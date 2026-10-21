import assert from 'node:assert/strict';
import {
  PRODUCTION_PLANS_V1,advanceProductionCellsV1,createDefaultProductionCellsV1,emptyIndustrialStockV1,
  normalizeProductionCellsV1,productionCellProjectionV1,productionStaffingEffectV1,setProductionPlanV1,startProductionCellV1
} from '../src/production_cells_v1.ts';

const now=1_800_000_000_000;
const state=createDefaultProductionCellsV1(),stock=emptyIndustrialStockV1();
Object.assign(stock,{
  alloyScrap:50,reinforcedAlloy:20,structuralProfile:11,cleanCopper:20,
  gearbox:2,motor:2,electronics:4,bearing:4,hydraulic:2,pump:2,
  heavyHydraulicCylinder:2,industrialController:2,structural:2,control:2
});

assert.equal(Object.keys(state.cells).length,3,'P5 must expose exactly the first three coherent production cells');
assert.equal(state.cells.refining.selectedPlanId,'reinforced_alloy');
assert.equal(state.cells.fabrication.selectedPlanId,'drive_module');
assert.equal(state.cells.heavy_assembly.selectedPlanId,'hydraulic_power');

// Two independent production activities must start together and commit their inputs immediately.
const refining=startProductionCellV1(state,'refining',stock,{role:'logistician',rank:3,workerId:'w-log',workerName:'Логист'},now);
assert.equal(refining.ok,true);assert.equal(stock.alloyScrap,25,'refining input must be committed at start');
const fabrication=startProductionCellV1(state,'fabrication',stock,{role:'operator',rank:3,workerId:'w-op',workerName:'Оператор'},now);
assert.equal(fabrication.ok,true);assert.equal(stock.structuralProfile,9);assert.equal(stock.cleanCopper,14);assert.equal(stock.gearbox,1);assert.equal(stock.motor,1);
assert.ok(state.cells.refining.job&&state.cells.fabrication.job,'refining and fabrication must run in parallel');

// A third chain cannot spend stock already committed by another cell.
const heavyBlocked=startProductionCellV1(state,'heavy_assembly',stock,{role:'technician',rank:3},now);
assert.equal(heavyBlocked.ok,false);assert.equal(heavyBlocked.reason,'missing_input');assert.equal(heavyBlocked.missing?.structuralProfile,1);
stock.structuralProfile=10;
const heavy=startProductionCellV1(state,'heavy_assembly',stock,{role:'technician',rank:3,workerId:'w-tech',workerName:'Техник'},now,{kind:'recovery_rig',vehicleId:'rig-1',vehicleName:'Recovery Rig #1',durationFactor:.85});
assert.equal(heavy.ok,true);assert.equal(stock.structuralProfile,0);assert.equal(stock.reinforcedAlloy,12);

// Role effects must be measurable and cell-specific rather than cosmetic labels.
const baseFab=PRODUCTION_PLANS_V1.drive_module.baseDurationSec;
assert.ok((fabrication.job!.endsAt-fabrication.job!.startedAt)/1000<baseFab,'Operator must reduce real fabrication duration');
const technicianOnly=PRODUCTION_PLANS_V1.hydraulic_power.baseDurationSec*productionStaffingEffectV1('heavy_assembly','technician',3);
const heavySeconds=(heavy.job!.endsAt-heavy.job!.startedAt)/1000;
assert.ok(heavySeconds<technicianOnly*.9,'Recovery Rig support must materially improve heavy assembly beyond Technician alone');
assert.equal(heavy.job!.support.kind,'recovery_rig');assert.equal(heavy.job!.support.vehicleId,'rig-1');assert.equal(heavy.job!.support.durationFactor,.85);
assert.ok(productionStaffingEffectV1('refining','logistician',3)<1,'Logistician must improve real refining handling time');
assert.equal(productionStaffingEffectV1('refining','technician',5),1,'Technician must not receive a fake refining bonus');

// Busy cells cannot start a second job, even if enough stock remains.
assert.deepEqual(startProductionCellV1(state,'refining',stock,{role:'operator',rank:5},now),{ok:false,reason:'busy'});

// Save normalization must preserve active jobs, staffing and heavy support snapshots.
const restored=normalizeProductionCellsV1(JSON.parse(JSON.stringify(state)));
assert.equal(restored.cells.refining.job?.id,state.cells.refining.job?.id);
assert.equal(restored.cells.fabrication.job?.staffing.workerId,'w-op');
assert.equal(restored.cells.heavy_assembly.job?.staffing.role,'technician');
assert.equal(restored.cells.heavy_assembly.job?.support.kind,'recovery_rig');assert.equal(restored.cells.heavy_assembly.job?.support.vehicleName,'Recovery Rig #1');

// Projection names the real input bottleneck when idle.
const blockedState=createDefaultProductionCellsV1(),empty=emptyIndustrialStockV1();
assert.equal(setProductionPlanV1(blockedState,'fabrication','control_module'),true);
const blockedView=productionCellProjectionV1(blockedState,'fabrication',empty,now);
assert.equal(blockedView.status,'blocked');assert.equal(blockedView.bottleneck,'missing_input');
assert.equal(blockedView.missing.structuralProfile,1);assert.equal(blockedView.missing.cleanCopper,6);assert.equal(blockedView.missing.electronics,2);

// Completion pays output once. Re-running the same timestamp cannot duplicate it.
const finishAt=Math.max(...Object.values(state.cells).map(cell=>cell.job?.endsAt??now));
const first=advanceProductionCellsV1(state,stock,finishAt+1);
assert.equal(first.length,3);assert.equal(stock.reinforcedAlloy,30,'18 refined output must be added after 8 was consumed by heavy assembly');
assert.equal(stock.drive,1);assert.equal(stock.hydraulicPower,1);
assert.equal(state.cells.refining.completedCycles,1);assert.equal(state.cells.fabrication.completedCycles,1);assert.equal(state.cells.heavy_assembly.completedCycles,1);
const snapshot=JSON.stringify(stock),second=advanceProductionCellsV1(state,stock,finishAt+60_000);
assert.equal(second.length,0,'completed jobs must not complete twice');assert.equal(JSON.stringify(stock),snapshot,'second advance must not duplicate outputs');

console.log('Production Cells V1 domain: 3 cells + parallel commit + no double-spend + staffing effects + Recovery Rig heavy support + exactly-once completion: PASS');
