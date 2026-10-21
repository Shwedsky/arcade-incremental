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

function decorateUi(){
  const runtime=api(),state=runtime?.getState?.();if(!state)return;
  const jobs=activeJobs(state),workers=new Map<string,ActiveJob>(),vehicles=new Map<string,ActiveJob>();
  for(const entry of jobs){
    const workerId=entry.job?.staffing?.workerId,vehicleId=entry.job?.support?.vehicleId;
    if(workerId)workers.set(workerId,entry);if(vehicleId)vehicles.set(vehicleId,entry);
  }

  document.querySelectorAll<HTMLSelectElement>('[data-pc-worker]').forEach(select=>{
    for(const option of Array.from(select.options)){
      if(!option.value)continue;const lock=workers.get(option.value);if(!lock)continue;
      option.disabled=true;
      if(!option.textContent?.includes('занят циклом'))option.textContent=`${option.textContent} · занят циклом`;
    }
  });

  document.querySelectorAll<HTMLInputElement>('[data-crew-vehicle]').forEach(input=>{
    const id=String(input.dataset.crewVehicle??'');const lock=vehicles.get(id);if(!lock)return;
    input.checked=false;input.disabled=true;
    const label=input.closest('label'),small=label?.querySelector('small');
    if(small&&!small.textContent?.includes('занята производством'))small.textContent=`${small.textContent} · занята производством`;
  });

  document.querySelectorAll<HTMLSelectElement>('[data-network-route-vehicle]').forEach(select=>{
    for(const option of Array.from(select.options)){
      const lock=vehicles.get(option.value);if(!lock)continue;option.disabled=true;
      if(!option.textContent?.includes('занята производством'))option.textContent=`${option.textContent} · занята производством`;
    }
  });
}

function install(){
  const runtime=api();if(!runtime?.getState){window.setTimeout(install,60);return}
  if(runtime.__productionResourceLockV1)return;

  const original={
    assignGenericRoute:runtime.assignGenericRoute?.bind(runtime),
    sellGenericVehicle:runtime.sellGenericVehicle?.bind(runtime),
    setGenericWorkerRole:runtime.setGenericWorkerRole?.bind(runtime),
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
