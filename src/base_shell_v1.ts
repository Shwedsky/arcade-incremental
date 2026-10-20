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

function workerCount(state:RuntimeState):number{
  return[
    state.midgame?.worker?.hired,
    state.packB?.secondWorker?.hired,
    state.packC?.crew3?.hired,
    state.packD?.crew4?.hired
  ].filter(Boolean).length;
}

function vehicleNames(state:RuntimeState):string[]{
  const result:string[]=[];
  if(state.midgame?.van?.owned)result.push('Фургон');
  if(state.packB?.truck?.owned)result.push('Грузовик');
  if(state.packD?.recoveryRig?.owned)result.push('Recovery Rig');
  return result;
}

function masteredZoneCount(state:RuntimeState):number{
  return Object.values(state.midgame?.mastery??{}).filter(value=>Number(value)>=99.9).length;
}

function activeQueueCount(state:RuntimeState):number{
  return (state.scheduler?.actions??[]).filter((action:any)=>action?.status==='active'||action?.status==='waiting').length;
}

function pane(surface:BaseSurfaceId){return document.querySelector<HTMLElement>(`[data-base-pane="${surface}"]`)}
function navButton(surface:BaseSurfaceId){return document.querySelector<HTMLButtonElement>(`[data-base-surface="${surface}"]`)}

function openSurface(surface:BaseSurfaceId){
  if(surface==='development'){
    document.querySelector<HTMLButtonElement>('#talentsGarage')?.click();
    return;
  }
  const target=pane(surface);if(!target||target.hidden)return;
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

function renderOverview(state:RuntimeState,def:BusinessStageDef){
  const target=document.querySelector<HTMLElement>('#baseStageOverview');if(!target)return;
  const machines=Array.isArray(state.installed)?state.installed.length:0;
  const workers=workerCount(state),vehicles=vehicleNames(state),mastered=masteredZoneCount(state),queue=activeQueueCount(state);
  const currentZone=String(state.midgame?.currentZone??'z1').toUpperCase();
  const plantLines=Number(state.packE?.plantLines??0);
  const next=def.nextMilestone??'Текущая вершина бизнес-лестницы';
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

function applyStage(def:BusinessStageDef,state:RuntimeState){
  const garage=document.querySelector<HTMLElement>('#garageScreen'),box=document.querySelector<HTMLElement>('.garageBox');if(!garage||!box)return;
  garage.dataset.businessStage=def.id;box.dataset.businessStage=def.id;
  const header=box.querySelector<HTMLElement>(':scope > header');
  const eyebrow=header?.querySelector<HTMLElement>('small'),title=header?.querySelector<HTMLElement>('h1'),lead=header?.querySelector<HTMLElement>('p');
  if(eyebrow)eyebrow.textContent=def.eyebrow;
  if(title)title.textContent=def.title;
  if(lead)lead.textContent=def.fantasy;

  const allowed=new Set(def.surfaces);
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
