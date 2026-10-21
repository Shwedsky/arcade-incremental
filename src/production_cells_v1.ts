export type ProductionCellIdV1='refining'|'fabrication'|'heavy_assembly';
export type ProductionPlanIdV1=
  |'reinforced_alloy'
  |'drive_module'|'control_module'|'structural_section'
  |'hydraulic_power'|'heavy_frame';

export type IndustrialStockKeyV1=
  |'alloyScrap'|'reinforcedAlloy'|'structuralProfile'|'cleanCopper'
  |'bearing'|'motor'|'hydraulic'|'electronics'|'pump'|'gearbox'
  |'industrialController'|'heavyHydraulicCylinder'
  |'drive'|'control'|'structural'|'hydraulicPower'|'heavyFrame';

export type ProductionStaffRoleV1='none'|'operator'|'technician'|'logistician'|'scavenger';
export type ProductionCellStatusV1='idle'|'ready'|'running'|'blocked';
export type ProductionBottleneckV1='none'|'busy'|'missing_input';

export type IndustrialStockV1=Record<IndustrialStockKeyV1,number>;
export type IndustrialStockDeltaV1=Partial<Record<IndustrialStockKeyV1,number>>;

export interface ProductionPlanV1{
  id:ProductionPlanIdV1;
  cellId:ProductionCellIdV1;
  label:string;
  description:string;
  inputs:IndustrialStockDeltaV1;
  outputs:IndustrialStockDeltaV1;
  baseDurationSec:number;
}

export interface ProductionStaffSnapshotV1{
  workerId:string|null;
  workerName:string|null;
  role:ProductionStaffRoleV1;
  rank:number;
  durationFactor:number;
}

export interface ProductionCellJobV1{
  id:string;
  planId:ProductionPlanIdV1;
  startedAt:number;
  endsAt:number;
  inputs:IndustrialStockDeltaV1;
  outputs:IndustrialStockDeltaV1;
  staffing:ProductionStaffSnapshotV1;
}

export interface ProductionCellRuntimeV1{
  id:ProductionCellIdV1;
  selectedPlanId:ProductionPlanIdV1;
  job:ProductionCellJobV1|null;
  completedCycles:number;
}

export interface ProductionCellsV1State{
  version:1;
  nextJobSerial:number;
  cells:Record<ProductionCellIdV1,ProductionCellRuntimeV1>;
}

export interface ProductionStartResultV1{
  ok:boolean;
  reason?:ProductionBottleneckV1;
  missing?:IndustrialStockDeltaV1;
  job?:ProductionCellJobV1;
}

export interface ProductionCompletionV1{
  cellId:ProductionCellIdV1;
  planId:ProductionPlanIdV1;
  jobId:string;
  outputs:IndustrialStockDeltaV1;
}

export interface ProductionCellProjectionV1{
  id:ProductionCellIdV1;
  label:string;
  selectedPlan:ProductionPlanV1;
  status:ProductionCellStatusV1;
  bottleneck:ProductionBottleneckV1;
  missing:IndustrialStockDeltaV1;
  job:ProductionCellJobV1|null;
  progress:number;
  remainingSec:number;
}

export const PRODUCTION_CELL_LABELS_V1:Record<ProductionCellIdV1,string>={
  refining:'Refining Cell',
  fabrication:'Fabrication Cell',
  heavy_assembly:'Heavy Assembly Cell'
};

export const PRODUCTION_PLANS_V1:Record<ProductionPlanIdV1,ProductionPlanV1>={
  reinforced_alloy:{
    id:'reinforced_alloy',cellId:'refining',label:'Усиленный сплав',
    description:'Промышленное сплав-сырьё проходит полноценный цикл очистки и подготовки.',
    inputs:{alloyScrap:25},outputs:{reinforcedAlloy:18},baseDurationSec:240
  },
  drive_module:{
    id:'drive_module',cellId:'fabrication',label:'Приводной модуль',
    description:'Сборка привода из конструкционного профиля, меди и восстановленного силового узла.',
    inputs:{structuralProfile:2,cleanCopper:6,gearbox:1,motor:1},outputs:{drive:1},baseDurationSec:360
  },
  control_module:{
    id:'control_module',cellId:'fabrication',label:'Модуль управления',
    description:'Электротехническая сборка для ворот, линий и промышленной автоматики.',
    inputs:{structuralProfile:1,cleanCopper:6,electronics:2},outputs:{control:1},baseDurationSec:300
  },
  structural_section:{
    id:'structural_section',cellId:'fabrication',label:'Конструкционная секция',
    description:'Готовая монтажная секция из профиля и восстановленных опорных узлов.',
    inputs:{structuralProfile:4,bearing:2},outputs:{structural:1},baseDurationSec:360
  },
  hydraulic_power:{
    id:'hydraulic_power',cellId:'heavy_assembly',label:'Гидравлический силовой модуль',
    description:'Тяжёлая гидростанция из усиленного сплава, профиля и найденной промышленной гидравлики.',
    inputs:{reinforcedAlloy:8,structuralProfile:10,hydraulic:1,pump:1,heavyHydraulicCylinder:1},outputs:{hydraulicPower:1},baseDurationSec:480
  },
  heavy_frame:{
    id:'heavy_frame',cellId:'heavy_assembly',label:'Тяжёлая рама',
    description:'Силовая рама для промышленной установки с контроллером и готовыми монтажными модулями.',
    inputs:{reinforcedAlloy:12,structuralProfile:16,structural:1,control:1,industrialController:1},outputs:{heavyFrame:1},baseDurationSec:600
  }
};

const PLAN_IDS=Object.keys(PRODUCTION_PLANS_V1) as ProductionPlanIdV1[];
const STOCK_KEYS:IndustrialStockKeyV1[]=[
  'alloyScrap','reinforcedAlloy','structuralProfile','cleanCopper','bearing','motor','hydraulic','electronics','pump','gearbox',
  'industrialController','heavyHydraulicCylinder','drive','control','structural','hydraulicPower','heavyFrame'
];

export function emptyIndustrialStockV1():IndustrialStockV1{
  return Object.fromEntries(STOCK_KEYS.map(key=>[key,0])) as IndustrialStockV1;
}

function defaultCell(id:ProductionCellIdV1):ProductionCellRuntimeV1{
  const selectedPlanId:ProductionPlanIdV1=id==='refining'?'reinforced_alloy':id==='fabrication'?'drive_module':'hydraulic_power';
  return{id,selectedPlanId,job:null,completedCycles:0};
}

export function createDefaultProductionCellsV1():ProductionCellsV1State{
  return{version:1,nextJobSerial:1,cells:{refining:defaultCell('refining'),fabrication:defaultCell('fabrication'),heavy_assembly:defaultCell('heavy_assembly')}};
}

function validPlanForCell(cellId:ProductionCellIdV1,value:unknown):ProductionPlanIdV1{
  const id=String(value) as ProductionPlanIdV1;
  return PLAN_IDS.includes(id)&&PRODUCTION_PLANS_V1[id].cellId===cellId?id:defaultCell(cellId).selectedPlanId;
}

function normalizeDelta(value:IndustrialStockDeltaV1|undefined):IndustrialStockDeltaV1{
  const result:IndustrialStockDeltaV1={};
  if(!value)return result;
  for(const key of STOCK_KEYS){const amount=Math.max(0,Number(value[key])||0);if(amount>0)result[key]=amount}
  return result;
}

function normalizeJob(value:ProductionCellJobV1|null|undefined,cellId:ProductionCellIdV1):ProductionCellJobV1|null{
  if(!value)return null;
  const planId=validPlanForCell(cellId,value.planId),plan=PRODUCTION_PLANS_V1[planId];
  const startedAt=Math.max(0,Number(value.startedAt)||0),endsAt=Math.max(startedAt+1000,Number(value.endsAt)||startedAt+plan.baseDurationSec*1000);
  const role=(['none','operator','technician','logistician','scavenger'].includes(String(value.staffing?.role))?value.staffing.role:'none') as ProductionStaffRoleV1;
  return{
    id:String(value.id||`legacy-${cellId}-${startedAt}`),planId,startedAt,endsAt,
    inputs:normalizeDelta(value.inputs??plan.inputs),outputs:normalizeDelta(value.outputs??plan.outputs),
    staffing:{
      workerId:typeof value.staffing?.workerId==='string'?value.staffing.workerId:null,
      workerName:typeof value.staffing?.workerName==='string'?value.staffing.workerName:null,
      role,rank:Math.max(0,Math.min(5,Math.floor(Number(value.staffing?.rank)||0))),
      durationFactor:Math.max(.5,Math.min(1.25,Number(value.staffing?.durationFactor)||1))
    }
  };
}

export function normalizeProductionCellsV1(value:Partial<ProductionCellsV1State>|undefined):ProductionCellsV1State{
  const base=createDefaultProductionCellsV1();if(!value)return base;
  for(const id of ['refining','fabrication','heavy_assembly'] as ProductionCellIdV1[]){
    const incoming=value.cells?.[id],cell=base.cells[id];if(!incoming)continue;
    cell.selectedPlanId=validPlanForCell(id,incoming.selectedPlanId);
    cell.job=normalizeJob(incoming.job,id);
    cell.completedCycles=Math.max(0,Math.floor(Number(incoming.completedCycles)||0));
  }
  base.nextJobSerial=Math.max(1,Math.floor(Number(value.nextJobSerial)||1));
  return base;
}

export function productionStaffingEffectV1(cellId:ProductionCellIdV1,role:ProductionStaffRoleV1,rank=1):number{
  const r=Math.max(1,Math.min(5,Math.floor(rank)||1));
  if(role==='operator')return Math.max(.68,1/(1.18+.06*(r-1)));
  if(role==='technician'&&(cellId==='fabrication'||cellId==='heavy_assembly'))return Math.max(.76,.90-.03*(r-1));
  if(role==='logistician'&&cellId==='refining')return Math.max(.84,.96-.02*(r-1));
  return 1;
}

export function setProductionPlanV1(state:ProductionCellsV1State,cellId:ProductionCellIdV1,planId:ProductionPlanIdV1):boolean{
  const plan=PRODUCTION_PLANS_V1[planId],cell=state.cells[cellId];if(!cell||!plan||plan.cellId!==cellId||cell.job)return false;
  cell.selectedPlanId=planId;return true;
}

export function missingInputsV1(stock:IndustrialStockV1,inputs:IndustrialStockDeltaV1):IndustrialStockDeltaV1{
  const missing:IndustrialStockDeltaV1={};
  for(const [rawKey,rawNeed] of Object.entries(inputs) as [IndustrialStockKeyV1,number][]){
    const need=Math.max(0,Number(rawNeed)||0),have=Math.max(0,Number(stock[rawKey])||0);if(have+1e-9<need)missing[rawKey]=need-have;
  }
  return missing;
}

export function startProductionCellV1(
  state:ProductionCellsV1State,cellId:ProductionCellIdV1,stock:IndustrialStockV1,
  staffing:Partial<ProductionStaffSnapshotV1>={},now=Date.now()
):ProductionStartResultV1{
  const cell=state.cells[cellId];if(cell.job)return{ok:false,reason:'busy'};
  const plan=PRODUCTION_PLANS_V1[cell.selectedPlanId],missing=missingInputsV1(stock,plan.inputs);
  if(Object.keys(missing).length)return{ok:false,reason:'missing_input',missing};
  for(const [key,amount] of Object.entries(plan.inputs) as [IndustrialStockKeyV1,number][])stock[key]=Math.max(0,stock[key]-amount);
  const role=(staffing.role??'none') as ProductionStaffRoleV1,rank=Math.max(0,Math.min(5,Math.floor(Number(staffing.rank)||0)));
  const durationFactor=productionStaffingEffectV1(cellId,role,rank||1),durationMs=Math.max(1000,Math.round(plan.baseDurationSec*durationFactor*1000));
  const job:ProductionCellJobV1={
    id:`pcv1-${state.nextJobSerial++}`,planId:plan.id,startedAt:now,endsAt:now+durationMs,
    inputs:{...plan.inputs},outputs:{...plan.outputs},
    staffing:{workerId:staffing.workerId??null,workerName:staffing.workerName??null,role,rank,durationFactor}
  };
  cell.job=job;return{ok:true,job};
}

export function advanceProductionCellsV1(state:ProductionCellsV1State,stock:IndustrialStockV1,now=Date.now()):ProductionCompletionV1[]{
  const completed:ProductionCompletionV1[]=[];
  for(const cell of Object.values(state.cells)){
    const job=cell.job;if(!job||job.endsAt>now)continue;
    for(const [key,amount] of Object.entries(job.outputs) as [IndustrialStockKeyV1,number][])stock[key]+=amount;
    completed.push({cellId:cell.id,planId:job.planId,jobId:job.id,outputs:{...job.outputs}});cell.job=null;cell.completedCycles++;
  }
  return completed;
}

export function productionCellProjectionV1(state:ProductionCellsV1State,cellId:ProductionCellIdV1,stock:IndustrialStockV1,now=Date.now()):ProductionCellProjectionV1{
  const cell=state.cells[cellId],plan=PRODUCTION_PLANS_V1[cell.selectedPlanId],job=cell.job;
  if(job){
    const span=Math.max(1,job.endsAt-job.startedAt),progress=Math.max(0,Math.min(1,(now-job.startedAt)/span));
    return{id:cellId,label:PRODUCTION_CELL_LABELS_V1[cellId],selectedPlan:plan,status:'running',bottleneck:'busy',missing:{},job:{...job},progress,remainingSec:Math.max(0,(job.endsAt-now)/1000)};
  }
  const missing=missingInputsV1(stock,plan.inputs),blocked=Object.keys(missing).length>0;
  return{id:cellId,label:PRODUCTION_CELL_LABELS_V1[cellId],selectedPlan:plan,status:blocked?'blocked':'ready',bottleneck:blocked?'missing_input':'none',missing,job:null,progress:0,remainingSec:0};
}
