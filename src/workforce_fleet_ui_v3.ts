import './workforce_fleet_ui_v3.css';
import {FLEET_CAPACITY_BY_STAGE,VEHICLE_SPECS,WORKER_CAPACITY_BY_STAGE,nextWorkerHireCost,workerHireBandForCount,type VehicleTypeV3,type WorkforceFleetV3State} from './workforce_fleet_v3.ts';
import {VEHICLE_PURCHASE_COST,vehicleSellRefund} from './fleet_market_v1.ts';
import {ZONE_DEFS,type ZoneId} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const money=(v:number)=>`${Math.round(v).toLocaleString('ru-RU')} ₽`;
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};
const bottleneckLabel=(value:string)=>({none:'поток сбалансирован',no_worker:'нет рабочего',no_vehicle:'нет транспорта — малая партия',capacity:'транспорт заполнится раньше конца смены',shift:'закончится смена',base_storage:'склад базы заполнен — освободи место или расширь базу'} as Record<string,string>)[value]??value;
const routeStopLabel=(endsAt:number)=>Math.max(0,(endsAt-Date.now())/3600_000);

function state(){return api()?.getState?.()}
function workforce(s:any):WorkforceFleetV3State{return s.workforceV3}
function freeVehicles(wf:WorkforceFleetV3State,currentRouteId?:string|null){return wf.fleet.filter(v=>!v.routeId||v.routeId===currentRouteId)}
function workerRoute(wf:WorkforceFleetV3State,workerId:string){return wf.routes.find(r=>r.workerIds.includes(workerId))}
function vehicleLabel(type:VehicleTypeV3){return VEHICLE_SPECS[type].label}
function canBuyType(stage:BusinessStageId,type:VehicleTypeV3){return stageRank[stage]>=stageRank[VEHICLE_SPECS[type].minStage]}
function masteredZones(s:any):ZoneId[]{return (Object.keys(ZONE_DEFS) as ZoneId[]).filter(id=>(s.midgame?.mastery?.[id]??0)>=99.999)}
function notifyBusinessChange(){window.dispatchEvent(new CustomEvent('salvage:business-state-changed'))}
function uiNotice(text:string,tone:'ok'|'warn'='warn'){window.dispatchEvent(new CustomEvent('salvage:ui-notice',{detail:{text,tone}}))}
function afterAction(){window.setTimeout(()=>{render();notifyBusinessChange()},0)}

function siblingRoot(panel:HTMLElement,id:string,className:string){
  let root=document.querySelector<HTMLElement>(`#${id}`);
  if(!root){root=document.createElement('section');root.id=id;root.className=className}
  if(root.parentElement!==panel.parentElement)panel.parentElement?.insertBefore(root,panel);
  else if(root.nextElementSibling!==panel)panel.parentElement?.insertBefore(root,panel);
  return root;
}

function workerCard(s:any,worker:any){
  const wf=workforce(s),route=workerRoute(wf,worker.id),projection=route?api().projectGenericRoute(route.id):null,zones=masteredZones(s),availableVehicles=freeVehicles(wf,route?.id);
  const roleName=worker.role==='logistician'?'Логист':worker.role==='operator'?'Оператор':worker.role==='technician'?'Техник':'Сборщик';
  const routeStatus=route&&projection
    ?`<div class="v3RouteLive" data-v3-route-live="${route.id}"><div><b>${ZONE_DEFS[route.zone].name}</b><span>${projection.vehicleName??'Без транспорта'}</span></div><div class="v3Metrics"><span><b data-v3-metric="kgph">${projection.kgPerHour.toFixed(0)}</b> кг/ч</span><span><b data-v3-metric="valueph">${money(projection.valuePerHour)}</b>/ч</span><span><b data-v3-metric="load">${route.deliveredKg.toFixed(0)} / ${projection.capacityKg.toFixed(0)}</b> кг</span><span><b data-v3-metric="shift">${routeStopLabel(route.shiftEndsAt).toFixed(1)}</b> ч смены</span></div><small class="${projection.bottleneck==='none'?'ok':'warn'}" data-v3-metric="bottleneck">${bottleneckLabel(projection.bottleneck)}</small></div>`
    :worker.status==='production'
      ?`<div class="v3Idle production">На производстве · управление во вкладке «Производство»</div>`
      :`<div class="v3Idle">Свободен · назначь освоенную зону</div>`;
  const currentVehicle=route?.vehicleId??'';
  const roleButtons=`<div class="v3RoleButtons"><button data-v3-role="scavenger" data-worker="${worker.id}" class="${worker.role==='scavenger'?'active':''}">Сборщик</button><button data-v3-role="logistician" data-worker="${worker.id}" class="${worker.role==='logistician'?'active':''}">Логист</button></div>`;
  return `<article class="v3WorkerCard" data-worker-card="${worker.id}"><header><div><b>${worker.name}</b><span>${roleName} · ранг ${worker.rank}/5</span></div><strong>${worker.status==='route'?'В РАБОТЕ':worker.status==='production'?'ПРОИЗВОДСТВО':'СВОБОДЕН'}</strong></header>${routeStatus}${roleButtons}<div class="v3Assignment"><label>Зона<select data-v3-zone="${worker.id}" ${worker.status==='production'?'disabled':''}>${zones.map(id=>`<option value="${id}" ${route?.zone===id?'selected':''}>${ZONE_DEFS[id].name}</option>`).join('')}</select></label><label>Транспорт<select data-v3-vehicle="${worker.id}" ${worker.status==='production'?'disabled':''}><option value="">Без транспорта</option>${availableVehicles.map(v=>`<option value="${v.id}" ${currentVehicle===v.id?'selected':''}>${v.name} · ${v.capacityKg} кг</option>`).join('')}</select></label><button data-v3-assign="${worker.id}" ${zones.length&&worker.status!=='production'?'':'disabled'}>${route?'Обновить маршрут':'Назначить'}</button></div><div class="v3WorkerActions"><button data-v3-train="${worker.id}" ${worker.rank>=5?'disabled':''}>Обучить${worker.rank<5?` · ${money(15_000*worker.rank)}`:''}</button>${route?`<button data-v3-unassign="${route.id}" data-v3-unassign-worker="${worker.id}" class="dangerLite">Снять с маршрута</button>`:''}</div></article>`;
}

function renderCrew(s:any){
  const legacy=document.querySelector<HTMLElement>('#workerPanel');if(!legacy||!s.workforceV3)return;
  legacy.classList.add('v3LegacyWorkerPanelHidden');
  const root=siblingRoot(legacy,'workforceV3Root','workforceV3');
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=WORKER_CAPACITY_BY_STAGE[stage],hireCost=nextWorkerHireCost(wf),band=workerHireBandForCount(wf.workers.length);
  const mastered=(s.midgame?.mastery?.z1??0)>=99.999,space=wf.workers.length<capacity,entryReady=mastered||wf.workers.length>0,cashReady=s.cash>=hireCost,canPress=space&&entryReady;
  const missingCash=Math.max(0,hireCost-s.cash),hireLabel=!space?'Нет свободных мест':!entryReady?'Сначала освой Z1':cashReady?`Нанять · ${money(hireCost)}`:`Нанять · ${money(hireCost)} · не хватает ${money(missingCash)}`;
  const bandHint=band.nextAt==null?`Текущий тариф: ${band.label}. Дальше цена найма не растёт.`:`Текущий тариф: ${band.label}. Цена изменится только после ${band.nextAt}-го сотрудника.`;
  root.innerHTML=`<div class="v3SectionHead"><div><small>ПЕРСОНАЛ</small><h2>Команда ${wf.workers.length} / ${capacity}</h2><p>Назначение меняется здесь и не прыгает при обновлении производства. Живые показатели маршрута обновляются отдельно, без пересборки карточек.</p><p class="v3ActionHint">${bandHint}</p></div><button data-v3-hire class="${cashReady?'':'needsCash'}" ${canPress?'':'disabled'}>${hireLabel}</button></div><div class="v3Workers">${wf.workers.length?wf.workers.map(worker=>workerCard(s,worker)).join(''):'<div class="v3Empty">Освой Z1 полностью — после этого можно нанять первого сборщика.</div>'}</div>`;
}

function renderFleet(s:any){
  const legacy=document.querySelector<HTMLElement>('#transportPanel');if(!legacy||!s.workforceV3)return;
  const root=siblingRoot(legacy,'fleetV3Root','fleetV3');
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=FLEET_CAPACITY_BY_STAGE[stage],hasType=(type:VehicleTypeV3)=>wf.fleet.some(v=>v.type===type),fleetFull=wf.fleet.length>=capacity;
  const cards=wf.fleet.map(vehicle=>{const route=vehicle.routeId?wf.routes.find(r=>r.id===vehicle.routeId):null,worker=route?wf.workers.find(w=>route.workerIds.includes(w.id)):null,refund=vehicleSellRefund(vehicle.type);return`<article class="v3VehicleCard ${vehicle.routeId?'busy':''}" data-vehicle-card="${vehicle.id}"><header><b>${vehicle.name}</b><span>${vehicle.capacityKg} кг</span></header><p>${route?`${ZONE_DEFS[route.zone].name} · ${worker?.name??'бригада'}`:'Свободен на базе'}</p><div class="v3VehicleActions">${route?'<small>Сначала сними машину с маршрута</small>':`<button class="dangerLite" data-v3-sell-vehicle="${vehicle.id}">Продать · ${money(refund)}</button>`}</div></article>`}).join('');
  const buyButtons=(['van','truck','recovery_rig'] as VehicleTypeV3[]).filter(type=>canBuyType(stage,type)&&hasType(type)).map(type=>`<button data-v3-buy-vehicle="${type}" ${fleetFull||s.cash<VEHICLE_PURCHASE_COST[type]?'disabled':''}>+ ${vehicleLabel(type)} · ${money(VEHICLE_PURCHASE_COST[type])}</button>`).join('');
  root.innerHTML=`<div class="v3SectionHead"><div><small>ПАРК</small><h2>Транспорт ${wf.fleet.length} / ${capacity}</h2><p>Свободную машину можно продать за 60% стоимости и освободить слот. Машину на маршруте сначала нужно снять с назначения.</p></div></div><div class="v3FleetCards">${cards||'<div class="v3Empty">Первый транспорт собирается по основному рецепту развития.</div>'}</div>${buyButtons?`<div class="v3FleetBuy">${buyButtons}</div>`:''}`;
  for(const card of Array.from(legacy.querySelectorAll<HTMLElement>('.transportCard,.milestoneCard'))){
    const title=card.querySelector('h2,h3')?.textContent??'';card.classList.remove('v3LegacyHidden');
    if((hasType('van')&&/Фургон/.test(title))||(hasType('truck')&&/Грузовик|Truck conversion/.test(title))||(hasType('recovery_rig')&&/Recovery Rig/.test(title)))card.classList.add('v3LegacyHidden');
  }
}

function updateLiveMetrics(s:any){
  const wf=workforce(s);for(const route of wf.routes){const root=document.querySelector<HTMLElement>(`[data-v3-route-live="${route.id}"]`);if(!root)continue;const projection=api()?.projectGenericRoute?.(route.id);if(!projection)continue;
    const put=(name:string,value:string)=>{const el=root.querySelector<HTMLElement>(`[data-v3-metric="${name}"]`);if(el)el.textContent=value};
    put('kgph',projection.kgPerHour.toFixed(0));put('valueph',money(projection.valuePerHour));put('load',`${route.deliveredKg.toFixed(0)} / ${projection.capacityKg.toFixed(0)}`);put('shift',routeStopLabel(route.shiftEndsAt).toFixed(1));
    const bottleneck=root.querySelector<HTMLElement>('[data-v3-metric="bottleneck"]');if(bottleneck){bottleneck.textContent=bottleneckLabel(projection.bottleneck);bottleneck.className=projection.bottleneck==='none'?'ok':'warn'}
  }
}

function updateActionAvailability(s:any){
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=WORKER_CAPACITY_BY_STAGE[stage];
  const hire=document.querySelector<HTMLButtonElement>('[data-v3-hire]');
  if(hire){
    const cost=nextWorkerHireCost(wf),mastered=(s.midgame?.mastery?.z1??0)>=99.999,space=wf.workers.length<capacity,entryReady=mastered||wf.workers.length>0,cashReady=s.cash>=cost;
    const missing=Math.max(0,cost-s.cash);
    hire.disabled=!(space&&entryReady);
    hire.classList.toggle('needsCash',!cashReady);
    hire.textContent=!space?'Нет свободных мест':!entryReady?'Сначала освой Z1':cashReady?`Нанять · ${money(cost)}`:`Нанять · ${money(cost)} · не хватает ${money(missing)}`;
  }
  const fleetFull=wf.fleet.length>=FLEET_CAPACITY_BY_STAGE[stage];
  document.querySelectorAll<HTMLButtonElement>('[data-v3-buy-vehicle]').forEach(button=>{
    const type=button.dataset.v3BuyVehicle as VehicleTypeV3|undefined;if(!type)return;
    button.disabled=fleetFull||s.cash<VEHICLE_PURCHASE_COST[type];
  });
}

let lastSignature='';
function structuralSignature(s:any){const wf=workforce(s);return JSON.stringify({stage:s.businessStage,workers:wf.workers.map(w=>[w.id,w.rank,w.role,w.status,w.routeId,w.productionCellId]),fleet:wf.fleet.map(v=>[v.id,v.type,v.routeId]),routes:wf.routes.map(r=>[r.id,r.zone,r.workerIds,r.vehicleId]),mastered:Object.entries(s.midgame?.mastery??{}).filter(([,v])=>Number(v)>=99.999).map(([k])=>k)})}
function rootOwnedByLegacy(rootId:string,legacyId:string){const root=document.querySelector<HTMLElement>(`#${rootId}`),legacy=document.querySelector<HTMLElement>(`#${legacyId}`);return !!root&&!!legacy&&root.parentElement===legacy.parentElement&&root.nextElementSibling===legacy}
function render(){
  const s=state();if(!s?.workforceV3)return;const garage=document.querySelector<HTMLElement>('#garageScreen');if(!garage||garage.hidden)return;
  const sig=structuralSignature(s),crewOwned=rootOwnedByLegacy('workforceV3Root','workerPanel'),fleetOwned=rootOwnedByLegacy('fleetV3Root','transportPanel');
  if(sig!==lastSignature||!crewOwned||!fleetOwned){renderCrew(s);renderFleet(s);lastSignature=sig}
  updateLiveMetrics(s);updateActionAvailability(s)
}

addEventListener('click',event=>{const target=event.target as HTMLElement;
  if(target.closest('[data-v3-hire]')){
    const s=state(),wf=workforce(s),stage=s.businessStage as BusinessStageId,cost=nextWorkerHireCost(wf),limit=WORKER_CAPACITY_BY_STAGE[stage];
    if(wf.workers.length>=limit){uiNotice(`На текущей базе нет свободных мест: ${wf.workers.length}/${limit}.`);return}
    if(wf.workers.length===0&&(s.midgame?.mastery?.z1??0)<99.999){uiNotice('Сначала полностью освой Z1.');return}
    if(s.cash<cost){uiNotice(`На найм нужно ${money(cost)}. Не хватает ${money(cost-s.cash)}.`);return}
    const hired=api()?.hireGenericWorker?.();if(hired)uiNotice(`${hired.name} нанят за ${money(cost)}.`,'ok');else uiNotice('Найм не выполнен: проверь условия текущей базы.');
    afterAction();return
  }
  const train=target.closest<HTMLElement>('[data-v3-train]');if(train?.dataset.v3Train){
    const s=state(),worker=s?.workforceV3?.workers?.find((w:any)=>w.id===train.dataset.v3Train);if(!worker)return;
    if(worker.rank>=5){uiNotice(`${worker.name}: максимальный ранг.`);return}
    const cost=15_000*worker.rank;if(s.cash<cost){uiNotice(`Не хватает ${money(cost-s.cash)} на обучение ${worker.name}. Обучение стоит ${money(cost)}.`);return}
    const before=worker.rank,ok=api()?.trainGenericWorker?.(worker.id);if(ok)uiNotice(`${worker.name} обучен: ранг ${before+1}.`,'ok');else uiNotice('Обучение не выполнено: состояние изменилось.');
    afterAction();return
  }
  const unassign=target.closest<HTMLElement>('[data-v3-unassign]');if(unassign){const s=state(),workerId=unassign.dataset.v3UnassignWorker,currentRoute=workerId?s?.workforceV3?.workers?.find((worker:any)=>worker.id===workerId)?.routeId:null,routeId=currentRoute||unassign.dataset.v3Unassign;if(routeId)api()?.unassignGenericRoute?.(routeId);afterAction();return}
  const role=target.closest<HTMLElement>('[data-v3-role]');if(role?.dataset.worker&&role.dataset.v3Role){api()?.setGenericWorkerRole?.(role.dataset.worker,role.dataset.v3Role);afterAction();return}
  const assign=target.closest<HTMLElement>('[data-v3-assign]');if(assign?.dataset.v3Assign){const workerId=assign.dataset.v3Assign,zone=document.querySelector<HTMLSelectElement>(`[data-v3-zone="${workerId}"]`)?.value as ZoneId|undefined,vehicle=document.querySelector<HTMLSelectElement>(`[data-v3-vehicle="${workerId}"]`)?.value||null;if(zone)api()?.assignGenericRoute?.(workerId,zone,vehicle);afterAction();return}
  const buy=target.closest<HTMLElement>('[data-v3-buy-vehicle]');if(buy?.dataset.v3BuyVehicle){api()?.acquireGenericVehicle?.(buy.dataset.v3BuyVehicle);afterAction();return}
  const sell=target.closest<HTMLElement>('[data-v3-sell-vehicle]');if(sell?.dataset.v3SellVehicle){const s=state(),vehicle=s?.workforceV3?.fleet?.find((v:any)=>v.id===sell.dataset.v3SellVehicle);if(vehicle&&confirm(`Продать ${vehicle.name} за ${money(vehicleSellRefund(vehicle.type))}?`)){api()?.sellGenericVehicle?.(vehicle.id);afterAction()}return}
},true);

setInterval(render,500);
