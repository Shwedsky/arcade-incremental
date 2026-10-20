import fs from 'node:fs';
const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('CORE_RUNTIME_V3_STAGE2')){console.log('Core runtime V3 stage2 already integrated');process.exit(0)}
const replaceOne=(oldText,newText,label)=>{const count=text.split(oldText).length-1;if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);text=text.replace(oldText,newText)};

replaceOne(
`import {
  activeBoardContract,boardContractOffers,advanceBoardContract,contractBoardPoolStats,contractFamilyLabel,isDiscreteContractNeed,
  type ContractBoardContext,type ContractBoardNeed
} from './contract_board_v2.ts';`,
`import {
  activeBoardContract,boardContractOffers,advanceBoardContract,contractBoardPoolStats,contractFamilyLabel,isDiscreteContractNeed,
  type ContractBoardContext,type ContractBoardNeed
} from './contract_board_v2.ts';
import {
  advanceSpecialOrderV3,deliverStandingV3,specialOrdersV3,standingBuyersForContext,
  type StandingBuyerV3
} from './contract_board_v3.ts';`,
'contract v3 imports');

replaceOne(
`function workforceContext(now:number,offline:boolean){const e=effects();return{stage:currentBusinessStage(),now,offline,offlineCapHours:e.offlineCapHours,workerOutputMultiplier:e.workerOutputMultiplier*e.offlineEfficiency/(offline?1:.20),workerShiftMultiplier:e.workerShiftMultiplier,benchmarks:midgame.economyV2.benchmarks}}`,
`function workforceContext(now:number,offline:boolean){const e=effects();return{stage:currentBusinessStage(),now,offline,offlineCapHours:e.offlineCapHours,workerOutputMultiplier:e.workerOutputMultiplier*(offline?e.offlineEfficiency:1),workerShiftMultiplier:e.workerShiftMultiplier,benchmarks:midgame.economyV2.benchmarks}}`,
'workforce efficiency');

replaceOne(
`function hireGenericWorker(){const cost=nextWorkerHireCost(workforceV3),stage=currentBusinessStage();if(cash<cost||workforceV3.workers.length>=workerCapacityForStage(stage))return null;const worker=hireWorkerV3(workforceV3,stage,Date.now());if(!worker)return null;cash-=cost;saveGame();renderGarage();return worker}`,
`function hireGenericWorker(){const cost=nextWorkerHireCost(workforceV3),stage=currentBusinessStage(),before=workforceV3.workers.length;if(before===0&&!zoneMastered(midgame,'z1'))return null;if(cash<cost||before>=workerCapacityForStage(stage))return null;const worker=hireWorkerV3(workforceV3,stage,Date.now());if(!worker)return null;cash-=cost;if(before===0){midgame.worker.hired=true;midgame.worker.lastTick=Date.now()}else if(before===1){packB.secondWorker.hired=true;packB.secondWorker.lastTick=Date.now()}else if(before===2){packC.crew3.hired=true;packC.crew3.role='scavenger';packC.crew3.lastTick=Date.now()}else if(before===3){packD.crew4.hired=true;packD.crew4.role='scavenger';packD.crew4.lastTick=Date.now()}saveGame();renderGarage();return worker}`,
'generic hire compatibility');

replaceOne(
`function dispatchWorkers(){const slots=hiredWorkerSlots();if(!slots.length)return;dispatchWorkerShifts(midgame.economyV2,slots,Date.now());showToast(\`Смена подготовлена: \${slots.length} раб. · до 2 ч offline\`);saveGame();renderGarage()}`,
`function dispatchWorkers(){const now=Date.now(),slots=hiredWorkerSlots();if(slots.length)dispatchWorkerShifts(midgame.economyV2,slots,now);const hours=2*effects().workerShiftMultiplier;for(const route of workforceV3.routes){route.startedAt=now;route.shiftEndsAt=now+hours*3_600_000;route.deliveredKg=0}workforceV3.lastSimulatedAt=now;showToast(\`Смена запущена: \${workforceV3.routes.length} маршрут. · до \${hours.toFixed(1)} ч\`);saveGame();renderGarage()}`,
'dispatch routes');
replaceOne(
`function toggleWorkerVan(){if(!midgame.van.owned||!midgame.worker.hired)return;setVanWorker(midgame.economyV2,midgame.economyV2.vanWorker==='w1'?null:'w1');showToast(midgame.economyV2.vanWorker==='w1'?'Фургон назначен на маршрут рабочего':'Фургон возвращён игроку');saveGame();renderGarage();hud()}`,
`function toggleWorkerVan(){if(!midgame.van.owned||!midgame.worker.hired)return;setVanWorker(midgame.economyV2,midgame.economyV2.vanWorker==='w1'?null:'w1');const route=workforceV3.routes.find(r=>r.workerIds.includes(workforceV3.workers[0]?.id));if(route)assignLegacyWorkerV3(0,route.zone);showToast(midgame.economyV2.vanWorker==='w1'?'Фургон назначен на маршрут рабочего':'Фургон возвращён игроку');saveGame();renderGarage();hud()}`,
'van route sync');

replaceOne(
`function doAssignOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Оператор ячейки»');return}if(!assignThirdWorkerOperator(packC,Date.now()))return;showToast('Рабочий №3 → Operator: цикл промышленной ячейки ×0.75');saveGame();renderGarage()}`,
`function doAssignOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Диспетчер»');return}if(!assignThirdWorkerOperator(packC,Date.now()))return;const worker=ensureLegacyWorkerV3(2);if(worker)setWorkerRoleV3(workforceV3,worker.id,'operator');showToast('Рабочий №3 → Operator');saveGame();renderGarage()}`,
'operator3 sync');
replaceOne(
`function doAssignFourthOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Оператор ячейки»');return}if(!assignFourthWorkerOperator(packD,0,Date.now()))return;showToast('Рабочий №4 → Operator: промышленная ячейка ×0.85');saveGame();renderGarage()}`,
`function doAssignFourthOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Диспетчер»');return}if(!assignFourthWorkerOperator(packD,0,Date.now()))return;const worker=ensureLegacyWorkerV3(3);if(worker)setWorkerRoleV3(workforceV3,worker.id,'operator');showToast('Рабочий №4 → Operator');saveGame();renderGarage()}`,
'operator4 sync');

replaceOne(
`function completeContract(contractId?:string){const ctx=contractContext(),offers=boardContractOffers(contractState,ctx,effects().contractChoices),def=(contractId?offers.find(x=>x.id===contractId):undefined)??activeBoardContract(contractState,ctx),needMult=contractNeedMultiplier(),needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult}));if(!needs.every(n=>contractOwned(n)+1e-9>=n.amount))return;for(const n of needs)consumeContractNeed(n,n.amount);const rewardMult=contractScale(contractState,effects().urgentContracts),reward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);cash+=reward;advanceBoardContract(contractState,def);gainXp(xpReward);showToast(\`Контракт закрыт: +\${money(reward)}, +\${xpReward} XP\`);saveGame();renderGarage()}`,
`function completeContract(contractId?:string){const ctx=contractContext(),offers=boardContractOffers(contractState,ctx,effects().contractChoices),def=(contractId?offers.find(x=>x.id===contractId):undefined)??activeBoardContract(contractState,ctx),needMult=contractNeedMultiplier(),needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult}));if(!needs.every(n=>contractOwned(n)+1e-9>=n.amount))return;for(const n of needs)consumeContractNeed(n,n.amount);const rewardMult=contractScale(contractState,effects().urgentContracts),reward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);cash+=reward;advanceBoardContract(contractState,def);gainXp(xpReward);showToast(\`Контракт закрыт: +\${money(reward)}, +\${xpReward} XP\`);saveGame();renderGarage()}
function standingOwned(buyer:StandingBuyerV3){return buyer.kind==='resource'?storage[buyer.key as ResourceKind]:processed[buyer.key as ProcessKind]}
function getContractV3View(){const ctx=contractContext(),standing=standingBuyersForContext(ctx).map(buyer=>({buyer,owned:standingOwned(buyer)})),specials=specialOrdersV3(contractState,ctx,effects().contractChoices).map(def=>({def,needs:def.needs.map(need=>({...need,owned:contractOwned(need)})),ready:def.needs.every(need=>contractOwned(need)+1e-9>=need.amount),reward:def.cashReward*Math.max(1.25,contractScale(contractState,effects().urgentContracts))}));return{standing,specials}}
function submitStandingV3(buyerId:string,requested:number){const buyer=standingBuyersForContext(contractContext()).find(item=>item.id===buyerId);if(!buyer)return null;const owned=standingOwned(buyer),result=deliverStandingV3(contractState,buyerId,owned,requested,effects().saleMultiplier);if(!result||result.consumed<=0)return result;if(buyer.kind==='resource')storage[buyer.key as ResourceKind]-=result.consumed;else processed[buyer.key as ProcessKind]-=result.consumed;cash+=result.cash;if(result.xp)gainXp(result.xp);showToast(\`\${buyer.name}: +\${money(result.cash)}\`);saveGame();renderGarage();return result}
function submitSpecialV3(contractId:string){const def=specialOrdersV3(contractState,contractContext(),effects().contractChoices).find(item=>item.id===contractId);if(!def||!def.needs.every(need=>contractOwned(need)+1e-9>=need.amount))return false;for(const need of def.needs)consumeContractNeed(need,need.amount);const rewardMult=Math.max(1.25,contractScale(contractState,effects().urgentContracts)),reward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);cash+=reward;gainXp(xpReward);advanceSpecialOrderV3(contractState,def);showToast(\`Спецзаказ: +\${money(reward)}, +\${xpReward} XP\`);saveGame();renderGarage();return true}`,
'contract v3 actions');

replaceOne(
`tierLabel=t.progressionTier===1?\`I · \${t.tier}\`:\`II · \${Math.max(1,t.tier-7)}\``,
`tierLabel=t.progressionTier===1?\`I · \${t.tier}\`:t.progressionTier===2?\`II · \${t.tier}\`:\`III · \${t.tier}\``,
'Tier III label');
replaceOne(
`Tier \${t.progressionTier===1?'I':'II'} · <span class="talentCost">`,
`Tier \${t.progressionTier===1?'I':t.progressionTier===2?'II':'III'} · <span class="talentCost">`,
'talent tier badge');

replaceOne(
`dispatchWorkers,toggleWorkerVan,hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole,projectGenericRoute:(routeId:string)=>{const route=workforceV3.routes.find(r=>r.id===routeId);return route?projectRouteV3(workforceV3,route,workforceContext(Date.now(),false)):null},awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
`dispatchWorkers,toggleWorkerVan,hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole,projectGenericRoute:(routeId:string)=>{const route=workforceV3.routes.find(r=>r.id===routeId);return route?projectRouteV3(workforceV3,route,workforceContext(Date.now(),false)):null},getContractV3View,submitStandingV3,submitSpecialV3,awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone)`,
'contract api');

text=text.replace('// CORE_RUNTIME_V3_INTEGRATED','// CORE_RUNTIME_V3_INTEGRATED\n// CORE_RUNTIME_V3_STAGE2');
fs.writeFileSync(path,text);
console.log('Core runtime V3 stage2 integration applied');
