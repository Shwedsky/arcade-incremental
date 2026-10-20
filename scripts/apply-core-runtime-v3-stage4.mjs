import fs from 'node:fs';

function replaceExactly(text,oldText,newText,label){
  const count=text.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);
  return text.replace(oldText,newText);
}

// Pack C must no longer own staffing through the historical hard-coded worker #3.
{
  const path='src/content_pack_c.ts';
  let text=fs.readFileSync(path,'utf8');
  const legacy=`export function productionDurationSec(state:PackCState,kind:PackCProductionKind):number{\n  const operator=state.crew3.hired&&state.crew3.role==='operator';\n  return PACK_C_PRODUCTION_SECONDS[kind]*(operator ? .75 : 1);\n}`;
  const generic=`export function productionDurationSec(_state:PackCState,kind:PackCProductionKind):number{\n  // Workforce V3 owns staffing. Domain production remains deterministic at\n  // base duration; runtime applies the assigned generic Operator factor once.\n  return PACK_C_PRODUCTION_SECONDS[kind];\n}`;
  if(text.includes(generic))console.log(`${path}: generic Operator duration already integrated`);
  else if(text.includes(legacy)){text=text.replace(legacy,generic);fs.writeFileSync(path,text)}
  else throw new Error(`${path}: neither legacy nor generic productionDurationSec found`);
}

{
  const path='src/main.ts',marker='CORE_RUNTIME_V3_STAGE4';
  let text=fs.readFileSync(path,'utf8');
  if(text.includes(marker)){console.log(`${path}: ${marker} already integrated`);process.exit(0)}

  if(!text.includes("import './operator_ui_v3.ts';")){
    text=replaceExactly(text,"import './content_pack_e.css';","import './content_pack_e.css';\nimport './operator_ui_v3.ts';",'operator ui import');
  }

  text=replaceExactly(text,
`function setGenericWorkerRole(workerId:string,role:'scavenger'|'operator'|'logistician'|'technician'){const ok=setWorkerRoleV3(workforceV3,workerId,role);if(ok){saveGame();renderGarage()}return ok}`,
`function setGenericWorkerRole(workerId:string,role:'scavenger'|'operator'|'logistician'|'technician'){const ok=setWorkerRoleV3(workforceV3,workerId,role);if(ok){saveGame();renderGarage()}return ok}\nfunction operatorFactor(cellId:string){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId===cellId&&w.role==='operator');if(!worker)return 1;return Math.max(.68,1/(1.18+.06*(worker.rank-1)))}\nfunction assignGenericProduction(workerId:string,cellId:'heavy_cell'|'plant_lines'){if(!effects().operatorUnlocked)return false;const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker)return false;const available=cellId==='heavy_cell'?packC.salvageYardOwned:packE.processingPlantOwned;if(!available)return false;const occupied=workforceV3.workers.find(w=>w.id!==workerId&&w.status==='production'&&w.productionCellId===cellId);if(occupied){occupied.status='idle';occupied.productionCellId=null;occupied.role='scavenger'}if(worker.routeId)unassignRouteV3(workforceV3,worker.routeId);worker.role='operator';worker.status='production';worker.routeId=null;worker.productionCellId=cellId;saveGame();renderGarage();return true}\nfunction getProductionV3View(){const cells:any[]=[];if(packC.salvageYardOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='heavy_cell');cells.push({id:'heavy_cell',label:'Тяжёлая ячейка',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('heavy_cell'),status:packC.production?packC.production.kind:'свободна',remainingSec:packC.production?Math.max(0,(packC.production.endsAt-Date.now())/1000):0})}if(packE.processingPlantOwned){const worker=workforceV3.workers.find(w=>w.status==='production'&&w.productionCellId==='plant_lines');const active=packE.production.filter(job=>job.endsAt>Date.now());cells.push({id:'plant_lines',label:'Линии Processing Plant',operatorId:worker?.id??null,operatorName:worker?.name??null,speedFactor:operatorFactor('plant_lines'),status:active.length?\`работает линий: \${active.length}\`:'свободны',remainingSec:active.length?Math.max(0,Math.min(...active.map(job=>job.endsAt))-Date.now())/1000:0})}return{unlocked:effects().operatorUnlocked,cells}}`,
  'operator api');

  text=replaceExactly(text,
`function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);if(packC.production){const raw=packC.production.endsAt-packC.production.startedAt,mult=effects().industrialProductionMultiplier*(packD.crew4.hired&&packD.crew4.role==='operator'?.85:1);if(mult<1)packC.production.endsAt=packC.production.startedAt+raw*mult}const duration=packC.production?Math.max(0,(packC.production.endsAt-packC.production.startedAt)/1000):productionDurationSec(packC,kind);showToast(\`\${kind} поставлен в промышленную ячейку · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
`function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);if(packC.production){const raw=packC.production.endsAt-packC.production.startedAt,mult=effects().industrialProductionMultiplier*operatorFactor('heavy_cell');if(mult<1)packC.production.endsAt=packC.production.startedAt+raw*mult}const duration=packC.production?Math.max(0,(packC.production.endsAt-packC.production.startedAt)/1000):productionDurationSec(packC,kind);showToast(\`\${kind} → тяжёлая ячейка · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
  'pack c generic operator');

  text=replaceExactly(text,
`function doStartPlantAlloy(){const scrap={value:packC.materials.alloyScrap};if(startPlantAlloy(packE,scrap,Date.now())){packC.materials.alloyScrap=scrap.value;showToast(\`Processing Plant: линия сплава запущена · \${fmtLong(PLANT_ALLOY_SECONDS)}\`);saveGame();renderGarage()}}`,
`function doStartPlantAlloy(){const scrap={value:packC.materials.alloyScrap},now=Date.now();if(startPlantAlloy(packE,scrap,now)){packC.materials.alloyScrap=scrap.value;const job=[...packE.production].reverse().find(item=>item.startedAt===now)??packE.production.at(-1);if(job){const raw=job.endsAt-job.startedAt,mult=effects().industrialProductionMultiplier*operatorFactor('plant_lines');if(mult<1)job.endsAt=job.startedAt+raw*mult}const line=job?packE.production.indexOf(job)+1:packE.production.length,duration=job?Math.max(0,(job.endsAt-job.startedAt)/1000):PLANT_ALLOY_SECONDS;showToast(\`Processing Plant: линия \${Math.max(1,line)} · \${fmtLong(duration)}\`);saveGame();renderGarage()}}`,
  'plant generic operator');

  text=replaceExactly(text,
`trainGenericWorker,setGenericWorkerRole,projectGenericRoute:`,
`trainGenericWorker,setGenericWorkerRole,assignGenericProduction,getProductionV3View,projectGenericRoute:`,
  'expose production api');

  if(text.includes('// CORE_RUNTIME_V3_STAGE3'))text=text.replace('// CORE_RUNTIME_V3_STAGE3','// CORE_RUNTIME_V3_STAGE3\n// CORE_RUNTIME_V3_STAGE4');
  else text=`// CORE_RUNTIME_V3_STAGE4\n${text}`;
  fs.writeFileSync(path,text);
}

console.log('Core runtime V3 stage4 generic Operator integration applied');
