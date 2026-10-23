import './production_cells_v1.css';
import {PRODUCTION_PLANS_V1,productionStaffingEffectV1,type IndustrialStockKeyV1,type ProductionCellIdV1,type ProductionPlanIdV1,type ProductionStaffRoleV1} from './production_cells_v1.ts';

type RuntimeApi={
  getState?:()=>any;
  getProductionCellsV1View?:()=>any;
  setProductionCellPlanV1?:(cellId:ProductionCellIdV1,planId:ProductionPlanIdV1)=>boolean;
  startProductionCellV1?:(cellId:ProductionCellIdV1)=>any;
  assignProductionCellWorkerV1?:(workerId:string,cellId:ProductionCellIdV1,role?:ProductionStaffRoleV1)=>boolean;
};

const api=()=> (globalThis as any).__SALVAGE_TEST__ as RuntimeApi|undefined;
const CELL_IDS:ProductionCellIdV1[]=['refining','fabrication','heavy_assembly'];
const ROLE_OPTIONS:ProductionStaffRoleV1[]=['operator','technician','logistician','scavenger'];
const CELL_TITLES:Record<ProductionCellIdV1,{eyebrow:string;title:string;purpose:string}>={
  refining:{eyebrow:'01 · ПОДГОТОВКА МАТЕРИАЛА',title:'Участок подготовки сырья',purpose:'Превращает промышленное сплав-сырьё в усиленный сплав для дорогих сборок.'},
  fabrication:{eyebrow:'02 · МОДУЛЬНАЯ СБОРКА',title:'Сборочный участок',purpose:'Собирает привод, управление и конструкционные секции для заказов и тяжёлых изделий.'},
  heavy_assembly:{eyebrow:'03 · ТЯЖЁЛАЯ СБОРКА',title:'Участок тяжёлой сборки',purpose:'Выпускает силовые модули и тяжёлые рамы — конечный промышленный продукт этого этапа.'}
};
const STOCK_LABELS:Record<IndustrialStockKeyV1,string>={
  alloyScrap:'Сплав-сырьё',reinforcedAlloy:'Усиленный сплав',structuralProfile:'Конструкционный профиль',cleanCopper:'Чистая медь',
  bearing:'Подшипник',motor:'Мотор',hydraulic:'Гидравлика',electronics:'Электроника',pump:'Насос',gearbox:'Редуктор',
  industrialController:'Пром. контроллер',heavyHydraulicCylinder:'Тяжёлый гидроцилиндр',drive:'Приводной модуль',control:'Модуль управления',
  structural:'Конструкционная секция',hydraulicPower:'Гидравлический силовой модуль',heavyFrame:'Тяжёлая рама'
};
const ROLE_LABELS:Record<ProductionStaffRoleV1,string>={none:'Без специалиста',operator:'Оператор',technician:'Техник',logistician:'Логист',scavenger:'Сборщик'};

const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char] as string));
const num=(value:number)=>Number.isInteger(value)?String(value):value.toFixed(1);
const duration=(sec:number)=>sec>=3600?`${(sec/3600).toFixed(1)} ч`:sec>=60?`${Math.ceil(sec/60)} мин`:`${Math.ceil(sec)} сек`;
const rigName=(value?:string|null)=>value?.replace(/Recovery Rig/g,'Тяжёлая эвакуационная платформа')??'Тяжёлая эвакуационная платформа';

function planOptions(cellId:ProductionCellIdV1,selected:ProductionPlanIdV1){
  return Object.values(PRODUCTION_PLANS_V1).filter(plan=>plan.cellId===cellId).map(plan=>`<option value="${plan.id}" ${plan.id===selected?'selected':''}>${esc(plan.label)}</option>`).join('');
}

function stockRows(delta:Record<string,number>|undefined,stock:Record<string,number>,running=false){
  const entries=Object.entries(delta??{}).filter(([,amount])=>Number(amount)>0) as [IndustrialStockKeyV1,number][];
  if(!entries.length)return'<span class="pcEmpty">—</span>';
  return entries.map(([key,need])=>{
    const have=Math.max(0,Number(stock[key]??0)),ok=running||have+1e-9>=need;
    return `<span class="pcMaterial ${ok?'ok':'missing'}"><b>${esc(STOCK_LABELS[key])}</b><em>${running?'зафиксировано':`${num(have)} / ${num(need)}`}</em></span>`;
  }).join('');
}

function outputRows(delta:Record<string,number>|undefined){
  const entries=Object.entries(delta??{}).filter(([,amount])=>Number(amount)>0) as [IndustrialStockKeyV1,number][];
  return entries.map(([key,amount])=>`<span class="pcOutput"><b>${esc(STOCK_LABELS[key])}</b><em>+${num(amount)}</em></span>`).join('')||'<span class="pcEmpty">—</span>';
}

function bottleneckText(cell:any){
  if(cell.status==='running')return`Цикл идёт · осталось ${duration(Number(cell.remainingSec??0))}`;
  if(cell.status==='ready')return'Входы готовы — можно запускать цикл';
  const missing=Object.entries(cell.missing??{}).filter(([,amount])=>Number(amount)>0) as [IndustrialStockKeyV1,number][];
  if(missing.length)return`Не хватает: ${missing.map(([key,amount])=>`${STOCK_LABELS[key]} ${num(amount)}`).join(' · ')}`;
  return'Ячейка ожидает производственный план';
}

function roleEffect(cellId:ProductionCellIdV1,worker:any,role:ProductionStaffRoleV1,baseSec:number){
  if(!worker||role==='none')return{factor:1,text:'Базовая скорость',sec:baseSec};
  const factor=productionStaffingEffectV1(cellId,role,Number(worker.rank??1)),gain=Math.max(0,Math.round((1-factor)*100));
  return{factor,text:gain?`${ROLE_LABELS[role]}: ${gain}% быстрее`:`${ROLE_LABELS[role]}: без бонуса этой ячейке`,sec:baseSec*factor};
}

function workerOptions(state:any,assignedId:string|null){
  const workers=Array.isArray(state?.workforceV3?.workers)?state.workforceV3.workers:[];
  return `<option value="">Без назначения</option>${workers.map((worker:any)=>`<option value="${esc(worker.id)}" ${worker.id===assignedId?'selected':''}>${esc(worker.name)} · ур. ${Number(worker.rank??1)} · ${esc(ROLE_LABELS[worker.role as ProductionStaffRoleV1]??worker.role)}</option>`).join('')}`;
}

function heavySupportMarkup(cell:any,freeSupport:any){
  if(cell.id!=='heavy_assembly')return'';
  const jobSupport=cell.job?.support;
  if(jobSupport?.kind==='recovery_rig'){
    const gain=Math.round((1-Number(jobSupport.durationFactor??1))*100);
    return `<div class="pcHeavySupport active"><small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${esc(rigName(jobSupport.vehicleName))} поддержала запуск</b><span>Погрузка и позиционирование тяжёлых узлов: <strong>−${gain}% к циклу</strong>. Бонус закреплён за текущим циклом.</span></div>`;
  }
  if(freeSupport?.kind==='recovery_rig'){
    const gain=Math.round((1-Number(freeSupport.durationFactor??1))*100);
    return `<div class="pcHeavySupport ready"><small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${esc(rigName(freeSupport.vehicleName))} свободна</b><span>Следующий цикл тяжёлой сборки получит <strong>−${gain}% к времени</strong> за тяжёлую подачу и позиционирование.</span></div>`;
  }
  return '<div class="pcHeavySupport unavailable"><small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>Тяжёлая эвакуационная платформа недоступна</b><span>Машина на маршруте или ещё не в парке. Тяжёлая сборка работает без бонуса подачи.</span></div>';
}

function cellMarkup(cell:any,stock:Record<string,number>,state:any,heavySupport:any){
  const id=cell.id as ProductionCellIdV1,meta=CELL_TITLES[id],plan=cell.selectedPlan,job=cell.job,assigned=cell.assignedWorker;
  const assignedWorker=(state?.workforceV3?.workers??[]).find((worker:any)=>worker.id===assigned?.workerId)??null;
  const role=(assigned?.role??assignedWorker?.role??'none') as ProductionStaffRoleV1;
  const effect=roleEffect(id,assignedWorker,role,Number(plan.baseDurationSec??0));
  const progress=Math.max(0,Math.min(100,Math.round(Number(cell.progress??0)*100)));
  const activeStaff=job?.staffing?.workerName?`${job.staffing.workerName} · ${ROLE_LABELS[job.staffing.role as ProductionStaffRoleV1]??job.staffing.role}`:assigned?.workerName?`${assigned.workerName} · ${ROLE_LABELS[role]}`:'Без специалиста';
  return `<article class="productionCellCard status-${cell.status}" data-production-cell="${id}">
    <header><div><small>${meta.eyebrow}</small><h3>${meta.title}</h3><p>${meta.purpose}</p></div><span class="pcStatus" data-pc-status>${cell.status==='running'?'РАБОТАЕТ':cell.status==='ready'?'ГОТОВА':'НУЖНЫ ВХОДЫ'}</span></header>
    <div class="pcPlanRow"><label>План<select data-pc-plan="${id}" ${job?'disabled':''}>${planOptions(id,plan.id)}</select></label><div class="pcTiming"><small>Цикл</small><b>${duration(job?Math.max(0,(job.endsAt-job.startedAt)/1000):effect.sec)}</b><span>${job?activeStaff:effect.text}</span></div></div>
    <div class="pcFlow"><section><small>ВХОДЫ</small><div data-pc-inputs>${stockRows(job?.inputs??plan.inputs,stock,!!job)}</div></section><i>→</i><section><small>ВЫХОД</small><div>${outputRows(job?.outputs??plan.outputs)}</div></section></div>
    <div class="pcStaff"><label>Специалист<select data-pc-worker="${id}" ${job?'disabled':''}>${workerOptions(state,assigned?.workerId??null)}</select></label><label>Роль<select data-pc-role="${id}" ${job?'disabled':''}>${ROLE_OPTIONS.map(item=>`<option value="${item}" ${item===role?'selected':''}>${ROLE_LABELS[item]}</option>`).join('')}</select></label><button class="secondary" data-pc-assign="${id}" ${job?'disabled':''}>Назначить</button></div>
    ${heavySupportMarkup(cell,heavySupport)}
    <div class="pcBottleneck ${cell.status==='blocked'?'warn':'ok'}" data-pc-bottleneck><small>${cell.status==='blocked'?'УЗКОЕ МЕСТО':'СОСТОЯНИЕ'}</small><b>${esc(bottleneckText(cell))}</b></div>
    ${job?`<div class="pcProgress" data-pc-progress><i><em style="width:${progress}%"></em></i><span>${progress}% · ${duration(Number(cell.remainingSec??0))}</span></div>`:''}
    <footer><span>${job?'Входы уже списаны и закреплены за этим циклом. Повторно другой ячейкой они не тратятся.':'Запуск сразу фиксирует входы за циклом — скрытого двойного расхода нет.'}</span><button data-pc-start="${id}" ${cell.status!=='ready'?'disabled':''}>${job?'В работе':'Запустить цикл'}</button></footer>
  </article>`;
}

function summaryMarkup(view:any){
  const running=(view.cells??[]).filter((cell:any)=>cell.status==='running').length,blocked=(view.cells??[]).filter((cell:any)=>cell.status==='blocked').length;
  const outputs=(view.cells??[]).reduce((sum:number,cell:any)=>sum+Number(cell.job?1:0),0);
  return `<section class="pcSummary"><div><small>ПРОМЫШЛЕННАЯ МАСТЕРСКАЯ · 3 ПРОИЗВОДСТВЕННЫХ УЧАСТКА</small><h2>Производственный диспетчер</h2><p>Три понятных участка вместо россыпи промышленных кнопок. Выбери план, назначь человека и запускай параллельные цепочки.</p></div><div class="pcSummaryMetrics"><span><small>Участки</small><b>3</b></span><span><small>Работают</small><b data-pc-summary="running">${running}</b></span><span><small>Заблокированы</small><b data-pc-summary="blocked">${blocked}</b></span><span><small>Активных циклов</small><b data-pc-summary="active">${outputs}</b></span></div></section>`;
}

function ensureRoot(){
  const pane=document.querySelector<HTMLElement>('[data-base-pane="production"]');if(!pane)return null;
  let root=pane.querySelector<HTMLElement>('#productionCellsV1Root');
  if(!root){root=document.createElement('section');root.id='productionCellsV1Root';root.className='productionCellsV1Root';pane.prepend(root)}
  return root;
}

function managementStructureSignature(view:any,state:any){
  return JSON.stringify({
    cells:(view?.cells??[]).map((cell:any)=>({id:cell.id,plan:cell.selectedPlan?.id,job:cell.job?.id??null,worker:cell.assignedWorker?.workerId??null,role:cell.assignedWorker?.role??null})),
    workers:(state?.workforceV3?.workers??[]).map((worker:any)=>[worker.id,worker.rank,worker.role,worker.status,worker.routeId,worker.productionCellId]),
    heavySupport:view?.heavySupport?{kind:view.heavySupport.kind,vehicleId:view.heavySupport.vehicleId,vehicleName:view.heavySupport.vehicleName}:null
  });
}

function updateManagementLive(view:any,state:any,root:HTMLElement){
  const running=(view.cells??[]).filter((cell:any)=>cell.status==='running').length,blocked=(view.cells??[]).filter((cell:any)=>cell.status==='blocked').length,active=(view.cells??[]).filter((cell:any)=>!!cell.job).length;
  const putSummary=(name:string,value:number)=>{const el=root.querySelector<HTMLElement>(`[data-pc-summary="${name}"]`);if(el)el.textContent=String(value)};
  putSummary('running',running);putSummary('blocked',blocked);putSummary('active',active);
  for(const id of CELL_IDS){
    const cell=view.cells.find((item:any)=>item.id===id),card=root.querySelector<HTMLElement>(`[data-production-cell="${id}"]`);if(!cell||!card)continue;
    card.classList.remove('status-running','status-ready','status-blocked');card.classList.add(`status-${cell.status}`);
    const status=card.querySelector<HTMLElement>('[data-pc-status]');if(status)status.textContent=cell.status==='running'?'РАБОТАЕТ':cell.status==='ready'?'ГОТОВА':'НУЖНЫ ВХОДЫ';
    const inputs=card.querySelector<HTMLElement>('[data-pc-inputs]');if(inputs)inputs.innerHTML=stockRows(cell.job?.inputs??cell.selectedPlan.inputs,view.stock,!!cell.job);
    const bottleneck=card.querySelector<HTMLElement>('[data-pc-bottleneck]');if(bottleneck){bottleneck.classList.toggle('warn',cell.status==='blocked');bottleneck.classList.toggle('ok',cell.status!=='blocked');const small=bottleneck.querySelector('small');if(small)small.textContent=cell.status==='blocked'?'УЗКОЕ МЕСТО':'СОСТОЯНИЕ';const label=bottleneck.querySelector('b');if(label)label.textContent=bottleneckText(cell)}
    const progress=card.querySelector<HTMLElement>('[data-pc-progress]');if(progress&&cell.job){const pct=Math.max(0,Math.min(100,Math.round(Number(cell.progress??0)*100)));const bar=progress.querySelector<HTMLElement>('em');if(bar)bar.style.width=`${pct}%`;const label=progress.querySelector<HTMLElement>('span');if(label)label.textContent=`${pct}% · ${duration(Number(cell.remainingSec??0))}`}
    const start=card.querySelector<HTMLButtonElement>(`[data-pc-start="${id}"]`);if(start)start.disabled=cell.status!=='ready';
  }
}

function renderManagement(){
  const runtime=api(),state=runtime?.getState?.(),view=runtime?.getProductionCellsV1View?.(),root=ensureRoot();if(!root)return;
  const industrial=!!state?.packD?.industrialWorkshopOwned;
  root.hidden=!industrial;if(!industrial)return;
  const signature=managementStructureSignature(view,state);
  if(root.dataset.signature!==signature){root.dataset.signature=signature;root.innerHTML=`${summaryMarkup(view)}<div class="productionCellGrid">${CELL_IDS.map(id=>cellMarkup(view.cells.find((cell:any)=>cell.id===id),view.stock,state,view.heavySupport)).join('')}</div><section class="pcSupport"><b>Вспомогательная мастерская</b><span>Старые станки и очередь мастерской ниже остаются обслуживающим контуром. Основные производственные решения теперь принимаются на этих трёх участках.</span></section>`}
  updateManagementLive(view,state,root);
}

function sceneCell(cell:any){
  const id=cell.id as ProductionCellIdV1,meta=CELL_TITLES[id],job=cell.job;
  return `<section class="industrialLiveCell ${id} ${cell.status}" data-industrial-scene-cell="${id}"><header><small>${meta.eyebrow}</small><b>${meta.title}</b><span>${cell.status==='running'?'РАБОТАЕТ':cell.status==='ready'?'ГОТОВА':'СТОП'}</span></header><div class="industrialMachine"><i></i><i></i><i></i></div><p data-industrial-cell-live="${id}">${job?`${esc(job.outputs&&Object.keys(job.outputs).map(key=>STOCK_LABELS[key as IndustrialStockKeyV1]).join(' + '))} · ${duration(Number(cell.remainingSec??0))}`:esc(bottleneckText(cell))}</p></section>`;
}

function heavyGateMarkup(view:any){
  const heavy=view.cells?.find((cell:any)=>cell.id==='heavy_assembly'),jobSupport=heavy?.job?.support;
  const support=jobSupport?.kind==='recovery_rig'?jobSupport:view.heavySupport;
  if(support?.kind==='recovery_rig'){
    const gain=Math.round((1-Number(support.durationFactor??1))*100),active=jobSupport?.kind==='recovery_rig';
    return `<div class="industrialHeavyGate active"><b>ТЯЖЁЛЫЙ ШЛЮЗ · ${esc(rigName(support.vehicleName))}</b><span>${active?'поддержала текущий цикл':'готова к тяжёлой подаче'} · −${gain}%</span></div>`;
  }
  return '<div class="industrialHeavyGate"><b>ТЯЖЁЛЫЙ ШЛЮЗ</b><span>Тяжёлая эвакуационная платформа недоступна</span></div>';
}

function sceneStructureSignature(view:any,state:any){
  const heavy=view.cells.find((cell:any)=>cell.id==='heavy_assembly');
  return JSON.stringify({cells:view.cells.map((cell:any)=>({id:cell.id,status:cell.status,plan:cell.selectedPlan?.id,job:cell.job?.id??null,worker:cell.assignedWorker?.workerId})),workers:state.workforceV3?.workers?.length,fleet:state.workforceV3?.fleet?.length,heavySupport:view.heavySupport,heavyJobSupport:heavy?.job?.support});
}

function updateIndustrialSceneLive(scene:HTMLElement,view:any,state:any){
  const running=view.cells.filter((cell:any)=>cell.status==='running').length,summary=scene.querySelector<HTMLElement>('[data-industrial-summary-live]');if(summary)summary.textContent=`${running}/3 участков работают · ${(state.workforceV3?.workers??[]).filter((w:any)=>w.status==='production').length} сотруд. в производстве`;
  for(const cell of view.cells){const live=scene.querySelector<HTMLElement>(`[data-industrial-cell-live="${cell.id}"]`);if(live)live.textContent=cell.job?`${cell.job.outputs&&Object.keys(cell.job.outputs).map((key:string)=>STOCK_LABELS[key as IndustrialStockKeyV1]).join(' + ')} · ${duration(Number(cell.remainingSec??0))}`:bottleneckText(cell)}
}

function renderIndustrialScene(){
  const runtime=api(),state=runtime?.getState?.(),view=runtime?.getProductionCellsV1View?.();if(!state?.packD?.industrialWorkshopOwned||state?.packE?.processingPlantOwned||!view)return;
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2.stage-industrial');if(!scene)return;
  const signature=sceneStructureSignature(view,state);
  if(scene.dataset.p5Signature!==signature||!scene.querySelector('[data-industrial-workshop-live]')){
    scene.dataset.p5Signature=signature;
    const running=view.cells.filter((cell:any)=>cell.status==='running').length;
    scene.innerHTML=`<div class="baseSceneLabel"><b>Промышленная мастерская · Производственный цех</b><span data-industrial-summary-live>${running}/3 участков работают · ${(state.workforceV3?.workers??[]).filter((w:any)=>w.status==='production').length} сотруд. в производстве</span></div><div class="industrialWorkshopLive" data-industrial-workshop-live><div class="industrialRoof"><i></i><i></i><i></i><span>МОСТОВОЙ КРАН · ЗОНА ТЯЖЁЛОЙ СБОРКИ</span></div><div class="industrialInputStage"><b>ВХОДЯЩИЙ МАТЕРИАЛ</b><span>профиль · сплав-сырьё · восстановленные узлы</span><i></i><i></i><i></i></div><div class="industrialLiveGrid">${CELL_IDS.map(id=>sceneCell(view.cells.find((cell:any)=>cell.id===id))).join('')}</div><div class="industrialOutputStage"><b>ГОТОВАЯ ПРОДУКЦИЯ</b><span>модули · силовые сборки · тяжёлые рамы</span><i></i><i></i></div>${heavyGateMarkup(view)}</div>`;
  }
  updateIndustrialSceneLive(scene,view,state);
}

addEventListener('change',event=>{
  const target=event.target as HTMLSelectElement;
  if(target.matches('[data-pc-plan]'))api()?.setProductionCellPlanV1?.(target.dataset.pcPlan as ProductionCellIdV1,target.value as ProductionPlanIdV1);
},true);
addEventListener('click',event=>{
  const target=event.target as HTMLElement,start=target.closest<HTMLButtonElement>('[data-pc-start]'),assign=target.closest<HTMLButtonElement>('[data-pc-assign]');
  if(start?.dataset.pcStart){api()?.startProductionCellV1?.(start.dataset.pcStart as ProductionCellIdV1);setTimeout(renderManagement,0);return}
  if(assign?.dataset.pcAssign){const id=assign.dataset.pcAssign as ProductionCellIdV1,worker=document.querySelector<HTMLSelectElement>(`[data-pc-worker="${id}"]`),role=document.querySelector<HTMLSelectElement>(`[data-pc-role="${id}"]`);if(worker?.value)api()?.assignProductionCellWorkerV1?.(worker.value,id,(role?.value??'operator') as ProductionStaffRoleV1);setTimeout(renderManagement,0)}
},true);

function tick(){renderManagement();renderIndustrialScene()}
setInterval(tick,350);queueMicrotask(tick);
