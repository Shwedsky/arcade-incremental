import './v3_a_clarity.css';
import {BUSINESS_STAGES,type BusinessStageId} from './business_stage.ts';
import {baseStoragePressureV1} from './base_storage_v1.ts';
import {BRANCHES,TALENTS,type BranchId,type TalentId,type TalentMilestone} from './progression.ts';
import {PRODUCTION_PLANS_V1,productionStaffingEffectV1,type ProductionCellIdV1,type ProductionPlanIdV1,type ProductionStaffRoleV1} from './production_cells_v1.ts';

const api=()=>((globalThis as any).__SALVAGE_TEST__??null);
const shell=()=>((globalThis as any).__SALVAGE_BASE_SHELL__??null);
const state=()=>{try{return api()?.getState?.()??null}catch{return null}};

const STAGE_IDS=new Set(Object.keys(BUSINESS_STAGES));
const BRANCH_ORDER=Object.keys(BRANCHES) as BranchId[];
const ROLE_LABELS:Record<string,string>={none:'Без специалиста',operator:'Оператор',technician:'Техник',logistician:'Логист',scavenger:'Сборщик'};
const ZONE_ORDER=['z1','z2','z3','z4','z5','z6','z7','z8'] as const;

type ZoneIdV3=typeof ZONE_ORDER[number];

function businessStageId(s:any):BusinessStageId{
  const raw=String(s?.businessStage??'');
  return STAGE_IDS.has(raw)?raw as BusinessStageId:'starter_garage';
}

function businessEra(stage:BusinessStageId){
  if(stage==='processing_plant')return'plant';
  if(stage==='industrial_workshop')return'industrial';
  if(stage==='salvage_yard')return'yard';
  if(stage==='hangar')return'hangar';
  return'garage';
}

function knownZoneCount(stage:BusinessStageId):number{
  const era=businessEra(stage);
  return era==='garage'?3:era==='hangar'?5:era==='yard'?6:era==='industrial'?7:8;
}

function visibleTalentDepth(stage:BusinessStageId):number{
  const era=businessEra(stage);
  return era==='garage'?4:era==='hangar'?6:8;
}

function fmtDuration(sec:number):string{
  const safe=Math.max(0,Math.round(Number(sec)||0));
  const h=Math.floor(safe/3600),m=Math.floor((safe%3600)/60),s=safe%60;
  if(h>0)return`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return`${m}:${String(s).padStart(2,'0')}`;
}

function milestoneMet(s:any,milestone:TalentMilestone|undefined):boolean{
  if(!milestone)return true;
  if(milestone==='van')return !!s?.midgame?.van?.owned;
  if(milestone==='first_worker')return !!s?.midgame?.worker?.hired||Number(s?.workforceV3?.workers?.length??0)>0;
  if(milestone==='hangar')return !!s?.packB?.hangarOwned;
  if(milestone==='salvage_yard')return !!s?.packC?.salvageYardOwned;
  return !!s?.packD?.industrialWorkshopOwned;
}

function talentReason(s:any,talent:any,owned:Set<TalentId>,points:number):string{
  if(talent.requires&&!owned.has(talent.requires))return'Сначала открой предыдущий узел';
  if(Number(s?.level??1)<talent.minLevel)return`Нужен уровень ${talent.minLevel}`;
  if(!milestoneMet(s,talent.milestone))return'Нужен следующий этап бизнеса';
  if(points<talent.pointCost)return`Нужно очков: ${talent.pointCost}`;
  return'Можно изучить';
}

function renderTalentTree(){
  const root=document.querySelector<HTMLElement>('#talentBranches');
  const screen=document.querySelector<HTMLElement>('#talentScreen');
  const s=state();if(!root||!screen||screen.hidden||!s)return;
  const stage=businessStageId(s),depth=visibleTalentDepth(stage),owned=new Set<TalentId>((s.talents??[]) as TalentId[]),points=Number(s.mastery??0);
  const signature=JSON.stringify([stage,depth,points,[...owned].sort()]);
  if(root.dataset.v3aSignature===signature&&root.querySelector('[data-v3-tree-root]'))return;

  const branches=BRANCH_ORDER.map(branch=>{
    const meta=BRANCHES[branch],nodes=TALENTS.filter(t=>t.branch===branch).sort((a,b)=>a.tier-b.tier).slice(0,depth);
    const firstLocked=nodes.findIndex(t=>!owned.has(t.id));
    const frontier=firstLocked<0?nodes.length:firstLocked;
    const nodeMarkup=nodes.map((talent,index)=>{
      const unlocked=owned.has(talent.id);
      const revealed=unlocked||index===frontier;
      if(!revealed)return`<div class="v3TalentNode unknown" aria-label="Неизвестный талант"><span>?</span><small>Неизвестно</small></div>`;
      const reason=unlocked?'Изучено':talentReason(s,talent,owned,points);
      const available=!unlocked&&reason==='Можно изучить';
      return`<button class="v3TalentNode ${unlocked?'unlocked':available?'available':'locked'}" ${unlocked||!available?'disabled':''} data-talent="${talent.id}"><span>${unlocked?'✓':talent.tier}</span><div><b>${talent.name}</b><small>${talent.description}</small><em>${unlocked?'Изучено':reason}</em></div></button>`;
    }).join('<i class="v3TalentLink"></i>');
    return`<section class="v3TalentBranch" data-v3-branch="${branch}"><header><strong>${meta.name}</strong><small>${meta.fantasy}</small></header><div class="v3TalentSpoke">${nodeMarkup}</div></section>`;
  }).join('');

  const era=businessEra(stage),nextRing=depth<8?(era==='garage'?'Следующее кольцо откроется после перехода бизнеса в Ангар':'Следующее кольцо откроется на более крупном этапе бизнеса'):'Открыта текущая максимальная глубина дерева';
  root.className='talentBranches v3TalentTree';
  root.dataset.v3aSignature=signature;
  root.innerHTML=`<div class="v3TalentTreeRoot" data-v3-tree-root><div class="v3TalentCore"><small>ТЕКУЩАЯ ЭРА</small><b>${BUSINESS_STAGES[stage].shortTitle}</b><span>${points} свободн. оч.</span><em>${nextRing}</em></div>${branches}</div>`;
  const summary=document.querySelector<HTMLElement>('#talentSummary');
  if(summary)summary.textContent=`Уровень ${Number(s.level??1)} · свободных очков: ${points}. Видны изученные таланты и только следующий выбор каждой ветки.`;
}

function applyMapFog(){
  const root=document.querySelector<HTMLElement>('#zoneGrid');
  const screen=document.querySelector<HTMLElement>('#zoneScreen');
  const s=state();if(!root||!screen||screen.hidden||!s)return;
  const cards=Array.from(root.querySelectorAll<HTMLElement>('.zoneCard[data-zone]'));
  if(cards.length<8)return; // act only on the canonical full render
  const stage=businessStageId(s);
  let known=knownZoneCount(stage);
  // Fog must never hide a frontier the canonical progression has already made playable.
  // This preserves transitions such as Z4 -> Hangar while still concealing locked future zones.
  while(known<cards.length){
    const nextButton=cards[known].querySelector<HTMLButtonElement>('button');
    if(!nextButton||nextButton.disabled)break;
    known++;
  }
  const visible=cards.slice(0,known).map(card=>card.cloneNode(true) as HTMLElement);
  root.replaceChildren(...visible);
  root.classList.add('v3ZoneFog');
  if(known<8){
    const unknown=document.createElement('article');unknown.className='zoneCard v3UnknownZone locked';unknown.dataset.v3Unknown=ZONE_ORDER[known];
    unknown.innerHTML=`<span class="zoneNumber">СЛЕДУЮЩИЙ ФРОНТИР</span><h3>?</h3><p>Новая территория станет известна после расширения бизнеса.</p><div class="v3UnknownRoute">···</div><span class="gateText">Сначала достигни предела текущего этапа</span><button disabled>Неизвестно</button>`;
    root.append(unknown);
  }
  root.dataset.v3aMapStage=stage;
}

function productionSummary(s:any){
  const view=api()?.getProductionCellsV1View?.();
  if(view?.cells?.length){
    const running=view.cells.filter((c:any)=>c.status==='running').length,blocked=view.cells.filter((c:any)=>c.status==='blocked').length;
    const blockedCell=view.cells.find((c:any)=>c.status==='blocked');
    return{main:`${running}/${view.cells.length} участков работают`,detail:blocked?`${blocked} заблокировано${blockedCell?.selectedPlan?.label?` · ${blockedCell.selectedPlan.label}`:''}`:'Нет производственных блокировок'};
  }
  const actions=(s.scheduler?.actions??[]).filter((a:any)=>a?.status==='active'||a?.status==='waiting');
  return{main:actions.length?`${actions.length} задач в очереди`:'Производство свободно',detail:actions.length?'Открой производство, чтобы проверить следующий цикл':'Можно запустить нужную переработку'};
}

function guidance(s:any,stage:BusinessStageId){
  const mastery=s.midgame?.mastery??{},installed=new Set<string>(s.installed??[]),workers=s.workforceV3?.workers??[],fleet=s.workforceV3?.fleet??[];
  if(businessEra(stage)==='garage'){
    if(Number(mastery.z1??0)<100)return{problem:'Ты ещё осваиваешь первую свалку',action:'Доведи Z1 до 100%',why:'Открывается стабильная ранняя база ресурсов и следующий шаг карты.',milestone:'Garage · освоить Z1–Z3'};
    if(!installed.has('press')||!installed.has('wire'))return{problem:'Сырьё почти не перерабатывается',action:'Развивай станки Garage',why:'Переработанные материалы нужны для оборудования, контрактов и выхода к Z3.',milestone:'Garage · рабочая мастерская'};
    if(Number(mastery.z3??0)<100)return{problem:'Текущий фронтир Garage ещё не освоен',action:'Продолжай Z3',why:'Z3 — последний полноценный фронтир первой эры.',milestone:'Подготовка к Hangar'};
    return{problem:'Garage практически исчерпан',action:'Закрой оставшиеся требования этапа',why:'Следующий крупный скачок — переход в Hangar с более сильным baseline.',milestone:'Garage → Hangar'};
  }
  const idle=workers.filter((w:any)=>w.status==='idle').length,freeVehicles=fleet.filter((v:any)=>!v.routeId).length;
  if(idle&&freeVehicles)return{problem:'Есть свободные люди и транспорт',action:'Запусти маршрут на освоенную зону',why:'Старый контент должен снабжать бизнес без ручного повторного фарма.',milestone:BUSINESS_STAGES[stage].nextMilestone??'Оптимизация бизнеса'};
  const prod=productionSummary(s);return{problem:prod.detail,action:'Проверь производство и текущий фронтир',why:'Ищи реальное узкое место: сырьё, маршрут, сотрудника или активную добычу.',milestone:BUSINESS_STAGES[stage].nextMilestone??'Оптимизация бизнеса'};
}

function renderOverview(){
  const pane=document.querySelector<HTMLElement>('[data-base-pane="overview"]');
  const s=state();if(!pane||pane.hidden||!s)return;
  const stage=businessStageId(s),storage=baseStoragePressureV1(stage,s.storage),prod=productionSummary(s),guide=guidance(s,stage);
  const workers=s.workforceV3?.workers??[],fleet=s.workforceV3?.fleet??[],routes=s.workforceV3?.routes??[];
  const idleWorkers=workers.filter((w:any)=>w.status==='idle').length,idleFleet=fleet.filter((v:any)=>!v.routeId).length;
  const currentZone=String(s.midgame?.currentZone??'z1').toUpperCase(),cargo=Number(s.cart??0),capacity=Number(s.capacity??0);
  const signature=JSON.stringify([stage,currentZone,Math.round(cargo),Math.round(storage.storedKg),prod.main,workers.length,fleet.length,routes.length,Number(s.mastery??0),Number(s.contract?.completed??0),guide.problem]);
  let root=pane.querySelector<HTMLElement>('#v3AOverview');
  if(root?.dataset.signature===signature)return;
  if(!root){root=document.createElement('section');root.id='v3AOverview';root.className='v3AOverview';pane.append(root)}
  root.dataset.signature=signature;
  root.innerHTML=`
    <header class="v3AOverviewHead"><div><small>V3 · ОБЗОР КОМПАНИИ</small><h2>${BUSINESS_STAGES[stage].title}</h2><p>Короткое состояние всех доступных систем. Детали остаются в профильных вкладках.</p></div><div><small>Следующий рубеж</small><b>${BUSINESS_STAGES[stage].nextMilestone??'Текущая вершина'}</b></div></header>
    <div class="v3OverviewGrid">
      <button data-v3-open="production"><small>ПРОИЗВОДСТВО</small><b>${prod.main}</b><span>${prod.detail}</span></button>
      <button data-v3-open="storage"><small>СКЛАД</small><b>${Math.round(storage.storedKg)} / ${storage.capacityKg} кг</b><span>${Math.round(storage.loadRatio*100)}% заполнено · свободно ${Math.round(storage.freeKg)} кг</span></button>
      <button data-v3-open="contracts"><small>КОНТРАКТЫ</small><b>${Number(s.contract?.completed??0)} выполнено</b><span>Открой доску для текущих заказов и денежного выхода продукции.</span></button>
      <button data-v3-open="development"><small>РАЗВИТИЕ</small><b>${Number(s.mastery??0)} свободн. оч.</b><span>В каждой ветке показан только ближайший известный выбор.</span></button>
      <article><small>ЭКСПЕДИЦИЯ</small><b>${currentZone} · ${Math.round(cargo)} / ${Math.round(capacity)} кг</b><span>${cargo>0?'В тележке есть текущая добыча':'Грузовой буфер сейчас пуст'}</span></article>
      <article><small>ПЕРСОНАЛ / ЛОГИСТИКА</small><b>${workers.length} чел. · ${fleet.length} машин</b><span>${routes.length} маршрутов · свободно ${idleWorkers} чел. / ${idleFleet} машин</span></article>
    </div>
    <section class="v3NowCard"><small>ЧТО ДЕЛАТЬ СЕЙЧАС?</small><div><b>${guide.problem}</b><strong>${guide.action}</strong><span>${guide.why}</span><em>Следующая цель: ${guide.milestone}</em></div></section>`;
}

function updateStaffingEta(){
  const s=state(),view=api()?.getProductionCellsV1View?.();if(!s||!view?.cells)return;
  for(const card of Array.from(document.querySelectorAll<HTMLElement>('[data-production-cell]'))){
    const cellId=card.dataset.productionCell as ProductionCellIdV1,cell=view.cells.find((c:any)=>c.id===cellId);if(!cell)continue;
    const timing=card.querySelector<HTMLElement>('.pcTiming');if(!timing)continue;
    const planSelect=card.querySelector<HTMLSelectElement>(`[data-pc-plan="${cellId}"]`),workerSelect=card.querySelector<HTMLSelectElement>(`[data-pc-worker="${cellId}"]`),roleSelect=card.querySelector<HTMLSelectElement>(`[data-pc-role="${cellId}"]`);
    const planId=(planSelect?.value||cell.selectedPlan?.id) as ProductionPlanIdV1,plan=PRODUCTION_PLANS_V1[planId];if(!plan)continue;
    if(cell.job){
      const actual=Math.max(1,(Number(cell.job.endsAt)-Number(cell.job.startedAt))/1000),remaining=Math.max(0,(Number(cell.job.endsAt)-Date.now())/1000),staff=cell.job.staffing;
      timing.dataset.v3aEta='running';
      timing.innerHTML=`<small>Фактический цикл</small><b>${fmtDuration(actual)}</b><span>Осталось ${fmtDuration(remaining)}${staff?.workerName?` · ${staff.workerName} / ${ROLE_LABELS[staff.role]??staff.role}`:''}</span>`;
      continue;
    }
    const workerId=workerSelect?.value??'',worker=(s.workforceV3?.workers??[]).find((w:any)=>w.id===workerId),role=(roleSelect?.value??worker?.role??'none') as ProductionStaffRoleV1,rank=Math.max(1,Number(worker?.rank??1));
    const factor=productionStaffingEffectV1(cellId,role,rank),adjusted=plan.baseDurationSec*factor,gain=Math.max(0,Math.round((1-factor)*100));
    timing.dataset.v3aEta='preview';
    timing.dataset.baseSec=String(plan.baseDurationSec);timing.dataset.adjustedSec=String(Math.round(adjusted));
    timing.innerHTML=`<small>Цикл</small><b>${fmtDuration(plan.baseDurationSec)}${gain?` → ${fmtDuration(adjusted)}`:''}</b><span>${worker?`${worker.name} · ${ROLE_LABELS[role]??role} ур. ${rank}${gain?` · −${gain}%`:' · без профильного бонуса'}`:'Без специалиста · базовое время'}</span>`;
  }
}

function tick(){renderOverview();renderTalentTree();applyMapFog();updateStaffingEta()}

addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLElement>('[data-v3-open]');if(!button)return;
  const surface=button.dataset.v3Open;if(surface)shell()?.open?.(surface);
},true);
addEventListener('change',event=>{
  const target=event.target as HTMLElement;if(target.matches('[data-pc-plan],[data-pc-worker],[data-pc-role]'))setTimeout(updateStaffingEta,0);
},true);

setInterval(tick,250);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else queueMicrotask(tick);