import './fleet_network_v1.css';
import {deriveFleetNetworkV1,fleetNetworkBottleneckLabelV1,previewCrewDispatchV1} from './fleet_network_v1.ts';
import {ZONE_DEFS,type ZoneId} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};
const money=(value:number)=>`${Math.round(value).toLocaleString('ru-RU')} ₽`;
const vehicleIcon=(type:string|null)=>type==='truck'?'🚚':type==='recovery_rig'?'🚛':'🚐';
const GROUP_SHIFT_HOURS=2;

type NetworkView=ReturnType<typeof deriveFleetNetworkV1>;
type NetworkRoute=NetworkView['routes'][number];
type CrewPreset='top2'|'balanced'|'all'|'clear';

function runtime(){try{return api()?.getState?.()}catch{return null}}
function enabledStage(stage:string):stage is BusinessStageId{return stage in stageRank&&stageRank[stage as BusinessStageId]>=stageRank.salvage_yard}
function viewFor(s:any):NetworkView{return deriveFleetNetworkV1(s.workforceV3,(routeId)=>api()?.projectGenericRoute?.(routeId),Date.now())}
function masteredZones(s:any):ZoneId[]{return (Object.keys(ZONE_DEFS) as ZoneId[]).filter(id=>Number(s.midgame?.mastery?.[id]??0)>=99.999)}

function currentNetworkRoot(){return document.querySelector<HTMLElement>('#fleetNetworkV1Root')}
function logisticsPane(){return document.querySelector<HTMLElement>('[data-base-pane="logistics"]')}
function rootAttachedToLogisticsPane(){const root=currentNetworkRoot(),pane=logisticsPane();return !!root&&!!pane&&root.parentElement===pane}
function networkRoot(){
  const pane=logisticsPane();if(!pane)return null;
  let root=currentNetworkRoot();if(!root){root=document.createElement('section');root.id='fleetNetworkV1Root';root.className='fleetNetworkV1'}
  if(root.parentElement!==pane)pane.prepend(root);
  return root;
}

function fillText(route:NetworkRoute){return route.hoursToCapacity===null?'—':route.hoursToCapacity<=0?'полон':`${route.hoursToCapacity.toFixed(1)} ч`}
function routeRemediationMarkup(route:NetworkRoute,s:any){
  const freeLarger=(s.workforceV3?.fleet??[]).filter((vehicle:any)=>!vehicle.routeId&&Number(vehicle.capacityKg)>route.capacityKg);
  if(!['capacity','no_vehicle'].includes(route.bottleneck)||route.workerIds.length!==1||!freeLarger.length)return`<div class="fleetNetworkPressure"><span>До заполнения: <b data-network-fill="${route.routeId}">${fillText(route)}</b></span></div>`;
  return`<div class="fleetNetworkPressure actionable" data-network-remediation="${route.routeId}">
    <span>До заполнения: <b data-network-fill="${route.routeId}">${fillText(route)}</b></span>
    <label>Свободная машина<select data-network-route-vehicle="${route.routeId}">${freeLarger.sort((a:any,b:any)=>Number(b.capacityKg)-Number(a.capacityKg)).map((vehicle:any)=>`<option value="${vehicle.id}">${vehicleIcon(vehicle.type)} ${vehicle.name} · ${vehicle.capacityKg} кг</option>`).join('')}</select></label>
    <button data-network-reassign-route="${route.routeId}" data-network-worker="${route.workerIds[0]}" data-network-zone="${route.zone}">Усилить маршрут</button>
  </div>`;
}

function routeMarkup(route:NetworkRoute,s:any){
  const zone=ZONE_DEFS[route.zone]?.name??route.zone.toUpperCase(),crew=route.workerNames.length?route.workerNames.join(' + '):'Нет бригады',vehicle=route.vehicleName??'Без транспорта';
  return`<article class="fleetNetworkRoute ${route.bottleneck!=='none'?'constrained':''}" data-network-route="${route.routeId}">
    <header><div><b>${zone}</b><span>${route.routeId}</span></div><strong>${vehicleIcon(route.vehicleType)} ${vehicle}</strong></header>
    <div class="fleetNetworkCrew">Бригада: <b>${crew}</b></div>
    <div class="fleetNetworkDestination">Доставка → <b>Склад базы</b></div>
    <div class="fleetNetworkMetrics">
      <span>Поток<b>${route.kgPerHour.toFixed(0)} кг/ч</b></span>
      <span>Стоимость<b>${money(route.valuePerHour)}/ч</b></span>
      <span>Загрузка<b data-network-load="${route.routeId}">${route.deliveredKg.toFixed(0)} / ${route.capacityKg.toFixed(0)} кг</b></span>
      <span>Смена<b data-network-shift="${route.routeId}">${route.shiftRemainingHours.toFixed(1)} ч</b></span>
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
    <header><div><small>ГРУППОВОЙ ВЫЕЗД</small><b>Отправить несколько бригад одной командой</b><p>Выбери готовую схему или собери группу вручную. Машины распределяются от самой вместительной к самой сильной бригаде; лишние люди выйдут без машины. Стандартная смена — ${GROUP_SHIFT_HOURS} часа.</p></div></header>
    <div class="crewDispatchPresets" data-crew-presets><small>БЫСТРЫЕ СОСТАВЫ</small><button data-crew-preset="top2">2 лучших</button><button data-crew-preset="balanced">Сборщик + логист</button><button data-crew-preset="all">Все свободные</button><button data-crew-preset="clear">Сброс</button></div>
    <div class="crewDispatchGrid">
      <div><small>1 · ЛЮДИ</small><div class="crewDispatchChoices" data-crew-workers>${workerChoices||'<em>Нет свободных сборщиков/логистов</em>'}</div></div>
      <div><small>2 · ЗОНА</small><label class="crewDispatchSelect">Освоенная зона<select data-crew-zone>${zones.map(id=>`<option value="${id}">${ZONE_DEFS[id].name}</option>`).join('')}</select></label><div class="crewDispatchFixedShift"><small>СМЕНА</small><b>${GROUP_SHIFT_HOURS} часа</b><span>тот же runtime-контракт, что у обычного назначения</span></div></div>
      <div><small>3 · ТРАНСПОРТ</small><div class="crewDispatchChoices" data-crew-vehicles>${vehicleChoices||'<em>Свободного транспорта нет</em>'}</div></div>
    </div>
    <div class="crewDispatchFooter"><div><small>БАЗОВЫЙ ПРОГНОЗ</small><b data-crew-preview-kg>0 кг/ч</b><span data-crew-preview-detail>Выбери хотя бы одного сотрудника</span></div><button data-crew-dispatch-go disabled>Отправить группу</button></div>
  </section>`;
}

function selectedIds(selector:string){return Array.from(document.querySelectorAll<HTMLInputElement>(selector)).filter(input=>input.checked).map(input=>String(input.dataset.crewWorker??input.dataset.crewVehicle??''))}
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

function applyCrewPreset(s:any,preset:CrewPreset){
  const idle=(s?.workforceV3?.workers??[]).filter((worker:any)=>worker.status==='idle'&&['scavenger','logistician'].includes(worker.role)).sort((a:any,b:any)=>Number(b.rank)-Number(a.rank));
  let ids:string[]=[];
  if(preset==='top2')ids=idle.slice(0,2).map((worker:any)=>worker.id);
  else if(preset==='all')ids=idle.map((worker:any)=>worker.id);
  else if(preset==='balanced'){
    const scavenger=idle.find((worker:any)=>worker.role==='scavenger'),logistician=idle.find((worker:any)=>worker.role==='logistician');
    ids=[scavenger?.id,logistician?.id].filter((id):id is string=>!!id);
    if(ids.length<2)ids=idle.slice(0,2).map((worker:any)=>worker.id);
  }
  document.querySelectorAll<HTMLInputElement>('[data-crew-worker]').forEach(input=>{input.checked=ids.includes(String(input.dataset.crewWorker??''))});
  updateCrewPreview(s);
}

function patchLiveMetrics(view:NetworkView){
  for(const route of view.routes){
    const load=document.querySelector<HTMLElement>(`[data-network-load="${route.routeId}"]`),shift=document.querySelector<HTMLElement>(`[data-network-shift="${route.routeId}"]`),fill=document.querySelector<HTMLElement>(`[data-network-fill="${route.routeId}"]`);
    if(load)load.textContent=`${route.deliveredKg.toFixed(0)} / ${route.capacityKg.toFixed(0)} кг`;
    if(shift)shift.textContent=`${route.shiftRemainingHours.toFixed(1)} ч`;
    if(fill)fill.textContent=fillText(route);
  }
}

function renderNetwork(s:any,view=viewFor(s)){
  const root=networkRoot();if(!root)return false;const summary=view.summary,constrained=summary.constrainedRouteCount>0;
  root.innerHTML=`
    <div class="fleetNetworkHead"><div><small>FLEET NETWORK V1</small><h2>Сеть снабжения</h2><p>Все освоенные операции в одном месте: кто работает, на чём едет, сколько везёт, куда сдаёт и что ограничивает поток.</p></div><div class="fleetNetworkHealth ${constrained?'warn':''}">${constrained?`Ограничено маршрутов: ${summary.constrainedRouteCount}`:'Сеть сбалансирована'}</div></div>
    ${crewDispatchMarkup(s)}
    <div class="fleetNetworkSummary">
      <article><small>Маршруты</small><b>${summary.routeCount}</b><span>работают одновременно</span></article>
      <article><small>Бригады</small><b>${summary.routedWorkerCount}</b><span>людей в поле · свободно ${summary.idleWorkerCount}</span></article>
      <article><small>Автопарк</small><b>${summary.assignedVehicleCount}</b><span>занято · свободно ${summary.freeVehicleCount}</span></article>
      <article><small>Общий поток</small><b>${summary.totalKgPerHour.toFixed(0)}</b><span>кг/ч по сети</span></article>
      <article><small>Стоимость потока</small><b>${money(summary.totalValuePerHour)}</b><span>в час до переработки</span></article>
    </div>
    <div class="fleetNetworkRoutes">${view.routes.length?view.routes.map(route=>routeMarkup(route,s)).join(''):'<div class="fleetNetworkEmpty">Сеть пока простаивает. Назначь людей и транспорт на освоенные зоны — маршруты появятся здесь одновременно.</div>'}</div>`;
  updateCrewPreview(s);patchLiveMetrics(view);return true;
}

function renderYardScene(s:any,view=viewFor(s)){
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2.stage-yard');document.querySelectorAll<HTMLElement>('[data-yard-network-scene]').forEach(node=>{if(node.parentElement!==scene)node.remove()});if(!scene)return;
  const summary=view.summary,signature=JSON.stringify(view.routes.slice(0,4).map(route=>[route.routeId,route.zone,route.workerNames,route.vehicleName,Math.round(route.kgPerHour),route.bottleneck]));
  let root=scene.querySelector<HTMLElement>('[data-yard-network-scene]');if(!root){root=document.createElement('div');root.className='yardNetworkScene';root.dataset.yardNetworkScene='1';scene.append(root)}
  if(root.dataset.signature===signature)return;root.dataset.signature=signature;
  const lanes=view.routes.slice(0,4).map(route=>`<div class="yardRouteLane ${route.bottleneck!=='none'?'warn':''}"><b>${ZONE_DEFS[route.zone]?.name??route.zone.toUpperCase()}</b><span>${vehicleIcon(route.vehicleType)} ${route.vehicleName??'без транспорта'} · ${route.workerNames.join(' + ')||'нет бригады'}</span><em>${route.kgPerHour.toFixed(0)} кг/ч · ${fleetNetworkBottleneckLabelV1(route.bottleneck)}</em></div>`).join('');
  root.innerHTML=`<div class="yardNetworkSceneSummary"><small>СЕТЬ YARD</small><b>${summary.routeCount} маршрут.</b><span>${summary.totalKgPerHour.toFixed(0)} кг/ч · ${summary.assignedVehicleCount}/${summary.assignedVehicleCount+summary.freeVehicleCount} машин занято</span></div>${lanes||'<div class="yardRouteLane"><b>Маршруты не запущены</b><span>Освоенные зоны ждут бригаду и транспорт</span><em>Yard готов к диспетчеризации</em></div>'}`;
}

function structuralSignature(s:any,view:NetworkView,stage:string){
  return JSON.stringify({stage,workers:(s.workforceV3?.workers??[]).map((worker:any)=>[worker.id,worker.rank,worker.role,worker.status,worker.routeId]),fleet:(s.workforceV3?.fleet??[]).map((vehicle:any)=>[vehicle.id,vehicle.type,vehicle.capacityKg,vehicle.routeId]),mastered:masteredZones(s),routes:view.routes.map(route=>[route.routeId,route.zone,route.workerIds,route.vehicleId,Math.round(route.kgPerHour),Math.round(route.valuePerHour),route.capacityKg,route.bottleneck]),summary:view.summary});
}

let lastSignature='';
export function refreshFleetNetworkV1(){
  const s=runtime();if(!s?.workforceV3)return;const stage=String(s.businessStage??'');
  if(!enabledStage(stage)){currentNetworkRoot()?.remove();document.querySelector('[data-yard-network-scene]')?.remove();lastSignature='';return}
  const view=viewFor(s),signature=structuralSignature(s,view,stage);
  if(signature===lastSignature&&rootAttachedToLogisticsPane()){patchLiveMetrics(view);if(stage==='salvage_yard')renderYardScene(s,view);return}
  if(renderNetwork(s,view)){lastSignature=signature;if(stage==='salvage_yard')renderYardScene(s,view);else document.querySelector('[data-yard-network-scene]')?.remove()}
}

function requestRefresh(){lastSignature='';queueMicrotask(refreshFleetNetworkV1);setTimeout(refreshFleetNetworkV1,120);setTimeout(refreshFleetNetworkV1,420)}

addEventListener('change',event=>{const target=event.target as HTMLElement;if(target.closest('[data-crew-dispatch]')){const s=runtime();if(s)updateCrewPreview(s)}},true);
addEventListener('click',event=>{
  const target=event.target as HTMLElement,preset=target.closest<HTMLElement>('[data-crew-preset]');
  if(preset?.dataset.crewPreset){const s=runtime();if(s)applyCrewPreset(s,preset.dataset.crewPreset as CrewPreset);return}
  const reassign=target.closest<HTMLElement>('[data-network-reassign-route]');
  if(reassign?.dataset.networkReassignRoute&&reassign.dataset.networkWorker&&reassign.dataset.networkZone){
    const routeId=reassign.dataset.networkReassignRoute,vehicleId=document.querySelector<HTMLSelectElement>(`[data-network-route-vehicle="${routeId}"]`)?.value;
    if(vehicleId&&api()?.assignGenericRoute?.(reassign.dataset.networkWorker,reassign.dataset.networkZone,vehicleId)){window.dispatchEvent(new CustomEvent('salvage:business-state-changed'));requestRefresh()}return;
  }
  if(!target.closest('[data-crew-dispatch-go]'))return;const s=runtime(),panel=document.querySelector<HTMLElement>('[data-crew-dispatch]');if(!s?.workforceV3||!panel)return;
  const zone=panel.querySelector<HTMLSelectElement>('[data-crew-zone]')?.value as ZoneId|undefined;if(!zone)return;
  const selectedWorkers=selectedIds('[data-crew-worker]').map(id=>s.workforceV3.workers.find((worker:any)=>worker.id===id)).filter(Boolean).sort((a:any,b:any)=>Number(b.rank)-Number(a.rank));
  const selectedVehicles=selectedIds('[data-crew-vehicle]').map(id=>s.workforceV3.fleet.find((vehicle:any)=>vehicle.id===id)).filter((vehicle:any)=>vehicle&&!vehicle.routeId).sort((a:any,b:any)=>Number(b.capacityKg)-Number(a.capacityKg));
  let dispatched=0;selectedWorkers.forEach((worker:any,index:number)=>{if(api()?.assignGenericRoute?.(worker.id,zone,selectedVehicles[index]?.id??null))dispatched++});if(dispatched){window.dispatchEvent(new CustomEvent('salvage:business-state-changed'));requestRefresh()}
},true);
addEventListener('salvage:business-state-changed',requestRefresh);
setInterval(refreshFleetNetworkV1,1000);