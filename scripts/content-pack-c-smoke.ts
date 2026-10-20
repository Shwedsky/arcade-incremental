import assert from 'node:assert/strict';
import {
  PACK_C_ZONE_PROFILES, SALVAGE_YARD_CASH, SALVAGE_YARD_RECIPE, THIRD_WORKER_COST,
  acquireSalvageYard, advancePackCProduction, alloyYield, assignThirdWorkerOperator, assignThirdWorkerScavenger,
  canAcquireSalvageYard, canHireThirdWorker, canUnlockPackCZone, createDefaultPackC, fabricateHeavyModule,
  hireThirdWorker, productionDurationSec, refineAlloy, rollPackCComponent, simulateThirdWorker, startPackCProduction,
  type PackCInventory,
} from '../src/content_pack_c.ts';
import {createDefaultWorkerEconomy} from '../src/worker_economy_v2.ts';

const state=createDefaultPackC(0),economy=createDefaultWorkerEconomy(0);
assert.deepEqual(Object.keys(PACK_C_ZONE_PROFILES),['z5','z6']);
assert.ok(PACK_C_ZONE_PROFILES.z6.hpMultiplier>PACK_C_ZONE_PROFILES.z5.hpMultiplier);
assert.ok(PACK_C_ZONE_PROFILES.z6.masteryTarget>PACK_C_ZONE_PROFILES.z5.masteryTarget);

const gateBase={z4Mastered:false,z5Mastered:false,hangarOwned:false,truckOwned:false,controllerDiscovered:false};
assert.equal(canUnlockPackCZone('z5',gateBase).ok,false);
assert.equal(canUnlockPackCZone('z5',{...gateBase,z4Mastered:true,hangarOwned:true,truckOwned:true}).ok,true);
assert.equal(canUnlockPackCZone('z6',{...gateBase,z4Mastered:true,z5Mastered:true,hangarOwned:true,truckOwned:true}).ok,false,'Z6 needs active controller discovery');

let drop:ReturnType<typeof rollPackCComponent>;
for(let i=0;i<12;i++)drop=rollPackCComponent(state,'z5','large_appliance',()=>1);
assert.equal(drop,'industrialController','controller must pity by 12 eligible Z5 targets');
assert.ok(state.discoveredIndustrial.includes('industrialController'));
assert.equal(canUnlockPackCZone('z6',{...gateBase,z4Mastered:true,z5Mastered:true,hangarOwned:true,truckOwned:true,controllerDiscovered:true}).ok,true);
for(let i=0;i<10;i++)drop=rollPackCComponent(state,'z6','large_appliance',()=>1);
assert.equal(drop,'heavyHydraulicCylinder','heavy cylinder must pity by 10 eligible Z6 targets');
assert.ok(state.discoveredIndustrial.includes('heavyHydraulicCylinder'));

const z5Alloy=alloyYield('z5','large_appliance',()=>.5),z6Alloy=alloyYield('z6','large_appliance',()=>.5);
assert.ok(z5Alloy>0);assert.ok(z6Alloy>z5Alloy,'Z6 should be the stronger alloy source');
state.materials.alloyScrap=50;assert.equal(refineAlloy(state,2),36);assert.equal(state.materials.alloyBillet,36);

state.industrial.heavyHydraulicCylinder=5;state.industrial.industrialController=5;
const inv:PackCInventory={cash:500_000,metal:1000,cleanCopper:100,briquette:200,steelBlank:120,aluminiumBillet:60,structural:6,control:8,hydraulic:4,pump:4};
assert.equal(fabricateHeavyModule(state,'hydraulicPower',inv),true);assert.equal(fabricateHeavyModule(state,'heavyFrame',inv),true);
state.materials.alloyBillet+=20;assert.equal(fabricateHeavyModule(state,'hydraulicPower',inv),true);assert.equal(fabricateHeavyModule(state,'heavyFrame',inv),true);

assert.equal(canAcquireSalvageYard(state,inv,false),false,'Yard cannot bypass Z6 mastery');
state.materials.alloyBillet=Math.max(state.materials.alloyBillet,SALVAGE_YARD_RECIPE.alloyBillet);
inv.cash=Math.max(inv.cash,SALVAGE_YARD_CASH);inv.metal=Math.max(inv.metal,SALVAGE_YARD_RECIPE.metal);inv.cleanCopper=Math.max(inv.cleanCopper,SALVAGE_YARD_RECIPE.cleanCopper);inv.briquette=Math.max(inv.briquette,SALVAGE_YARD_RECIPE.briquette);inv.steelBlank=Math.max(inv.steelBlank,SALVAGE_YARD_RECIPE.steelBlank);inv.aluminiumBillet=Math.max(inv.aluminiumBillet,SALVAGE_YARD_RECIPE.aluminiumBillet);inv.control=Math.max(inv.control,SALVAGE_YARD_RECIPE.control);
assert.equal(acquireSalvageYard(state,inv,true),true);assert.equal(state.salvageYardOwned,true);

assert.equal(canHireThirdWorker(state,THIRD_WORKER_COST),true);assert.equal(hireThirdWorker(state,1_000),true);
assert.equal(assignThirdWorkerScavenger(state,'z5',false,1_000),false,'crew cannot enter unmastered zone');
assert.equal(assignThirdWorkerScavenger(state,'z4',true,1_000),true);
const scav=simulateThirdWorker(state,economy,['bearing','motor'],3_601_000,false);assert.ok(scav.resources.metal>0);
const normalDuration=productionDurationSec(state,'alloyBillet');
assert.equal(assignThirdWorkerOperator(state,4_000_000),true);
assert.equal(simulateThirdWorker(state,economy,['bearing','motor'],5_000_000,false).resources.metal,0,'legacy Operator cannot scavenge simultaneously');
const legacyOperatorDuration=productionDurationSec(state,'alloyBillet');
assert.equal(legacyOperatorDuration,normalDuration,'legacy Pack C worker role must not own production speed; Workforce V3 runtime applies the real Operator factor');

state.materials.alloyScrap=25;
assert.equal(startPackCProduction(state,'alloyBillet',inv,10_000),true);
assert.ok(state.production);assert.equal(advancePackCProduction(state,state.production!.endsAt-1),undefined);
assert.equal(advancePackCProduction(state,state.production!.endsAt),'alloyBillet');assert.ok(state.materials.alloyBillet>=18);

console.log(JSON.stringify({zones:Object.values(PACK_C_ZONE_PROFILES).map(z=>({id:z.id,hp:z.hpMultiplier,yield:z.yieldMultiplier,mastery:z.masteryTarget})),controllerPity:12,cylinderPity:10,alloyBatch:'25 -> 18',legacyOperatorOwnsProductionSpeed:false,thirdWorker:true,salvageYard:true},null,2));
console.log('Content Pack C domain smoke / generic Operator ownership: PASS');
