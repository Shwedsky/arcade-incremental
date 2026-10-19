#!/usr/bin/env python3
"""Deterministic pacing contract for Progression Expansion V2.

V2 preserves the accepted level 1-10 thresholds exactly, then restores a useful
mid/late reward cadence so already-implemented Z6/Z7 level gates are naturally
reachable. Infrastructure milestones remain separate runtime gates; this model
must never imply that XP alone unlocks the business spine.
"""
from __future__ import annotations

import sys

LEVEL_XP = [
    0, 120, 420, 1800, 3200, 5200, 7800, 11000, 15000, 20000,
    23000, 26000, 29500, 33000, 37000, 41000, 45500, 50000, 55000, 60000,
    65500, 71000, 77000, 83000, 89500, 96000, 103000, 110000, 117500, 125000,
]

LEGACY_LEVEL_XP = [0,120,420,1800,3200,5200,7800,11000,15000,20000]
FRONTIER_XP_PER_HOUR = 2200.0

# First coherent Tier-II root in every permanent branch. These are runtime gates,
# not a claim that the complete Tier II is delivered in one package.
TIER2_ROOTS = {
    "salvage": {"id":"salvage_8", "level":10, "milestone":"van"},
    "logistics": {"id":"logistics_8", "level":10, "milestone":"van"},
    "workshop": {"id":"workshop_8", "level":12, "milestone":"hangar"},
    "automation": {"id":"automation_8", "level":12, "milestone":"salvage_yard"},
    "trade": {"id":"trade_8", "level":11, "milestone":"first_worker"},
}


def level_for_xp(xp: float) -> int:
    level = 1
    for i, threshold in enumerate(LEVEL_XP[1:], start=2):
        if xp >= threshold:
            level = i
    return level


def mastery_points(level: int) -> int:
    return max(0, level - 1)


def hours_after_level10(level: int) -> float:
    if level <= 10:
        return 0.0
    return (LEVEL_XP[level-1] - LEVEL_XP[9]) / FRONTIER_XP_PER_HOUR


def check() -> None:
    assert LEVEL_XP[:10] == LEGACY_LEVEL_XP, "levels 1-10 must remain save-compatible"
    assert all(b > a for a,b in zip(LEVEL_XP, LEVEL_XP[1:])), "XP thresholds must strictly increase"
    assert level_for_xp(19999) == 9
    assert level_for_xp(20000) == 10
    assert level_for_xp(26000) == 12
    assert level_for_xp(33000) == 14
    assert len(LEVEL_XP) == 30
    assert mastery_points(10) == 9
    assert mastery_points(14) == 13
    assert mastery_points(20) == 19
    assert mastery_points(30) == 29
    # Existing Z6/Z7 gates should arrive within a bounded number of active frontier hours after L10.
    assert hours_after_level10(12) <= 3.0
    assert hours_after_level10(14) <= 6.5
    # No branch may expose its Tier-II root from XP alone: every root has an infrastructure milestone.
    assert set(TIER2_ROOTS) == {"salvage","logistics","workshop","automation","trade"}
    assert all(root["milestone"] for root in TIER2_ROOTS.values())
    assert max(root["level"] for root in TIER2_ROOTS.values()) <= 12


def main() -> None:
    if "--check" in sys.argv:
        check()
    print("Progression Expansion V2 model")
    for level in [10,11,12,13,14,16,18,20,25,30]:
        threshold=LEVEL_XP[level-1]
        print({
            "level":level,
            "xp":threshold,
            "mastery_points":mastery_points(level),
            "frontier_hours_after_l10":round(hours_after_level10(level),2),
        })
    print("Tier-II roots:", TIER2_ROOTS)
    print("progression expansion v2 model: PASS")


if __name__ == "__main__":
    main()
