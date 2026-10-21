import './fleet_network_v1.css';
import {deriveFleetNetworkV1,fleetNetworkBottleneckLabelV1,previewCrewDispatchV1} from './fleet_network_v1.ts';
import {ZONE_DEFS,type ZoneId} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};
const money=(value:number)=>`${Math.round(value).toLocaleString('ru-RU')} ₽`;
const vehicleIcon=(type:string|null)=>type==='truck'?'🚚':type==='recovery_rig'?'🚛':'🚐';
const GROUP_SHIFT_HOURS=2;

function runtime(){try{return api()?.getState?.()}catch{return null}}
function enabledStage(stage:string):stage is BusinessStageId{return stage in stageRank&&stageRank[stage as BusinessStageId]>=stageRank.salvage_yard}
function viewFor(s:any){return deriveFleetNetworkV1(s.workforceV3,(routeId)=>api()?.projectGenericRoute?.(routeId),Date.now())}
function masteredZones(s:any):ZoneId[]{return (Object.keys(ZONE_DEFS) as ZoneId[]).filter(id=>Number(s.midgame?.mastery?.[id]??0)>=99.999)}

function networkRoot(){
  const fleet=document.querySelector<HTMLElement>('#fleetV3Root');if(!fleet?.parentElement)return null;
  let root=document.querySelector<HTMLElement>('#fleetNetworkV1Root');
  if(!root){root=document.createElement('section');root.id='fleetNetworkV1Root';root.className='fleetNetworkV1'}
  if(root.parentElement!==fleet.parentElement||root.nextElementSibling!==fleet)fleet.parentElement.insertBefore(root,fleet);
  return root;
}

function routeRemediationMarkup(route:ReturnType<typeof viewFor>['routes'][number],s:any){
  const freeLarger=(s.workforceV3?.fleet??[]).filter((vehicle:any)=>!vehicle.routeId&&Number(vehicle.capacityKg)>route.capacityKg);
  const fill=route.hoursToCapacity===null?'—':route.hoursToCapacity<=0?'полон':`${route.hoursToCapacity.toFixed(1)} ч`;
  if(!['capacity','no_vehicle'].includes(route.bottleneck)||route.workerIds.length!==1||!freeLarger.length)return`<div class="fleetNetworkPressure"><span>До заполнения: <b>${fill}</b></span></div>`;
  return`<div class="fleetNetworkPressure actionable" data-network-remediation="${route.routeId}">
    <span>До заполнения: <b>${fill}</b></span>
    <label>Свободная машина<select data-network-route-vehicle="${route.routeId}">${freeLarger.sort((a:any,b:any)=>Number(b.capacityKg)-Number(a.capacityKg)).map((vehicle:any)=>`<option value="${vehicle.id}">${vehicleIcon(vehicle.type)} ${vehicle.name} · ${vehicle.capacityKg} кг</option>`).join('')}</select></label>
    <button data-network-reassign-route="${route.routeId}" data-network-worker="${route.workerIds[0]}" data-network-zone="${route.zone}">Усилить маршрут</button>
  </div>`;
}

function routeMarkup(route:ReturnType<typeof viewFor>['routes'][number],s:any){
  const zone=ZONE_DEFS[route.zone]?.name??route.zone.toUpperCase();
  const crew=route.workerNames.length?route.workerNames.join(' + '):'Нет бригады';
  const vehicle=route.vehicleName??'Без транспорта';
  const constrained=route.bottleneck!=='none';
  return`<article class="fleetNetworkRoute ${constrained?'constrained':''}" data-network-route="${route.routeId}">
    <header><div><b>${zone}</b><span>${route.routeId}</span></div><strong>${vehicleIcon(route.vehicleType)} ${vehicle}</strong></header>
    <div class="fleetNetworkCrew">Бригада: <b>${crew}</b></div>
    <div class="fleetNetworkMetrics">
      <span>Поток<b>${route.kgPerHour.toFixed(0)} кг/ч</b></span>
      <span>Стоимость<b>${money(route.valuePerHour)}/ч</b></span>
      <span>Загрузка<b>${route.deliveredKg.toFixed(0)} / ${route.capacityKg.toFixed(0)} кг</b></span>
      <span>Смена<b>${route.shiftRemainingHours.toFixed(1)} ч</b></span>
    </div>
    <small class="fleetNetworkBottleneck">${fleetNetworkBottleneckLabelV1(route.bottleneck)}</small>
    ${routeRemediationMarkup(route,s)}
  </article>`;
}

function crewDispatchMarkup(s:any){
  const wf=s.workforceV3,idle=wf.workers.filter((worker:any)=>worker.status==='idle'&&['scavenger','logistician'].includes(worker.role)),free=wf.fleet.filter((vehicle:any)=>!vehicle.routeId),zones=masteredZones(s);
  const workerChoices=idle.map((worker:any)=>`<label><input type="checkbox" data-crew-worker="${worker.id}"><span><b>${worker.name}</b><small>${worker.role==='logistician'?'Логист':'Сборщик'} · ранг ${worker.rank}</small></span></label>`).join('');
  const vehicleChoices=free.map((vehicle:any)=>`<label><input type="checkbox" data-crew-vehicle="${vehicle.id}"><span><b>${vehicleIcon(vehicle.type)} ${vehicle.name}</b><small>${vehicle.capacityKg} кг</small></span></label>`).join('');
  return`<section class="crewDispatchV1" data-crew-dispatch>
    <header><div><small>ГРУППОВОЙ ВЫЕЗД</small><b>Отправить несколько бригад одной командой</b><p>Выбери свободных людей, освоенную зону и транспорт. Машины распределяются от самой вместительной к самой сильной бригаде; лишние люди выйдут без машины. Стандартная смена — ${GROUP_SHIFT_HOURS} часа.</p></div></header>
    <div class="crewDispatchGrid">
      <div><small>1 · ЛЮДИ</small><div class="crewDispatchChoices" data-crew-workers>${workerChoices||'<em>Нет свободных сборщиков/логистов</em>'}</div></div>
      <div><small>2 · ЗОНА</small><label class="crewDispatchSelect">Освоенная зона<select data-crew-zone>${zones.map(id=>`<option value="${id}">${ZONE_DEFS[id].name}</option>`).join('')}</select></label><div class="crewDispatchFixedShift"><small>СМЕНА</small><b>${GROUP_SHIFT_HOURS} часа</b><span>тот же runtime-контракт, что у обычного назначения</span></div></div>
      <div><small>3 · ТРАНСПОРТ</small><div class="crewDispatchChoices" data-crew-vehicles>${vehicleChoices||'<em>Свободного транспорта нет</em>'}</div></div>
    </div>
    <div class="crewDispatchFooter"><div><small>БАЗОВЫЙ ПРОГНОЗ</small><b data-crew-preview-kg>0 кг/ч</b><span data-crew-preview-detail>Выбери хотя бы одного сотрудника</span></div><button data-crew-dispatch-go disabled>Отправить группу</button></div>
  </section>`;
}

function renderNetwork(s:any){
  const root=networkRoot();if(!root)return;
  const view=viewFor(s),summary=view.summary;
  const constrained=summary.constrainedRouteCount>0;
  root.innerHTML=`
    <div class="fleetNetworkHead"><div><small>FLEET NETWORK V1</small><h2>Сеть снабжения</h2><p>Все освоенные операции в одном месте: кто работает, на чём едет, сколько везёт и что ограничивает поток.</p></div><div class="fleetNetworkHealth ${constrained?'warn':''}">${constrained?`Ограничено маршрутов: ${summary.constrainedRouteCount}`:'Сеть сбалансирована'}</div></div>
    ${crewDispatchMarkup(s)}
    <div class="fleetNetworkSummary">
      <article><small>Маршруты</small><b>${summary.routeCount}</b><span>работают одновременно</span></article>
      <article><small>Бригады</small><b>${summary.routedWorkerCount}</b><span>людей в поле · свободно ${summary.idleWorkerCount}</span></article>
      <article><small>Автопарк</small><b>${summary.assignedVehicleCount}</b><span>занято · свободно ${summary.freeVehicleCount}</span></article>
      <article><small>Общий поток</small><b>${summary.totalKgPerHour.toFixed(0)}</b><span>кг/ч по сети</span></article>
      <article><small>Стоимость потока</small><b>${money(summary.totalValuePerHour)}</b><span>в час до переработки</span></article>
    </div>
    <div class="fleetNetworkRoutes">${view.routes.length?view.routes.map(route=>routeMarkup(route,s)).join(''):'<div class="fleetNetworkEmpty">Сеть пока простаивает. Назначь людей и транспорт на освоенные зоны — маршруты появятся здесь одновременно.</div>'}</div>`;
  updateCrewPreview(s);
}

function selectedIds(selector:string){return Array.from(document.querySelectorAll<HTMLInputElement>(selector)).filter(input=>input.checked).map(input=>String(input.dataset.crewWorker??input.dataset.crewVehicle??''));}
function updateCrewPreview(s:any){
  const panel=document.querySelector<HTMLElement>('[data-crew-dispatch]');if(!panel||!s?.workforceV3)return;
  const workerIds=selectedIds('[data-crew-worker]'),vehicleIds=selectedIds('[data-crew-vehicle]'),zone=panel.querySelector<HTMLSelectElement>('[data-crew-zone]')?.value as ZoneId|undefined;
  const kg=panel.querySelector<HTMLElement>('[data-crew-preview-kg]'),detail=panel.querySelector<HTMLElement>('[data-crew-preview-detail]'),button=panel.querySelector<HTMLButtonElement>('[data-crew-dispatch-go]');
  if(!zone||!workerIds.length){if(kg)kg.textContent='0 кг/ч';if(detail)detail.textContent='Выбери хотя бы одного сотрудника';if(button)button.disabled=true;return}
  const preview=previewCrewDispatchV1(s.workforceV3,{workerIds,vehicleIds,zone,shiftHours:GROUP_SHIFT_HOURS,now:Date.now()});
  if(kg)kg.textContent=`${preview.totalKgPerHour.toFixed(0)} кг/ч`;
  if(detail)detail.textContent=`${preview.routeCount} маршрут. · машин ${Math.min(preview.workerIds.length,preview.vehicleIds.length)}${preview.unservedWorkerCount?` · без транспорта ${preview.unservedWorkerCount}`:''}${preview.constrainedRouteCount?` · ограничений ${preview.constrainedRouteCount}`:''}`;
  if(button)button.disabled=preview.routeCount===0;
}

function renderYardScene(s:any){
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2.stage-yard');
  document.querySelectorAll<HTMLElement>('[data-yard-network-scene]').forEach(node=>{if(node.parentElement!==scene)node.remove()});
  if(!scene)return;
  const view=viewFor(s),summary=view.summary;
  let root=scene.querySelector<HTMLElement>('[data-yard-network-scene]');if(!root){root=document.createElement('div');root.className='yardNetworkScene';root.dataset.yardNetworkScene='1';scene.append(root)}
  const lanes=view.routes.slice(0,4).map(route=>`<div class="yardRouteLane ${route.bottleneck!=='none'?'warn':''}"><b>${ZONE_DEFS[route.zone]?.name??route.zone.toUpperCase()}</b><span>${vehicleIcon(route.vehicleType)} ${route.vehicleName??'без транспорта'} · ${route.workerNames.join(' + ')||'нет бригады'}</span><em>${route.kgPerHour.toFixed(0)} кг/ч · ${fleetNetworkBottleneckLabelV1(route.bottleneck)}</em></div>`).join('');
  root.innerHTML=`<div class="yardNetworkSceneSummary"><small>СЕТЬ YARD</small><b>${summary.routeCount} маршрут.</b><span>${summary.totalKgPerHour.toFixed(0)} кг/ч · ${summary.assignedVehicleCount}/${summary.assignedVehicleCount+summary.freeVehicleCount} машин занято</span></div>${lanes||'<div class="yardRouteLane"><b>Маршруты не запущены</b><span>Освоенные зоны ждут бригаду и транспорт</span><em>Yard готов к диспетчеризации</em></div>'}`;
}

let lastSignature='';
export function refreshFleetNetworkV1(){
  const s=runtime();if(!s?.workforceV3)return;
  const stage=String(s.businessStage??'');
  if(!enabledStage(stage)){
    document.querySelector('#fleetNetworkV1Root')?.remove();
    document.querySelector('[data-yard-network-scene]')?.remove();
    lastSignature='';return;
  }
  const view=viewFor(s);
  const signature=JSON.stringify({stage,routes:view.routes.map(route=>[route.routeId,route.zone,route.workerIds,route.vehicleId,Math.round(route.kgPerHour),Math.round(route.deliveredKg),route.bottleneck]),summary:view.summary});
  if(signature===lastSignature&&document.querySelector('#fleetNetworkV1Root')){if(stage==='salvage_yard')renderYardScene(s);return}
  lastSignature=signature;renderNetwork(s);
  if(stage==='salvage_yard')renderYardScene(s);else document.querySelector('[data-yard-network-scene]')?.remove();
}

addEventListener('change',event=>{const target=event.target as HTMLElement;if(target.closest('[data-crew-dispatch]')){const s=runtime();if(s)updateCrewPreview(s)}} ,true);
addEventListener('click',event=>{
  const target=event.target as HTMLElement;
  const reassign=target.closest<HTMLElement>('[data-network-reassign-route]');
  if(reassign?.dataset.networkReassignRoute&&reassign.dataset.networkWorker&&reassign.dataset.networkZone){
    const routeId=reassign.dataset.networkReassignRoute,vehicleId=document.querySelector<HTMLSelectElement>(`[data-network-route-vehicle="${routeId}"]`)?.value;
    if(vehicleId&&api()?.assignGenericRoute?.(reassign.dataset.networkWorker,reassign.dataset.networkZone,vehicleId)){lastSignature='';window.dispatchEvent(new CustomEvent('salvage:business-state-changed'));setTimeout(refreshFleetNetworkV1,0)}
    return;
  }
  if(!target.closest('[data-crew-dispatch-go]'))return;
  const s=runtime(),panel=document.querySelector<HTMLElement>('[data-crew-dispatch]');if(!s?.workforceV3||!panel)return;
  const zone=panel.querySelector<HTMLSelectElement>('[data-crew-zone]')?.value as ZoneId|undefined;if(!zone)return;
  const selectedWorkers=selectedIds('[data-crew-worker]').map(id=>s.workforceV3.workers.find((worker:any)=>worker.id===id)).filter(Boolean).sort((a:any,b:any)=>Number(b.rank)-Number(a.rank));
  const selectedVehicles=selectedIds('[data-crew-vehicle]').map(id=>s.workforceV3.fleet.find((vehicle:any)=>vehicle.id===id)).filter((vehicle:any)=>vehicle&&!vehicle.routeId).sort((a:any,b:any)=>Number(b.capacityKg)-Number(a.capacityKg));
  let dispatched=0;selectedWorkers.forEach((worker:any,index:number)=>{if(api()?.assignGenericRoute?.(worker.id,zone,selectedVehicles[index]?.id??null))dispatched++});
  if(dispatched){lastSignature='';window.dispatchEvent(new CustomEvent('salvage:business-state-changed'));setTimeout(refreshFleetNetworkV1,0)}
},true);
addEventListener('salvage:business-state-changed',()=>queueMicrotask(refreshFleetNetworkV1));
setInterval(refreshFleetNetworkV1,1000);
