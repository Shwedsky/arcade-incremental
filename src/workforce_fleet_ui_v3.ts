import './workforce_fleet_ui_v3.css';
import {FLEET_CAPACITY_BY_STAGE,VEHICLE_SPECS,WORKER_CAPACITY_BY_STAGE,nextWorkerHireCost,type VehicleTypeV3,type WorkforceFleetV3State} from './workforce_fleet_v3.ts';
import {ZONE_DEFS,type ZoneId} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const money=(v:number)=>`${Math.round(v).toLocaleString('ru-RU')} ₽`;
const vehicleCosts:Record<VehicleTypeV3,number>={van:90_000,truck:260_000,recovery_rig:480_000};
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};
const bottleneckLabel=(value:string)=>({none:'поток сбалансирован',no_worker:'нет рабочего',no_vehicle:'нет транспорта — малая партия',capacity:'транспорт заполнится раньше конца смены',shift:'закончится смена'} as Record<string,string>)[value]??value;
const routeStopLabel=(endsAt:number)=>Math.max(0,(endsAt-Date.now())/3600_000);

function state(){return api()?.getState?.()}
function workforce(s:any):WorkforceFleetV3State{return s.workforceV3}
function freeVehicles(wf:WorkforceFleetV3State,currentRouteId?:string|null){return wf.fleet.filter(v=>!v.routeId||v.routeId===currentRouteId)}
function workerRoute(wf:WorkforceFleetV3State,workerId:string){return wf.routes.find(r=>r.workerIds.includes(workerId))}
function vehicleLabel(type:VehicleTypeV3){return VEHICLE_SPECS[type].label}
function canBuyType(stage:BusinessStageId,type:VehicleTypeV3){return stageRank[stage]>=stageRank[VEHICLE_SPECS[type].minStage]}
function masteredZones(s:any):ZoneId[]{return (Object.keys(ZONE_DEFS) as ZoneId[]).filter(id=>(s.midgame?.mastery?.[id]??0)>=99.999)}

function workerCard(s:any,worker:any){
  const wf=workforce(s),route=workerRoute(wf,worker.id),projection=route?api().projectGenericRoute(route.id):null,zones=masteredZones(s),availableVehicles=freeVehicles(wf,route?.id);
  const roleName=worker.role==='logistician'?'Логист':'Сборщик';
  const routeStatus=route&&projection
    ?`<div class="v3RouteLive"><div><b>${ZONE_DEFS[route.zone].name}</b><span>${projection.vehicleName??'Без транспорта'}</span></div><div class="v3Metrics"><span><b>${projection.kgPerHour.toFixed(0)}</b> кг/ч</span><span><b>${money(projection.valuePerHour)}</b>/ч</span><span><b>${route.deliveredKg.toFixed(0)} / ${projection.capacityKg.toFixed(0)}</b> кг</span><span><b>${routeStopLabel(route.shiftEndsAt).toFixed(1)}</b> ч смены</span></div><small class="${projection.bottleneck==='none'?'ok':'warn'}">${bottleneckLabel(projection.bottleneck)}</small></div>`
    :`<div class="v3Idle">Свободен · назначь освоенную зону</div>`;
  const currentVehicle=route?.vehicleId??'';
  const roleButtons=`<div class="v3RoleButtons"><button data-v3-role="scavenger" data-worker="${worker.id}" class="${worker.role==='scavenger'?'active':''}">Сборщик</button><button data-v3-role="logistician" data-worker="${worker.id}" class="${worker.role==='logistician'?'active':''}">Логист</button></div>`;
  return `<article class="v3WorkerCard" data-worker-card="${worker.id}"><header><div><b>${worker.name}</b><span>${roleName} · ранг ${worker.rank}/5</span></div><strong>${worker.status==='route'?'В РАБОТЕ':'СВОБОДЕН'}</strong></header>${routeStatus}${roleButtons}<div class="v3Assignment"><label>Зона<select data-v3-zone="${worker.id}">${zones.map(id=>`<option value="${id}" ${route?.zone===id?'selected':''}>${ZONE_DEFS[id].name}</option>`).join('')}</select></label><label>Транспорт<select data-v3-vehicle="${worker.id}"><option value="">Без транспорта</option>${availableVehicles.map(v=>`<option value="${v.id}" ${currentVehicle===v.id?'selected':''}>${v.name} · ${v.capacityKg} кг</option>`).join('')}</select></label><button data-v3-assign="${worker.id}" ${zones.length?'':'disabled'}>${route?'Обновить маршрут':'Назначить'}</button></div><div class="v3WorkerActions"><button data-v3-train="${worker.id}" ${worker.rank>=5?'disabled':''}>Обучить${worker.rank<5?` · ${money(15_000*worker.rank)}`:''}</button>${route?`<button data-v3-unassign="${route.id}" class="dangerLite">Снять с маршрута</button>`:''}</div></article>`;
}

function renderCrew(s:any){
  const panel=document.querySelector<HTMLElement>('#workerPanel');if(!panel||!s.workforceV3)return;
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=WORKER_CAPACITY_BY_STAGE[stage],hireCost=nextWorkerHireCost(wf),canHire=wf.workers.length<capacity&&s.cash>=hireCost&&((s.midgame?.mastery?.z1??0)>=99.999||wf.workers.length>0);
  panel.innerHTML=`<section id="workforceV3Root" class="workforceV3"><div class="v3SectionHead"><div><small>ПЕРСОНАЛ V3</small><h2>Команда ${wf.workers.length} / ${capacity}</h2><p>Один список рабочих для всей базы. Никаких отдельных «рабочих №2/№3» с другими правилами.</p></div><button data-v3-hire ${canHire?'':'disabled'}>${wf.workers.length>=capacity?'Нет свободных мест':wf.workers.length===0&&(s.midgame?.mastery?.z1??0)<99.999?'Сначала освой Z1':`Нанять · ${money(hireCost)}`}</button></div><div class="v3Workers">${wf.workers.length?wf.workers.map(worker=>workerCard(s,worker)).join(''):'<div class="v3Empty">Освой Z1 полностью — после этого можно нанять первого сборщика.</div>'}</div></section>`;
}

function renderFleet(s:any){
  const panel=document.querySelector<HTMLElement>('#transportPanel');if(!panel||!s.workforceV3)return;
  const oldRoot=panel.querySelector('#fleetV3Root');oldRoot?.remove();
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=FLEET_CAPACITY_BY_STAGE[stage],hasType=(type:VehicleTypeV3)=>wf.fleet.some(v=>v.type===type),fleetFull=wf.fleet.length>=capacity;
  const cards=wf.fleet.map(vehicle=>{const route=vehicle.routeId?wf.routes.find(r=>r.id===vehicle.routeId):null,worker=route?wf.workers.find(w=>route.workerIds.includes(w.id)):null;return`<article class="v3VehicleCard ${vehicle.routeId?'busy':''}"><header><b>${vehicle.name}</b><span>${vehicle.capacityKg} кг</span></header><p>${route?`${ZONE_DEFS[route.zone].name} · ${worker?.name??'бригада'}`:'Свободен на базе'}</p></article>`}).join('');
  const buyButtons=(['van','truck','recovery_rig'] as VehicleTypeV3[]).filter(type=>canBuyType(stage,type)&&hasType(type)).map(type=>`<button data-v3-buy-vehicle="${type}" ${fleetFull||s.cash<vehicleCosts[type]?'disabled':''}>+ ${vehicleLabel(type)} · ${money(vehicleCosts[type])}</button>`).join('');
  const root=document.createElement('section');root.id='fleetV3Root';root.className='fleetV3';root.innerHTML=`<div class="v3SectionHead"><div><small>ПАРК V3</small><h2>Транспорт ${wf.fleet.length} / ${capacity}</h2><p>Каждая машина — отдельный актив. Назначение видно в маршруте рабочего.</p></div></div><div class="v3FleetCards">${cards||'<div class="v3Empty">Первый транспорт собирается по основному рецепту развития.</div>'}</div>${buyButtons?`<div class="v3FleetBuy">${buyButtons}</div>`:''}`;
  panel.prepend(root);
  // Once an owned legacy vehicle is represented in the real fleet, hide its old
  // singleton summary. Acquisition cards remain visible until the first asset exists.
  for(const card of Array.from(panel.querySelectorAll<HTMLElement>('.transportCard,.milestoneCard'))){
    if(card.closest('#fleetV3Root'))continue;const title=card.querySelector('h2,h3')?.textContent??'';
    if((hasType('van')&&/Фургон/.test(title))||(hasType('truck')&&/Грузовик|Truck conversion/.test(title))||(hasType('recovery_rig')&&/Recovery Rig/.test(title)))card.classList.add('v3LegacyHidden');
  }
}

let lastSignature='';
function render(){const s=state();if(!s?.workforceV3)return;const garage=document.querySelector<HTMLElement>('#garageScreen');if(!garage||garage.hidden)return;const wf=workforce(s),sig=JSON.stringify({stage:s.businessStage,cash:Math.floor(s.cash),workers:wf.workers.map(w=>[w.id,w.rank,w.role,w.status,w.routeId]),fleet:wf.fleet.map(v=>[v.id,v.type,v.routeId]),routes:wf.routes.map(r=>[r.id,r.zone,r.workerIds,r.vehicleId,Math.floor(r.deliveredKg),Math.floor(r.shiftEndsAt/10000)]),mastery:s.midgame?.mastery});if(sig===lastSignature&&document.querySelector('#workforceV3Root')&&document.querySelector('#fleetV3Root'))return;lastSignature=sig;renderCrew(s);renderFleet(s)}

addEventListener('click',event=>{const target=event.target as HTMLElement;
  if(target.closest('[data-v3-hire]')){api()?.hireGenericWorker?.();setTimeout(render,0);return}
  const train=target.closest<HTMLElement>('[data-v3-train]');if(train?.dataset.v3Train){api()?.trainGenericWorker?.(train.dataset.v3Train);setTimeout(render,0);return}
  const unassign=target.closest<HTMLElement>('[data-v3-unassign]');if(unassign?.dataset.v3Unassign){api()?.unassignGenericRoute?.(unassign.dataset.v3Unassign);setTimeout(render,0);return}
  const role=target.closest<HTMLElement>('[data-v3-role]');if(role?.dataset.worker&&role.dataset.v3Role){api()?.setGenericWorkerRole?.(role.dataset.worker,role.dataset.v3Role);setTimeout(render,0);return}
  const assign=target.closest<HTMLElement>('[data-v3-assign]');if(assign?.dataset.v3Assign){const workerId=assign.dataset.v3Assign,zone=document.querySelector<HTMLSelectElement>(`[data-v3-zone="${workerId}"]`)?.value as ZoneId|undefined,vehicle=document.querySelector<HTMLSelectElement>(`[data-v3-vehicle="${workerId}"]`)?.value||null;if(zone)api()?.assignGenericRoute?.(workerId,zone,vehicle);setTimeout(render,0);return}
  const buy=target.closest<HTMLElement>('[data-v3-buy-vehicle]');if(buy?.dataset.v3BuyVehicle){api()?.acquireGenericVehicle?.(buy.dataset.v3BuyVehicle);setTimeout(render,0)}
},true);

setInterval(render,250);
