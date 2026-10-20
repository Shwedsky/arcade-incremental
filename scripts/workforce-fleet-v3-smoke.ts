import assert from 'node:assert/strict';
import {
  acquireVehicleV3,createDefaultWorkforceFleetV3,createOrAssignRouteV3,fleetCapacityForStage,hireWorkerV3,
  migrateLegacyWorkforceV3,nextWorkerHireCost,projectRouteV3,simulateWorkforceV3,workerCapacityForStage
} from '../src/workforce_fleet_v3.ts';

const now=1_900_000_000_000;
const state=createDefaultWorkforceFleetV3(now);
assert.equal(workerCapacityForStage('starter_garage'),1);
assert.equal(workerCapacityForStage('hangar'),5);
assert.equal(workerCapacityForStage('processing_plant'),16);
assert.equal(fleetCapacityForStage('hangar'),4);
assert.equal(nextWorkerHireCost(state),35_000);

const w1=hireWorkerV3(state,'hangar',now)!;
const w2=hireWorkerV3(state,'hangar',now)!;
assert.ok(w1&&w2);
const van1=acquireVehicleV3(state,'hangar','van',now)!;
const van2=acquireVehicleV3(state,'hangar','van',now)!;
assert.notEqual(van1.id,van2.id,'multiple vans must be real distinct assets');
assert.match(van2.name,/Фургон #2/);
const route1=createOrAssignRouteV3(state,{workerId:w1.id,zone:'z3',vehicleId:van1.id,now,shiftHours:2})!;
const route2=createOrAssignRouteV3(state,{workerId:w2.id,zone:'z2',vehicleId:van2.id,now,shiftHours:2})!;
assert.ok(route1&&route2);
const withVan=projectRouteV3(state,route1,{stage:'hangar',now,offline:false,offlineCapHours:4,workerOutputMultiplier:1,workerShiftMultiplier:1});
route1.vehicleId=null;van1.routeId=null;
const withoutVan=projectRouteV3(state,route1,{stage:'hangar',now,offline:false,offlineCapHours:4,workerOutputMultiplier:1,workerShiftMultiplier:1});
assert.ok(withVan.kgPerHour>withoutVan.kgPerHour,'vehicle assignment must visibly change throughput');
route1.vehicleId=van1.id;van1.routeId=route1.id;

const sim=simulateWorkforceV3(state,{stage:'hangar',now:now+60*60_000,offline:true,offlineCapHours:4,workerOutputMultiplier:1.2,workerShiftMultiplier:1});
assert.equal(sim.reports.length,2);
assert.ok(sim.reports.every(report=>report.gainedKg>0));
assert.ok(sim.total.metal>0);
assert.ok(sim.reports[0].capacityKg===400);

const migrated=migrateLegacyWorkforceV3({
 first:{hired:true,assignment:'z1'},second:{hired:true,assignment:'z5'},third:{hired:true,role:'operator',assignment:null},fourth:{hired:false,role:'scavenger',assignment:null},
 vanOwned:true,truckOwned:true,rigOwned:true,vanWorkerLegacySlot:'w1'
},now);
assert.equal(migrated.workers.length,3);
assert.equal(migrated.fleet.length,3);
assert.equal(migrated.routes.length,2,'legacy scavengers migrate to generic routes regardless of old pack origin');
assert.equal(migrated.routes.find(route=>route.zone==='z5')?.workerIds.length,1,'former worker #2 is not restricted to Z1-Z3 in V3');
assert.equal(migrated.fleet.find(vehicle=>vehicle.type==='van')?.routeId,migrated.routes.find(route=>route.zone==='z1')?.id);

console.log('Workforce/Fleet V3 arbitrary roster + multi-vehicle routes + migration: PASS');
