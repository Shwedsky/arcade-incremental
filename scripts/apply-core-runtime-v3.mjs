import fs from 'node:fs';

const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('CORE_RUNTIME_V3_INTEGRATED')){
  console.log('Core runtime V3 already integrated');
  process.exit(0);
}

function replaceOne(oldText,newText,label){
  const count=text.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);
  text=text.replace(oldText,newText);
}

replaceOne(
`import {
  awardClearMedal,dispatchWorkerShifts,hasClearMedal,recordActiveBenchmark,setVanWorker,vanAssignedToWorker,
  type WorkerSlotId
} from './worker_economy_v2.ts';`,
`import {
  awardClearMedal,dispatchWorkerShifts,hasClearMedal,recordActiveBenchmark,setVanWorker,vanAssignedToWorker,
  type WorkerSlotId
} from './worker_economy_v2.ts';
import {deriveBusinessStage,type BusinessStageId} from './business_stage.ts';
import {
  acquireVehicleV3,createOrAssignRouteV3,fleetCapacityForStage,hireWorkerV3,migrateLegacyWorkforceV3,nextWorkerHireCost,
  normalizeWorkforceFleetV3,projectRouteV3,setWorkerRoleV3,simulateWorkforceV3,trainWorkerV3,unassignRouteV3,workerCapacityForStage,
  type VehicleTypeV3,type WorkforceFleetV3State
} from './workforce_fleet_v3.ts';`,
'imports');

replaceOne(
`  scheduler:WorkshopSchedulerState;contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;packE:PackEState;
}`,
`  scheduler:WorkshopSchedulerState;contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;packE:PackEState;
  workforceV3?:WorkforceFleetV3State;
}`,
'save interface');

replaceOne(
`let packD:PackDState=normalizePackD(loaded.packD);
let packE:PackEState=normalizePackE(loaded.packE);`,
`let packD:PackDState=normalizePackD(loaded.packD);
let packE:PackEState=normalizePackE(loaded.packE);
let workforceV3:WorkforceFleetV3State=loaded.workforceV3
  ?normalizeWorkforceFleetV3(loaded.workforceV3)
  :migrateLegacyWorkforceV3({
    first:midgame.worker,second:packB.secondWorker,third:packC.crew3,fourth:packD.crew4,
    vanOwned:midgame.van.owned,truckOwned:packB.truck.owned,rigOwned:packD.recoveryRig.owned,
    vanWorkerLegacySlot:midgame.economyV2.vanWorker
  });
// CORE_RUNTIME_V3_INTEGRATED`,
'workforce state init');

replaceOne(
`function talentMilestones():ReadonlySet<TalentMilestone>{const result=new Set<TalentMilestone>();if(midgame.van.owned)result.add('van');if(midgame.worker.hired)result.add('first_worker');if(packB.hangarOwned)result.add('hangar');if(packC.salvageYardOwned)result.add('salvage_yard');if(packD.industrialWorkshopOwned)result.add('industrial_workshop');return result}`,
`function talentMilestones():ReadonlySet<TalentMilestone>{const result=new Set<TalentMilestone>();if(midgame.van.owned||workforceV3.fleet.some(v=>v.type==='van'))result.add('van');if(workforceV3.workers.length||midgame.worker.hired)result.add('first_worker');if(packB.hangarOwned)result.add('hangar');if(packC.salvageYardOwned)result.add('salvage_yard');if(packD.industrialWorkshopOwned)result.add('industrial_workshop');return result}
const currentBusinessStage=():BusinessStageId=>deriveBusinessStage({installedMachineCount:installed.size,vanOwned:midgame.van.owned||workforceV3.fleet.some(v=>v.type==='van'),firstWorkerHired:workforceV3.workers.length>0,hangarOwned:packB.hangarOwned,salvageYardOwned:packC.salvageYardOwned,industrialWorkshopOwned:packD.industrialWorkshopOwned,processingPlantOwned:packE.processingPlantOwned});
function ensureLegacyWorkerV3(index:number){let worker=workforceV3.workers[index];if(worker)return worker;worker=hireWorkerV3(workforceV3,currentBusinessStage(),Date.now());if(worker)worker.name=\`Рабочий \${index+1}\`;return worker}
function ensureVehicleV3(type:VehicleTypeV3){let vehicle=workforceV3.fleet.find(v=>v.type===type&&!v.routeId);if(vehicle)return vehicle;return acquireVehicleV3(workforceV3,currentBusinessStage(),type,Date.now())}
function assignLegacyWorkerV3(index:number,zone:ZoneId){const worker=ensureLegacyWorkerV3(index);if(!worker)return;let vehicleId:string|null=null;if(index===0&&midgame.economyV2.vanWorker==='w1')vehicleId=workforceV3.fleet.find(v=>v.type==='van')?.id??null;createOrAssignRouteV3(workforceV3,{workerId:worker.id,zone,vehicleId,now:Date.now()})}
function workforceContext(now:number,offline:boolean){const e=effects();return{stage:currentBusinessStage(),now,offline,offlineCapHours:e.offlineCapHours,workerOutputMultiplier:e.workerOutputMultiplier*e.offlineEfficiency/(offline?1:.20),workerShiftMultiplier:e.workerShiftMultiplier,benchmarks:midgame.economyV2.benchmarks}}
function applyWorkforceTick(now=Date.now(),offline=false){const result=simulateWorkforceV3(workforceV3,workforceContext(now,offline));for(const key of ['metal','copper','plastic'] as ResourceKind[])storage[key]+=result.total[key];return result}
function hireGenericWorker(){const cost=nextWorkerHireCost(workforceV3),stage=currentBusinessStage();if(cash<cost||workforceV3.workers.length>=workerCapacityForStage(stage))return null;const worker=hireWorkerV3(workforceV3,stage,Date.now());if(!worker)return null;cash-=cost;saveGame();renderGarage();return worker}
function acquireGenericVehicle(type:VehicleTypeV3){const stage=currentBusinessStage();if(workforceV3.fleet.length>=fleetCapacityForStage(stage))return null;const costs={van:90_000,truck:260_000,recovery_rig:480_000} as const,cost=costs[type];if(cash<cost)return null;const vehicle=acquireVehicleV3(workforceV3,stage,type,Date.now());if(!vehicle)return null;cash-=cost;saveGame();renderGarage();return vehicle}
function assignGenericRoute(workerId:string,zone:ZoneId,vehicleId:string|null=null){if(!zoneMastered(midgame,zone))return null;const route=createOrAssignRouteV3(workforceV3,{workerId,zone,vehicleId,now:Date.now()});if(route){saveGame();renderGarage()}return route}
function unassignGenericRoute(routeId:string){if(unassignRouteV3(workforceV3,routeId)){saveGame();renderGarage();return true}return false}
function trainGenericWorker(workerId:string){const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker||worker.rank>=5)return false;const cost=15_000*worker.rank;if(cash<cost)return false;cash-=cost;if(!trainWorkerV3(workforceV3,workerId))return false;saveGame();renderGarage();return true}
function setGenericWorkerRole(workerId:string,role:'scavenger'|'operator'|'logistician'|'technician'){const ok=setWorkerRoleV3(workforceV3,workerId,role);if(ok){saveGame();renderGarage()}return ok}`,
'workforce helpers');

replaceOne(
`function saveGame(){const state:SaveStateV10={v:10,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},scheduler:normalizeWorkshopScheduler(workshop),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD),packE:normalizePackE(packE)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}`,
`function saveGame(){const state:SaveStateV10={v:10,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},scheduler:normalizeWorkshopScheduler(workshop),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD),packE:normalizePackE(packE),workforceV3:normalizeWorkforceFleetV3(workforceV3)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}`,
'save workforce');

replaceOne(
`function buyVan(){if(!canBuyVan(midgame,zoneContext(),{cash,metal:storage.metal,cleanCopper:processed.cleanCopper,motor:storedComps.motor,electronics:storedComps.electronics}))return;cash-=VAN_RECIPE.cash;storage.metal-=VAN_RECIPE.metal;processed.cleanCopper-=VAN_RECIPE.cleanCopper;storedComps.motor--;storedComps.electronics--;midgame.van.owned=true;showToast('Фургон готов: 400 кг полевого буфера');saveGame();renderGarage();hud()}`,
`function buyVan(){if(!canBuyVan(midgame,zoneContext(),{cash,metal:storage.metal,cleanCopper:processed.cleanCopper,motor:storedComps.motor,electronics:storedComps.electronics}))return;cash-=VAN_RECIPE.cash;storage.metal-=VAN_RECIPE.metal;processed.cleanCopper-=VAN_RECIPE.cleanCopper;storedComps.motor--;storedComps.electronics--;midgame.van.owned=true;ensureVehicleV3('van');showToast('Фургон готов: 400 кг полевого буфера');saveGame();renderGarage();hud()}`,
'buy van sync');
replaceOne(
`function hireWorker(){if(!canHireFirstWorker(midgame,cash))return;cash-=FIRST_WORKER_COST;midgame.worker.hired=true;midgame.worker.lastTick=Date.now();showToast('Первый рабочий нанят · Basic Route Kit 150 кг');saveGame();renderGarage()}`,
`function hireWorker(){if(!canHireFirstWorker(midgame,cash))return;cash-=FIRST_WORKER_COST;midgame.worker.hired=true;midgame.worker.lastTick=Date.now();ensureLegacyWorkerV3(0);showToast('Первый рабочий нанят · Basic Route Kit 150 кг');saveGame();renderGarage()}`,
'hire worker sync');
replaceOne(
`function assignWorker(id:ZoneId){if(!assignWorkerDomain(midgame,id,Date.now()))return;showToast(\`Рабочий назначен: \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
`function assignWorker(id:ZoneId){if(!assignWorkerDomain(midgame,id,Date.now()))return;assignLegacyWorkerV3(0,id);showToast(\`Рабочий назначен: \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
'assign worker sync');

replaceOne(
`function doAcquireTruck(){const inv=currentPackBInventory();if(acquireTruck(packB,inv,zoneMastered(midgame,'z4'))){applyPackBInventory(inv);showToast('Грузовик готов: 1000 кг полевого буфера');saveGame();renderGarage();hud()}}`,
`function doAcquireTruck(){const inv=currentPackBInventory();if(acquireTruck(packB,inv,zoneMastered(midgame,'z4'))){applyPackBInventory(inv);ensureVehicleV3('truck');showToast('Грузовик готов: 1000 кг полевого буфера');saveGame();renderGarage();hud()}}`,
'truck sync');
replaceOne(
`function doHireSecondWorker(){if(!canHireSecondWorker(packB,zoneMastered(midgame,'z1'),cash))return;cash-=SECOND_WORKER_COST;hireSecondWorker(packB,Date.now());showToast('Второй рабочий нанят');saveGame();renderGarage()}`,
`function doHireSecondWorker(){if(!canHireSecondWorker(packB,zoneMastered(midgame,'z1'),cash))return;cash-=SECOND_WORKER_COST;hireSecondWorker(packB,Date.now());ensureLegacyWorkerV3(1);showToast('Второй рабочий нанят');saveGame();renderGarage()}`,
'hire worker2 sync');
replaceOne(
`function doAssignSecondWorker(id:ZoneId){if(!assignSecondWorker(packB,id,zoneMastered(midgame,id),Date.now()))return;showToast(\`Рабочий №2: \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
`function doAssignSecondWorker(id:ZoneId){if(!assignSecondWorker(packB,id,zoneMastered(midgame,id),Date.now()))return;assignLegacyWorkerV3(1,id);showToast(\`Рабочий №2: \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
'assign worker2 sync');
replaceOne(
`function doHireThirdWorker(){if(!canHireThirdWorker(packC,cash))return;cash-=THIRD_WORKER_COST;if(hireThirdWorker(packC,Date.now())){showToast('Третий рабочий нанят');saveGame();renderGarage()}}`,
`function doHireThirdWorker(){if(!canHireThirdWorker(packC,cash))return;cash-=THIRD_WORKER_COST;if(hireThirdWorker(packC,Date.now())){ensureLegacyWorkerV3(2);showToast('Третий рабочий нанят');saveGame();renderGarage()}}`,
'hire worker3 sync');
replaceOne(
`function doAssignThirdWorker(id:ZoneId){if(id==='z7')return;if(!assignThirdWorkerScavenger(packC,id,zoneMastered(midgame,id),Date.now()))return;showToast(\`Рабочий №3 → \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
`function doAssignThirdWorker(id:ZoneId){if(!assignThirdWorkerScavenger(packC,id,zoneMastered(midgame,id),Date.now()))return;assignLegacyWorkerV3(2,id);showToast(\`Рабочий №3 → \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
'assign worker3 sync');
replaceOne(
`function doHireFourthWorker(){if(!canHireFourthWorker(packD,cash))return;cash-=FOURTH_WORKER_COST;if(hireFourthWorker(packD,Date.now())){showToast('Рабочий №4 нанят');saveGame();renderGarage()}}`,
`function doHireFourthWorker(){if(!canHireFourthWorker(packD,cash))return;cash-=FOURTH_WORKER_COST;if(hireFourthWorker(packD,Date.now())){ensureLegacyWorkerV3(3);showToast('Рабочий №4 нанят');saveGame();renderGarage()}}`,
'hire worker4 sync');
replaceOne(
`function doAssignFourthWorker(id:ZoneId){if(!assignFourthWorkerScavenger(packD,id,zoneMastered(midgame,id),Date.now()))return;showToast(\`Рабочий №4 → \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
`function doAssignFourthWorker(id:ZoneId){if(!assignFourthWorkerScavenger(packD,id,zoneMastered(midgame,id),Date.now()))return;assignLegacyWorkerV3(3,id);showToast(\`Рабочий №4 → \${ZONE_DEFS[id].name}\`);saveGame();renderGarage()}`,
'assign worker4 sync');
replaceOne(
`function doAcquireRecoveryRig(){const inv=currentPackDInventory(),gate=zoneGate('z7');if(acquireRecoveryRig(packD,inv,gate.ok)){applyPackDInventory(inv);showToast('Recovery Rig готов: 1800 кг тяжёлого полевого буфера');saveGame();renderGarage();hud()}}`,
`function doAcquireRecoveryRig(){const inv=currentPackDInventory(),gate=zoneGate('z7');if(acquireRecoveryRig(packD,inv,gate.ok)){applyPackDInventory(inv);ensureVehicleV3('recovery_rig');showToast('Recovery Rig готов: 1800 кг тяжёлого полевого буфера');saveGame();renderGarage();hud()}}`,
'rig sync');

replaceOne(
`function applyOffline(){
  const now=Date.now(),completed=advanceWorkshop(now,false),elapsed=Math.max(0,(now-loadedLastSeen)/3600000),e=effects(),hours=Math.min(elapsed,e.offlineCapHours);
  let gain={metal:0,copper:0,plastic:0};
  if(elapsed>=.1667){gain={metal:420*e.offlineEfficiency*hours,copper:27*e.offlineEfficiency*hours,plastic:75*e.offlineEfficiency*hours};storage.metal+=gain.metal;storage.copper+=gain.copper;storage.plastic+=gain.plastic}
  const packCCompleted=advancePackCProduction(packC,now);
  const plantCompleted=advancePlant(now);
  const workerGain=simulateWorkerGain(midgame,now,8,true);
  const worker2Gain=simulateSecondWorker(packB,midgame.economyV2,midgame.discoveredComponents,now,true);
  const worker3Gain=simulateThirdWorker(packC,midgame.economyV2,midgame.discoveredComponents,now,true);
  const worker4Gain=simulateFourthWorker(packD,midgame.economyV2,midgame.discoveredComponents,now,true);
  [workerGain,worker2Gain,worker3Gain,worker4Gain].forEach(applyWorkerEconomyGain);
  const workerWeight=workerGain.weight+worker2Gain.weight+worker3Gain.weight+worker4Gain.weight;
  if(completed.length||packCCompleted||plantCompleted||elapsed>=.1667||workerWeight>.01){
    $('offlineLoot').innerHTML=\`<p>\${hours.toFixed(1)} ч пассивной вылазки · эффективность \${(e.offlineEfficiency*100).toFixed(0)}%</p><div><span>Металл <b>+\${gain.metal.toFixed(1)} кг</b></span><span>Медь <b>+\${gain.copper.toFixed(1)} кг</b></span><span>Пластик <b>+\${gain.plastic.toFixed(1)} кг</b></span></div>\${workerWeight>.01?\`<h3>Рабочие маршруты</h3><p>+\${workerWeight.toFixed(1)} кг · offline смена списывается максимум за 2 ч</p>\`:''}\${plantCompleted?\`<h3>Processing Plant</h3><p>+\${plantCompleted} Alloy Billet</p>\`:''}\${completed.length?\`<h3>Мастерская завершила</h3><ul>\${completed.map(x=>\`<li>\${x}</li>\`).join('')}</ul>\`:''}\`;offlineScreen.hidden=false
  }
  saveGame()
}`,
`function applyOffline(){
  const now=Date.now(),completed=advanceWorkshop(now,false),elapsed=Math.max(0,(now-loadedLastSeen)/3600000),e=effects(),hours=Math.min(elapsed,e.offlineCapHours);
  let gain={metal:0,copper:0,plastic:0};
  if(elapsed>=.1667){gain={metal:420*e.offlineEfficiency*hours,copper:27*e.offlineEfficiency*hours,plastic:75*e.offlineEfficiency*hours};storage.metal+=gain.metal;storage.copper+=gain.copper;storage.plastic+=gain.plastic}
  const packCCompleted=advancePackCProduction(packC,now),plantCompleted=advancePlant(now),workforce=applyWorkforceTick(now,true);
  const workerWeight=workforce.reports.reduce((sum,report)=>sum+report.gainedKg,0);
  if(completed.length||packCCompleted||plantCompleted||elapsed>=.1667||workerWeight>.01){
    const routeRows=workforce.reports.filter(r=>r.elapsedHours>.001).map(r=>\`<li><b>\${r.workerNames.join(', ')||'Без рабочего'}</b> · \${ZONE_DEFS[r.zone].name} · \${r.vehicleName??'без транспорта'}<br><span>\${r.kgPerHour.toFixed(0)} кг/ч · +\${r.gainedKg.toFixed(1)} кг · \${r.stopReason==='vehicle_full'?'остановка: заполнен транспорт':r.stopReason==='shift_ended'?'остановка: смена закончилась':r.stopReason==='no_worker'?'остановка: нет рабочего':'маршрут продолжает работу'}</span></li>\`).join('');
    $('offlineLoot').innerHTML=\`<p>\${hours.toFixed(1)} ч офлайн · эффективность базы \${(e.offlineEfficiency*100).toFixed(0)}%</p><div><span>База: металл <b>+\${gain.metal.toFixed(1)} кг</b></span><span>медь <b>+\${gain.copper.toFixed(1)} кг</b></span><span>пластик <b>+\${gain.plastic.toFixed(1)} кг</b></span></div>\${routeRows?\`<h3>Маршруты</h3><ul class="offlineRoutesV3">\${routeRows}</ul>\`:''}\${plantCompleted?\`<h3>Processing Plant</h3><p>+\${plantCompleted} Alloy Billet</p>\`:''}\${completed.length?\`<h3>Мастерская завершила</h3><ul>\${completed.map(x=>\`<li>\${x}</li>\`).join('')}</ul>\`:''}\`;offlineScreen.hidden=false
  }
  saveGame()
}`,
'offline v3');

replaceOne(
`setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8,false),gain2=simulateSecondWorker(packB,midgame.economyV2,midgame.discoveredComponents,now,false),gain3=simulateThirdWorker(packC,midgame.economyV2,midgame.discoveredComponents,now,false),gain4=simulateFourthWorker(packD,midgame.economyV2,midgame.discoveredComponents,now,false);const gains=[gain,gain2,gain3,gain4];let changed=false;for(const workerGain of gains){if(workerGain.weight>.001)changed=true;applyWorkerEconomyGain(workerGain)}if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);`,
`setInterval(()=>{const result=applyWorkforceTick(Date.now(),false),changed=result.reports.some(report=>report.gainedKg>.001);if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);`,
'online workforce tick');

replaceOne(
`packD:normalizePackD(packD),packE:normalizePackE(packE)}),forceGarage:garage`,
`packD:normalizePackD(packD),packE:normalizePackE(packE),workforceV3:normalizeWorkforceFleetV3(workforceV3),businessStage:currentBusinessStage()}),forceGarage:garage`,
'getState workforce');

replaceOne(
`dispatchWorkers,toggleWorkerVan,awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
`dispatchWorkers,toggleWorkerVan,hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole,projectGenericRoute:(routeId:string)=>{const route=workforceV3.routes.find(r=>r.id===routeId);return route?projectRouteV3(workforceV3,route,workforceContext(Date.now(),false)):null},awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
'test api workforce');

fs.writeFileSync(path,text);
console.log('Core runtime V3 main integration applied');
