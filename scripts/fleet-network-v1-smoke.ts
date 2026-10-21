import assert from 'node:assert/strict';
import {createDefaultWorkforceFleetV3,hireWorkerV3,acquireVehicleV3,createOrAssignRouteV3,projectRouteV3} from '../src/workforce_fleet_v3.ts';
import {deriveFleetNetworkV1,previewCrewDispatchV1} from '../src/fleet_network_v1.ts';

const now=1_800_000_000_000;
const state=createDefaultWorkforceFleetV3(now);
for(let i=0;i<3;i++)assert.ok(hireWorkerV3(state,'salvage_yard',now+i));
const van=acquireVehicleV3(state,'salvage_yard','van',now+10),truck=acquireVehicleV3(state,'salvage_yard','truck',now+11);
assert.ok(van&&truck,'Yard fleet should own Van + Truck simultaneously');
const r1=createOrAssignRouteV3(state,{workerId:state.workers[0].id,zone:'z1',vehicleId:van!.id,shiftHours:8,now});
const r2=createOrAssignRouteV3(state,{workerId:state.workers[1].id,zone:'z4',vehicleId:truck!.id,shiftHours:2,now});
assert.ok(r1&&r2,'two simultaneous routes should be created');
const ctx={stage:'salvage_yard' as const,now,offline:false,offlineCapHours:0,workerOutputMultiplier:1,workerShiftMultiplier:1};
const network=deriveFleetNetworkV1(state,routeId=>{
  const route=state.routes.find(item=>item.id===routeId);return route?projectRouteV3(state,route,ctx):null;
},now);
assert.equal(network.routes.length,2);
assert.equal(network.summary.routeCount,2);
assert.equal(network.summary.routedWorkerCount,2);
assert.equal(network.summary.idleWorkerCount,1);
assert.equal(network.summary.assignedVehicleCount,2);
assert.equal(network.summary.freeVehicleCount,0);
assert.ok(network.summary.totalKgPerHour>300,'network should aggregate both route throughputs');
assert.equal(network.routes.find(route=>route.routeId===r1!.id)?.bottleneck,'capacity','long Van shift should expose capacity bottleneck');
assert.equal(network.routes.find(route=>route.routeId===r2!.id)?.bottleneck,'none','short Truck shift should stay balanced');
assert.equal(network.summary.constrainedRouteCount,1);
assert.ok(network.routes.every(route=>route.workerNames.length===1));

// Group-dispatch preview must not mutate canonical state and must expose workers without transport.
const dispatch=createDefaultWorkforceFleetV3(now);
for(let i=0;i<3;i++)assert.ok(hireWorkerV3(dispatch,'salvage_yard',now+i));
dispatch.workers[0].rank=3;dispatch.workers[1].rank=2;
const rig=acquireVehicleV3(dispatch,'salvage_yard','recovery_rig',now+20);assert.ok(rig);
const before=JSON.stringify(dispatch);
const preview=previewCrewDispatchV1(dispatch,{workerIds:[dispatch.workers[2].id,dispatch.workers[0].id],vehicleIds:[rig!.id],zone:'z3',shiftHours:4,now});
assert.equal(preview.routeCount,2,'one group action should preview two canonical routes');
assert.equal(preview.workerIds[0],dispatch.workers[0].id,'strongest selected worker should receive the first/largest selected vehicle');
assert.equal(preview.vehicleIds.length,1);
assert.equal(preview.unservedWorkerCount,1,'second selected worker must be explicit about lacking a vehicle');
assert.ok(preview.totalKgPerHour>0);
assert.equal(JSON.stringify(dispatch),before,'preview must never mutate canonical Workforce/Fleet V3 state');

console.log('Fleet Network V1 multi-route read model + capacity bottleneck + group dispatch preview: PASS');
