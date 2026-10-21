import './base_shell_v1.css';
import {BUSINESS_STAGES,businessStage,type BaseSurfaceId,type BusinessStageDef,type BusinessStageSignals} from './business_stage.ts';

type RuntimeState=Record<string,any>;

type BaseShellApi={
  refresh:()=>void;
  open:(surface:BaseSurfaceId)=>void;
  getStage:()=>string|null;
  getActiveSurface:()=>BaseSurfaceId;
};

const SURFACE_LABELS:Record<BaseSurfaceId,{icon:string;label:string}>={
  overview:{icon:'⌂',label:'Обзор'},
  production:{icon:'⚙',label:'Производство'},
  storage:{icon:'▤',label:'Склад'},
  contracts:{icon:'₽',label:'Контракты'},
  crew:{icon:'👷',label:'Персонал'},
  logistics:{icon:'🚚',label:'Логистика'},
  development:{icon:'✦',label:'Развитие'}
};

const PANE_SURFACES:BaseSurfaceId[]=['overview','production','storage','contracts','crew','logistics'];
const STAGE_ORDER=Object.values(BUSINESS_STAGES).sort((a,b)=>a.rank-b.rank);
let activeSurface:BaseSurfaceId='overview';
let installed=false;
let lastStageId:string|null=null;

function runtimeApi(){return(globalThis as any).__SALVAGE_TEST__??null}
function runtimeState():RuntimeState|null{try{return runtimeApi()?.getState?.()??null}catch{return null}}

export function signalsFromRuntimeState(state:RuntimeState):BusinessStageSignals{
  return{
    installedMachineCount:Array.isArray(state.installed)?new Set(state.installed).size:0,
    vanOwned:!!state.midgame?.van?.owned,
    firstWorkerHired:!!state.midgame?.worker?.hired,
    hangarOwned:!!state.packB?.hangarOwned,
    salvageYardOwned:!!state.packC?.salvageYardOwned,
    industrialWorkshopOwned:!!state.packD?.industrialWorkshopOwned,
    processingPlantOwned:!!state.packE?.processingPlantOwned
  };
}

function genericWorkers(state:RuntimeState):any[]{
  if(Array.isArray(state.workforceV3?.workers))return state.workforceV3.workers;
  const legacy=[
    state.midgame?.worker?.hired&&{name:'Рабочий 1',status:state.midgame?.worker?.assignment?'route':'idle'},
    state.packB?.secondWorker?.hired&&{name:'Рабочий 2',status:state.packB?.secondWorker?.assignment?'route':'idle'},
    state.packC?.crew3?.hired&&{name:'Рабочий 3',status:state.packC?.crew3?.role==='operator'?'production':state.packC?.crew3?.assignment?'route':'idle'},
    state.packD?.crew4?.hired&&{name:'Рабочий 4',status:state.packD?.crew4?.role==='operator'?'production':state.packD?.crew4?.assignment?'route':'idle'}
  ];
  return legacy.filter(Boolean);
}

function genericFleet(state:RuntimeState):any[]{
  if(Array.isArray(state.workforceV3?.fleet))return state.workforceV3.fleet;
  const legacy:any[]=[];
  if(state.midgame?.van?.owned)legacy.push({name:'Фургон',routeId:null});
  if(state.packB?.truck?.owned)legacy.push({name:'Грузовик',routeId:null});
  if(state.packD?.recoveryRig?.owned)legacy.push({name:'Recovery Rig',routeId:null});
  return legacy;
}

function workerStats(state:RuntimeState){
  const workers=genericWorkers(state),idle=workers.filter(worker=>worker?.status==='idle').length,route=workers.filter(worker=>worker?.status==='route').length,production=workers.filter(worker=>worker?.status==='production').length;
  return{workers,total:workers.length,idle,route,production,active:route+production};
}

function fleetStats(state:RuntimeState){
  const fleet=genericFleet(state),assigned=fleet.filter(vehicle=>!!vehicle?.routeId).length;
  return{fleet,total:fleet.length,assigned,free:Math.max(0,fleet.length-assigned)};
}

function workerCount(state:RuntimeState):number{return workerStats(state).total}
function vehicleNames(state:RuntimeState):string[]{return genericFleet(state).map(vehicle=>String(vehicle?.name??'Транспорт'))}

function masteredZoneCount(state:RuntimeState):number{
  return Object.values(state.midgame?.mastery??{}).filter(value=>Number(value)>=99.9).length;
}

function activeQueueCount(state:RuntimeState):number{
  return (state.scheduler?.actions??[]).filter((action:any)=>action?.status==='active'||action?.status==='waiting').length;
}

function activeRouteCount(state:RuntimeState):number{
  if(Array.isArray(state.workforceV3?.routes))return state.workforceV3.routes.length;
  return genericWorkers(state).filter(worker=>worker?.status==='route').length;
}

function rawStockKg(state:RuntimeState):number{
  return ['metal','copper','plastic'].reduce((sum,key)=>sum+Math.max(0,Number(state.storage?.[key]??0)),0);
}

function hangarBottleneck(state:RuntimeState,workers:ReturnType<typeof workerStats>,fleet:ReturnType<typeof fleetStats>,queue:number){
  const stock=rawStockKg(state),routes=activeRouteCount(state);
  if(!workers.total)return{tone:'warn',label:'Нужен персонал',detail:'Ангар пустует: найми первого сотрудника и запусти освоенную зону.'};
  if(workers.idle>0&&!fleet.free)return{tone:'warn',label:'Транспорт занят',detail:`Свободных сотрудников: ${workers.idle}, но весь автопарк уже на маршрутах.`};
  if(workers.idle>0&&fleet.free>0&&routes===0)return{tone:'action',label:'Свободные мощности',detail:`Есть ${workers.idle} сотруд. и ${fleet.free} свободн. транспорт — можно запустить маршрут.`};
  if(queue>=3)return{tone:'warn',label:'Очередь мастерской',detail:`В Workshop Queue уже ${queue} задач. Производство стало текущим ограничением.`};
  if(stock<180)return{tone:'warn',label:'Нехватка сырья',detail:`На базе около ${Math.round(stock)} кг базового сырья. Активный фронтир или маршруты дадут лучший прирост.`};
  if(workers.idle>0)return{tone:'action',label:'Есть свободные люди',detail:`${workers.idle} сотруд. сейчас не назначены. Можно усилить маршруты или производство.`};
  if(fleet.free>0)return{tone:'ok',label:'Резерв транспорта',detail:`${fleet.free} машин сейчас свободны — есть запас для следующего маршрута.`};
  return{tone:'ok',label:'База сбалансирована',detail:'Люди и транспорт загружены. Следи за очередью, сырьём и следующим бизнес-рубежом.'};
}

function pane(surface:BaseSurfaceId){return document.querySelector<HTMLElement>(`[data-base-pane="${surface}"]`)}

function openSurface(surface:BaseSurfaceId){
  if(surface==='development'){
    document.querySelector<HTMLButtonElement>('#talentsGarage')?.click();
    return;
  }
  const target=pane(surface);if(!target||target.dataset.available==='false')return;
  activeSurface=surface;
  for(const id of PANE_SURFACES){const node=pane(id);if(node)node.hidden=id!==surface}
  document.querySelectorAll<HTMLButtonElement>('[data-base-surface]').forEach(button=>{
    const selected=button.dataset.baseSurface===surface;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',selected?'true':'false');
  });
  try{sessionStorage.setItem('salvage-base-surface-v1',surface)}catch{}
}

function stageRail(def:BusinessStageDef):string{
  return STAGE_ORDER.map(stage=>{
    const status=stage.rank<def.rank?'done':stage.rank===def.rank?'current':'future';
    return `<div class="baseStageStep ${status}" title="${stage.title}"><i></i><span>${stage.shortTitle}</span></div>`;
  }).join('');
}

function hangarOpsMarkup(state:RuntimeState):string{
  const workers=workerStats(state),fleet=fleetStats(state),routes=activeRouteCount(state),queue=activeQueueCount(state),stock=Math.round(rawStockKg(state)),bottleneck=hangarBottleneck(state,workers,fleet,queue);
  return`<section class="baseHangarOps" data-hangar-ops>
    <header><div><small>ОПЕРАЦИОННЫЙ ЦЕНТР</small><b>Что происходит в ангаре сейчас</b></div><span>${workers.active+fleet.assigned? 'База работает':'Есть свободные мощности'}</span></header>
    <div class="baseHangarOpsGrid">
      <article><small>Персонал</small><b>${workers.active}/${workers.total}</b><span>в работе · свободно ${workers.idle}</span></article>
      <article><small>Автопарк</small><b>${fleet.assigned}/${fleet.total}</b><span>на маршрутах · свободно ${fleet.free}</span></article>
      <article><small>Маршруты</small><b>${routes}</b><span>${workers.route} сотруд. в поле</span></article>
      <article><small>Workshop Queue</small><b>${queue}</b><span>${queue?'задач ждут/работают':'очередь свободна'}</span></article>
      <article><small>Сырьё на базе</small><b>${stock}</b><span>кг металла / меди / пластика</span></article>
    </div>
    <div class="baseHangarBottleneck ${bottleneck.tone}"><small>ГЛАВНЫЙ УЗКИЙ МОМЕНТ</small><b>${bottleneck.label}</b><span>${bottleneck.detail}</span></div>
  </section>`;
}

function renderOverview(state:RuntimeState,def:BusinessStageDef){
  const target=document.querySelector<HTMLElement>('#baseStageOverview');if(!target)return;
  const machines=Array.isArray(state.installed)?state.installed.length:0;
  const workers=workerCount(state),vehicles=vehicleNames(state),mastered=masteredZoneCount(state),queue=activeQueueCount(state);
  const currentZone=String(state.midgame?.currentZone??'z1').toUpperCase();
  const plantLines=Number(state.packE?.plantLines??0);
  const next=def.nextMilestone??'Текущая вершина бизнес-лестницы';
  const hangarOps=def.id==='hangar'?hangarOpsMarkup(state):'';
  target.innerHTML=`
    <section class="baseStageHero">
      <div class="baseStageHeroCopy">
        <small>${def.eyebrow}</small>
        <h2 id="baseStageTitle">${def.title}</h2>
        <p>${def.fantasy}</p>
      </div>
      <div class="baseStageNext"><small>СЛЕДУЮЩИЙ РУБЕЖ</small><b>${next}</b><span>${def.pressure}</span></div>
    </section>
    <section class="baseStageRail" aria-label="Эволюция бизнеса">${stageRail(def)}</section>
    ${hangarOps}
    <section class="baseStageMetrics">
      <article><small>Станки</small><b>${machines}</b><span>${machines<=1?'Личная мастерская':'Производственная база'}</span></article>
      <article><small>Персонал</small><b>${workers}</b><span>${workers?'Рабочих в системе':'Пока работаешь один'}</span></article>
      <article><small>Транспорт</small><b>${vehicles.length}</b><span>${vehicles.length?vehicles.join(' · '):'Только тележка'}</span></article>
      <article><small>Фронтир</small><b>${currentZone}</b><span>Освоено зон: ${mastered}/8</span></article>
      <article><small>Работа базы</small><b>${queue}${plantLines?` + ${plantLines}`:''}</b><span>${plantLines?'Очередь + линии Plant':'Действий в очереди'}</span></article>
      <article><small>Уровень</small><b>${Number(state.level??1)}</b><span>Свободных очков: ${Number(state.mastery??0)}</span></article>
    </section>
    <section class="baseStagePrinciple"><b>Активный фронтир остаётся главным.</b><span>Рабочие автоматизируют освоенное, но новые зоны, первое открытие и целевой дефицит по-прежнему выгоднее закрывать лично.</span></section>`;
}

function allowedSurfaces(def:BusinessStageDef,state:RuntimeState):Set<BaseSurfaceId>{
  const allowed=new Set<BaseSurfaceId>(def.surfaces);
  // Worker Economy V2 deliberately allows the first hire without Van or a second
  // machine: mastered Z1 + 35k is the real gate. Preserve that rule even if the
  // derived business stage is still Starter Garage.
  const firstWorkerEntryReady=!!state.midgame?.worker?.hired||(Number(state.midgame?.mastery?.z1??0)>=100&&Number(state.cash??0)>=35_000);
  if(firstWorkerEntryReady)allowed.add('crew');
  return allowed;
}

function applyStage(def:BusinessStageDef,state:RuntimeState){
  const garage=document.querySelector<HTMLElement>('#garageScreen'),box=document.querySelector<HTMLElement>('.garageBox');if(!garage||!box)return;
  garage.dataset.businessStage=def.id;box.dataset.businessStage=def.id;
  const header=box.querySelector<HTMLElement>(':scope > header');
  const eyebrow=header?.querySelector<HTMLElement>('small'),title=header?.querySelector<HTMLElement>('h1'),lead=header?.querySelector<HTMLElement>('p');
  if(eyebrow)eyebrow.textContent=def.eyebrow;
  if(title)title.textContent=def.title;
  if(lead)lead.textContent=def.fantasy;

  const allowed=allowedSurfaces(def,state);
  document.querySelectorAll<HTMLButtonElement>('[data-base-surface]').forEach(button=>{
    const surface=button.dataset.baseSurface as BaseSurfaceId;
    button.hidden=!allowed.has(surface);
  });
  for(const surface of PANE_SURFACES){const node=pane(surface);if(node)node.dataset.available=allowed.has(surface)?'true':'false'}
  if(!allowed.has(activeSurface)||activeSurface==='development')activeSurface='overview';
  renderOverview(state,def);
  openSurface(activeSurface);
  lastStageId=def.id;
}

export function refreshBaseShell(){
  if(!installed)return;
  const state=runtimeState();if(!state)return;
  applyStage(businessStage(signalsFromRuntimeState(state)),state);
}

function createPane(surface:BaseSurfaceId):HTMLElement{
  const section=document.createElement('section');section.className=`baseShellPane baseShellPane-${surface}`;section.dataset.basePane=surface;section.hidden=surface!=='overview';return section;
}

function installStructure(){
  const screen=document.querySelector<HTMLElement>('#garageScreen'),box=document.querySelector<HTMLElement>('.garageBox');if(!screen||!box||box.dataset.baseShell==='v1')return false;
  const header=box.querySelector<HTMLElement>(':scope > header'),footer=box.querySelector<HTMLElement>(':scope > footer'),floor=box.querySelector<HTMLElement>(':scope > .floor');
  const equipment=document.querySelector<HTMLElement>('#equipmentPanel'),queue=document.querySelector<HTMLElement>('#queuePanel'),contracts=document.querySelector<HTMLElement>('#contractPanel'),transport=document.querySelector<HTMLElement>('#transportPanel'),workers=document.querySelector<HTMLElement>('#workerPanel'),store=box.querySelector<HTMLElement>('.store');
  if(!header||!footer||!floor||!equipment||!queue||!contracts||!transport||!workers||!store)return false;

  box.dataset.baseShell='v1';box.classList.add('baseShellV1');
  const nav=document.createElement('nav');nav.id='baseShellNav';nav.className='baseShellNav';nav.setAttribute('aria-label','Разделы базы');
  for(const id of Object.keys(SURFACE_LABELS) as BaseSurfaceId[]){const meta=SURFACE_LABELS[id],button=document.createElement('button');button.type='button';button.className='baseShellTab secondary';button.dataset.baseSurface=id;button.innerHTML=`<span>${meta.icon}</span>${meta.label}`;button.setAttribute('aria-selected','false');nav.append(button)}

  const body=document.createElement('div');body.className='baseShellBody';
  const panes=new Map<BaseSurfaceId,HTMLElement>();for(const id of PANE_SURFACES){const node=createPane(id);panes.set(id,node);body.append(node)}
  const overview=panes.get('overview')!;const overviewCard=document.createElement('div');overviewCard.id='baseStageOverview';overviewCard.className='baseStageOverview';overview.append(overviewCard);

  const production=panes.get('production')!;production.append(floor);store.remove();panes.get('storage')!.append(store);
  const management=document.createElement('div');management.className='baseShellManagementGrid';management.append(equipment,queue);production.append(management);
  panes.get('contracts')!.append(contracts);panes.get('logistics')!.append(transport);panes.get('crew')!.append(workers);

  box.querySelectorAll<HTMLElement>(':scope > .managementGrid').forEach(grid=>grid.remove());
  header.insertAdjacentElement('afterend',nav);footer.insertAdjacentElement('beforebegin',body);
  nav.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-base-surface]');if(button&&!button.hidden)openSurface(button.dataset.baseSurface as BaseSurfaceId)});

  try{const saved=sessionStorage.getItem('salvage-base-surface-v1') as BaseSurfaceId|null;if(saved&&PANE_SURFACES.includes(saved))activeSurface=saved}catch{}
  const observer=new MutationObserver(()=>{if(!screen.hidden)refreshBaseShell()});observer.observe(screen,{attributes:true,attributeFilter:['hidden']});
  window.setInterval(()=>{if(!screen.hidden)refreshBaseShell()},1000);
  installed=true;refreshBaseShell();return true;
}

export function installBaseShellV1(){
  if(installStructure())return;
  let attempts=0;const timer=window.setInterval(()=>{attempts++;if(installStructure()||attempts>40)clearInterval(timer)},50);
}

const api:BaseShellApi={refresh:refreshBaseShell,open:openSurface,getStage:()=>lastStageId,getActiveSurface:()=>activeSurface};
Object.assign(globalThis,{__SALVAGE_BASE_SHELL__:api});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installBaseShellV1,{once:true});else queueMicrotask(installBaseShellV1);
