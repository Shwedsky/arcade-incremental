import assert from 'node:assert/strict';
import { FIELD_NODE_COUNT, TARGET_CLASSES, WORLD, expectedFieldMix, generateField, getTargetClass, hashSeed, mulberry32, rollDrops } from '../src/sim.ts';
import { MACHINE_DEFS, STARTING_CASH, canAfford, machineUnlocked, nextUpgrade, type GarageInventory, type ProgressContext } from '../src/garage.ts';
import { TALENTS, canUnlockTalent, deriveEffects, earnedMasteryPoints, levelForXp, totalTalentPointCost, type TalentId } from '../src/progression.ts';

const a = generateField('smoke-seed');
const b = generateField('smoke-seed');
assert.equal(a.length, FIELD_NODE_COUNT);
assert.deepEqual(a, b, 'field generation must be deterministic for a fixed seed');
assert.equal(TARGET_CLASSES.reduce((sum, item) => sum + item.share, 0).toFixed(6), '1.000000');
assert.ok(a.every((target) => target.x > 0 && target.x < WORLD.width && target.y > 0 && target.y < WORLD.height));

const mix = expectedFieldMix();
for (const def of TARGET_CLASSES) assert.ok(mix[def.id] >= 4 || def.share < 0.05, `expected mix too sparse for ${def.id}`);

const rng = mulberry32(hashSeed('drop-smoke'));
const totals = { metal: 0, copper: 0, plastic: 0 };
const components = { bearing: 0, motor: 0, hydraulic: 0, electronics: 0 };
let rolls = 0;
for (let repeat = 0; repeat < 600; repeat += 1) {
  for (const def of TARGET_CLASSES) {
    const result = rollDrops(def.id, rng);
    totals.metal += result.resources.metal;
    totals.copper += result.resources.copper;
    totals.plastic += result.resources.plastic;
    if (result.component) components[result.component] += 1;
    rolls += 1;
    assert.ok(result.resources.metal >= 0 && result.resources.copper >= 0 && result.resources.plastic >= 0);
    assert.ok(getTargetClass(def.id).breakSeconds > 0);
  }
}
assert.ok(totals.metal > totals.copper * 3, 'metal should dominate early raw mass');
assert.ok(totals.plastic > totals.copper, 'plastic should be more common than copper by mass');
assert.ok(Object.values(components).reduce((sum, value) => sum + value, 0) > 10, 'component drops should exist');

assert.equal(TALENTS.length,40,'Talent V4 exposes five complete eight-node branches');
assert.ok(TALENTS.every(t=>t.runtime),'every visible talent must be functional');
assert.equal(totalTalentPointCost(),45);
assert.equal(new Set(TALENTS.map((t) => t.id)).size,40,'talent ids must be unique');
assert.equal(levelForXp(0),1);assert.equal(levelForXp(120),2);assert.equal(levelForXp(420),3);assert.equal(levelForXp(1800),4);assert.equal(levelForXp(380000),50);
assert.equal(earnedMasteryPoints(4),3);assert.equal(earnedMasteryPoints(46),45);

const combo=TALENTS.find(t=>t.id==='salvage_3')!;
assert.equal(combo.name,'Combo');assert.equal(combo.minLevel,6);assert.equal(combo.requires,'salvage_2');
const salvageTwo=new Set<TalentId>(['salvage_1','salvage_2']);
assert.equal(canUnlockTalent(combo,5,salvageTwo).ok,false);assert.equal(canUnlockTalent(combo,6,salvageTwo).ok,true);
const wideSwing=TALENTS.find(t=>t.id==='salvage_8')!;
assert.equal(wideSwing.name,'Широкий замах');assert.equal(wideSwing.requires,'salvage_7');assert.equal(wideSwing.pointCost,2);
assert.equal(canUnlockTalent(wideSwing,25,new Set<TalentId>(['salvage_7']),new Set(['van'] as const)).ok,false);
assert.equal(canUnlockTalent(wideSwing,26,new Set<TalentId>(['salvage_7'])).ok,false);
assert.equal(canUnlockTalent(wideSwing,26,new Set<TalentId>(['salvage_7']),new Set(['van'] as const)).ok,true);
const heavyFab=TALENTS.find(t=>t.id==='workshop_8')!;
const shiftLead=TALENTS.find(t=>t.id==='automation_8')!;
assert.equal(heavyFab.name,'Тяжёлая фабрикация');assert.equal(shiftLead.name,'Начальник смены');
assert.equal(canUnlockTalent(heavyFab,28,new Set<TalentId>(['workshop_7'])).ok,false);
assert.equal(canUnlockTalent(heavyFab,28,new Set<TalentId>(['workshop_7']),new Set(['industrial_workshop'] as const)).ok,true);
assert.equal(canUnlockTalent(shiftLead,30,new Set<TalentId>(['automation_7'])).ok,false);
assert.equal(canUnlockTalent(shiftLead,30,new Set<TalentId>(['automation_7']),new Set(['industrial_workshop'] as const)).ok,true);

const effectSet=new Set<TalentId>(['salvage_1','salvage_2','salvage_3','salvage_7','salvage_8','logistics_1','workshop_8','automation_1','automation_8','trade_1']);
const fx=deriveEffects(effectSet);
assert.equal(fx.dpsMultiplier.toFixed(2),'1.24');assert.equal(fx.capacityBonus,15);assert.equal(fx.comboUnlocked,true);assert.equal(fx.wideSwingUnlocked,true);
assert.equal(fx.offlineEfficiency,.75);assert.equal(fx.offlineCapHours,12);assert.equal(fx.saleMultiplier,1.08);assert.equal(fx.industrialProductionMultiplier,.78);assert.equal(fx.operatorUnlocked,true);

const press=MACHINE_DEFS.press;
assert.equal(press.name,'Малый гидропресс');assert.equal(press.buyPrice,24000);assert.equal(press.upgrades.length,5,'press now grows through six total machine levels');
assert.ok(press.requirements.some(r=>r.kind==='resource'&&r.key==='metal'&&r.amount===100));
assert.ok(press.requirements.some(r=>r.kind==='component'&&r.key==='bearing'&&r.amount===2));
assert.ok(press.requirements.some(r=>r.kind==='component'&&r.key==='hydraulic'&&r.amount===1));
assert.ok(press.requirements.every(r=>r.source.length>10),'every requirement must explain where it comes from');
assert.ok(nextUpgrade(press,1),'installed press must expose its next upgrade requirements');
assert.ok(nextUpgrade(press,5),'late press progression must continue beyond the former level-4 cap');

const insufficient:GarageInventory={resources:{metal:99,copper:0,plastic:0},components:{bearing:2,hydraulic:1,motor:0,electronics:0},cash:STARTING_CASH};
assert.equal(canAfford(press.requirements,insufficient),false,'press must remain unaffordable while recipe is incomplete');
const sufficient:GarageInventory={...insufficient,resources:{...insufficient.resources,metal:100}};
assert.equal(canAfford(press.requirements,sufficient),true,'press becomes affordable when recipe is complete');
const baseContext:ProgressContext={level:2,talents:new Set<TalentId>(),installed:new Set(['workbench'])};
assert.equal(machineUnlocked(MACHINE_DEFS.press,baseContext),true,'press is an early visible build target');
assert.equal(machineUnlocked(MACHINE_DEFS.wire,baseContext),false,'wire stripper must explain and enforce progression gates');
const wireContext:ProgressContext={level:3,talents:new Set<TalentId>(),installed:new Set(['workbench','press'])};
assert.equal(machineUnlocked(MACHINE_DEFS.wire,wireContext),true,'wire stripper unlocks after level and press gate');

console.log(JSON.stringify({fieldNodes:a.length,rolls,totals,components,talents:TALENTS.length,totalTalentCost:totalTalentPointCost(),combo,wideSwing,heavyFab,shiftLead,pressUpgrades:press.upgrades.length},null,2));
console.log('salvage slice smoke / Core Rebuild V1: PASS');
