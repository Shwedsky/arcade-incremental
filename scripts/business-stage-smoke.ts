import assert from 'node:assert/strict';
import {BUSINESS_STAGES,businessStage,deriveBusinessStage,stageAtLeast,type BusinessStageSignals} from '../src/business_stage.ts';

const base:BusinessStageSignals={installedMachineCount:1,vanOwned:false,firstWorkerHired:false,hangarOwned:false,salvageYardOwned:false,industrialWorkshopOwned:false,processingPlantOwned:false};
const withSignals=(patch:Partial<BusinessStageSignals>)=>({...base,...patch});

assert.equal(deriveBusinessStage(base),'starter_garage');
assert.equal(deriveBusinessStage(withSignals({installedMachineCount:2})),'equipped_garage');
assert.equal(deriveBusinessStage(withSignals({vanOwned:true})),'workforce_garage');
assert.equal(deriveBusinessStage(withSignals({firstWorkerHired:true})),'workforce_garage');
assert.equal(deriveBusinessStage(withSignals({hangarOwned:true})),'hangar');
assert.equal(deriveBusinessStage(withSignals({salvageYardOwned:true})),'salvage_yard');
assert.equal(deriveBusinessStage(withSignals({industrialWorkshopOwned:true})),'industrial_workshop');
assert.equal(deriveBusinessStage(withSignals({processingPlantOwned:true})),'processing_plant');

// Highest owned infrastructure wins even if an older flag is absent/corrupt.
assert.equal(deriveBusinessStage(withSignals({processingPlantOwned:true,hangarOwned:false})),'processing_plant');
assert.equal(deriveBusinessStage(withSignals({industrialWorkshopOwned:true,salvageYardOwned:false})),'industrial_workshop');

assert.deepEqual(BUSINESS_STAGES.starter_garage.surfaces,['overview','production','storage','contracts','development']);
assert.ok(BUSINESS_STAGES.equipped_garage.surfaces.includes('logistics'),'Logistics must appear before Van purchase so the player can buy the first vehicle');
assert.ok(BUSINESS_STAGES.equipped_garage.surfaces.includes('crew'),'Crew must appear before first hire so the player can recruit the first worker');
assert.ok(BUSINESS_STAGES.workforce_garage.surfaces.includes('crew'));
assert.ok(BUSINESS_STAGES.workforce_garage.surfaces.includes('logistics'));
assert.equal(businessStage(withSignals({hangarOwned:true})).nextMilestone,'Развернуть Salvage Yard');
assert.equal(BUSINESS_STAGES.processing_plant.nextMilestone,null);
assert.equal(stageAtLeast('hangar','workforce_garage'),true);
assert.equal(stageAtLeast('equipped_garage','hangar'),false);

const ranks=Object.values(BUSINESS_STAGES).map(stage=>stage.rank);
assert.equal(new Set(ranks).size,ranks.length,'business stage ranks must be unique');
assert.deepEqual([...ranks].sort((a,b)=>a-b),[0,1,2,3,4,5,6]);

console.log('Business Stage V1 domain smoke: PASS');
