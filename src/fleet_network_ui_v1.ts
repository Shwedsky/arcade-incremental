import './fleet_network_v1.css';
import {deriveFleetNetworkV1,fleetNetworkBottleneckLabelV1} from './fleet_network_v1.ts';
import {ZONE_DEFS} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};
const money=(value:number)=>`${Math.round(value).toLocaleString('ru-RU')} ₽`;
const vehicleIcon=(type:string|null)=>type==='truck'?'🚚':type==='recovery_rig'?'🚛':'🚐';

function runtime(){try{return api()?.getState?.()}catch{return null}}
function enabledStage(stage:string):stage is BusinessStageId{return stage in stageRank&&stageRank[stage as BusinessStageId]>=stageRank.salvage_yard}
function viewFor(s:any){return deriveFleetNetworkV1(s.workforceV3,(routeId)=>api()?.projectGenericRoute?.(routeId),Date.now())}

function networkRoot(){
  const fleet=document.querySelector<HTMLElement>('#fleetV3Root');if(!fleet?.parentElement)return null;
  let root=document.querySelector<HTMLElement>('#fleetNetworkV1Root');
  if(!root){root=document.createElement('section');root.id='fleetNetworkV1Root';root.className='fleetNetworkV1'}
  if(root.parentElement!==fleet.parentElement||root.nextElementSibling!==fleet)fleet.parentElement.insertBefore(root,fleet);
  return root;
}

function routeMarkup(route:ReturnType<typeof viewFor>['routes'][number]){
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
  </article>`;
}

function renderNetwork(s:any){
  const root=networkRoot();if(!root)return;
  const view=viewFor(s),summary=view.summary;
  const constrained=summary.constrainedRouteCount>0;
  root.innerHTML=`
    <div class="fleetNetworkHead"><div><small>FLEET NETWORK V1</small><h2>Сеть снабжения</h2><p>Все освоенные операции в одном месте: кто работает, на чём едет, сколько везёт и что ограничивает поток.</p></div><div class="fleetNetworkHealth ${constrained?'warn':''}">${constrained?`Ограничено маршрутов: ${summary.constrainedRouteCount}`:'Сеть сбалансирована'}</div></div>
    <div class="fleetNetworkSummary">
      <article><small>Маршруты</small><b>${summary.routeCount}</b><span>работают одновременно</span></article>
      <article><small>Бригады</small><b>${summary.routedWorkerCount}</b><span>людей в поле · свободно ${summary.idleWorkerCount}</span></article>
      <article><small>Автопарк</small><b>${summary.assignedVehicleCount}</b><span>занято · свободно ${summary.freeVehicleCount}</span></article>
      <article><small>Общий поток</small><b>${summary.totalKgPerHour.toFixed(0)}</b><span>кг/ч по сети</span></article>
      <article><small>Стоимость потока</small><b>${money(summary.totalValuePerHour)}</b><span>в час до переработки</span></article>
    </div>
    <div class="fleetNetworkRoutes">${view.routes.length?view.routes.map(routeMarkup).join(''):'<div class="fleetNetworkEmpty">Сеть пока простаивает. Назначь людей и транспорт на освоенные зоны — маршруты появятся здесь одновременно.</div>'}</div>`;
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

addEventListener('salvage:business-state-changed',()=>queueMicrotask(refreshFleetNetworkV1));
setInterval(refreshFleetNetworkV1,1000);
