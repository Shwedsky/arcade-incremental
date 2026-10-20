import assert from 'node:assert/strict';
import {
  LEVEL_XP,TALENTS,TALENT_BY_ID,canUnlockTalent,deriveEffects,earnedMasteryPoints,levelForXp,spentMasteryPoints,totalTalentPointCost,
  type TalentId,type TalentMilestone
} from '../src/progression.ts';

const legacy=[0,120,420,1800,3200,5200,7800,11000,15000,20000];
assert.deepEqual(LEVEL_XP.slice(0,10),legacy,'legacy L1-L10 thresholds must remain exact');
assert.equal(LEVEL_XP.length,50);
assert.equal(levelForXp(19_999),9);assert.equal(levelForXp(20_000),10);assert.equal(levelForXp(125_000),30);assert.equal(levelForXp(380_000),50);
assert.equal(earnedMasteryPoints(30),29);assert.equal(earnedMasteryPoints(50),49);
assert.equal(TALENTS.length,40);assert.ok(TALENTS.every(talent=>talent.runtime),'every player-facing Talent V4 node must be real runtime');
assert.equal(totalTalentPointCost(),45,'V4 full tree budget must be reachable by late progression');
assert.ok(earnedMasteryPoints(50)>=totalTalentPointCost(),'late player must be able to finish the full current-scope tree');

const branchIds=['salvage','logistics','workshop','automation','trade'];
for(const branch of branchIds){const nodes=TALENTS.filter(t=>t.branch===branch);assert.equal(nodes.length,8);assert.ok(nodes.every((node,index)=>node.tier===index+1));assert.equal(nodes.at(-1)?.pointCost,2)}
const unlocked=new Set<TalentId>(['salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7']);
const vanMilestones=new Set<TalentMilestone>(['van']);
assert.equal(canUnlockTalent(TALENT_BY_ID.get('salvage_8')!,26,unlocked).ok,false);
assert.equal(canUnlockTalent(TALENT_BY_ID.get('salvage_8')!,26,unlocked,vanMilestones).ok,true);

const effects=deriveEffects(new Set<TalentId>([
  'salvage_1','salvage_2','salvage_6','salvage_7','logistics_1','logistics_4','logistics_5','logistics_6','logistics_8',
  'workshop_1','workshop_3','workshop_4','workshop_5','workshop_6','workshop_7','automation_1','automation_4','automation_5','automation_6','automation_7','trade_1','trade_4','trade_5','trade_6','trade_7'
]));
assert.ok(effects.dpsMultiplier>=1.24);assert.ok(effects.capacityBonus>=95);assert.equal(effects.vanCapacityBonus,150);
assert.equal(effects.workshopSlots,3);assert.equal(effects.workshopYieldMultiplier,1.25);assert.equal(effects.offlineEfficiency,.65);assert.equal(effects.offlineCapHours,10);
assert.equal(effects.saleMultiplier,1.18);assert.equal(effects.copperSaleMultiplier,1.12);assert.equal(effects.contractChoices,2);assert.ok(effects.workerOutputMultiplier>1);
assert.equal(spentMasteryPoints(new Set<TalentId>(['salvage_1','trade_8'])),3);

console.log(JSON.stringify({levels:LEVEL_XP.length,maxLevel:levelForXp(Number.MAX_SAFE_INTEGER),level50Points:earnedMasteryPoints(50),talents:TALENTS.length,totalCost:totalTalentPointCost()},null,2));
console.log('Talent V4 / extended progression domain smoke: PASS');
