import type {ResourceKind} from './sim.ts';
import type {ZoneId} from './midgame.ts';
import type {BusinessStageId} from './business_stage.ts';
import {runtimeBaseStorageFreeKg} from './base_storage_v1.ts';

export type WorkerRoleV3='scavenger'|'operator'|'logistician'|'technician';
export type WorkerStatusV3='idle'|'route'|'production';
export type VehicleTypeV3='van'|'truck'|'recovery_rig';

export interface WorkerV3{
  id:string;
  name:string;
  rank:1|2|3|4|5;
  role:WorkerRoleV3;
  status:WorkerStatusV3;
  routeId:string|null;
  productionCellId:string|null;
  hiredAt:number;
}

export interface FleetVehicleV3{
  id:string;
  type:VehicleTypeV3;
  name:string;
  capacityKg:number;
  routeId:string|null;
  acquiredAt:number;
}

export interface RouteV3{
  id:string;
  zone:ZoneId;
  workerIds:string[];
  vehicleId:string|null;
  startedAt:number;
  shiftEndsAt:number;
  deliveredKg:number;
}

export interface WorkforceFleetV3State{
  version:3;
  nextWorkerSerial:number;
  nextVehicleSerial:number;
  nextRouteSerial:number;
  workers:WorkerV3[];
  fleet:FleetVehicleV3[];
  routes:RouteV3[];
  lastSimulatedAt:number;
}

export interface WorkforceBenchmarkV3{
  resources:Record<ResourceKind,number>;
  durationMs:number;
}

export interface RouteEconomyContextV3{
  stage:BusinessStageId;
  now:number;
  offline:boolean;
  offlineCapHours:number;
  workerOutputMultiplier:number;
  workerShiftMultiplier:number;
  benchmarks?:Partial<Record<ZoneId,WorkforceBenchmarkV3>>;
  baseStorageFreeKg?:number;
}

export interface RouteProjectionV3{
  routeId:string;
  zone:ZoneId;
  workerNames:string[];
  vehicleName:string|null;
  kgPerHour:number;
  valuePerHour:number;
  capacityKg:number;
  shiftHours:number;
  bottleneck:'none'|'no_worker'|'no_vehicle'|'capacity'|'shift'|'base_storage';
}

export interface RouteSimulationReportV3 extends RouteProjectionV3{
  elapsedHours:number;
  workedHours:number;
  gained:Record<ResourceKind,number>;
  gainedKg:number;
  stopReason:'running'|'shift_ended'|'vehicle_full'|'base_storage_full'|'no_worker';
}

export const WORKER_CAPACITY_BY_STAGE:Record<BusinessStageId,number>={
  starter_garage:1,
  equipped_garage:2,
  workforce_garage:3,
  hangar:5,
  salvage_yard:8,
  industrial_workshop:12,
  processing_plant:16
};

export const FLEET_CAPACITY_BY_STAGE:Record<BusinessStageId,number>={
  starter_garage:0,
  equipped_garage:1,
  workforce_garage:2,
  hangar:4,
  salvage_yard:7,
  industrial_workshop:10,
  processing_plant:14
};

export const VEHICLE_SPECS:Record<VehicleTypeV3,{label:string;capacityKg:number;throughputMultiplier:number;minStage:BusinessStageId}>={
  van:{label:'Фургон',capacityKg:400,throughputMultiplier:1.25,minStage:'equipped_garage'},
  truck:{label:'Грузовик',capacityKg:1000,throughputMultiplier:1.50,minStage:'hangar'},
  recovery_rig:{label:'Recovery Rig',capacityKg:1800,throughputMultiplier:1.75,minStage:'salvage_yard'}
};

const ZONE_RATES:Record<ZoneId,Record<ResourceKind,number>>={
  z1:{metal:76,copper:5,plastic:14},
  z2:{metal:68,copper:8.5,plastic:11},
  z3:{metal:96,copper:9,plastic:14},
  z4:{metal:118,copper:11,plastic:10},
  z5:{metal:145,copper:13,plastic:8},
  z6:{metal:162,copper:14,plastic:6},
  z7:{metal:185,copper:15,plastic:5},
  z8:{metal:210,copper:17,plastic:4}
};

const RAW_VALUE:Record<ResourceKind,number>={metal:8,copper:60,plastic:5};
const STAGE_RANK:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};

export function createDefaultWorkforceFleetV3(now=Date.now()):WorkforceFleetV3State{
  return{version:3,nextWorkerSerial:1,nextVehicleSerial:1,nextRouteSerial:1,workers:[],fleet:[],routes:[],lastSimulatedAt:now};
}

export function normalizeWorkforceFleetV3(value:Partial<WorkforceFleetV3State>|undefined,now=Date.now()):WorkforceFleetV3State{
  const base=createDefaultWorkforceFleetV3(now);
  if(!value)return base;
  const workers=(value.workers??[]).filter(Boolean).map((worker,index):WorkerV3=>({
    id:String(worker.id??`w${index+1}`),
    name:String(worker.name??`Рабочий ${index+1}`),
    rank:Math.max(1,Math.min(5,Math.floor(Number(worker.rank)||1))) as WorkerV3['rank'],
    role:['scavenger','operator','logistician','technician'].includes(String(worker.role))?worker.role as WorkerRoleV3:'scavenger',
    status:['idle','route','production'].includes(String(worker.status))?worker.status as WorkerStatusV3:'idle',
    routeId:typeof worker.routeId==='string'?worker.routeId:null,
    productionCellId:typeof worker.productionCellId==='string'?worker.productionCellId:null,
    hiredAt:Number(worker.hiredAt)||now
  }));
  const fleet=(value.fleet??[]).filter(Boolean).map((vehicle,index):FleetVehicleV3=>{
    const type=(['van','truck','recovery_rig'].includes(String(vehicle.type))?vehicle.type:'van') as VehicleTypeV3;
    return{id:String(vehicle.id??`vehicle-${index+1}`),type,name:String(vehicle.name??`${VEHICLE_SPECS[type].label} #${index+1}`),capacityKg:Math.max(1,Number(vehicle.capacityKg)||VEHICLE_SPECS[type].capacityKg),routeId:typeof vehicle.routeId==='string'?vehicle.routeId:null,acquiredAt:Number(vehicle.acquiredAt)||now};
  });
  const workerIds=new Set(workers.map(worker=>worker.id)),vehicleIds=new Set(fleet.map(vehicle=>vehicle.id));
  const routes=(value.routes??[]).filter(Boolean).map((route,index):RouteV3=>({
    id:String(route.id??`route-${index+1}`),zone:(['z1','z2','z3','z4','z5','z6','z7','z8'].includes(String(route.zone))?route.zone:'z1') as ZoneId,
    workerIds:(route.workerIds??[]).filter(id=>workerIds.has(id)),vehicleId:route.vehicleId&&vehicleIds.has(route.vehicleId)?route.vehicleId:null,
    startedAt:Number(route.startedAt)||now,shiftEndsAt:Number(route.shiftEndsAt)||now+2*3600_000,deliveredKg:Math.max(0,Number(route.deliveredKg)||0)
  }));
  return{
    version:3,
    nextWorkerSerial:Math.max(workers.length+1,Number(value.nextWorkerSerial)||1),
    nextVehicleSerial:Math.max(fleet.length+1,Number(value.nextVehicleSerial)||1),
    nextRouteSerial:Math.max(routes.length+1,Number(value.nextRouteSerial)||1),
    workers,fleet,routes,lastSimulatedAt:Number(value.lastSimulatedAt)||now
  };
}

export function workerCapacityForStage(stage:BusinessStageId):number{return WORKER_CAPACITY_BY_STAGE[stage]}
export function fleetCapacityForStage(stage:BusinessStageId):number{return FLEET_CAPACITY_BY_STAGE[stage]}
export function canUseVehicleType(stage:BusinessStageId,type:VehicleTypeV3):boolean{return STAGE_RANK[stage]>=STAGE_RANK[VEHICLE_SPECS[type].minStage]}
export const WORKER_HIRE_COST_BANDS=[
  {min:0,max:2,cost:35_000,label:'Гараж',nextAt:3},
  {min:3,max:4,cost:55_000,label:'Ангар',nextAt:5},
  {min:5,max:7,cost:90_000,label:'Площадка разборки',nextAt:8},
  {min:8,max:11,cost:140_000,label:'Промышленная мастерская',nextAt:12},
  {min:12,max:Number.POSITIVE_INFINITY,cost:220_000,label:'Перерабатывающий завод',nextAt:null}
] as const;
export function workerHireBandForCount(workerCount:number){
  const count=Math.max(0,Math.floor(Number(workerCount)||0));
  return WORKER_HIRE_COST_BANDS.find(band=>count>=band.min&&count<=band.max)??WORKER_HIRE_COST_BANDS.at(-1)!;
}
export function nextWorkerHireCost(state:WorkforceFleetV3State):number{return workerHireBandForCount(state.workers.length).cost}

export function hireWorkerV3(state:WorkforceFleetV3State,stage:BusinessStageId,now=Date.now()):WorkerV3|null{
  if(state.workers.length>=workerCapacityForStage(stage))return null;
  const serial=state.nextWorkerSerial++;
  const worker:WorkerV3={id:`worker-${serial}`,name:`Рабочий ${serial}`,rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:now};
  state.workers.push(worker);return worker;
}

export function trainWorkerV3(state:WorkforceFleetV3State,workerId:string):boolean{
  const worker=state.workers.find(item=>item.id===workerId);if(!worker||worker.rank>=5)return false;
  worker.rank=(worker.rank+1) as WorkerV3['rank'];return true;
}

export function setWorkerRoleV3(state:WorkforceFleetV3State,workerId:string,role:WorkerRoleV3):boolean{
  const worker=state.workers.find(item=>item.id===workerId);if(!worker)return false;
  if(worker.routeId){const route=state.routes.find(item=>item.id===worker.routeId);if(route)route.workerIds=route.workerIds.filter(id=>id!==workerId);worker.routeId=null}
  worker.productionCellId=null;worker.role=role;worker.status='idle';return true;
}

export function acquireVehicleV3(state:WorkforceFleetV3State,stage:BusinessStageId,type:VehicleTypeV3,now=Date.now()):FleetVehicleV3|null{
  if(state.fleet.length>=fleetCapacityForStage(stage)||!canUseVehicleType(stage,type))return null;
  const serial=state.nextVehicleSerial++,spec=VEHICLE_SPECS[type];
  const count=state.fleet.filter(item=>item.type===type).length+1;
  const vehicle:FleetVehicleV3={id:`vehicle-${serial}`,type,name:`${spec.label} #${count}`,capacityKg:spec.capacityKg,routeId:null,acquiredAt:now};
  state.fleet.push(vehicle);return vehicle;
}

export function createOrAssignRouteV3(state:WorkforceFleetV3State,args:{workerId:string;zone:ZoneId;vehicleId?:string|null;shiftHours?:number;now?:number}):RouteV3|null{
  const now=args.now??Date.now(),worker=state.workers.find(item=>item.id===args.workerId);if(!worker||!['scavenger','logistician'].includes(worker.role))return null;
  const vehicle=args.vehicleId?state.fleet.find(item=>item.id===args.vehicleId):undefined;
  if(args.vehicleId&&!vehicle)return null;
  if(vehicle?.routeId&&vehicle.routeId!==worker.routeId)return null;
  if(worker.routeId){const old=state.routes.find(item=>item.id===worker.routeId);if(old){old.workerIds=old.workerIds.filter(id=>id!==worker.id);if(old.vehicleId){const oldVehicle=state.fleet.find(item=>item.id===old.vehicleId);if(oldVehicle)oldVehicle.routeId=null}if(!old.workerIds.length)state.routes=state.routes.filter(item=>item.id!==old.id)}}
  const serial=state.nextRouteSerial++,route:RouteV3={id:`route-${serial}`,zone:args.zone,workerIds:[worker.id],vehicleId:vehicle?.id??null,startedAt:now,shiftEndsAt:now+Math.max(.25,args.shiftHours??2)*3600_000,deliveredKg:0};
  state.routes.push(route);worker.routeId=route.id;worker.productionCellId=null;worker.status='route';if(vehicle)vehicle.routeId=route.id;return route;
}

export function unassignRouteV3(state:WorkforceFleetV3State,routeId:string):boolean{
  const route=state.routes.find(item=>item.id===routeId);if(!route)return false;
  for(const workerId of route.workerIds){const worker=state.workers.find(item=>item.id===workerId);if(worker){worker.routeId=null;worker.status='idle'}}
  if(route.vehicleId){const vehicle=state.fleet.find(item=>item.id===route.vehicleId);if(vehicle)vehicle.routeId=null}
  state.routes=state.routes.filter(item=>item.id!==routeId);return true;
}

function benchmarkRates(zone:ZoneId,benchmarks?:Partial<Record<ZoneId,WorkforceBenchmarkV3>>):Record<ResourceKind,number>{
  const benchmark=benchmarks?.[zone];if(!benchmark||benchmark.durationMs<=0)return ZONE_RATES[zone];
  const hours=benchmark.durationMs/3600_000;return{metal:benchmark.resources.metal/hours,copper:benchmark.resources.copper/hours,plastic:benchmark.resources.plastic/hours};
}
function rankMultiplier(rank:number):number{return 1+(Math.max(1,Math.min(5,rank))-1)*.10}
function baseStorageFreeKg(ctx:RouteEconomyContextV3):number{return Number.isFinite(ctx.baseStorageFreeKg)?Math.max(0,Number(ctx.baseStorageFreeKg)):runtimeBaseStorageFreeKg(ctx.stage)}

export function projectRouteV3(state:WorkforceFleetV3State,route:RouteV3,ctx:RouteEconomyContextV3):RouteProjectionV3{
  const workers=route.workerIds.map(id=>state.workers.find(item=>item.id===id)).filter(Boolean) as WorkerV3[];
  const vehicle=route.vehicleId?state.fleet.find(item=>item.id===route.vehicleId):undefined;
  if(!workers.length)return{routeId:route.id,zone:route.zone,workerNames:[],vehicleName:vehicle?.name??null,kgPerHour:0,valuePerHour:0,capacityKg:vehicle?.capacityKg??150,shiftHours:0,bottleneck:'no_worker'};
  const base=benchmarkRates(route.zone,ctx.benchmarks),baseKg=base.metal+base.copper+base.plastic;
  const workerFactor=workers.reduce((sum,worker)=>sum+rankMultiplier(worker.rank)*(worker.role==='logistician'?1.08:1),0);
  const vehicleFactor=vehicle?VEHICLE_SPECS[vehicle.type].throughputMultiplier:.72;
  const kgPerHour=baseKg*workerFactor*vehicleFactor*Math.max(.25,ctx.workerOutputMultiplier);
  const baseValue=base.metal*RAW_VALUE.metal+base.copper*RAW_VALUE.copper+base.plastic*RAW_VALUE.plastic;
  const valuePerHour=baseValue*workerFactor*vehicleFactor*Math.max(.25,ctx.workerOutputMultiplier);
  const capacityKg=(vehicle?.capacityKg??150)*(workers.some(worker=>worker.role==='logistician')?1.12:1);
  const rawShift=(route.shiftEndsAt-route.startedAt)/3600_000;
  const shiftHours=Math.max(.25,rawShift)*Math.max(.5,ctx.workerShiftMultiplier);
  const storageFull=baseStorageFreeKg(ctx)<=.001;
  const bottleneck:RouteProjectionV3['bottleneck']=storageFull?'base_storage':!vehicle&&kgPerHour*shiftHours>150?'no_vehicle':kgPerHour*shiftHours>capacityKg?'capacity':'none';
  return{routeId:route.id,zone:route.zone,workerNames:workers.map(worker=>worker.name),vehicleName:vehicle?.name??null,kgPerHour,valuePerHour,capacityKg,shiftHours,bottleneck};
}

export function simulateWorkforceV3(state:WorkforceFleetV3State,ctx:RouteEconomyContextV3):{reports:RouteSimulationReportV3[];total:Record<ResourceKind,number>}{
  const from=state.lastSimulatedAt,to=Math.max(from,ctx.now),elapsedHours=Math.max(0,(to-from)/3600_000),total:Record<ResourceKind,number>={metal:0,copper:0,plastic:0},reports:RouteSimulationReportV3[]=[];
  let storageRemaining=baseStorageFreeKg(ctx);
  for(const route of state.routes){
    const projection=projectRouteV3(state,route,{...ctx,baseStorageFreeKg:storageRemaining}),rates=benchmarkRates(route.zone,ctx.benchmarks),baseKg=rates.metal+rates.copper+rates.plastic;
    if(projection.kgPerHour<=0||baseKg<=0){reports.push({...projection,elapsedHours,workedHours:0,gained:{metal:0,copper:0,plastic:0},gainedKg:0,stopReason:'no_worker'});continue}
    const offlineLimit=ctx.offline?Math.max(0,ctx.offlineCapHours):Infinity,shiftRemaining=Math.max(0,(route.shiftEndsAt-from)/3600_000)*Math.max(.5,ctx.workerShiftMultiplier),capacityRemaining=Math.max(0,projection.capacityKg-route.deliveredKg),capacityHours=capacityRemaining/projection.kgPerHour,storageHours=storageRemaining/projection.kgPerHour;
    const workedHours=Math.max(0,Math.min(elapsedHours,offlineLimit,shiftRemaining,capacityHours,storageHours));
    const gainedKg=projection.kgPerHour*workedHours,scale=gainedKg/baseKg;
    const gained={metal:rates.metal*scale,copper:rates.copper*scale,plastic:rates.plastic*scale};
    for(const key of Object.keys(total) as ResourceKind[])total[key]+=gained[key];
    route.deliveredKg+=gainedKg;storageRemaining=Math.max(0,storageRemaining-gainedKg);
    const stopReason:RouteSimulationReportV3['stopReason']=workedHours+1e-9<elapsedHours?(storageHours<=workedHours+1e-9?'base_storage_full':capacityHours<=workedHours+1e-9?'vehicle_full':shiftRemaining<=workedHours+1e-9?'shift_ended':'running'):'running';
    reports.push({...projection,elapsedHours,workedHours,gained,gainedKg,stopReason});
  }
  state.lastSimulatedAt=to;return{reports,total};
}

export interface LegacyWorkforceMigrationInputV3{
  first?:{hired:boolean;assignment:ZoneId|null};
  second?:{hired:boolean;assignment:ZoneId|null};
  third?:{hired:boolean;role:'scavenger'|'operator';assignment:ZoneId|null};
  fourth?:{hired:boolean;role:'scavenger'|'operator';assignment:ZoneId|null};
  vanOwned?:boolean;
  truckOwned?:boolean;
  rigOwned?:boolean;
  vanWorkerLegacySlot?:'w1'|'w2'|'w3'|'w4'|null;
}

export function migrateLegacyWorkforceV3(input:LegacyWorkforceMigrationInputV3,now=Date.now()):WorkforceFleetV3State{
  const state=createDefaultWorkforceFleetV3(now),legacy=[input.first,input.second,input.third,input.fourth];
  legacy.forEach((item,index)=>{
    if(!item?.hired)return;
    const worker=hireWorkerV3(state,'processing_plant',now)!;
    const legacyRole=('role' in item&&item.role==='operator')?'operator':'scavenger';
    worker.name=`Рабочий ${index+1}`;worker.role=legacyRole;
  });
  if(input.vanOwned)acquireVehicleV3(state,'processing_plant','van',now);
  if(input.truckOwned)acquireVehicleV3(state,'processing_plant','truck',now);
  if(input.rigOwned)acquireVehicleV3(state,'processing_plant','recovery_rig',now);
  const slotToWorker=(slot:number)=>state.workers[slot];
  legacy.forEach((item,index)=>{if(!item?.hired||!item.assignment)return;const worker=slotToWorker(index);if(!worker||worker.role==='operator')return;let vehicleId:string|null=null;if(input.vanWorkerLegacySlot===`w${index+1}`)vehicleId=state.fleet.find(vehicle=>vehicle.type==='van')?.id??null;createOrAssignRouteV3(state,{workerId:worker.id,zone:item.assignment,vehicleId,now})});
  return state;
}