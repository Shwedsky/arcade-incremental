import './base_stage_visual_v2.css';

type RuntimeState=any;
type Stage='garage'|'hangar'|'yard'|'industrial'|'plant';
type WorkerView={id:string;name:string;rank:number;role:string;status:string};
type VehicleView={id:string;name:string;type:string;routeId:string|null};

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageOf=(s:RuntimeState):Stage=>s?.packE?.processingPlantOwned?'plant':s?.packD?.industrialWorkshopOwned?'industrial':s?.packC?.salvageYardOwned?'yard':s?.packB?.hangarOwned?'hangar':'garage';

function canonicalWorkers(s:RuntimeState):WorkerView[]{
  if(Array.isArray(s?.workforceV3?.workers))return s.workforceV3.workers.map((worker:any)=>({
    id:String(worker?.id??''),name:String(worker?.name??'Рабочий'),rank:Number(worker?.rank??1),role:String(worker?.role??'scavenger'),status:String(worker?.status??'idle')
  }));
  return[
    s?.midgame?.worker?.hired&&{id:'legacy-1',name:'Рабочий 1',rank:1,role:'scavenger',status:s?.midgame?.worker?.assignment?'route':'idle'},
    s?.packB?.secondWorker?.hired&&{id:'legacy-2',name:'Рабочий 2',rank:1,role:'scavenger',status:s?.packB?.secondWorker?.assignment?'route':'idle'},
    s?.packC?.crew3?.hired&&{id:'legacy-3',name:'Рабочий 3',rank:1,role:String(s?.packC?.crew3?.role??'scavenger'),status:s?.packC?.crew3?.operatorCell?'production':s?.packC?.crew3?.assignment?'route':'idle'},
    s?.packD?.crew4?.hired&&{id:'legacy-4',name:'Рабочий 4',rank:1,role:String(s?.packD?.crew4?.role??'scavenger'),status:s?.packD?.crew4?.operatorCell?'production':s?.packD?.crew4?.assignment?'route':'idle'}
  ].filter(Boolean) as WorkerView[];
}

function canonicalFleet(s:RuntimeState):VehicleView[]{
  if(Array.isArray(s?.workforceV3?.fleet))return s.workforceV3.fleet.map((vehicle:any)=>({
    id:String(vehicle?.id??''),name:String(vehicle?.name??'Транспорт'),type:String(vehicle?.type??'van'),routeId:typeof vehicle?.routeId==='string'?vehicle.routeId:null
  }));
  const result:VehicleView[]=[];
  if(s?.midgame?.van?.owned)result.push({id:'legacy-van',name:'Фургон #1',type:'van',routeId:null});
  if(s?.packB?.truck?.owned)result.push({id:'legacy-truck',name:'Грузовик #1',type:'truck',routeId:null});
  if(s?.packD?.recoveryRig?.owned)result.push({id:'legacy-rig',name:'Recovery Rig #1',type:'recovery_rig',routeId:null});
  return result;
}

const workerCount=(s:RuntimeState)=>canonicalWorkers(s).length;
const vehicleCount=(s:RuntimeState)=>canonicalFleet(s).length;
const machineIds=(s:RuntimeState)=>Array.from(new Set<string>(Array.isArray(s?.installed)?s.installed.map(String):[]));
const machineCount=(s:RuntimeState)=>Math.max(1,machineIds(s).length||1);
const vehicleIcon=(type:string)=>type==='truck'?'🚚':type==='recovery_rig'?'🚛':'🚐';
const roleLabel=(role:string)=>role==='operator'?'Оператор':role==='logistician'?'Логист':role==='technician'?'Техник':'Сборщик';
const statusLabel=(status:string)=>status==='production'?'Производство':status==='route'?'Маршрут':'Свободен';
const machineLabel=(id:string)=>id==='workbench'?'Верстак':id==='press'?'Пресс':id==='wire'?'Медь':id==='plastic'?'Пластик':id;

function workers(s:RuntimeState,limit=8){
  return canonicalWorkers(s).slice(0,limit).map((worker,i)=>`<i class="basePerson p${i+1} status-${worker.status}" title="${worker.name} · ${roleLabel(worker.role)} · ${statusLabel(worker.status)}"><span>${worker.rank}</span></i>`).join('');
}

function bays(s:RuntimeState,n:number,label:string){
  const fleet=canonicalFleet(s);
  return Array.from({length:n},(_,i)=>{
    const vehicle=fleet[i];
    const classes=['baseBay',vehicle?'occupied':'empty',vehicle?.routeId?'assigned':'free'].join(' ');
    return `<div class="${classes}"><span>${vehicle?vehicleIcon(vehicle.type):'+'}</span><small>${vehicle?vehicle.name:`${label} ${i+1}`}</small><em>${vehicle?(vehicle.routeId?'НА МАРШРУТЕ':'СВОБОДЕН'):'СВОБОДНО'}</em></div>`;
  }).join('');
}

function machineSlots(s:RuntimeState,n:number){
  const installed=machineIds(s);
  return Array.from({length:n},(_,i)=>{
    const id=installed[i];
    return `<i class="hangarMachineSlot ${id?'installed':'open'}"><span>${id?'⚙':'+'}</span><small>${id?machineLabel(id):'Свободный пост'}</small></i>`;
  }).join('');
}

function dispatchCards(s:RuntimeState,n=5){
  const roster=canonicalWorkers(s);
  return Array.from({length:n},(_,i)=>{
    const worker=roster[i];
    if(!worker)return`<div class="dispatchSeat open"><b>+</b><small>Место сотрудника</small></div>`;
    return`<div class="dispatchSeat ${worker.status}"><b>${worker.name}</b><span>${roleLabel(worker.role)} · ур. ${worker.rank}</span><small>${statusLabel(worker.status)}</small></div>`;
  }).join('');
}

function hangarSignature(s:RuntimeState){
  const workers=canonicalWorkers(s).map(worker=>`${worker.id}:${worker.rank}:${worker.role}:${worker.status}`).join('|');
  const fleet=canonicalFleet(s).map(vehicle=>`${vehicle.id}:${vehicle.type}:${vehicle.routeId??'-'}`).join('|');
  return`${workers}::${fleet}::${machineIds(s).join('|')}::${Number(s?.scheduler?.actions?.length??0)}`;
}

function sceneMarkup(stage:Stage,s:RuntimeState){
  const wc=workerCount(s),mc=machineCount(s),vc=vehicleCount(s);
  if(stage==='garage')return`<div class="baseSceneLabel"><b>Личный гараж</b><span>${mc} станк. · ${wc} раб.</span></div><div class="garageWall ${mc>=3||wc>=2?'crowded':''}"><div class="garageDoor"></div><div class="garageBench">🛠</div><div class="garageShelves"><i></i><i></i><i></i></div><div class="garageMachines">${Array.from({length:Math.min(4,mc)},()=>'<i>⚙</i>').join('')}</div>${workers(s,4)}</div>`;
  if(stage==='hangar')return`
    <div class="baseSceneLabel"><b>Операционный ангар</b><span>${mc} станк. · ${wc}/5 сотрудников · ${vc}/4 транспорт</span></div>
    <div class="hangarStructure"><div class="hangarTruss t1"></div><div class="hangarTruss t2"></div><div class="hangarTruss t3"></div><div class="hangarDoorGlow"></div></div>
    <div class="hangarFloorV1">
      <section class="hangarZone machineZone"><header><b>ПРОИЗВОДСТВЕННЫЙ ПОЛ</b><span>${mc}/6 постов</span></header><div class="hangarMachinesV1">${machineSlots(s,6)}</div></section>
      <section class="hangarZone dispatchZone"><header><b>ДИСПЕТЧЕРСКАЯ</b><span>${wc}/5 мест</span></header><div class="dispatchGrid">${dispatchCards(s,5)}</div></section>
      <section class="hangarZone storageZone"><header><b>СКЛАД / СТЕЙДЖИНГ</b><span>паллеты и входящий поток</span></header><div class="rack r1"><i></i><i></i><i></i></div><div class="rack r2"><i></i><i></i><i></i></div><div class="hangarPallets"><i></i><i></i><i></i><i></i></div></section>
      <section class="hangarZone vehicleZone"><header><b>ТРАНСПОРТНЫЕ БОКСЫ</b><span>${vc}/4 занято</span></header><div class="hangarBaysV1">${bays(s,4,'Бокс')}</div></section>
      <div class="hangarExpansion"><b>ЗОНА РАСШИРЕНИЯ</b><span>следующий предел бизнеса — Yard</span></div>
      ${workers(s,8)}
    </div>`;
  if(stage==='yard')return`<div class="baseSceneLabel"><b>Salvage Yard</b><span>Сеть снабжения · ${wc} раб. · ${vc} транспорт</span></div><div class="yardSky"><div class="yardCrane">┐<i></i></div></div><div class="yardGround"><div class="scrapPile a"></div><div class="scrapPile b"></div><div class="yardBays">${bays(s,5,'Стоянка')}</div><div class="yardStaging">ТЯЖЁЛЫЙ ЛОМ</div>${workers(s,8)}</div>`;
  if(stage==='industrial')return`<div class="baseSceneLabel"><b>Industrial Workshop</b><span>Производственные ячейки · ${wc} раб.</span></div><div class="industrialHall"><div class="overheadCrane"></div><div class="productionCells">${Array.from({length:4},(_,i)=>`<div><b>ЯЧЕЙКА ${i+1}</b><span>${i<2?'⚙ ACTIVE':'READY'}</span><i></i></div>`).join('')}</div><div class="industrialBays">${bays(s,4,'Ворота')}</div>${workers(s,10)}</div>`;
  return`<div class="baseSceneLabel"><b>Processing Plant</b><span>Завод · линии + склад + входящая логистика</span></div><div class="plantScene"><div class="plantStacks"><i></i><i></i><i></i></div><div class="plantWarehouse">СКЛАД<br><strong>150 000 кг</strong></div><div class="plantLines"><div>ЛИНИЯ 1<i></i></div><div>ЛИНИЯ 2<i></i></div></div><div class="plantDock">${bays(s,5,'Док')}</div>${workers(s,12)}</div>`;
}

function placeScene(box:HTMLElement,scene:HTMLElement){
  const overview=box.querySelector<HTMLElement>('[data-base-pane="overview"]');
  if(overview){const card=overview.querySelector<HTMLElement>('#baseStageOverview');if(scene.parentElement!==overview){if(card)overview.insertBefore(scene,card);else overview.prepend(scene)}return}
  if(scene.parentElement!==box){const header=box.querySelector<HTMLElement>(':scope > header');header?.insertAdjacentElement('afterend',scene)}
}

export function refreshBaseStageVisualV2(){
  const runtime=api();if(!runtime?.getState)return;const s=runtime.getState();
  const box=document.querySelector<HTMLElement>('.garageBox');if(!box)return;
  const stage=stageOf(s);box.dataset.visualStage=stage;
  let scene=box.querySelector<HTMLElement>('#baseStageSceneV2');
  if(!scene){scene=document.createElement('section');scene.id='baseStageSceneV2';scene.className='baseStageSceneV2';const header=box.querySelector<HTMLElement>(':scope > header');header?.insertAdjacentElement('afterend',scene)}
  placeScene(box,scene);
  const signature=stage==='hangar'?`${stage}:${hangarSignature(s)}`:`${stage}:${workerCount(s)}:${vehicleCount(s)}:${machineCount(s)}:${s?.packE?.production?.length??0}`;
  if(scene.dataset.signature===signature)return;scene.dataset.signature=signature;scene.className=`baseStageSceneV2 stage-${stage}`;scene.innerHTML=sceneMarkup(stage,s);
}

const visualApi={refresh:refreshBaseStageVisualV2};
Object.assign(globalThis,{__SALVAGE_BASE_VISUAL__:visualApi});
const observer=new MutationObserver(()=>queueMicrotask(refreshBaseStageVisualV2));
function boot(){const garage=document.querySelector('#garageScreen');if(!garage){setTimeout(boot,100);return}observer.observe(garage,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});refreshBaseStageVisualV2();setInterval(refreshBaseStageVisualV2,1000)}
boot();
