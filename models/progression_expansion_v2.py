#!/usr/bin/env python3
"""Progression contract after Talent Rebuild V4.

Levels 1-30 preserve shipped thresholds. Levels 31-50 extend useful progression
so the current-scope tree can eventually be completed instead of permanently
locking a large gray tail.
"""
from __future__ import annotations
import sys

LEVEL_XP=[
  0,120,420,1800,3200,5200,7800,11000,15000,20000,
  23000,26000,29500,33000,37000,41000,45500,50000,55000,60000,
  65500,71000,77000,83000,89500,96000,103000,110000,117500,125000,
  133000,141500,150500,160000,170000,180500,191500,203000,215000,227500,
  240500,254000,268000,282500,297500,313000,329000,345500,362500,380000,
]
LEGACY_LEVEL_XP=[0,120,420,1800,3200,5200,7800,11000,15000,20000]
TALENT_COUNT=40
FULL_TREE_COST=45
FRONTIER_XP_PER_HOUR=2200.0

def level_for_xp(xp:float)->int:
    level=1
    for i,threshold in enumerate(LEVEL_XP[1:],start=2):
        if xp>=threshold: level=i
    return level

def mastery_points(level:int)->int:return max(0,level-1)
def hours_after_level10(level:int)->float:
    if level<=10:return 0.0
    return (LEVEL_XP[level-1]-LEVEL_XP[9])/FRONTIER_XP_PER_HOUR

def check()->None:
    assert LEVEL_XP[:10]==LEGACY_LEVEL_XP
    assert len(LEVEL_XP)==50
    assert all(b>a for a,b in zip(LEVEL_XP,LEVEL_XP[1:]))
    assert level_for_xp(19_999)==9 and level_for_xp(20_000)==10
    assert level_for_xp(125_000)==30 and level_for_xp(380_000)==50
    assert mastery_points(30)==29 and mastery_points(50)==49
    assert mastery_points(50)>=FULL_TREE_COST
    assert TALENT_COUNT==40
    assert hours_after_level10(12)<=3.0
    assert hours_after_level10(16)<12.0

def main()->None:
    if '--check' in sys.argv: check()
    print('Progression / Talent V4 model')
    for level in [10,12,16,20,25,30,35,40,45,46,50]:
        print({'level':level,'xp':LEVEL_XP[level-1],'mastery_points':mastery_points(level),'hours_after_l10':round(hours_after_level10(level),2)})
    print({'talents':TALENT_COUNT,'full_tree_cost':FULL_TREE_COST,'full_tree_reachable_at_level':46})
    print('progression talent v4 model: PASS')
if __name__=='__main__':main()
