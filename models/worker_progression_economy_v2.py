#!/usr/bin/env python3
"""Deterministic model for Worker & Progression Economy V2 (#26).

This is a design gate, not runtime code.
It checks:
- early frontier value/XP pacing for Z1-Z3;
- benchmark-derived worker throughput with/without Van;
- 2h offline shift cap and no double-credit across repeated logins;
- progressive use of processed/intermediate materials in base recipes.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass

TRAVEL_OVERHEAD_SEC = 0.80
SHIFT_CAP_HOURS = 2.0
WORKER_TICK_MIN = 10.0
COMPONENT_WORKER_FACTOR = 0.35
VAN_PARCEL_MULTIPLIER = 1.35

SALE_PRICE = {"metal": 8.0, "copper": 60.0, "plastic": 5.0}

TARGETS = {
    "small_scrap": dict(break_s=.45, metal=.42, copper=.01, plastic=.02, xp=1),
    "cable": dict(break_s=.65, metal=.02, copper=.14, plastic=.08, xp=1),
    "small_appliance": dict(break_s=1.20, metal=.52, copper=.10, plastic=.27, xp=2),
    "bike_fan": dict(break_s=1.80, metal=1.25, copper=.08, plastic=.23, xp=2),
    "medium_appliance": dict(break_s=3.20, metal=1.68, copper=.24, plastic=.38, xp=3),
    "large_appliance": dict(break_s=5.00, metal=2.68, copper=.38, plastic=.54, xp=5),
}

# id, weights, hp mult, current yield, recommended tool power, proposed yield, proposed XP
ZONES = [
    ("z1", {"small_scrap":.34,"cable":.18,"small_appliance":.20,"bike_fan":.13,"medium_appliance":.10,"large_appliance":.05}, 1.00, 1.00, 1.00, 1.00, 1.00),
    ("z2", {"small_scrap":.20,"cable":.20,"small_appliance":.22,"bike_fan":.16,"medium_appliance":.15,"large_appliance":.07}, 1.25, 1.15, 1.22, 1.30, 1.20),
    ("z3", {"small_scrap":.10,"cable":.08,"small_appliance":.20,"bike_fan":.10,"medium_appliance":.32,"large_appliance":.20}, 1.50, 1.35, 1.50, 1.45, 1.30),
]

@dataclass(frozen=True)
class Benchmark:
    name: str
    destroyed: int
    haul_kg: float
    discovered_components: float
    duration_min: float

BENCHMARKS = [
    Benchmark("weak", 24, 32.0, 1.0, 7.5),
    Benchmark("average", 40, 48.0, 1.5, 4.5),
    # Owner's observed strong-run intuition: ~50 targets and ~3 rare modules in ~1.5 min.
    Benchmark("strong", 50, 62.0, 3.0, 1.5),
]

# Recipe ladder recommendations. Values are design targets, not current runtime constants.
RECIPE_LADDER = {
    "hangar": {
        "metal":240, "cleanCopper":24, "briquette":40, "steelBlank":12,
        "aluminiumBillet":6, "structural":2, "control":1,
    },
    "salvage_yard": {
        "metal":280, "cleanCopper":36, "briquette":40, "steelBlank":32,
        "aluminiumBillet":12, "alloyBillet":42, "hydraulicPower":2, "heavyFrame":2, "control":2,
    },
    "industrial_workshop": {
        "metal":360, "cleanCopper":70, "granulate":60, "steelBlank":90,
        "aluminiumBillet":36, "alloyBillet":150, "drive":3, "control":4,
        "hydraulicPower":4, "heavyFrame":5, "industrialController":2,
        "heavyHydraulicCylinder":2,
    },
    "processing_plant": {
        "metal":420, "cleanCopper":110, "granulate":100, "steelBlank":140,
        "aluminiumBillet":80, "alloyBillet":240, "drive":4, "control":5,
        "hydraulicPower":5, "heavyFrame":6, "industrialController":3,
        "heavyHydraulicCylinder":3, "recoveryAssemblies":2, "z8Signature":1,
    },
}

PROCESSED_KEYS = {
    "cleanCopper","briquette","granulate","steelBlank","aluminiumBillet","alloyBillet",
    "drive","control","structural","hydraulicPower","heavyFrame",
    "industrialController","heavyHydraulicCylinder","recoveryAssemblies","z8Signature",
}

def zone_metrics(row, proposed: bool):
    zid, weights, hp, current_yield, tool_power, proposed_yield, proposed_xp = row
    yield_mult = proposed_yield if proposed else current_yield
    xp_mult = proposed_xp if proposed else 1.0
    break_sec = sum(weights[k] * TARGETS[k]["break_s"] for k in weights) * hp / tool_power
    cycle_sec = break_sec + TRAVEL_OVERHEAD_SEC
    targets_min = 60.0 / cycle_sec
    per_target = {
        r: sum(weights[k] * TARGETS[k][r] for k in weights) * yield_mult
        for r in SALE_PRICE
    }
    raw_kg_min = sum(per_target.values()) * targets_min
    cash_min = sum(per_target[r] * SALE_PRICE[r] for r in SALE_PRICE) * targets_min
    xp_min = sum(weights[k] * TARGETS[k]["xp"] for k in weights) * xp_mult * targets_min
    return {
        "zone": zid,
        "targets_min": targets_min,
        "raw_kg_min": raw_kg_min,
        "cash_min": cash_min,
        "xp_min": xp_min,
        "raw_per_target": sum(per_target.values()),
    }

def worker_parcel_fraction(duration_min: float, van: bool) -> float:
    """Fraction of the best valid excursion paid per 10-minute worker parcel.

    Owner intuition is preserved: a strong/fast route pays 50% of one best excursion
    per 10 minutes. Slow-route cap prevents automation from approaching active play.
    """
    base = min(0.50, 2.20 / max(duration_min, 1e-9))  # <=22% active throughput
    if not van:
        return base
    return min(base * VAN_PARCEL_MULTIPLIER, 0.65, 3.00 / max(duration_min, 1e-9))  # <=30%

def worker_row(b: Benchmark, van: bool):
    fraction = worker_parcel_fraction(b.duration_min, van)
    active_kg_h = b.haul_kg / b.duration_min * 60
    worker_kg_h = b.haul_kg * fraction * (60 / WORKER_TICK_MIN)
    active_share = worker_kg_h / active_kg_h
    component_h = b.discovered_components * fraction * COMPONENT_WORKER_FACTOR * (60 / WORKER_TICK_MIN)
    return {
        "scenario": b.name,
        "van": van,
        "parcel_fraction": fraction,
        "active_kg_h": active_kg_h,
        "worker_kg_h": worker_kg_h,
        "active_share": active_share,
        "shift_kg": worker_kg_h * SHIFT_CAP_HOURS,
        "shift_components": component_h * SHIFT_CAP_HOURS,
    }

def shift_credit(elapsed_h: float, remaining_h: float) -> tuple[float,float]:
    credited = min(max(0.0, elapsed_h), max(0.0, remaining_h))
    return credited, max(0.0, remaining_h - credited)

def processed_family_count(recipe: dict[str,float]) -> int:
    return sum(1 for key, amount in recipe.items() if key in PROCESSED_KEYS and amount > 0)

def check():
    current = {r["zone"]: r for r in (zone_metrics(z, False) for z in ZONES)}
    proposed = {r["zone"]: r for r in (zone_metrics(z, True) for z in ZONES)}

    # Reproduce the owner's early-game complaint: current Z2 XP/min is essentially flat.
    assert current["z2"]["xp_min"] <= current["z1"]["xp_min"] * 1.02

    # Proposed frontier should feel stronger without doubling every step.
    assert 1.25 <= proposed["z2"]["raw_kg_min"] / proposed["z1"]["raw_kg_min"] <= 1.45
    assert 1.12 <= proposed["z2"]["xp_min"] / proposed["z1"]["xp_min"] <= 1.30
    assert 1.20 <= proposed["z3"]["raw_kg_min"] / proposed["z2"]["raw_kg_min"] <= 1.40
    assert 1.08 <= proposed["z3"]["xp_min"] / proposed["z2"]["xp_min"] <= 1.20

    # Worker never approaches active throughput. Van improves logistics, not first-hire access.
    for b in BENCHMARKS:
        no_van = worker_row(b, False)
        van = worker_row(b, True)
        assert no_van["active_share"] <= .22 + 1e-9
        assert van["active_share"] <= .30 + 1e-9
        assert van["worker_kg_h"] > no_van["worker_kg_h"]
        assert no_van["shift_kg"] < no_van["active_kg_h"] * SHIFT_CAP_HOURS
    strong = worker_row(BENCHMARKS[-1], False)
    assert abs(strong["parcel_fraction"] - .50) < 1e-9  # owner 10min -> half best run intuition

    # Split relogs cannot duplicate the same offline interval.
    one, remain = shift_credit(1.5, SHIFT_CAP_HOURS)
    a, rem = shift_credit(.5, SHIFT_CAP_HOURS)
    b, rem = shift_credit(1.0, rem)
    assert abs(one - (a+b)) < 1e-9 and abs(remain-rem) < 1e-9
    capped, rem = shift_credit(8.0, SHIFT_CAP_HOURS)
    assert capped == SHIFT_CAP_HOURS and rem == 0

    # Processed/intermediate dependency diversity must grow with the base.
    counts = [processed_family_count(RECIPE_LADDER[k]) for k in
              ("hangar","salvage_yard","industrial_workshop","processing_plant")]
    assert counts == sorted(counts)
    assert counts[0] >= 4 and counts[-1] >= 10
    assert all(recipe["metal"] < 500 for recipe in RECIPE_LADDER.values())
    return True

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--check", action="store_true")
    args=p.parse_args()
    check()
    if args.check:
        print("worker/progression economy v2 model: PASS")
        print("ZONE VALUE")
        for z in ZONES:
            c=zone_metrics(z,False); pz=zone_metrics(z,True)
            print(z[0],
                  f"current raw={c['raw_kg_min']:.1f}kg/min xp={c['xp_min']:.1f}/min",
                  f"proposed raw={pz['raw_kg_min']:.1f}kg/min xp={pz['xp_min']:.1f}/min cash={pz['cash_min']:.0f}/min")
        print("WORKER BENCHMARKS")
        for b in BENCHMARKS:
            a=worker_row(b,False); v=worker_row(b,True)
            print(b.name,
                  f"noVan={a['worker_kg_h']:.1f}kg/h ({a['active_share']*100:.1f}% active), 2h={a['shift_kg']:.1f}kg",
                  f"van={v['worker_kg_h']:.1f}kg/h ({v['active_share']*100:.1f}% active), 2h={v['shift_kg']:.1f}kg")
        print("RECIPE PROCESSED FAMILIES",
              {k:processed_family_count(v) for k,v in RECIPE_LADDER.items()})

if __name__ == "__main__":
    main()
