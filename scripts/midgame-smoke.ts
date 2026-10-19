import assert from 'node:assert/strict';
import {
  VAN_CAPACITY_KG, VAN_RECIPE, FIRST_WORKER_COST, ZONE_DEFS,
  addActiveMastery, applyZoneProfile, assignWorker, canAssignWorker, canBuyVan, canHireFirstWorker,
  createDefaultMidgame, emptyComponentRecord, emptyMidComponentRecord, emptyResourceRecord,
  migrateMidgameFromV3, simulateWorkerGain, transferCartToVan, vanWeight, zoneMastered, zoneUnlock,zoneXpMultiplier,
} from '../src/midgame.ts';
import { generateField, hashSeed, mulberry32 } from '../src/sim.ts';

const installed=new Set<any>(['workbench','press','wire']);
const state=createDefaultMidgame(0);
assert.equal(state.currentZone,'z1');
assert.equal(zoneUnlock(state,'z1',{level:1,installed:new Set(),mastery:state.mastery}).ok,true);
assert.equal(zoneUnlock(state,'z2',{level:3,installed,mastery:state.mastery}).ok,false);
assert.equal(zoneUnlock(state,'z2',{level:4,installed,mastery:state.mastery}).ok,true);
assert.equal(zoneUnlock(state,'z3',{level:7,installed,mastery:state.mastery}).ok,false,'Z3 needs mastered Z2');
assert.equal(ZONE_DEFS.z2.yieldMultiplier,1.30);assert.equal(zoneXpMultiplier('z2'),1.20);
assert.equal(ZONE_DEFS.z3.yieldMultiplier,1.45);assert.equal(zoneXpMultiplier('z3'),1.30);

addActiveMastery(state,'z2',ZONE_DEFS.z2.masteryTarget);
assert.equal(zoneMastered(state,'z2'),true);
assert.equal(zoneUnlock(state,'z3',{level:7,installed,mastery:state.mastery}).ok,true);

const field=applyZoneProfile(generateField('midgame-smoke'), 'z3', mulberry32(hashSeed('profile')));
assert.equal(field.length,80);
assert.ok(field.some(t=>t.classId==='large_appliance'));
assert.ok(field.every(t=>t.maxHp>0));

const migrated=migrateMidgameFromV3(750,{bearing:2,motor:1,hydraulic:0,electronics:1},1000);
assert.equal(zoneMastered(migrated,'z1'),true);
assert.deepEqual(new Set(migrated.discoveredComponents),new Set(['bearing','motor','electronics']));

// Worker V2: mastery + cash is sufficient even before the Van exists.
state.mastery.z1=100;
assert.equal(state.van.owned,false);
assert.equal(canHireFirstWorker(state,FIRST_WORKER_COST),true,'first worker must not require Van ownership');

state.mastery.z2=100;
const vanCtx={level:7,installed,mastery:state.mastery};
assert.equal(canBuyVan(state,vanCtx,{cash:VAN_RECIPE.cash,metal:VAN_RECIPE.metal,cleanCopper:VAN_RECIPE.cleanCopper,motor:1,electronics:1}),true);
state.van.owned=true;
const haul=emptyResourceRecord();haul.metal=75;
const comps=emptyComponentRecord();comps.bearing=1;
const mid=emptyMidComponentRecord();mid.pump=1;
for(let i=0;i<5;i++){
  haul.metal=75;
  const moved=transferCartToVan(state.van,haul,comps,mid);
  assert.equal(Math.round(moved.movedKg),75);
  assert.equal(Math.round(moved.remainingKg),0);
}
assert.equal(Math.round(vanWeight(state.van)),375);
haul.metal=75;
const last=transferCartToVan(state.van,haul,comps,mid);
assert.equal(Math.round(last.movedKg),25);
assert.equal(Math.round(vanWeight(state.van)),VAN_CAPACITY_KG);
assert.equal(Math.round(last.remainingKg),50);

state.worker.hired=true;
assert.equal(canAssignWorker(state,'z1'),true);
assert.equal(canAssignWorker(state,'z3'),false);
assert.equal(assignWorker(state,'z1',0),true);
state.discoveredComponents=['bearing','motor'];
const gain=simulateWorkerGain(state,2*3_600_000,8);
assert.equal(gain.hours,2);
assert.ok(gain.weight>0);
assert.ok(gain.resources.metal<522*2,'worker must stay well below active Z1 throughput');
assert.equal(state.mastery.z1,100,'worker must not change mastery');

console.log(JSON.stringify({
  zones:Object.values(ZONE_DEFS).map(z=>({id:z.id,masteryTarget:z.masteryTarget,hp:z.hpMultiplier,yield:z.yieldMultiplier,xp:zoneXpMultiplier(z.id)})),
  vanCapacity:VAN_CAPACITY_KG,
  fiveCartLoadsKg:375,
  firstWorkerCost:FIRST_WORKER_COST,
  worker2hKg:gain.weight
},null,2));
console.log('midgame domain smoke: PASS');
