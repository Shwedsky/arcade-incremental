#!/usr/bin/env python3
"""Structural proof for Content Pack E V1.

This deliberately checks the locked relationship to Pack D / late-game source docs
rather than pretending to be a full economy simulator.
"""
from __future__ import annotations

Z7 = {"hp": 3.25, "yield": 2.55, "mastery": 12_200, "large_share": .52, "target_hours": 4.5}
Z8 = {"hp": 3.45, "yield": 2.90, "mastery": 12_400, "large_share": .60, "target_hours": 4.6}

PLANT = {
    "cash": 1_200_000,
    "storage_kg": 150_000,
    "lines": 2,
    "alloy_input": 50,
    "alloy_output": 40,
    "alloy_seconds": 300,
    "recipe": {
        "metal": 720,
        "clean_copper": 120,
        "granulate": 100,
        "steel_blank": 160,
        "aluminium_billet": 72,
        "alloy_billet": 260,
        "drive": 5,
        "control": 6,
        "hydraulic_power": 6,
        "heavy_frame": 8,
        "industrial_controller": 4,
        "heavy_hydraulic_cylinder": 4,
        "port_power_assembly": 1,
    },
}


def check() -> None:
    assert Z8["hp"] > Z7["hp"]
    assert 1.05 <= Z8["hp"] / Z7["hp"] <= 1.15
    assert Z8["yield"] > Z7["yield"]
    assert 1.08 <= Z8["yield"] / Z7["yield"] <= 1.20
    assert Z8["mastery"] > Z7["mastery"]
    assert Z8["large_share"] > Z7["large_share"]
    assert Z8["target_hours"] == 4.6

    assert PLANT["cash"] == 1_200_000
    assert PLANT["storage_kg"] == 150_000
    assert PLANT["lines"] == 2
    assert PLANT["alloy_output"] / PLANT["alloy_input"] == .8
    # Existing industrial-cell alloy cycle is 25 -> 18 / 240 sec. Plant must be a
    # meaningful throughput improvement without inventing a new material chain.
    old_output_per_sec = 18 / 240
    plant_output_per_sec = PLANT["alloy_output"] / PLANT["alloy_seconds"]
    assert plant_output_per_sec >= old_output_per_sec * 1.70

    required_families = {
        "steel_blank", "aluminium_billet", "alloy_billet", "drive", "control",
        "hydraulic_power", "heavy_frame", "industrial_controller",
        "heavy_hydraulic_cylinder", "port_power_assembly",
    }
    assert required_families.issubset(PLANT["recipe"])
    assert PLANT["recipe"]["port_power_assembly"] == 1


def main() -> None:
    check()
    print("Content Pack E structural model: PASS")
    print(f"Z7 -> Z8 hp: {Z7['hp']} -> {Z8['hp']}")
    print(f"Z7 -> Z8 yield: {Z7['yield']} -> {Z8['yield']}")
    print(f"Z7 -> Z8 mastery: {Z7['mastery']} -> {Z8['mastery']}")
    print(f"Plant: cash={PLANT['cash']:,}, storage={PLANT['storage_kg']:,}kg, lines={PLANT['lines']}")
    print(f"Plant alloy: {PLANT['alloy_input']} -> {PLANT['alloy_output']} / {PLANT['alloy_seconds']}s")


if __name__ == "__main__":
    main()
