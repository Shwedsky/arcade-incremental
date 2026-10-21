import './industrial_visual_baseline_v1.css';

type ProductionCellId='refining'|'fabrication'|'heavy_assembly';
type RuntimeState=Record<string,any>;

const api=()=> (globalThis as any).__SALVAGE_TEST__??null;
const CELL_IDS:ProductionCellId[]=['refining','fabrication','heavy_assembly'];
const CELL_META:Record<ProductionCellId,{title:string;short:string;role:string}>={
  refining:{title:'Участок подготовки сырья',short:'Сырьё',role:'Сортировка и переработка лома'},
  fabrication:{title:'Сборочный участок',short:'Сборка',role:'Детали, модули и узлы'},
  heavy_assembly:{title:'Участок тяжёлой сборки',short:'Тяжёлая',role:'Крупные узлы и тяжёлые рамы'}
};
const ROLE_LABELS:Record<string,string>={operator:'Оператор',technician:'Техник',logistician:'Логист',scavenger:'Сборщик',none:'Без специалиста'};
const STATUS_LABELS:Record<string,string>={running:'РАБОТАЕТ',ready:'ГОТОВ К ЗАПУСКУ',blocked:'НЕТ ВХОДОВ',idle:'ПРОСТОЙ'};

const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] as string));
const duration=(sec:number)=>sec>=3600?`${(sec/3600).toFixed(1)} ч`:sec>=60?`${Math.ceil(sec/60)} мин`:`${Math.ceil(sec)} сек`;
const rigName=(value?:string|null)=>String(value??'Тяжёлая эвакуационная платформа').replace(/Recovery Rig/g,'Тяжёлая эвакуационная платформа');

function machineMarkup(id:ProductionCellId){
  if(id==='refining')return `<div class="ivMachine ivRefiningMachine" aria-hidden="true"><i class="ivScrapPile"></i><i class="ivHopper"></i><i class="ivConveyor"><em></em></i><i class="ivSortBin bin-a"></i><i class="ivSortBin bin-b"></i></div>`;
  if(id==='fabrication')return `<div class="ivMachine ivFabricationMachine" aria-hidden="true"><i class="ivPartsRack"><em></em><em></em><em></em></i><i class="ivWorkbench"><em></em></i><i class="ivToolPress"></i><i class="ivPartsTray"></i></div>`;
  return `<div class="ivMachine ivHeavyMachine" aria-hidden="true"><i class="ivGantry"><em></em></i><i class="ivHook"></i><i class="ivHeavyPlatform"><em></em><em></em></i><i class="ivWeldGlow"></i></div>`;
}

function workerMarkup(cell:any){
  const workerName=cell.job?.staffing?.workerName??cell.assignedWorker?.workerName;
  const role=cell.job?.staffing?.role??cell.assignedWorker?.role??'none';
  if(!workerName)return `<div class="ivWorkerSpot empty"><i></i><span>Свободный пост</span></div>`;
  return `<div class="ivWorkerSpot ${cell.status==='running'?'working':'assigned'}"><i><em></em></i><span><b>${esc(workerName)}</b>${esc(ROLE_LABELS[role]??role)}</span></div>`;
}

function cellMarkup(cell:any){
  const id=cell.id as ProductionCellId,meta=CELL_META[id],job=cell.job;
  const progress=Math.max(0,Math.min(100,Math.round(Number(cell.progress??0)*100)));
  const plan=cell.selectedPlan?.label??'План не выбран';
  const status=STATUS_LABELS[cell.status]??'ОЖИДАНИЕ';
  const detail=job?`${esc(plan)} · осталось ${duration(Number(cell.remainingSec??0))}`:cell.status==='blocked'?'Не хватает входных материалов':`${esc(plan)} · готов к запуску`;
  return `<section class="ivProductionBay industrialLiveCell ${id} ${cell.status}" data-industrial-scene-cell="${id}">
    <header class="ivBayHeader"><div><small>0${CELL_IDS.indexOf(id)+1} · ${esc(meta.short.toUpperCase())}</small><b>${esc(meta.title)}</b><span>${esc(meta.role)}</span></div><em class="ivState">${status}</em></header>
    <div class="ivBayWorkplane">${machineMarkup(id)}${workerMarkup(cell)}</div>
    <footer class="ivBayFooter"><div><b>${esc(plan)}</b><span>${detail}</span></div>${job?`<strong>${progress}%</strong>`:''}</footer>
    <div class="ivProgress" ${job?'':'hidden'}><i style="width:${progress}%"></i></div>
  </section>`;
}

function stockAmount(state:RuntimeState){
  const storage=state.storage??{};
  return Math.max(0,Number(storage.metal??0))+Math.max(0,Number(storage.copper??0))+Math.max(0,Number(storage.plastic??0));
}

function warehouseMarkup(state:RuntimeState,view:any){
  const raw=Math.round(stockAmount(state)),industrialPositive=Object.values(view?.stock??{}).filter(value=>Number(value)>0).length;
  return `<section class="ivWarehouse"><header><div><small>СКЛАД / ПОДГОТОВКА</small><b>Материалы и комплектующие</b></div><span>${raw.toLocaleString('ru-RU')} кг сырья</span></header><div class="ivWarehouseScene" aria-hidden="true"><i class="ivRack rack-a"><em></em><em></em><em></em></i><i class="ivRack rack-b"><em></em><em></em><em></em></i><i class="ivPallet p-a"></i><i class="ivPallet p-b"></i><i class="ivForklift"><em></em></i></div><footer><span>Промышленных позиций в наличии: <b>${industrialPositive}</b></span><span>Входы участков берутся из реального общего склада</span></footer></section>`;
}

function vehicleTypeLabel(type:string){return type==='truck'?'Грузовик':type==='recovery_rig'?'Эвакуационная платформа':'Фургон'}
function vehicleMarkup(vehicle:any,reservedRigId:string|null,standbyRigId:string|null){
  const reserved=vehicle.id===reservedRigId,standby=vehicle.id===standbyRigId&&!reserved,onRoute=!!vehicle.routeId;
  const state=reserved?'В ТЯЖЁЛОЙ СБОРКЕ':onRoute?'НА МАРШРУТЕ':standby?'ГОТОВА К ПОДАЧЕ':'НА БАЗЕ';
  const visualType=vehicle.type==='recovery_rig'?'rig':vehicle.type==='truck'?'truck':'van';
  return `<div class="ivFleetVehicle ${visualType} ${reserved?'reserved':onRoute?'route':standby?'standby':'idle'}" data-visual-fleet-vehicle="${esc(vehicle.id)}"><div class="ivVehicleArt" aria-hidden="true"><i></i><em></em></div><span><b>${esc(vehicle.name??vehicleTypeLabel(vehicle.type))}</b><small>${state}</small></span></div>`;
}

function fleetMarkup(state:RuntimeState,view:any){
  const fleet=Array.isArray(state.workforceV3?.fleet)?state.workforceV3.fleet:[];
  const heavy=view?.cells?.find((cell:any)=>cell.id==='heavy_assembly'),reservedRigId=heavy?.job?.support?.kind==='recovery_rig'?heavy.job.support.vehicleId:null;
  const standbyRigId=view?.heavySupport?.kind==='recovery_rig'?view.heavySupport.vehicleId:null;
  const items=fleet.length?fleet.map((vehicle:any)=>vehicleMarkup(vehicle,reservedRigId,standbyRigId)).join(''):'<div class="ivFleetEmpty">Транспорт ещё не приобретён</div>';
  return `<section class="ivFleetStage"><header><div><small>ПОГРУЗКА / ЛОГИСТИКА</small><b>Транспорт базы</b></div><span>${fleet.length} ед.</span></header><div class="ivFleetRow">${items}</div></section>`;
}

function heavyGateMarkup(view:any){
  const heavy=view?.cells?.find((cell:any)=>cell.id==='heavy_assembly'),jobSupport=heavy?.job?.support;
  const support=jobSupport?.kind==='recovery_rig'?jobSupport:view?.heavySupport;
  if(support?.kind==='recovery_rig'){
    const gain=Math.round((1-Number(support.durationFactor??1))*100),active=jobSupport?.kind==='recovery_rig';
    return `<div class="industrialHeavyGate ivHeavySupport ${active?'active':'ready'}"><b>${rigName(support.vehicleName)}</b><span>${active?'занята текущей тяжёлой сборкой':'готова поддержать следующий цикл'} · −${gain}% к времени</span></div>`;
  }
  return '<div class="industrialHeavyGate ivHeavySupport unavailable"><b>Тяжёлая эвакуационная платформа недоступна</b><span>Тяжёлая сборка работает без ускоренной подачи</span></div>';
}

function sceneSignature(state:RuntimeState,view:any){
  const cells=(view?.cells??[]).map((cell:any)=>({id:cell.id,status:cell.status,plan:cell.selectedPlan?.id,progress:Math.floor(Number(cell.progress??0)*100),worker:cell.job?.staffing?.workerId??cell.assignedWorker?.workerId,support:cell.job?.support?.vehicleId}));
  const fleet=(state.workforceV3?.fleet??[]).map((vehicle:any)=>({id:vehicle.id,type:vehicle.type,route:vehicle.routeId}));
  return JSON.stringify({cells,fleet,raw:Math.round(stockAmount(state)),heavy:view?.heavySupport?.vehicleId??null});
}

export function refreshIndustrialVisualBaselineV1(){
  const runtime=api(),state=runtime?.getState?.() as RuntimeState|undefined,view=runtime?.getProductionCellsV1View?.();
  if(!state?.packD?.industrialWorkshopOwned||state?.packE?.processingPlantOwned||!view)return;
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2.stage-industrial');if(!scene)return;
  const signature=sceneSignature(state,view);if(scene.dataset.visualBaselineV1===signature&&scene.querySelector('[data-visual-baseline-v1]'))return;
  scene.dataset.visualBaselineV1=signature;
  const running=(view.cells??[]).filter((cell:any)=>cell.status==='running').length,productionWorkers=(state.workforceV3?.workers??[]).filter((worker:any)=>worker.status==='production').length;
  scene.innerHTML=`<div class="baseSceneLabel ivSceneLabel"><b>Промышленная мастерская</b><span>${running}/3 участков работают · ${productionWorkers} сотруд. в производстве</span></div>
  <div class="industrialWorkshopLive ivWorkshop" data-industrial-workshop-live data-visual-baseline-v1>
    <div class="ivBackdrop" aria-hidden="true"><i class="ivBeam b1"></i><i class="ivBeam b2"></i><i class="ivBeam b3"></i><i class="ivLamp l1"></i><i class="ivLamp l2"></i><i class="ivLamp l3"></i><i class="ivWindow w1"></i><i class="ivWindow w2"></i><i class="ivCraneRail"></i></div>
    <div class="ivProductionDeck">${CELL_IDS.map(id=>cellMarkup(view.cells.find((cell:any)=>cell.id===id))).join('')}</div>
    <div class="ivLowerDeck">${warehouseMarkup(state,view)}${fleetMarkup(state,view)}</div>
    ${heavyGateMarkup(view)}
  </div>`;
}

const observer=new MutationObserver(()=>queueMicrotask(refreshIndustrialVisualBaselineV1));
function boot(){
  const garage=document.querySelector('#garageScreen');if(!garage||!api()?.getState){setTimeout(boot,100);return}
  observer.observe(garage,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  refreshIndustrialVisualBaselineV1();setInterval(refreshIndustrialVisualBaselineV1,300);
}
boot();
