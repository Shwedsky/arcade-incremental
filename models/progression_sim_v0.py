#!/usr/bin/env python3
"""Expected-value proof for early XP/mastery pacing.

This intentionally reuses the approved active-loop calibration rather than simulating
all game state. It answers one question: with the planned target mix and break cadence,
when do mastery points and Salvage tier 3 (Combo) arrive?
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "docs" / "proofs" / "progression_runtime_v0.csv"

SHARES = {
    "small_scrap": 0.34,
    "cable": 0.18,
    "small_appliance": 0.20,
    "bike_fan": 0.13,
    "medium_appliance": 0.10,
    "large_appliance": 0.05,
}
XP_PER_TARGET = {
    "small_scrap": 1,
    "cable": 1,
    "small_appliance": 2,
    "bike_fan": 2,
    "medium_appliance": 3,
    "large_appliance": 5,
}
BREAKS_PER_MINUTE = 9.0
COMPONENT_EVENTS_PER_HOUR = 9.3
XP_PER_COMPONENT = 3
LEVEL_XP = {
    2: 120,
    3: 420,
    4: 1800,
    5: 3200,
    6: 5200,
    7: 7800,
    8: 11000,
    9: 15000,
    10: 20000,
}


def calculate():
    xp_per_target = sum(SHARES[key] * XP_PER_TARGET[key] for key in SHARES)
    target_xp_per_hour = xp_per_target * BREAKS_PER_MINUTE * 60
    component_xp_per_hour = COMPONENT_EVENTS_PER_HOUR * XP_PER_COMPONENT
    xp_per_hour = target_xp_per_hour + component_xp_per_hour
    rows = []
    for level, cumulative_xp in LEVEL_XP.items():
        hours = cumulative_xp / xp_per_hour
        rows.append({
            "level": level,
            "cumulative_xp": cumulative_xp,
            "active_hours": round(hours, 3),
            "active_minutes": round(hours * 60, 1),
            "mastery_points": level - 1,
        })
    return xp_per_target, target_xp_per_hour, component_xp_per_hour, xp_per_hour, rows


def write(rows):
    PROOF.parent.mkdir(parents=True, exist_ok=True)
    with PROOF.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def check(rows):
    if not PROOF.exists():
        raise SystemExit(f"missing proof: {PROOF}")
    with PROOF.open(newline="", encoding="utf-8") as handle:
        committed = list(csv.DictReader(handle))
    expected = [{key: str(value) for key, value in row.items()} for row in rows]
    if committed != expected:
        raise SystemExit("progression proof CSV is stale; run models/progression_sim_v0.py --write")


def main():
    xp_per_target, target_rate, component_rate, total_rate, rows = calculate()
    if "--write" in sys.argv:
        write(rows)
    if "--check" in sys.argv:
        check(rows)
    print(f"weighted XP/target: {xp_per_target:.3f}")
    print(f"target XP/hour: {target_rate:.1f}")
    print(f"component XP/hour: {component_rate:.1f}")
    print(f"total XP/hour: {total_rate:.1f}")
    for row in rows:
        print(row)
    combo = next(row for row in rows if row["level"] == 4)
    assert 1.5 <= combo["active_hours"] <= 2.5, "Combo tier-3 pacing left the approved ~2h band"
    print("progression pacing: PASS")


if __name__ == "__main__":
    main()
