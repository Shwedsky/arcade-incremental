import fs from 'node:fs';

const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('// PRODUCTION_CELLS_V1_RUNTIME')){console.log('Production Cells V1 runtime already integrated');process.exit(0)}

function replaceOne(oldText,newText,label){
  const count=text.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);
  text=text.replace(oldText,newText);
}

replaceOne(
  "import {sellVehicleV3} from './fleet_market_v1.ts';",
  "import {sellVehicleV3} from './fleet_market_v1.ts';\nimport {\n  advanceProductionCellsV1,createDefaultProductionCellsV1,emptyIndustrialStockV1,normalizeProductionCellsV1,\n  productionCellProjectionV1,setProductionPlanV1,startProductionCellV1,\n  type IndustrialStockV1,type ProductionCellIdV1,type ProductionCellsV1State,type ProductionPlanIdV1,type ProductionStaffRoleV1\n} from './production_cells_v1.ts';",
  'production imports'
);

replaceOne(
  '  workforceV3?:WorkforceFleetV3State;\n}',
  '  workforceV3?:WorkforceFleetV3State;\n  productionCellsV1?:ProductionCellsV1State;\n}',
  'save type'
);

replaceOne(
  "packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD(),packE:createDefaultPackE()});",
  "packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD(),packE:createDefaultPackE(),productionCellsV1:createDefaultProductionCellsV1()});",
  'default save'
);

replaceOne(
  "packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:normalizePackD(value.packD),packE:normalizePackE(value.packE)};",
  "packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:normalizePackD(value.packD),packE:normalizePackE(value.packE),productionCellsV1:normalizeProductionCellsV1(value.productionCellsV1)};",
  'v10 load normalization'
);

replaceOne(
  'let packE:PackEState=normalizePackE(loaded.packE);\nlet workforceV3:WorkforceFleetV3State=loaded.workforceV3',
  'let packE:PackEState=normalizePackE(loaded.packE);\nlet productionCellsV1:ProductionCellsV1State=normalizeProductionCellsV1(loaded.productionCellsV1);\nlet workforceV3:WorkforceFleetV3State=loaded.workforceV3',
  'runtime state'
);

replaceOne(
  '// INDUSTRIAL_UI_V1',
  '// INDUSTRIAL_UI_V1\n// PRODUCTION_CELLS_V1_RUNTIME',
  'runtime marker'
);

const oldAssign=`function assignGenericProduction(workerId:string,cellId:'heavy_cell'|'plant_lines'){if(!effects().operatorUnlocked)return false;const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker)return false;const available=cellId==='heavy_cell'?packC.salvageYardOwned:packE.processingPlantOwned;if(!available)return false;const occupied=workforceV3.workers.find(w=>w.id!==workerId&&w.status==='production'&&w.productionCellId===cellId);if(occupied){occupied.status='idle';occupied.productionCellId=null;occupied.role='scavenger'}if(worker.routeId)unassignRouteV3(workforceV3,worker.routeId);worker.role='operator';worker.status='production';worker.routeId=null;worker.productionCellId=cellId;saveGame();renderGarage();return true}`;
const newAssign=`type GenericProductionCellId='heavy_cell'|'plant_lines'|ProductionCellIdV1;\nfunction productionCellAvailable(cellId:GenericProductionCellId){return cellId==='heavy_cell'?packC.salvageYardOwned:cellId==='plant_lines'?packE.processingPlantOwned:packD.industrialWorkshopOwned}\nfunction assignGenericProduction(workerId:string,cellId:GenericProductionCellId){if(!effects().operatorUnlocked)return false;const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker||!productionCellAvailable(cellId))return false;const occupied=workforceV3.workers.find(w=>w.id!==workerId&&w.status==='production'&&w.productionCellId===cellId);if(occupied){occupied.status='idle';occupied.productionCellId=null}if(worker.routeId)unassignRouteV3(workforceV3,worker.routeId);worker.role='operator';worker.status='production';worker.routeId=null;worker.productionCellId=cellId;saveGame();renderGarage();return true}`;
replaceOne(oldAssign,newAssign,'generic production assignment');

const oldView=`function getProductionV3View(){const cells:any[]=[];if(packC.salvageYardOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='heavy_cell');cells.push({id:'heavy_cell',label:'Тяжёлая ячейка',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('heavy_cell'),status:packC.production?packC.production.kind:'свободна',remainingSec:packC.production?Math.max(0,(packC.production.endsAt-Date.now())/1000):0})}if(packE.processingPlantOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='plant_lines');const active=packE.production.filter(job=>job.endsAt>Date.now());cells.push({id:'plant_lines',label:'Линии Processing Plant',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('plant_lines'),status:active.length?\`работает линий: \${active.length}\`:'свободны',remainingSec:active.length?Math.max(0,Math.min(...active.map(job=>job.endsAt))-Date.now())/1000:0})}return{unlocked:effects().operatorUnlocked,cells}}`;
const newView=`function getProductionV3View(){const cells:any[]=[];if(packC.salvageYardOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='heavy_cell');cells.push({id:'heavy_cell',label:'Тяжёлая ячейка',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('heavy_cell'),status:packC.production?packC.production.kind:'свободна',remainingSec:packC.production?Math.max(0,(packC.production.endsAt-Date.now())/1000):0})}if(packD.industrialWorkshopOwned){const stock=currentIndustrialStockV1(),now=Date.now();for(const id of ['refining','fabrication','heavy_assembly'] as ProductionCellIdV1[]){const projection=productionCellProjectionV1(productionCellsV1,id,stock,now),worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId===id);cells.push({id,label:projection.label,operatorId:worker?.role==='operator'?worker.id:null,operatorName:worker?.role==='operator'?worker.name:null,speedFactor:operatorFactor(id),status:projection.status==='running'?projection.selectedPlan.label:projection.status==='blocked'?'нет входов':'свободна',remainingSec:projection.remainingSec})}}if(packE.processingPlantOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='plant_lines');const active=packE.production.filter(job=>job.endsAt>Date.now());cells.push({id:'plant_lines',label:'Линии Processing Plant',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('plant_lines'),status:active.length?\`работает линий: \${active.length}\`:'свободны',remainingSec:active.length?Math.max(0,Math.min(...active.map(job=>job.endsAt))-Date.now())/1000:0})}return{unlocked:effects().operatorUnlocked,cells}}`;
replaceOne(oldView,newView,'production view extension');

const stockRuntime=`\nfunction currentIndustrialStockV1():IndustrialStockV1{const stock=emptyIndustrialStockV1();Object.assign(stock,{alloyScrap:packC.materials.alloyScrap,reinforcedAlloy:packC.materials.alloyBillet,structuralProfile:packB.materials.steelBlank,cleanCopper:processed.cleanCopper,bearing:storedComps.bearing,motor:storedComps.motor,hydraulic:storedComps.hydraulic,electronics:storedComps.electronics,pump:midgame.midComponents.pump,gearbox:packB.industrial.gearbox,industrialController:packC.industrial.industrialController,heavyHydraulicCylinder:packC.industrial.heavyHydraulicCylinder,drive:packB.modules.drive,control:packB.modules.control,structural:packB.modules.structural,hydraulicPower:packC.modules.hydraulicPower,heavyFrame:packC.modules.heavyFrame});return stock}\nfunction applyIndustrialStockV1(stock:IndustrialStockV1){packC.materials.alloyScrap=stock.alloyScrap;packC.materials.alloyBillet=stock.reinforcedAlloy;packB.materials.steelBlank=stock.structuralProfile;processed.cleanCopper=stock.cleanCopper;storedComps.bearing=stock.bearing;storedComps.motor=stock.motor;storedComps.hydraulic=stock.hydraulic;storedComps.electronics=stock.electronics;midgame.midComponents.pump=stock.pump;packB.industrial.gearbox=stock.gearbox;packC.industrial.industrialController=stock.industrialController;packC.industrial.heavyHydraulicCylinder=stock.heavyHydraulicCylinder;packB.modules.drive=stock.drive;packB.modules.control=stock.control;packB.modules.structural=stock.structural;packC.modules.hydraulicPower=stock.hydraulicPower;packC.modules.heavyFrame=stock.heavyFrame}\nfunction productionStaffForCellV1(cellId:ProductionCellIdV1){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId===cellId);return worker?{workerId:worker.id,workerName:worker.name,role:worker.role as ProductionStaffRoleV1,rank:worker.rank}:{workerId:null,workerName:null,role:'none' as const,rank:0}}\nfunction assignProductionCellWorkerV1(workerId:string,cellId:ProductionCellIdV1,role?:ProductionStaffRoleV1){if(!packD.industrialWorkshopOwned)return false;const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker)return false;if(role&&role!=='none'&&worker.role!==role)setWorkerRoleV3(workforceV3,worker.id,role);if(worker.routeId)unassignRouteV3(workforceV3,worker.routeId);const occupied=workforceV3.workers.find(w=>w.id!==workerId&&w.status==='production'&&w.productionCellId===cellId);if(occupied){occupied.status='idle';occupied.productionCellId=null}worker.status='production';worker.routeId=null;worker.productionCellId=cellId;saveGame();renderGarage();return true}\nfunction setProductionCellPlanRuntimeV1(cellId:ProductionCellIdV1,planId:ProductionPlanIdV1){if(!packD.industrialWorkshopOwned)return false;const ok=setProductionPlanV1(productionCellsV1,cellId,planId);if(ok){saveGame();renderGarage()}return ok}\nfunction startProductionCellRuntimeV1(cellId:ProductionCellIdV1){if(!packD.industrialWorkshopOwned)return{ok:false,reason:'locked'};const stock=currentIndustrialStockV1(),result=startProductionCellV1(productionCellsV1,cellId,stock,productionStaffForCellV1(cellId),Date.now());if(result.ok){applyIndustrialStockV1(stock);saveGame();renderGarage()}return result}\nfunction advanceProductionCellsRuntimeV1(now=Date.now()){const stock=currentIndustrialStockV1(),completed=advanceProductionCellsV1(productionCellsV1,stock,now);if(completed.length)applyIndustrialStockV1(stock);return completed}\nfunction getProductionCellsV1View(){const stock=currentIndustrialStockV1(),now=Date.now();return{unlocked:packD.industrialWorkshopOwned,stock,cells:(['refining','fabrication','heavy_assembly'] as ProductionCellIdV1[]).map(id=>({...productionCellProjectionV1(productionCellsV1,id,stock,now),assignedWorker:productionStaffForCellV1(id)}))}}\n`;
replaceOne(
  'function applyPackEInventory(inv:PackEInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.granulate=inv.granulate;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packC.materials.alloyScrap=inv.alloyScrap;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}',
  'function applyPackEInventory(inv:PackEInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.granulate=inv.granulate;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packC.materials.alloyScrap=inv.alloyScrap;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}'+stockRuntime,
  'stock/runtime bridge'
);

replaceOne(
  'packD:normalizePackD(packD),packE:normalizePackE(packE),workforceV3:normalizeWorkforceFleetV3(workforceV3)},raw=',
  'packD:normalizePackD(packD),packE:normalizePackE(packE),productionCellsV1:normalizeProductionCellsV1(productionCellsV1),workforceV3:normalizeWorkforceFleetV3(workforceV3)},raw=',
  'save runtime state'
);

replaceOne(
  'const packCCompleted=advancePackCProduction(packC,now),plantCompleted=advancePlant(now),workforce=applyWorkforceTick(now,true);',
  'const packCCompleted=advancePackCProduction(packC,now),productionCellsCompleted=advanceProductionCellsRuntimeV1(now),plantCompleted=advancePlant(now),workforce=applyWorkforceTick(now,true);',
  'offline advance'
);
replaceOne(
  'if(completed.length||packCCompleted||plantCompleted||elapsed>=.1667||workerWeight>.01){',
  'if(completed.length||packCCompleted||productionCellsCompleted.length||plantCompleted||elapsed>=.1667||workerWeight>.01){',
  'offline report gate'
);
replaceOne(
  '${plantCompleted?`<h3>Processing Plant</h3><p>+${plantCompleted} Alloy Billet</p>`:\'\'}${completed.length?',
  '${productionCellsCompleted.length?`<h3>Industrial Workshop</h3><ul>${productionCellsCompleted.map(x=>`<li>${x.planId}</li>`).join(\'\')}</ul>`:\'\'}${plantCompleted?`<h3>Processing Plant</h3><p>+${plantCompleted} Alloy Billet</p>`:\'\'}${completed.length?',
  'offline production report'
);

replaceOne(
  "setInterval(()=>{const now=Date.now(),completed=advanceWorkshop(now,mode==='garage'),packDone=advancePackCProduction(packC,now),plantDone=advancePlant(now);if(packDone){showToast(`Промышленная ячейка завершила: ${packDone}`);saveGame()}if(plantDone){showToast(`Processing Plant: +${plantDone} Alloy Billet`);saveGame()}if(mode==='garage'&&(completed.length||packDone||plantDone||performance.now()-lastGarageRender>1000))renderGarage()},1000);",
  "setInterval(()=>{const now=Date.now(),completed=advanceWorkshop(now,mode==='garage'),packDone=advancePackCProduction(packC,now),cellDone=advanceProductionCellsRuntimeV1(now),plantDone=advancePlant(now);if(packDone){showToast(`Промышленная ячейка завершила: ${packDone}`);saveGame()}if(cellDone.length){showToast(`Industrial Workshop: завершено ${cellDone.length}`);saveGame()}if(plantDone){showToast(`Processing Plant: +${plantDone} Alloy Billet`);saveGame()}if(mode==='garage'&&(completed.length||packDone||cellDone.length||plantDone||performance.now()-lastGarageRender>1000))renderGarage()},1000);",
  'live production advance'
);

replaceOne(
  'packD:normalizePackD(packD),packE:normalizePackE(packE),workforceV3:normalizeWorkforceFleetV3(workforceV3),businessStage:currentBusinessStage()',
  'packD:normalizePackD(packD),packE:normalizePackE(packE),productionCellsV1:normalizeProductionCellsV1(productionCellsV1),workforceV3:normalizeWorkforceFleetV3(workforceV3),businessStage:currentBusinessStage()',
  'test state exposure'
);
replaceOne(
  'setGenericWorkerRole,assignGenericProduction,getProductionV3View,projectGenericRoute:',
  'setGenericWorkerRole,assignGenericProduction,getProductionV3View,getProductionCellsV1View,setProductionCellPlanV1:setProductionCellPlanRuntimeV1,startProductionCellV1:startProductionCellRuntimeV1,assignProductionCellWorkerV1,advanceProductionCellsV1To:(now:number)=>{const done=advanceProductionCellsRuntimeV1(now);if(done.length){saveGame();if(mode===\'garage\')renderGarage()}return done},projectGenericRoute:',
  'test runtime API exposure'
);

fs.writeFileSync(path,text);
console.log('Production Cells V1 runtime integration applied');
