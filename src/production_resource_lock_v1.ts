type ProductionCellId='refining'|'fabrication'|'heavy_assembly';
type RuntimeApi=Record<string,any>;

type ActiveJob={
  cellId:ProductionCellId;
  job:any;
};

const api=()=> (globalThis as any).__SALVAGE_TEST__ as RuntimeApi|undefined;
const CELL_LABELS:Record<ProductionCellId,string>={
  refining:'участок подготовки сырья',
  fabrication:'сборочный участок',
  heavy_assembly:'участок тяжёлой сборки'
};
const LOCK_ATTR='productionLockV1';

function notify(text:string){
  window.dispatchEvent(new CustomEvent('salvage:ui-notice',{detail:{text,tone:'warn'}}));
}

function activeJobs(state:any):ActiveJob[]{
  const cells=state?.productionCellsV1?.cells??{};
  return (['refining','fabrication','heavy_assembly'] as ProductionCellId[])
    .map(cellId=>({cellId,job:cells[cellId]?.job??null}))
    .filter(entry=>!!entry.job);
}

function workerReservation(state:any,workerId:string):ActiveJob|undefined{
  return activeJobs(state).find(entry=>entry.job?.staffing?.workerId===workerId);
}

function vehicleReservation(state:any,vehicleId:string):ActiveJob|undefined{
  return activeJobs(state).find(entry=>entry.job?.support?.vehicleId===vehicleId);
}

function reservationText(entry:ActiveJob){
  return CELL_LABELS[entry.cellId]??'производственный участок';
}

function lockControl(element:HTMLButtonElement|HTMLInputElement|HTMLOptionElement,reason:string){
  if(!element.dataset[LOCK_ATTR]){
    element.dataset[LOCK_ATTR]='1';
    element.dataset.productionLockDisabled=element.disabled?'1':'0';
    element.dataset.productionLockTitle=element.getAttribute('title')??'';
  }
  element.disabled=true;element.title=reason;
}

function lockText(element:HTMLElement,text:string){
  if(element.dataset.productionLockOriginal===undefined)element.dataset.productionLockOriginal=element.textContent??'';
  element.dataset[LOCK_ATTR]='1';element.textContent=text;
}

function restoreUiLocks(){
  document.querySelectorAll<HTMLElement>('[data-production-lock-v1]').forEach(element=>{
    if('disabled' in element&&element.dataset.productionLockDisabled!==undefined){
      (element as HTMLButtonElement|HTMLInputElement|HTMLOptionElement).disabled=element.dataset.productionLockDisabled==='1';
      delete element.dataset.productionLockDisabled;
    }
    if(element.dataset.productionLockOriginal!==undefined){element.textContent=element.dataset.productionLockOriginal;delete element.dataset.productionLockOriginal}
    if(element.dataset.productionLockTitle!==undefined){
      if(element.dataset.productionLockTitle)element.setAttribute('title',element.dataset.productionLockTitle);else element.removeAttribute('title');
      delete element.dataset.productionLockTitle;
    }
    delete element.dataset[LOCK_ATTR];
  });
}

function decorateUi(){
  const runtime=api(),state=runtime?.getState?.();if(!state)return;
  restoreUiLocks();
  const jobs=activeJobs(state),workers=new Map<string,ActiveJob>(),vehicles=new Map<string,ActiveJob>();
  for(const entry of jobs){
    const workerId=entry.job?.staffing?.workerId,vehicleId=entry.job?.support?.vehicleId;
    if(workerId)workers.set(workerId,entry);if(vehicleId)vehicles.set(vehicleId,entry);
  }

  document.querySelectorAll<HTMLSelectElement>('[data-pc-worker]').forEach(select=>{
    for(const option of Array.from(select.options)){
      if(!option.value)continue;const lock=workers.get(option.value);if(!lock)continue;
      lockControl(option,`Занят: ${reservationText(lock)}`);
      if(!option.textContent?.includes('занят циклом'))lockText(option,`${option.textContent} · занят циклом`);
    }
  });

  for(const [workerId,lock] of workers){
    const reason=`Занят текущим циклом: ${reservationText(lock)}`;
    document.querySelectorAll<HTMLButtonElement>(`[data-worker="${workerId}"][data-v3-role], [data-v3-train="${workerId}"], [data-op-assign="${workerId}"]`).forEach(button=>lockControl(button,reason));
  }

  document.querySelectorAll<HTMLSelectElement>('[data-v3-vehicle]').forEach(select=>{
    for(const option of Array.from(select.options)){
      const lock=vehicles.get(option.value);if(!lock)continue;
      lockControl(option,`Занята: ${reservationText(lock)}`);
      if(!option.textContent?.includes('занята производством'))lockText(option,`${option.textContent} · занята производством`);
    }
  });

  document.querySelectorAll<HTMLInputElement>('[data-crew-vehicle]').forEach(input=>{
    const id=String(input.dataset.crewVehicle??'');const lock=vehicles.get(id);if(!lock)return;
    input.checked=false;lockControl(input,`Занята: ${reservationText(lock)}`);
    const label=input.closest('label'),small=label?.querySelector<HTMLElement>('small');
    if(small)lockText(small,`${small.textContent} · занята производством`);
  });

  document.querySelectorAll<HTMLSelectElement>('[data-network-route-vehicle]').forEach(select=>{
    for(const option of Array.from(select.options)){
      const lock=vehicles.get(option.value);if(!lock)continue;
      lockControl(option,`Занята: ${reservationText(lock)}`);
      if(!option.textContent?.includes('занята производством'))lockText(option,`${option.textContent} · занята производством`);
    }
  });

  for(const [vehicleId,lock] of vehicles){
    const card=document.querySelector<HTMLElement>(`[data-vehicle-card="${vehicleId}"]`);if(!card)continue;
    const status=card.querySelector<HTMLElement>('p');if(status)lockText(status,`На производстве · ${reservationText(lock)}`);
    card.querySelectorAll<HTMLButtonElement>('[data-v3-sell-vehicle]').forEach(button=>lockControl(button,`Нельзя продать: ${reservationText(lock)} использует машину`));
  }
}

function install(){
  const runtime=api();if(!runtime?.getState){window.setTimeout(install,60);return}
  if(runtime.__productionResourceLockV1)return;

  const original={
    assignGenericRoute:runtime.assignGenericRoute?.bind(runtime),
    sellGenericVehicle:runtime.sellGenericVehicle?.bind(runtime),
    setGenericWorkerRole:runtime.setGenericWorkerRole?.bind(runtime),
    trainGenericWorker:runtime.trainGenericWorker?.bind(runtime),
    assignGenericProduction:runtime.assignGenericProduction?.bind(runtime),
    assignProductionCellWorkerV1:runtime.assignProductionCellWorkerV1?.bind(runtime)
  };

  runtime.assignGenericRoute=(workerId:string,zone:string,vehicleId:string|null=null)=>{
    const state=runtime.getState(),workerLock=workerReservation(state,workerId);
    if(workerLock){notify(`Сотрудник занят: ${reservationText(workerLock)} выполняет текущий цикл.`);return null}
    if(vehicleId){const vehicleLock=vehicleReservation(state,vehicleId);if(vehicleLock){notify(`Техника занята: ${reservationText(vehicleLock)} использует её до завершения цикла.`);return null}}
    return original.assignGenericRoute?.(workerId,zone,vehicleId)??null;
  };

  runtime.sellGenericVehicle=(vehicleId:string)=>{
    const lock=vehicleReservation(runtime.getState(),vehicleId);
    if(lock){notify(`Эту технику нельзя продать: ${reservationText(lock)} использует её в текущем цикле.`);return null}
    return original.sellGenericVehicle?.(vehicleId)??null;
  };

  runtime.setGenericWorkerRole=(workerId:string,role:string)=>{
    const lock=workerReservation(runtime.getState(),workerId);
    if(lock){notify(`Роль нельзя сменить до завершения цикла: ${reservationText(lock)}.`);return false}
    return original.setGenericWorkerRole?.(workerId,role)??false;
  };

  runtime.trainGenericWorker=(workerId:string)=>{
    const lock=workerReservation(runtime.getState(),workerId);
    if(lock){notify(`Обучение доступно после завершения цикла: ${reservationText(lock)}.`);return false}
    return original.trainGenericWorker?.(workerId)??false;
  };

  runtime.assignGenericProduction=(workerId:string,cellId:string)=>{
    const lock=workerReservation(runtime.getState(),workerId);
    if(lock){notify(`Сотрудник уже закреплён за текущим циклом: ${reservationText(lock)}.`);return false}
    return original.assignGenericProduction?.(workerId,cellId)??false;
  };

  runtime.assignProductionCellWorkerV1=(workerId:string,cellId:ProductionCellId,role?:string)=>{
    const state=runtime.getState(),target=activeJobs(state).find(entry=>entry.cellId===cellId);
    if(target){notify(`${CELL_LABELS[cellId]} уже выполняет цикл. Состав можно менять после завершения.`);return false}
    const workerLock=workerReservation(state,workerId);
    if(workerLock){notify(`Сотрудник занят: ${reservationText(workerLock)} выполняет текущий цикл.`);return false}
    return original.assignProductionCellWorkerV1?.(workerId,cellId,role)??false;
  };

  Object.defineProperty(runtime,'__productionResourceLockV1',{value:true,enumerable:false,configurable:false});
  decorateUi();
  window.setInterval(decorateUi,250);
}

install();
