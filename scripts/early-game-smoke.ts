import assert from 'node:assert/strict';
import {
  CONTRACTS, EQUIPMENT_DEFS, activeContract, buildDurationSec, cartBaseCapacity, contractScale,
  jobProgress, nextEquipmentUpgrade, processSpec, toolPowerMultiplier, upgradeDurationSec,
  type WorkshopJob
} from '../src/early_game.ts';
import { deriveEffects } from '../src/progression.ts';

assert.equal(EQUIPMENT_DEFS.tool.upgrades.length,3);
assert.equal(EQUIPMENT_DEFS.cart.upgrades.length,3);
assert.equal(nextEquipmentUpgrade('tool',1)?.toLevel,2);
assert.equal(nextEquipmentUpgrade('cart',3)?.toLevel,4);
assert.ok(toolPowerMultiplier(2)>toolPowerMultiplier(1));
assert.ok(toolPowerMultiplier(4)>toolPowerMultiplier(3));
assert.deepEqual([1,2,3,4].map(cartBaseCapacity),[40,55,75,100]);
assert.ok(buildDurationSec('press')>=600,'first press should feel like a real fabrication milestone');
assert.ok(upgradeDurationSec('press',2)>0);

const baseEffects=deriveEffects(new Set());
const queueEffects=deriveEffects(new Set(['workshop_1','workshop_2','workshop_3','workshop_4']));
assert.equal(baseEffects.workshopSlots,1);
assert.equal(queueEffects.workshopSlots,2);
assert.ok(queueEffects.workshopSpeedMultiplier>1);
assert.equal(deriveEffects(new Set(['automation_1','automation_2','automation_3'])).autoFeed,true);
assert.equal(deriveEffects(new Set(['trade_1','trade_2','trade_3'])).urgentContracts,true);

const press=processSpec('press',1,1)!;
assert.equal(press.resource,'metal');
assert.equal(press.kind,'briquette');
assert.equal(press.input,10);
assert.equal(press.output,10);
assert.ok(press.durationSec>=20&&press.durationSec<=45);
const better=processSpec('press',2,1.1)!;
assert.ok(better.input>press.input);
assert.ok(better.output>better.input);
assert.ok(better.durationSec<press.durationSec);

assert.equal(CONTRACTS.length,3);
assert.equal(activeContract({index:0,completed:0}).id,'metal_pickup');
assert.equal(activeContract({index:3,completed:3}).id,'metal_pickup');
assert.ok(contractScale({index:0,completed:0},true)>contractScale({index:0,completed:0},false));
assert.ok(contractScale({index:1,completed:5},false)>1);
const repairState={index:1,completed:1};
const normalizedBearing=activeContract(repairState).needs.find(n=>n.kind==='component')!;
const experienceNeedMultiplier=1+Math.min(.25,repairState.completed*.025);
assert.equal(Math.ceil(normalizedBearing.amount*experienceNeedMultiplier),1,'normal repair contract must require exactly one bearing');
assert.equal(Math.ceil(normalizedBearing.amount*(experienceNeedMultiplier+.08)),1,'urgent repair contract must still require exactly one bearing');

const now=10_000;
const job:WorkshopJob={id:'proof',kind:'equipment',label:'proof',equipmentId:'tool',targetLevel:2,startedAt:now,endsAt:now+120_000};
assert.equal(jobProgress(job,now),0);
assert.equal(jobProgress(job,now+60_000),.5);
assert.equal(jobProgress(job,now+120_000),1);

console.log(JSON.stringify({
  toolLevels:[1,2,3,4].map(level=>({level,power:toolPowerMultiplier(level)})),
  cartLevels:[1,2,3,4].map(level=>({level,capacity:cartBaseCapacity(level)})),
  baseSlots:baseEffects.workshopSlots,
  parallelSlots:queueEffects.workshopSlots,
  firstPressBuildSec:buildDurationSec('press'),
  contracts:CONTRACTS.map(c=>c.id),
  repairBearingDisplayAndConsume:{normal:Math.ceil(normalizedBearing.amount*experienceNeedMultiplier),urgent:Math.ceil(normalizedBearing.amount*(experienceNeedMultiplier+.08))}
},null,2));
console.log('early-game systems smoke: PASS');
