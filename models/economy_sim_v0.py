#!/usr/bin/env python3
"""Expected-value economy simulation for Arcade Incremental design v2.

This is not the final game balance. It is an auditable pacing model used to test
whether the current design can hit the intended milestone bands without runaway
progression. It intentionally avoids third-party packages.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Tuple
import csv
import os

BASE_RATES = {"metal": 420.0, "copper": 27.0, "plastic": 75.0}  # kg / active-equivalent hour
BASE_PRICES = {"metal": 8.0, "copper": 60.0, "plastic": 5.0}    # virtual RUB / kg
BASE_COMPONENT_RATES = {"bearing": 5.0, "motor": 2.0, "hydraulic": 0.7, "electronic": 1.8}
COMPONENT_SHOP = {"bearing": 1200.0, "motor": 4500.0, "hydraulic": 6000.0, "electronic": 3500.0}

UPGRADES = {
    "tool1": dict(earliest=0.25, cash=700.0, mats={}, comps={}, build_min=0, prereq=[]),
    "cart1": dict(earliest=0.40, cash=900.0, mats={}, comps={}, build_min=0, prereq=[]),
    "press": dict(earliest=0.50, cash=2500.0, mats={"metal": 100.0}, comps={"bearing": 2.0, "hydraulic": 1.0}, build_min=25, prereq=[]),
    "wire": dict(earliest=2.00, cash=4500.0, mats={"metal": 40.0, "copper": 8.0}, comps={"motor": 1.0, "electronic": 1.0}, build_min=35, prereq=["press"]),
    "inspect": dict(earliest=3.50, cash=6000.0, mats={"metal": 50.0}, comps={"electronic": 1.0, "bearing": 2.0}, build_min=40, prereq=["wire"]),
    "shredder": dict(earliest=5.00, cash=8000.0, mats={"metal": 70.0}, comps={"motor": 1.0, "bearing": 2.0}, build_min=45, prereq=["inspect"]),
    "storage": dict(earliest=6.00, cash=6000.0, mats={}, comps={}, build_min=0, prereq=["shredder"]),
    "tool2": dict(earliest=6.50, cash=5000.0, mats={}, comps={}, build_min=0, prereq=["shredder"]),
    "van": dict(earliest=8.00, cash=70000.0, mats={}, comps={}, build_min=0, prereq=["storage", "tool2"]),
    "worker": dict(earliest=14.00, cash=35000.0, mats={}, comps={}, build_min=0, prereq=["van"]),
    "garage_full": dict(earliest=18.00, cash=55000.0, mats={"metal": 200.0, "copper": 20.0}, comps={"motor": 1.0, "electronic": 1.0}, build_min=60, prereq=["worker"]),
    "hangar": dict(earliest=28.00, cash=220000.0, mats={}, comps={}, build_min=0, prereq=["garage_full"]),
}

ORDER = ["tool1", "cart1", "press", "wire", "inspect", "shredder", "storage", "tool2", "van", "worker", "garage_full", "hangar"]

PROFILES = {
    "continuous_active": [(0, 24 * 60)],
    "15m_day_once": [(20 * 60, 15)],
    "30m_day_once": [(20 * 60, 30)],
    "60m_day_2x30": [(8 * 60, 30), (20 * 60, 30)],
    "heavy_3x60": [(8 * 60, 60), (14 * 60, 60), (20 * 60, 60)],
    "offline_heavy_3x5": [(8 * 60, 5), (14 * 60, 5), (20 * 60, 5)],
}

@dataclass
class Config:
    offline_efficiency: float = 0.20
    offline_cap_h: float = 2.0
    price_mult: float = 1.0
    component_rate_mult: float = 1.0

@dataclass
class State:
    cash: float = 0.0
    progress_h: float = 0.0
    active_h: float = 0.0
    mats: Dict[str, float] = field(default_factory=lambda: {k: 0.0 for k in BASE_RATES})
    comps: Dict[str, float] = field(default_factory=lambda: {k: 0.0 for k in BASE_COMPONENT_RATES})
    owned: set = field(default_factory=set)
    building: Dict[str, float] = field(default_factory=dict)
    milestones: Dict[str, Tuple[float, float, float]] = field(default_factory=dict)
    first_hydraulic_guarantee: bool = False
    wall_min: float = 0.0


def prices(cfg: Config) -> Dict[str, float]:
    return {k: v * cfg.price_mult for k, v in BASE_PRICES.items()}


def collection_multiplier(st: State, active: bool) -> float:
    mult = 1.0
    if "tool1" in st.owned:
        mult *= 1.12
    if "cart1" in st.owned:
        mult *= 1.08
    if "tool2" in st.owned:
        mult *= 1.12
    if "van" in st.owned:
        mult *= 1.20
    if not active and "worker" in st.owned:
        mult *= 1.25
    # Combo is assumed to unlock at ~2.5 progression hours for a player that
    # specializes into Salvage. It affects active play only; average realized
    # benefit is intentionally modest, not a giant cash multiplier.
    if active and st.progress_h >= 2.5:
        mult *= 1.06
    return mult


def machine_value_add_per_h(st: State, p: Dict[str, float]) -> float:
    bonus = 0.0
    if "press" in st.owned:
        bonus += 180.0 * p["metal"] * 0.25
    if "wire" in st.owned:
        bonus += 18.0 * p["copper"] * 0.30
    if "shredder" in st.owned:
        bonus += 35.0 * p["plastic"] * 0.50
    if "inspect" in st.owned:
        bonus += 120.0
    if "garage_full" in st.owned:
        bonus += 500.0
    return bonus


def apply_production(st: State, equivalent_hours: float, active: bool, cfg: Config) -> None:
    if equivalent_hours <= 0:
        return
    p = prices(cfg)
    mult = collection_multiplier(st, active)
    produced = {k: rate * equivalent_hours * mult for k, rate in BASE_RATES.items()}
    st.cash += sum(produced[k] * p[k] for k in produced)
    st.cash += machine_value_add_per_h(st, p) * equivalent_hours
    for k, qty in produced.items():
        st.mats[k] += qty
    component_mult = mult if active else max(1.0, mult * 0.9)
    for c, rate in BASE_COMPONENT_RATES.items():
        st.comps[c] += rate * cfg.component_rate_mult * equivalent_hours * component_mult
    st.progress_h += equivalent_hours
    if active:
        st.active_h += equivalent_hours


def finish_builds(st: State) -> None:
    done = [name for name, finish in st.building.items() if finish <= st.wall_min + 1e-9]
    for name in done:
        st.owned.add(name)
        st.milestones.setdefault(name, (st.wall_min, st.active_h, st.progress_h))
        del st.building[name]


def total_acquisition_cost(st: State, name: str, cfg: Config) -> float:
    u = UPGRADES[name]
    p = prices(cfg)
    shop = 0.0
    for c, qty in u["comps"].items():
        missing = max(0.0, qty - st.comps[c])
        shop += missing * COMPONENT_SHOP[c]
    material_opportunity_cost = sum(qty * p[m] for m, qty in u["mats"].items())
    return u["cash"] + shop + material_opportunity_cost


def can_acquire(st: State, name: str, cfg: Config) -> bool:
    u = UPGRADES[name]
    if name in st.owned or name in st.building:
        return False
    if st.progress_h + 1e-9 < u["earliest"]:
        return False
    if any(req not in st.owned for req in u["prereq"]):
        return False
    # Mandatory-progression anti-RNG guardrail: after the press recipe is
    # revealed, a targeted floor-jack-like source guarantees the first hydraulic
    # unit by ~0.72 progression hours if normal drops have not supplied one.
    if name == "press" and not st.first_hydraulic_guarantee and st.progress_h >= 0.72 and st.comps["hydraulic"] < 1.0:
        st.comps["hydraulic"] = 1.0
        st.first_hydraulic_guarantee = True
    return st.cash + 1e-9 >= total_acquisition_cost(st, name, cfg)


def acquire(st: State, name: str, cfg: Config) -> None:
    u = UPGRADES[name]
    cost = total_acquisition_cost(st, name, cfg)
    for c, qty in u["comps"].items():
        used = min(st.comps[c], qty)
        st.comps[c] -= used
    for m, qty in u["mats"].items():
        st.mats[m] = max(0.0, st.mats[m] - qty)
    st.cash -= cost
    if u["build_min"]:
        st.building[name] = st.wall_min + u["build_min"]
    else:
        st.owned.add(name)
        st.milestones.setdefault(name, (st.wall_min, st.active_h, st.progress_h))


def auto_acquire(st: State, cfg: Config) -> None:
    changed = True
    while changed:
        changed = False
        for name in ORDER:
            if can_acquire(st, name, cfg):
                acquire(st, name, cfg)
                changed = True
                break


def apply_offline_gap(st: State, gap_min: float, cfg: Config) -> None:
    if gap_min <= 0:
        return
    counted_h = min(gap_min / 60.0, cfg.offline_cap_h)
    if counted_h <= 0:
        return
    start = st.wall_min
    end = start + gap_min
    pending = sorted(t for t in st.building.values() if start < t < end)
    remaining_counted_h = counted_h
    cursor = start
    for point in pending + [end]:
        segment_h = (point - cursor) / 60.0
        use_h = min(segment_h, remaining_counted_h)
        if use_h > 0:
            apply_production(st, use_h * cfg.offline_efficiency, active=False, cfg=cfg)
            remaining_counted_h -= use_h
        st.wall_min = point
        finish_builds(st)
        auto_acquire(st, cfg)
        cursor = point


def simulate(profile: List[Tuple[int, int]], cfg: Config, max_days: int = 180) -> State:
    st = State()
    first_session = True
    last_session_end = 0.0
    for day in range(max_days):
        for start_min, duration_min in profile:
            session_start = day * 1440 + start_min
            if first_session:
                st.wall_min = session_start
                first_session = False
            else:
                st.wall_min = last_session_end
                apply_offline_gap(st, session_start - last_session_end, cfg)
                st.wall_min = session_start
            finish_builds(st)
            auto_acquire(st, cfg)
            for minute in range(duration_min):
                st.wall_min = session_start + minute
                finish_builds(st)
                auto_acquire(st, cfg)
                apply_production(st, 1.0 / 60.0, active=True, cfg=cfg)
                auto_acquire(st, cfg)
            last_session_end = session_start + duration_min
            st.wall_min = last_session_end
            finish_builds(st)
            auto_acquire(st, cfg)
            if "hangar" in st.owned:
                return st
    return st


def fmt_milestone(st: State, name: str, start_wall_min: float) -> Tuple[str, str, str]:
    if name not in st.milestones:
        return "", "", ""
    wall, active_h, progress_h = st.milestones[name]
    elapsed_days = (wall - start_wall_min) / 1440.0
    return f"{elapsed_days:.3f}", f"{active_h:.3f}", f"{progress_h:.3f}"


def run_baseline(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    milestones = ["press", "wire", "inspect", "shredder", "van", "worker", "garage_full", "hangar"]
    path = os.path.join(output_dir, "economy_sim_v0_profile_results.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        header = ["profile"]
        for m in milestones:
            header += [f"{m}_calendar_day", f"{m}_active_h", f"{m}_progress_h"]
        w.writerow(header)
        for profile_name, schedule in PROFILES.items():
            st = simulate(schedule, Config())
            row = [profile_name]
            for m in milestones:
                row.extend(fmt_milestone(st, m, schedule[0][0]))
            w.writerow(row)

    sensitivity_path = os.path.join(output_dir, "economy_sim_v0_sensitivity.csv")
    scenarios = [
        ("baseline", Config()),
        ("offline_15pct", Config(offline_efficiency=0.15)),
        ("offline_25pct", Config(offline_efficiency=0.25)),
        ("offline_cap_1h", Config(offline_cap_h=1.0)),
        ("offline_cap_3h", Config(offline_cap_h=3.0)),
        ("prices_minus_10pct", Config(price_mult=0.90)),
        ("prices_plus_10pct", Config(price_mult=1.10)),
        ("components_minus_30pct", Config(component_rate_mult=0.70)),
        ("components_plus_30pct", Config(component_rate_mult=1.30)),
    ]
    sensitivity_profiles = ["continuous_active", "30m_day_once", "offline_heavy_3x5"]
    with open(sensitivity_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["scenario", "profile", "van_calendar_day", "van_active_h", "van_progress_h", "hangar_calendar_day", "hangar_active_h", "hangar_progress_h"])
        for scenario_name, cfg in scenarios:
            for profile_name in sensitivity_profiles:
                st = simulate(PROFILES[profile_name], cfg)
                van_wall, van_active_h, van_progress_h = st.milestones["van"]
                hangar_wall, hangar_active_h, hangar_progress_h = st.milestones["hangar"]
                start_wall = PROFILES[profile_name][0][0]
                w.writerow([scenario_name, profile_name, f"{(van_wall-start_wall)/1440.0:.3f}", f"{van_active_h:.3f}", f"{van_progress_h:.3f}", f"{(hangar_wall-start_wall)/1440.0:.3f}", f"{hangar_active_h:.3f}", f"{hangar_progress_h:.3f}"])

    assumptions_path = os.path.join(output_dir, "economy_sim_v0_assumptions.csv")
    with open(assumptions_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["category", "name", "value", "unit_or_note"])
        for k, v in BASE_RATES.items():
            w.writerow(["active_yield", k, v, "kg per active-equivalent hour"])
        for k, v in BASE_PRICES.items():
            w.writerow(["raw_sale_price", k, v, "virtual RUB per kg"])
        for k, v in BASE_COMPONENT_RATES.items():
            w.writerow(["component_expected_rate", k, v, "expected units per active-equivalent hour"])
        w.writerow(["offline", "efficiency", 0.20, "fraction of active baseline"])
        w.writerow(["offline", "cap", 2.0, "hours per absence"])
        w.writerow(["combo", "average active multiplier after unlock", 1.06, "assumed after ~2.5 progression h"])
        w.writerow(["press", "metal throughput", 180, "kg/h"])
        w.writerow(["press", "sale uplift", 0.25, "fraction"])
        w.writerow(["press", "fabrication time", 25, "minutes"])
        w.writerow(["van", "cash price", 70000, "virtual RUB"])


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "proofs")
    run_baseline(out)
    print(f"Wrote economy simulation outputs to {out}")
