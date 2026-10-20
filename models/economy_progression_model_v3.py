#!/usr/bin/env python3
"""Economy / Progression Model V3.

This is the deterministic contract for Product Roadmap V2, not a full economy solver.
It unifies the progression constraints that were previously spread across separate
models so later Workforce/Hangar tuning has one source of truth.

The model intentionally does NOT change runtime values yet. It proves:
- business eras and level/mastery supply stay ordered;
- level 30 currently supplies enough points to saturate today's *enabled* tree;
- a complete current-scope tree around 48 total point cost restores specialization;
- passive bulk production grows with business scale without making active play obsolete;
- late business timing must be gated by infrastructure/economy, not XP alone.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass

LEVEL_XP = [
    0,120,420,1800,3200,5200,7800,11000,15000,20000,
    23000,26000,29500,33000,37000,41000,45500,50000,55000,60000,
    65500,71000,77000,83000,89500,96000,103000,110000,117500,125000,
]
FRONTIER_XP_PER_HOUR = 2200.0
CURRENT_RUNTIME_ENABLED_TALENT_COST = 28
TARGET_FULL_TREE_COST = 48
TARGET_PLANT_TREE_SHARE = (0.55, 0.65)

@dataclass(frozen=True)
class Era:
    id: str
    level: int
    hours_min: float
    hours_max: float
    passive_bulk_min: float
    passive_bulk_max: float
    promise: str

ERAS = [
    Era('starter_garage',4,0,4,0.00,0.00,'one scavenger / personal workshop'),
    Era('equipped_garage',8,3,12,0.00,0.00,'working garage / first processing chain'),
    Era('workforce_garage',12,8,20,0.15,0.30,'van + first passive route'),
    Era('hangar',16,24,45,0.25,0.40,'small company / several assets'),
    Era('salvage_yard',20,45,75,0.35,0.55,'salvage network / bulk supply'),
    Era('industrial_workshop',25,75,110,0.40,0.60,'industrial transformation margin'),
    Era('processing_plant',30,110,150,0.45,0.65,'plant-scale macro production'),
]

# Target full-tree cost by permanent branch. The exact node IDs/cost migrations are
# deliberately deferred to a later runtime package; P0 only locks the aggregate budget.
BRANCH_TARGET_COST = {
    'salvage':10,
    'logistics':9,
    'workshop':10,
    'automation':10,
    'trade':9,
}

# Rare/signature acquisition must remain an active-play advantage even when bulk
# passive supply becomes large. These are ratios of passive rare acquisition to a
# focused active player in the same era, not generic drop multipliers.
RARE_PASSIVE_SHARE_MAX = {
    'workforce_garage':0.25,
    'hangar':0.30,
    'salvage_yard':0.35,
    'industrial_workshop':0.35,
    'processing_plant':0.35,
}

def mastery_points(level:int)->int:
    return max(0,level-1)

def xp_threshold(level:int)->int:
    return LEVEL_XP[level-1]

def active_frontier_hours_after_l10(level:int)->float:
    if level<=10:return 0.0
    return (xp_threshold(level)-xp_threshold(10))/FRONTIER_XP_PER_HOUR

def point_share(level:int,total_cost:int=TARGET_FULL_TREE_COST)->float:
    return mastery_points(level)/total_cost

def check()->None:
    assert len(LEVEL_XP)==30
    assert all(b>a for a,b in zip(LEVEL_XP,LEVEL_XP[1:])), 'XP thresholds must strictly increase'
    assert [era.level for era in ERAS]==sorted(era.level for era in ERAS), 'era levels must be monotonic'
    assert [era.hours_min for era in ERAS]==sorted(era.hours_min for era in ERAS), 'era timing must be monotonic'
    assert [era.hours_max for era in ERAS]==sorted(era.hours_max for era in ERAS), 'era timing maxima must be monotonic'
    assert sum(BRANCH_TARGET_COST.values())==TARGET_FULL_TREE_COST

    # Current problem: by L30 the player can buy every currently enabled talent.
    assert mastery_points(30)>=CURRENT_RUNTIME_ENABLED_TALENT_COST
    current_enabled_share=mastery_points(30)/CURRENT_RUNTIME_ENABLED_TALENT_COST
    assert current_enabled_share>=1.0

    # Target: Plant-era player owns a meaningful specialization, not the whole tree.
    plant_share=point_share(30)
    lo,hi=TARGET_PLANT_TREE_SHARE
    assert lo<=plant_share<=hi, f'Plant tree share {plant_share:.3f} outside target {lo:.2f}-{hi:.2f}'
    assert max(BRANCH_TARGET_COST.values())<=mastery_points(12), 'a focused branch must become completable before late game if gates allow'
    assert mastery_points(30)>=sum(sorted(BRANCH_TARGET_COST.values(),reverse=True)[:2]), 'Plant player should afford two deep specializations if choosing narrowly'
    assert mastery_points(30)<TARGET_FULL_TREE_COST, 'normal Plant progression must not max the tree'

    # Passive bulk grows, but never becomes an automatic 100% substitute for active play.
    passive=[era.passive_bulk_max for era in ERAS]
    assert passive==sorted(passive)
    assert ERAS[-1].passive_bulk_max<=0.65
    assert all(value<=0.35 for value in RARE_PASSIVE_SHARE_MAX.values())

    # XP should not be the late-game hard gate. Infrastructure/recipes/business pressure
    # must dominate the long target windows.
    assert active_frontier_hours_after_l10(16)<ERAS[3].hours_max
    assert active_frontier_hours_after_l10(30)<ERAS[-1].hours_min


def main()->None:
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    check()
    if args.check: print('economy/progression model v3: PASS')
    print('TALENT BUDGET')
    print({
        'level30_points':mastery_points(30),
        'current_enabled_cost':CURRENT_RUNTIME_ENABLED_TALENT_COST,
        'current_enabled_share':round(mastery_points(30)/CURRENT_RUNTIME_ENABLED_TALENT_COST,3),
        'target_full_tree_cost':TARGET_FULL_TREE_COST,
        'target_plant_share':round(point_share(30),3),
        'branch_costs':BRANCH_TARGET_COST,
    })
    print('BUSINESS ERAS')
    for era in ERAS:
        print({
            'era':era.id,
            'target_level':era.level,
            'points':mastery_points(era.level),
            'target_hours':f'{era.hours_min:g}-{era.hours_max:g}',
            'passive_bulk_share':f'{era.passive_bulk_min:.0%}-{era.passive_bulk_max:.0%}',
            'active_hours_after_l10_for_level':round(active_frontier_hours_after_l10(era.level),2),
            'promise':era.promise,
        })

if __name__=='__main__':main()
