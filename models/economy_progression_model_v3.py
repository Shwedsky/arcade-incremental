#!/usr/bin/env python3
"""Economy / Progression Model V4-compatible contract.

The owner rejected permanent 55-65% tree ownership. Specialization now controls
order and timing, while a sufficiently progressed late player can complete the
current-scope tree. Plant acquisition can occur before full completion; post-Plant
mastery continues to level 46+.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass

LEVEL_XP=[
  0,120,420,1800,3200,5200,7800,11000,15000,20000,
  23000,26000,29500,33000,37000,41000,45500,50000,55000,60000,
  65500,71000,77000,83000,89500,96000,103000,110000,117500,125000,
  133000,141500,150500,160000,170000,180500,191500,203000,215000,227500,
  240500,254000,268000,282500,297500,313000,329000,345500,362500,380000,
]
FRONTIER_XP_PER_HOUR=2200.0
FULL_TREE_COST=45
TREE_COMPLETION_LEVEL=46

@dataclass(frozen=True)
class Era:
    id:str;level:int;hours_min:float;hours_max:float;passive_bulk_min:float;passive_bulk_max:float;promise:str
ERAS=[
 Era('starter_garage',4,0,4,0,0,'one scavenger / personal workshop'),
 Era('equipped_garage',8,3,12,0,0,'working garage / first processing'),
 Era('workforce_garage',12,8,20,.15,.30,'first crew + route'),
 Era('hangar',16,24,45,.25,.40,'visible small company'),
 Era('salvage_yard',20,45,75,.35,.55,'network / bulk supply'),
 Era('industrial_workshop',25,75,110,.40,.60,'industrial transformation'),
 Era('processing_plant',30,110,150,.45,.65,'plant acquisition / macro production'),
 Era('plant_mastery',46,145,220,.50,.70,'complete current-scope mastery'),
]
BRANCH_COST={'salvage':9,'logistics':9,'workshop':9,'automation':9,'trade':9}
RARE_PASSIVE_SHARE_MAX=.35

def mastery_points(level:int)->int:return max(0,level-1)
def xp_threshold(level:int)->int:return LEVEL_XP[level-1]
def active_frontier_hours_after_l10(level:int)->float:
    if level<=10:return 0.0
    return (xp_threshold(level)-xp_threshold(10))/FRONTIER_XP_PER_HOUR

def check()->None:
    assert len(LEVEL_XP)==50 and all(b>a for a,b in zip(LEVEL_XP,LEVEL_XP[1:]))
    assert sum(BRANCH_COST.values())==FULL_TREE_COST
    assert mastery_points(30)==29
    assert .60<=mastery_points(30)/FULL_TREE_COST<=.70,'Plant acquisition still has meaningful build ordering'
    assert mastery_points(TREE_COMPLETION_LEVEL)>=FULL_TREE_COST,'current-scope tree must be finishable'
    assert mastery_points(TREE_COMPLETION_LEVEL-1)<FULL_TREE_COST,'completion level is intentional'
    assert [e.level for e in ERAS]==sorted(e.level for e in ERAS)
    assert [e.hours_min for e in ERAS]==sorted(e.hours_min for e in ERAS)
    assert all(e.passive_bulk_max<=.70 for e in ERAS)
    assert RARE_PASSIVE_SHARE_MAX<=.35
    assert active_frontier_hours_after_l10(16)<ERAS[3].hours_max
    assert active_frontier_hours_after_l10(30)<ERAS[6].hours_min

def main()->None:
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args();check()
    if args.check:print('economy/progression model v4 contract: PASS')
    print({'level30_points':mastery_points(30),'full_tree_cost':FULL_TREE_COST,'level30_share':round(mastery_points(30)/FULL_TREE_COST,3),'full_completion_level':TREE_COMPLETION_LEVEL})
    for era in ERAS:print({'era':era.id,'level':era.level,'points':mastery_points(era.level),'hours':f'{era.hours_min:g}-{era.hours_max:g}','passive':f'{era.passive_bulk_min:.0%}-{era.passive_bulk_max:.0%}','promise':era.promise})
if __name__=='__main__':main()
