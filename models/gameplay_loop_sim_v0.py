from __future__ import annotations

import csv
import random
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from statistics import mean

SEED = 20261017
RUNS_PER_PHASE = 20000
OUT = Path("docs/proofs")

@dataclass(frozen=True)
class Obj:
    key: str
    probability: float
    break_seconds: float
    metal_kg: float
    copper_kg: float
    plastic_kg: float
    component_chance: float
    visual_pickups: int
    component_mix: tuple[tuple[str, float], ...] = ()

OBJECTS = (
    Obj("small_scrap", .34, .45, .42, .005, .02, 0.00, 3),
    Obj("cable_bundle", .18, .65, .025, .14, .075, 0.00, 4),
    Obj("small_appliance", .20, 1.20, .66, .04, .19, .015, 5,
        (("electronic_module", .50), ("electric_motor", .50))),
    Obj("bike_or_fan", .13, 1.80, 1.43, .025, .10, .035, 7,
        (("bearings", .90), ("electric_motor", .10))),
    Obj("medium_appliance", .10, 3.20, 1.80, .075, .425, .055, 9,
        (("bearings", .60), ("electric_motor", .18), ("electronic_module", .12), ("hydraulic_unit", .10))),
    Obj("large_appliance", .05, 5.00, 2.75, .125, .725, .09, 12,
        (("bearings", .45), ("electric_motor", .20), ("electronic_module", .20), ("hydraulic_unit", .15))),
)

PHASES = (
    ("start", 40.0, 1.00, 0, 15),
    ("tool_upgrade", 40.0, 1.10, 15, 30),
    ("cart_plus_tool", 55.0, 1.10, 30, 90),
)

MOVE_SECONDS_PER_TARGET = 4.5
RETURN_AND_UNLOAD_SECONDS = 35.0
FILL_TARGET = 0.92

def weighted_choice(rng: random.Random, entries: tuple[Obj, ...]) -> Obj:
    roll = rng.random()
    acc = 0.0
    for entry in entries:
        acc += entry.probability
        if roll <= acc:
            return entry
    return entries[-1]

def component_choice(rng: random.Random, obj: Obj) -> str | None:
    if not obj.component_mix or rng.random() >= obj.component_chance:
        return None
    roll = rng.random()
    acc = 0.0
    for key, probability in obj.component_mix:
        acc += probability
        if roll <= acc:
            return key
    return obj.component_mix[-1][0]

def simulate_trip(rng: random.Random, cart_capacity: float, tool_speed: float) -> dict:
    weight = seconds = 0.0
    objects = pickups = 0
    materials = Counter()
    components = Counter()
    attempts = 0

    while weight < cart_capacity * FILL_TARGET and attempts < 1000:
        attempts += 1
        obj = weighted_choice(rng, OBJECTS)
        obj_weight = obj.metal_kg + obj.copper_kg + obj.plastic_kg
        if weight + obj_weight > cart_capacity:
            continue

        weight += obj_weight
        seconds += MOVE_SECONDS_PER_TARGET + obj.break_seconds / tool_speed
        objects += 1
        pickups += obj.visual_pickups
        materials["metal"] += obj.metal_kg
        materials["copper"] += obj.copper_kg
        materials["plastic"] += obj.plastic_kg

        component = component_choice(rng, obj)
        if component:
            components[component] += 1

    seconds += RETURN_AND_UNLOAD_SECONDS
    return {
        "weight": weight,
        "seconds": seconds,
        "objects": objects,
        "pickups": pickups,
        "materials": materials,
        "components": components,
    }

def phase_result(name: str, cart_capacity: float, tool_speed: float, start_min: int, end_min: int, seed_offset: int) -> dict:
    rng = random.Random(SEED + seed_offset)
    trips = [simulate_trip(rng, cart_capacity, tool_speed) for _ in range(RUNS_PER_PHASE)]
    avg_seconds = mean(t["seconds"] for t in trips)
    trips_per_hour = 3600.0 / avg_seconds

    component_totals = Counter()
    for trip in trips:
        component_totals.update(trip["components"])

    result = {
        "phase": name,
        "start_min": start_min,
        "end_min": end_min,
        "cart_capacity_kg": cart_capacity,
        "tool_speed_mult": tool_speed,
        "avg_trip_seconds": avg_seconds,
        "avg_trip_minutes": avg_seconds / 60.0,
        "avg_trip_weight_kg": mean(t["weight"] for t in trips),
        "avg_objects_per_trip": mean(t["objects"] for t in trips),
        "objects_per_min": mean(t["objects"] for t in trips) * 60.0 / avg_seconds,
        "visual_pickups_per_min": mean(t["pickups"] for t in trips) * 60.0 / avg_seconds,
        "trips_per_hour": trips_per_hour,
    }

    for key in ("metal", "copper", "plastic"):
        result[f"{key}_kg_per_hour"] = mean(t["materials"][key] for t in trips) * trips_per_hour

    total_components = sum(component_totals.values())
    result["components_per_hour"] = total_components / RUNS_PER_PHASE * trips_per_hour
    for key in ("bearings", "electric_motor", "hydraulic_unit", "electronic_module"):
        result[f"{key}_per_hour"] = component_totals[key] / RUNS_PER_PHASE * trips_per_hour

    return result

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    with (OUT / "gameplay_loop_v0_object_classes.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "key", "probability", "break_seconds", "metal_kg", "copper_kg", "plastic_kg",
            "component_chance", "visual_pickups", "component_mix"
        ])
        for o in OBJECTS:
            writer.writerow([
                o.key, o.probability, o.break_seconds, o.metal_kg, o.copper_kg, o.plastic_kg,
                o.component_chance, o.visual_pickups,
                ";".join(f"{k}:{p}" for k, p in o.component_mix)
            ])

    results = [
        phase_result(name, capacity, tool, start, end, i * 1000)
        for i, (name, capacity, tool, start, end) in enumerate(PHASES)
    ]

    fieldnames = list(results[0].keys())
    with (OUT / "gameplay_loop_v0_phase_results.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    first90 = Counter()
    for result in results:
        hours = (result["end_min"] - result["start_min"]) / 60.0
        first90["objects"] += result["objects_per_min"] * hours * 60.0
        first90["visual_pickups"] += result["visual_pickups_per_min"] * hours * 60.0
        first90["trips"] += result["trips_per_hour"] * hours
        first90["metal_kg"] += result["metal_kg_per_hour"] * hours
        first90["copper_kg"] += result["copper_kg_per_hour"] * hours
        first90["plastic_kg"] += result["plastic_kg_per_hour"] * hours
        first90["components"] += result["components_per_hour"] * hours

    with (OUT / "gameplay_loop_v0_first90_summary.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "expected_value"])
        for key in (
            "objects", "visual_pickups", "trips", "metal_kg", "copper_kg",
            "plastic_kg", "components"
        ):
            writer.writerow([key, f"{first90[key]:.3f}"])

    print("Gameplay Loop Calibration V0")
    for r in results:
        print(
            f"{r['phase']}: trip={r['avg_trip_minutes']:.2f}m, "
            f"objects={r['avg_objects_per_trip']:.1f}, "
            f"objects/min={r['objects_per_min']:.2f}, "
            f"pickups/min={r['visual_pickups_per_min']:.1f}, "
            f"components/h={r['components_per_hour']:.2f}"
        )
    print("First 90 min:", {k: round(v, 2) for k, v in first90.items()})

if __name__ == "__main__":
    main()
