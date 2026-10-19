import assert from 'node:assert/strict';
import {
  LEVEL_XP,TALENTS,TALENT_BY_ID,canUnlockTalent,deriveEffects,earnedMasteryPoints,levelForXp,spentMasteryPoints,
  type TalentId,type TalentMilestone
} from '../src/progression.ts';

const legacy=[0,120,420,1800,3200,5200,7800,11000,15000,20000];
assert.deepEqual(LEVEL_XP.slice(0,10),legacy,'legacy L1-L10 thresholds must remain exact');
assert.equal(LEVEL_XP.length,30);
assert.equal(levelForXp(19_999),9);assert.equal(levelForXp(20_000),10);
assert.equal(levelForXp(26_000),12);assert.equal(levelForXp(33_000),14);assert.equal(levelForXp(125_000),30);
assert.equal(earnedMasteryPoints(10),9);assert.equal(earnedMasteryPoints(14),13);assert.equal(earnedMasteryPoints(30),29);

const roots=['salvage_8','logistics_8','workshop_8','automation_8','trade_8'] as TalentId[];
assert.equal(new Set(roots.map(id=>TALENT_BY_ID.get(id)?.branch)).size,5,'every branch needs one Tier-II root');
for(const id of roots){const d=TALENT_BY_ID.get(id)!;assert.equal(d.progressionTier,2);assert.equal(d.runtime,true);assert.ok(d.milestone,`${id} must have milestone gate`);assert.equal(d.pointCost,1)}

const unlocked=new Set<TalentId>(['salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7']);
assert.equal(canUnlockTalent(TALENT_BY_ID.get('salvage_8')!,10,unlocked).ok,false,'XP alone must not unlock Tier II');
const vanMilestones=new Set<TalentMilestone>(['van']);
assert.equal(canUnlockTalent(TALENT_BY_ID.get('salvage_8')!,10,unlocked,vanMilestones).ok,true);

const effects=deriveEffects(new Set<TalentId>(['logistics_8','automation_1','automation_4','trade_1','trade_4','trade_8']));
assert.equal(effects.vanCapacityBonus,100);
assert.equal(effects.offlineEfficiency,.30);
assert.equal(effects.saleMultiplier,1.05);
assert.equal(effects.copperSaleMultiplier,1.08);
assert.equal(effects.contractChoices,2);

assert.equal(TALENT_BY_ID.get('automation_4')?.runtime,true);
assert.equal(TALENT_BY_ID.get('trade_4')?.runtime,true);
assert.equal(spentMasteryPoints(new Set<TalentId>(['salvage_1','trade_8'])),2);
assert.ok(TALENTS.some(x=>x.progressionTier===1)&&TALENTS.some(x=>x.progressionTier===2));

console.log(JSON.stringify({levels:LEVEL_XP.length,maxLevel:levelForXp(Number.MAX_SAFE_INTEGER),maxMastery:earnedMasteryPoints(30),runtimeTalents:TALENTS.filter(x=>x.runtime).length,tier2Roots:roots},null,2));
console.log('Progression Expansion V2 domain smoke: PASS');
