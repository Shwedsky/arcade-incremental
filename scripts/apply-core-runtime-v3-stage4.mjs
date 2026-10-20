import fs from 'node:fs';

function patch(path,replacements,marker){
  let text=fs.readFileSync(path,'utf8');
  if(marker&&text.includes(marker)){console.log(`${path}: ${marker} already integrated`);return}
  for(const [oldText,newText,label] of replacements){const count=text.split(oldText).length-1;if(count!==1)throw new Error(`${path} / ${label}: expected exactly 1 match, got ${count}`);text=text.replace(oldText,newText)}
  if(marker&&path==='src/main.ts')text=text.replace('// CORE_RUNTIME_V3_STAGE3',`// CORE_RUNTIME_V3_STAGE3\n// ${marker}`);
  fs.writeFileSync(path,text);
}

patch('src/content_pack_c.ts',[[`export function productionDurationSec(state:PackCState,kind:PackCProductionKind):number{
  const operator=state.crew3.hired&&state.crew3.role==='operator';
  return PACK_C_PRODUCTION_SECONDS[kind]*(operator ? .75 : 1);
}`,`export function productionDurationSec(_state:PackCState,kind:PackCProductionKind):number{
  // Generic Workforce V3 owns staffing. Domain production stays deterministic at
  // base duration; runtime applies the assigned Operator factor exactly once.
  return PACK_C_PRODUCTION_SECONDS[kind];
}`,'remove legacy operator timing']],null);

patch('src/main.ts',[
[`function setGenericWorkerRole(workerId:string,role:'scavenger'|'operator'|'logistician'|'technician'){const ok=setWorkerRoleV3(workforceV3,workerId,role);if(ok){saveGame();renderGarage()}return ok}`,
`function setGenericWorkerRole(workerId:string,role:'scavenger'|'operator'|'logistician'|'technician'){const ok=setWorkerRoleV3(workforceV3,workerId,role);if(ok){saveGame();renderGarage()}return ok}
function operatorFactor(cellId:string){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId===cellId&&w.role==='operator');if(!worker)return 1;return Math.max(.68,1/(1.18+.06*(worker.rank-1)))}
function assignGenericProduction(workerId:string,cellId:'heavy_cell'|'plant_lines'){if(!effects().operatorUnlocked)return false;const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker)return false;const available=cellId==='heavy_cell'?packC.salvageYardOwned:packE.processingPlantOwned;if(!available)return false;const occupied=workforceV3.workers.find(w=>w.id!==workerId&&w.status==='production'&&w.productionCellId===cellId);if(occupied){occupied.status='idle';occupied.productionCellId=null;occupied.role='scavenger'}if(worker.routeId)unassignRouteV3(workforceV3,worker.routeId);worker.role='operator';worker.status='production';worker.routeId=null;worker.productionCellId=cellId;saveGame();renderGarage();return true}
function getProductionV3View(){const cells:any[]=[];if(packC.salvageYardOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='heavy_cell');cells.push({id:'heavy_cell',label:'Тяжёлая ячейка',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('heavy_cell'),status:packC.production?packC.production.kind:'свободна',remainingSec:packC.production?Math.max(0,(packC.production.endsAt-Date.now())/1000):0})}if(packE.processingPlantOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='plant_lines');const active=packE.production.filter(job=>job.endsAt>Date.now());cells.push({id:'plant_lines',label:'Линии Processing Plant',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('plant_lines'),status:active.length?\`работает линий: \${active.length}\`:'свободны',remainingSec:active.length?Math.max(0,Math.min(...active.map(job=>job.endsAt))-Date.now())/1000:0})}return{unlocked:effects().operatorUnlocked,cells}}`,
'operator api'],
[`function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);if(packC.production){const raw=packC.production.endsAt-packC.production.startedAt,mult=effects().industrialProductionMultiplier*(packD.crew4.hired&&packD.crew4.role==='operator'?.85:1);if(mult<1)packC.production.endsAt=packC.production.startedAt+raw*mult}const duration=packC.production?Math.max(0,(packC.production.endsAt-packC.production.startedAt)/1000):productionDurationSec(packC,kind);showToast(\`${kind} поставлен в промышленную ячейку · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
`function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);if(packC.production){const raw=packC.production.endsAt-packC.production.startedAt,mult=effects().industrialProductionMultiplier*operatorFactor('heavy_cell');if(mult<1)packC.production.endsAt=packC.production.startedAt+raw*mult}const duration=packC.production?Math.max(0,(packC.production.endsAt-packC.production.startedAt)/1000):productionDurationSec(packC,kind);showToast(\`${kind} → тяжёлая ячейка · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
'pack c generic operator'],
[`function doStartPlantAlloy(){const scrap={value:packC.materials.alloyScrap};if(startPlantAlloy(packE,scrap,Date.now())){packC.materials.alloyScrap=scrap.value;showToast(\`Processing Plant: линия сплава запущена · \${fmtLong(PLANT_ALLOY_SECONDS)}\`);saveGame();renderGarage()}}`,
`function doStartPlantAlloy(){const scrap={value:packC.materials.alloyScrap},now=Date.now(),line=startPlantAlloy(packE,scrap,now);if(line!==null){packC.materials.alloyScrap=scrap.value;const job=packE.production.find(item=>item.line===line&&item.startedAt===now);if(job){const raw=job.endsAt-job.startedAt,mult=effects().industrialProductionMultiplier*operatorFactor('plant_lines');if(mult<1)job.endsAt=job.startedAt+raw*mult}const duration=job?Math.max(0,(job.endsAt-job.startedAt)/1000):PLANT_ALLOY_SECONDS;showToast(\`Processing Plant: линия \${line+1} · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
'plant generic operator'],
[`dispatchWorkers,toggleWorkerVan,hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole,projectGenericRoute:(routeId:string)=>{const route=workforceV3.routes.find(r=>r.id===routeId);return route?projectRouteV3(workforceV3,route,workforceContext(Date.now(),false)):null},getContractV3View,submitStandingV3,submitSpecialV3,awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
`dispatchWorkers,toggleWorkerVan,hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole,assignGenericProduction,getProductionV3View,projectGenericRoute:(routeId:string)=>{const route=workforceV3.routes.find(r=>r.id===routeId);return route?projectRouteV3(workforceV3,route,workforceContext(Date.now(),false)):null},getContractV3View,submitStandingV3,submitSpecialV3,awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
'expose production api']
],'CORE_RUNTIME_V3_STAGE4');

console.log('Core runtime V3 stage4 generic Operator integration applied');
