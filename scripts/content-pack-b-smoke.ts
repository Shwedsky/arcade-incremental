import assert from 'node:assert/strict';
import {
  HANGAR_CASH,HANGAR_RECIPE,SECOND_WORKER_COST,TRUCK_CAPACITY_KG,TRUCK_CASH,TRUCK_RECIPE,
  acquireHangar,acquireTruck,assignSecondWorker,canAcquireHangar,canAcquireTruck,canFabricateModule,
  canHireSecondWorker,createDefaultPackB,fabricateModule,hireSecondWorker,industrialName,normalizePackB,
  refineAluminium,refineSteel,rollIndustrialComponent,simulateSecondWorker,transferCartToTruck,truckWeight,unloadTruck,z4AluminiumYield
} from '../src/content_pack_b.ts';
import type { ComponentKind, ResourceKind } from '../src/sim.ts';

const state=createDefaultPackB(0);
assert.equal(TRUCK_CAPACITY_KG,1000);
assert.equal(industrialName('gearbox'),'Коробка передач');

// Deterministic pity: large drivetrain guarantees gearbox by the 8th eligible source.
let gotGearbox=false;
for(let i=0;i<8;i++)if(rollIndustrialComponent(state,'large_appliance',()=>.99)==='gearbox')gotGearbox=true;
assert.equal(gotGearbox,true);
assert.equal(state.discoveredIndustrial.includes('gearbox'),true);

// Medium targets guarantee generator by 10 eligible sources.
let gotGenerator=false;
for(let i=0;i<10;i++)if(rollIndustrialComponent(state,'medium_appliance',()=>.99)==='generator')gotGenerator=true;
assert.equal(gotGenerator,true);
assert.equal(state.discoveredIndustrial.includes('generator'),true);
assert.ok(z4AluminiumYield('large_appliance',()=>.5)>1);

const components:Record<ComponentKind,number>={bearing:10,motor:4,hydraulic:2,electronics:8};
const inv={cash:1_000_000,metal:2000,cleanCopper:200,briquette:500,components};
state.materials.aluminiumScrap=240;
assert.equal(refineSteel(state,inv,20),20);
assert.equal(refineAluminium(state,20),20);

// Fabricate enough modules for Hangar + Truck.
state.industrial.gearbox=4;state.industrial.generator=2;
assert.equal(canFabricateModule(state,'structural',inv),true);
assert.equal(fabricateModule(state,'structural',inv),true);
assert.equal(fabricateModule(state,'structural',inv),true);
assert.equal(fabricateModule(state,'control',inv),true);
assert.equal(canAcquireHangar(state,inv,true),true);
assert.equal(acquireHangar(state,inv,true),true);
assert.equal(state.hangarOwned,true);

// Produce truck modules after Hangar spend.
assert.equal(fabricateModule(state,'drive',inv),true);
assert.equal(fabricateModule(state,'control',inv),true);
assert.equal(canAcquireTruck(state,inv,true),true);
assert.equal(acquireTruck(state,inv,true),true);
assert.equal(state.truck.owned,true);

const haul:Record<ResourceKind,number>={metal:300,copper:60,plastic:40};
const aluminium={value:30};
const moved=transferCartToTruck(state,haul,aluminium);
assert.equal(Math.round(moved),430);
assert.equal(Math.round(truckWeight(state)),430);
const storage:Record<ResourceKind,number>={metal:0,copper:0,plastic:0};
const unloaded=unloadTruck(state,storage);
assert.equal(Math.round(unloaded.weight),430);
assert.equal(Math.round(state.materials.aluminiumScrap),30);

assert.equal(canHireSecondWorker(state,true,SECOND_WORKER_COST),true);
assert.equal(hireSecondWorker(state,0),true);
assert.equal(assignSecondWorker(state,'z1',true,0),true);
const gain=simulateSecondWorker(state,2*3_600_000,10);
assert.equal(gain.hours,2);
assert.ok(gain.resources.metal>100);

// Normalization must preserve backward-compatible partial saves.
const restored=normalizePackB({hangarOwned:true,truck:{owned:true,resources:{metal:5,copper:0,plastic:0},aluminiumScrap:2}} as any,100);
assert.equal(restored.hangarOwned,true);
assert.equal(restored.truck.resources.metal,5);
assert.equal(restored.materials.steelBlank,0);

console.log(JSON.stringify({
  hangarCash:HANGAR_CASH,truckCash:TRUCK_CASH,hangarRecipe:HANGAR_RECIPE,truckRecipe:TRUCK_RECIPE,
  truckCapacity:TRUCK_CAPACITY_KG,secondWorkerCost:SECOND_WORKER_COST,worker2hKg:Object.values(gain.resources).reduce((a,b)=>a+b,0)
},null,2));
console.log('Content Pack B domain smoke: PASS');
