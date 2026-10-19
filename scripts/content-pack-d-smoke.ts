import assert from 'node:assert/strict';
import {
  FOURTH_WORKER_COST, INDUSTRIAL_WORKSHOP_CASH, PACK_D_ZONE_PROFILE, RECOVERY_ASSEMBLY_PITY,
  RECOVERY_RIG_CAPACITY_KG, RECOVERY_RIG_CASH, acquireIndustrialWorkshop, acquireRecoveryRig,
  assignFourthWorkerOperator, assignFourthWorkerScavenger, canAcquireIndustrialWorkshop, canAcquireRecoveryRig,
  canHireFourthWorker, canUnlockZ7, createDefaultPackD, hireFourthWorker, recoveryRigRemaining, recoveryRigWeight,
  rollRecoveryAssembly, simulateFourthWorker, transferToRecoveryRig, truckWorkerRouteEligible, unloadRecoveryRig,
  z7AlloyYield, type PackDInventory,
} from '../src/content_pack_d.ts';
import {createDefaultWorkerEconomy} from '../src/worker_economy_v2.ts';

const state=createDefaultPackD(0),economy=createDefaultWorkerEconomy(0);
assert.equal(PACK_D_ZONE_PROFILE.id,'z7');
assert.ok(PACK_D_ZONE_PROFILE.hpMultiplier>3);
assert.ok(PACK_D_ZONE_PROFILE.nodeWeights.large_appliance>.5,'Z7 must read as heavy-target frontier');
assert.equal(RECOVERY_RIG_CAPACITY_KG,1800);

const gate={z6Mastered:false,salvageYardOwned:false,truckOwned:false};
assert.equal(canUnlockZ7(gate).ok,false);
assert.equal(canUnlockZ7({...gate,z6Mastered:true,salvageYardOwned:true,truckOwned:true}).ok,true);

let found=false;
for(let i=0;i<RECOVERY_ASSEMBLY_PITY;i++)found=rollRecoveryAssembly(state,'large_appliance',()=>1);
assert.equal(found,true,'active Z7 signature recovery assembly must pity by the bounded eligible-source threshold');
assert.equal(state.recoveryAssemblies,1);
assert.equal(state.recoveryPity,0);
assert.equal(rollRecoveryAssembly(state,'small_scrap',()=>0),false,'small junk cannot create signature recovery assemblies');
assert.ok(z7AlloyYield('large_appliance',()=>.5)>z7AlloyYield('medium_appliance',()=>.5));

const inv:PackDInventory={
  cash:2_000_000,metal:4000,cleanCopper:400,granulate:300,steelBlank:400,aluminiumBillet:200,alloyBillet:400,
  drive:10,control:12,hydraulicPower:10,heavyFrame:10,gearbox:5,generator:5,
  industrialController:8,heavyHydraulicCylinder:8
};
assert.equal(canAcquireRecoveryRig(state,inv,false),false,'Rig cannot bypass the Z7 frontier gate');
assert.equal(canAcquireRecoveryRig(state,inv,true),true);
assert.equal(acquireRecoveryRig(state,inv,true),true);
assert.equal(state.recoveryRig.owned,true);
assert.ok(inv.cash<2_000_000-1);
assert.equal(truckWorkerRouteEligible(state),true,'Truck gains its second-life route role only after player upgrades to Rig');

const haul={metal:900,copper:100,plastic:100},alloy={value:800};
const aluminium={value:40};const moved=transferToRecoveryRig(state,haul,aluminium,alloy);
assert.ok(moved>0&&recoveryRigWeight(state)<=RECOVERY_RIG_CAPACITY_KG+1e-9);assert.ok(state.recoveryRig.aluminiumScrap>0);
assert.equal(Math.round(moved),RECOVERY_RIG_CAPACITY_KG);
assert.equal(Math.round(recoveryRigWeight(state)),RECOVERY_RIG_CAPACITY_KG);
assert.equal(Math.round(recoveryRigRemaining(state)),0);
const storage={metal:0,copper:0,plastic:0};const unloaded=unloadRecoveryRig(state,storage);
assert.equal(Math.round(unloaded.weight),RECOVERY_RIG_CAPACITY_KG);assert.ok(unloaded.alloyScrap>0);assert.equal(recoveryRigWeight(state),0);

assert.equal(canAcquireIndustrialWorkshop(state,inv,false),false,'Workshop cannot bypass Z7 mastery');
Object.assign(inv,{cash:Math.max(inv.cash,INDUSTRIAL_WORKSHOP_CASH),metal:4000,cleanCopper:400,granulate:300,steelBlank:400,aluminiumBillet:200,alloyBillet:400,drive:10,control:12,hydraulicPower:10,heavyFrame:10,industrialController:8,heavyHydraulicCylinder:8});
assert.equal(canAcquireIndustrialWorkshop(state,inv,true),true);
assert.equal(acquireIndustrialWorkshop(state,inv,true),true);
assert.equal(state.industrialWorkshopOwned,true);assert.equal(state.productionCells,2);

assert.equal(canHireFourthWorker(state,FOURTH_WORKER_COST),true);assert.equal(hireFourthWorker(state,1_000),true);
assert.equal(assignFourthWorkerScavenger(state,'z7',false,1_000),false,'Worker #4 cannot enter unmastered frontier');
assert.equal(assignFourthWorkerScavenger(state,'z6',true,1_000),true);
const scav=simulateFourthWorker(state,economy,['bearing','motor'],3_601_000,false);assert.ok(scav.resources.metal>0);
assert.equal(assignFourthWorkerOperator(state,2,4_000_000),false,'Operator cell index must remain bounded by Workshop cells');
assert.equal(assignFourthWorkerOperator(state,1,4_000_000),true);
assert.equal(state.crew4.role,'operator');assert.equal(state.crew4.operatorCell,1);assert.equal(simulateFourthWorker(state,economy,['bearing','motor'],5_000_000,false).resources.metal,0,'Operator cannot scavenge simultaneously');

console.log(JSON.stringify({
  zone:{id:PACK_D_ZONE_PROFILE.id,hp:PACK_D_ZONE_PROFILE.hpMultiplier,yield:PACK_D_ZONE_PROFILE.yieldMultiplier,mastery:PACK_D_ZONE_PROFILE.masteryTarget},
  recoveryAssemblyPity:RECOVERY_ASSEMBLY_PITY,recoveryRigCash:RECOVERY_RIG_CASH,recoveryRigCapacity:RECOVERY_RIG_CAPACITY_KG,
  industrialWorkshop:true,productionCells:state.productionCells,fourthWorker:true
},null,2));
console.log('Content Pack D domain smoke: PASS');