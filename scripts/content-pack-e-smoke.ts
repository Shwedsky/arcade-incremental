import assert from 'node:assert/strict';
import {
  PACK_E_ZONE_PROFILE,PORT_POWER_ASSEMBLY_PITY,PROCESSING_PLANT_CASH,PROCESSING_PLANT_LINES,PROCESSING_PLANT_RECIPE,PROCESSING_PLANT_STORAGE_KG,
  PLANT_ALLOY_INPUT,PLANT_ALLOY_OUTPUT,PLANT_ALLOY_SECONDS,Z8_MIN_LEVEL,
  acquireProcessingPlant,advancePlantProduction,canAcquireProcessingPlant,canStartPlantAlloy,canUnlockZ8,capZ8MasteryUntilSignature,createDefaultPackE,normalizePackE,
  rollPortPowerAssembly,startPlantAlloy,z8AdvancedMetalYield,
  type PackEInventory, type ProcessingPlantContext
} from '../src/content_pack_e.ts';

const weightSum=Object.values(PACK_E_ZONE_PROFILE.nodeWeights).reduce((sum,value)=>sum+value,0);
assert.ok(Math.abs(weightSum-1)<1e-9,'Z8 target weights must sum to 1');
assert.equal(PACK_E_ZONE_PROFILE.id,'z8');
assert.equal(PACK_E_ZONE_PROFILE.name,'Портовый терминал');
assert.equal(PACK_E_ZONE_PROFILE.hpMultiplier,3.45);
assert.equal(PACK_E_ZONE_PROFILE.yieldMultiplier,2.90);
assert.equal(PACK_E_ZONE_PROFILE.masteryTarget,12_400);
assert.equal(PACK_E_ZONE_PROFILE.nodeWeights.large_appliance,.60,'Z8 must be heavier than Z7 rather than only higher HP');
assert.equal(Z8_MIN_LEVEL,16);

assert.equal(canUnlockZ8({level:15,z7Mastered:true,industrialWorkshopOwned:true,recoveryRigOwned:true}).ok,false,'level gate must matter');
assert.equal(canUnlockZ8({level:16,z7Mastered:false,industrialWorkshopOwned:true,recoveryRigOwned:true}).ok,false,'Z7 mastery must matter');
assert.equal(canUnlockZ8({level:16,z7Mastered:true,industrialWorkshopOwned:false,recoveryRigOwned:true}).ok,false,'Industrial Workshop must matter');
assert.equal(canUnlockZ8({level:16,z7Mastered:true,industrialWorkshopOwned:true,recoveryRigOwned:false}).ok,false,'Recovery Rig must matter');
assert.equal(canUnlockZ8({level:16,z7Mastered:true,industrialWorkshopOwned:true,recoveryRigOwned:true}).ok,true);

const pity=createDefaultPackE();
for(let i=0;i<20;i++)assert.equal(rollPortPowerAssembly(pity,'medium_appliance',()=>0),false,'only large port targets may drop the signature');
assert.equal(pity.portPowerPity,0,'ineligible targets must not advance pity');
for(let i=1;i<PORT_POWER_ASSEMBLY_PITY;i++){
  assert.equal(rollPortPowerAssembly(pity,'large_appliance',()=>1),false,`signature must not be forced before pity target ${i}`);
  assert.equal(pity.portPowerPity,i);
}
assert.equal(rollPortPowerAssembly(pity,'large_appliance',()=>1),true,'8th eligible large target must guarantee Port Power Assembly');
assert.equal(pity.portPowerAssemblies,1);assert.equal(pity.portPowerPity,0);assert.equal(pity.portPowerDiscovered,true);
assert.equal(capZ8MasteryUntilSignature(100,false),99.9,'Z8 must not complete before first active signature discovery');
assert.equal(capZ8MasteryUntilSignature(100,true),100,'signature discovery releases the final mastery fraction');

const advanced=z8AdvancedMetalYield('large_appliance',()=>.5);
assert.ok(advanced.aluminiumScrap>0&&advanced.alloyScrap>advanced.aluminiumScrap,'large port salvage must strongly favor advanced metal value');

const richInventory=():PackEInventory=>({
  cash:PROCESSING_PLANT_CASH+500_000,
  metal:PROCESSING_PLANT_RECIPE.metal+100,
  cleanCopper:PROCESSING_PLANT_RECIPE.cleanCopper+100,
  granulate:PROCESSING_PLANT_RECIPE.granulate+100,
  steelBlank:PROCESSING_PLANT_RECIPE.steelBlank+100,
  aluminiumBillet:PROCESSING_PLANT_RECIPE.aluminiumBillet+100,
  alloyScrap:PLANT_ALLOY_INPUT*4,
  alloyBillet:PROCESSING_PLANT_RECIPE.alloyBillet+100,
  drive:PROCESSING_PLANT_RECIPE.drive+10,
  control:PROCESSING_PLANT_RECIPE.control+10,
  hydraulicPower:PROCESSING_PLANT_RECIPE.hydraulicPower+10,
  heavyFrame:PROCESSING_PLANT_RECIPE.heavyFrame+10,
  industrialController:PROCESSING_PLANT_RECIPE.industrialController+10,
  heavyHydraulicCylinder:PROCESSING_PLANT_RECIPE.heavyHydraulicCylinder+10
});
const readyCtx:ProcessingPlantContext={z8Mastered:true,industrialWorkshopOwned:true,recoveryRigOwned:true,staffingReady:true};
const plant=createDefaultPackE();plant.portPowerAssemblies=1;
const inv=richInventory();
assert.equal(canAcquireProcessingPlant(plant,inv,{...readyCtx,z8Mastered:false}),false,'cash/resources cannot bypass Z8 mastery');
assert.equal(canAcquireProcessingPlant(plant,inv,{...readyCtx,staffingReady:false}),false,'Plant requires mature generic staffing readiness');
assert.equal(canAcquireProcessingPlant(plant,inv,readyCtx),true);
const cashBefore=inv.cash,alloyBefore=inv.alloyBillet;
assert.equal(acquireProcessingPlant(plant,inv,readyCtx),true);
assert.equal(plant.processingPlantOwned,true);assert.equal(plant.plantLines,PROCESSING_PLANT_LINES);assert.equal(PROCESSING_PLANT_LINES,2);assert.equal(PROCESSING_PLANT_STORAGE_KG,150_000);
assert.equal(inv.cash,cashBefore-PROCESSING_PLANT_CASH);assert.equal(inv.alloyBillet,alloyBefore-PROCESSING_PLANT_RECIPE.alloyBillet);assert.equal(plant.portPowerAssemblies,0);
assert.equal(acquireProcessingPlant(plant,inv,readyCtx),false,'Plant cannot be bought twice');

const scrap={value:PLANT_ALLOY_INPUT*3};
assert.equal(canStartPlantAlloy(plant,scrap.value),true);
assert.equal(startPlantAlloy(plant,scrap,1_000),true);
assert.equal(startPlantAlloy(plant,scrap,1_000),true);
assert.equal(plant.production.length,2);assert.equal(scrap.value,PLANT_ALLOY_INPUT);
assert.equal(startPlantAlloy(plant,scrap,1_000),false,'third concurrent line must be blocked even with enough scrap');
const output={value:0};
assert.equal(advancePlantProduction(plant,output,1_000+PLANT_ALLOY_SECONDS*1000-1),0,'line must not finish early');
assert.equal(advancePlantProduction(plant,output,1_000+PLANT_ALLOY_SECONDS*1000),PLANT_ALLOY_OUTPUT*2);
assert.equal(output.value,PLANT_ALLOY_OUTPUT*2);assert.equal(plant.production.length,0);

const normalized=normalizePackE({processingPlantOwned:true,plantLines:99,portPowerAssemblies:-5,portPowerPity:999,production:[]});
assert.equal(normalized.plantLines,PROCESSING_PLANT_LINES);assert.equal(normalized.portPowerAssemblies,0);assert.equal(normalized.portPowerPity,PORT_POWER_ASSEMBLY_PITY-1);assert.equal(normalized.portPowerDiscovered,true,'an owned Plant proves historical signature discovery');
const legacyDefault=normalizePackE(undefined);assert.deepEqual(legacyDefault,createDefaultPackE(),'missing Pack E state must safely migrate to defaults');

console.log(JSON.stringify({
  zone:{id:PACK_E_ZONE_PROFILE.id,hp:PACK_E_ZONE_PROFILE.hpMultiplier,yield:PACK_E_ZONE_PROFILE.yieldMultiplier,mastery:PACK_E_ZONE_PROFILE.masteryTarget,largeShare:PACK_E_ZONE_PROFILE.nodeWeights.large_appliance},
  signaturePity:PORT_POWER_ASSEMBLY_PITY,
  plant:{cash:PROCESSING_PLANT_CASH,storage:PROCESSING_PLANT_STORAGE_KG,lines:PROCESSING_PLANT_LINES,staffing:'generic-ready',alloyCycle:`${PLANT_ALLOY_INPUT} -> ${PLANT_ALLOY_OUTPUT} / ${PLANT_ALLOY_SECONDS}s`}
},null,2));
console.log('Content Pack E domain smoke / generic staffing readiness: PASS');
