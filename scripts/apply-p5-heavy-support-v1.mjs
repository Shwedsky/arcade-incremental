import fs from 'node:fs';
const path='src/main.ts';let text=fs.readFileSync(path,'utf8');
if(text.includes('function productionHeavySupportV1()')){console.log('P5 heavy support already integrated');process.exit(0)}
function replaceOne(a,b,label){const n=text.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);text=text.replace(a,b)}
replaceOne(
  "function startProductionCellRuntimeV1(cellId:ProductionCellIdV1){if(!packD.industrialWorkshopOwned)return{ok:false,reason:'locked'};const stock=currentIndustrialStockV1(),result=startProductionCellV1(productionCellsV1,cellId,stock,productionStaffForCellV1(cellId),Date.now());if(result.ok){applyIndustrialStockV1(stock);saveGame();renderGarage()}return result}",
  "function productionHeavySupportV1(){const rig=workforceV3.fleet.find(v=>v.type==='recovery_rig'&&!v.routeId);return rig?{kind:'recovery_rig' as const,vehicleId:rig.id,vehicleName:rig.name,durationFactor:.85}:{kind:'none' as const,vehicleId:null,vehicleName:null,durationFactor:1}}\nfunction startProductionCellRuntimeV1(cellId:ProductionCellIdV1){if(!packD.industrialWorkshopOwned)return{ok:false,reason:'locked'};const stock=currentIndustrialStockV1(),support=cellId==='heavy_assembly'?productionHeavySupportV1():undefined,result=startProductionCellV1(productionCellsV1,cellId,stock,productionStaffForCellV1(cellId),Date.now(),support);if(result.ok){applyIndustrialStockV1(stock);saveGame();renderGarage()}return result}",
  'start runtime support'
);
replaceOne(
  "function getProductionCellsV1View(){const stock=currentIndustrialStockV1(),now=Date.now();return{unlocked:packD.industrialWorkshopOwned,stock,cells:(['refining','fabrication','heavy_assembly'] as ProductionCellIdV1[]).map(id=>({...productionCellProjectionV1(productionCellsV1,id,stock,now),assignedWorker:productionStaffForCellV1(id)}))}}",
  "function getProductionCellsV1View(){const stock=currentIndustrialStockV1(),now=Date.now();return{unlocked:packD.industrialWorkshopOwned,stock,heavySupport:productionHeavySupportV1(),cells:(['refining','fabrication','heavy_assembly'] as ProductionCellIdV1[]).map(id=>({...productionCellProjectionV1(productionCellsV1,id,stock,now),assignedWorker:productionStaffForCellV1(id)}))}}",
  'view support'
);
fs.writeFileSync(path,text);console.log('P5 Recovery Rig heavy support integrated');
