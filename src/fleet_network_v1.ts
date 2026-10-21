import {createOrAssignRouteV3,normalizeWorkforceFleetV3,projectRouteV3,type RouteProjectionV3,type WorkforceFleetV3State} from './workforce_fleet_v3.ts';
import type {ZoneId} from './midgame.ts';

export type FleetNetworkBottleneckV1='none'|'no_worker'|'no_vehicle'|'capacity'|'shift';

export interface FleetNetworkRouteV1{
  routeId:string;
  zone:ZoneId;
  workerIds:string[];
  workerNames:string[];
  vehicleId:string|null;
  vehicleName:string|null;
  vehicleType:string|null;
  kgPerHour:number;
  valuePerHour:number;
  capacityKg:number;
  deliveredKg:number;
  loadRatio:number;
  hoursToCapacity:number|null;
  shiftRemainingHours:number;
  bottleneck:FleetNetworkBottleneckV1;
}

export interface FleetNetworkSummaryV1{
  routeCount:number;
  routedWorkerCount:number;
  idleWorkerCount:number;
  assignedVehicleCount:number;
  freeVehicleCount:number;
  totalKgPerHour:number;
  totalValuePerHour:number;
  constrainedRouteCount:number;
}

export interface FleetNetworkViewV1{
  routes:FleetNetworkRouteV1[];
  summary:FleetNetworkSummaryV1;
}

export interface CrewDispatchPreviewV1{
  workerIds:string[];
  vehicleIds:string[];
  zone:ZoneId;
  routeCount:number;
  totalKgPerHour:number;
  constrainedRouteCount:number;
  unservedWorkerCount:number;
}

export type FleetProjectionProviderV1=(routeId:string)=>RouteProjectionV3|null|undefined;

export function deriveFleetNetworkV1(state:WorkforceFleetV3State,project:FleetProjectionProviderV1,now=Date.now()):FleetNetworkViewV1{
  const routes=state.routes.map(route=>{
    const projection=project(route.id);
    const workers=route.workerIds.map(id=>state.workers.find(worker=>worker.id===id)).filter(Boolean);
    const vehicle=route.vehicleId?state.fleet.find(item=>item.id===route.vehicleId):undefined;
    const capacityKg=Math.max(1,Number(projection?.capacityKg??vehicle?.capacityKg??150));
    const deliveredKg=Math.max(0,Number(route.deliveredKg)||0);
    const kgPerHour=Math.max(0,Number(projection?.kgPerHour)||0);
    const capacityRemainingKg=Math.max(0,capacityKg-deliveredKg);
    const hoursToCapacity=kgPerHour>0?capacityRemainingKg/kgPerHour:null;
    const bottleneck=(projection?.bottleneck??(!workers.length?'no_worker':!vehicle?'no_vehicle':'none')) as FleetNetworkBottleneckV1;
    return{
      routeId:route.id,
      zone:route.zone,
      workerIds:[...route.workerIds],
      workerNames:projection?.workerNames?.length?[...projection.workerNames]:workers.map(worker=>worker!.name),
      vehicleId:route.vehicleId,
      vehicleName:projection?.vehicleName??vehicle?.name??null,
      vehicleType:vehicle?.type??null,
      kgPerHour,
      valuePerHour:Math.max(0,Number(projection?.valuePerHour)||0),
      capacityKg,
      deliveredKg,
      loadRatio:Math.min(1,deliveredKg/capacityKg),
      hoursToCapacity,
      shiftRemainingHours:Math.max(0,(route.shiftEndsAt-now)/3_600_000),
      bottleneck
    } satisfies FleetNetworkRouteV1;
  }).sort((a,b)=>a.routeId.localeCompare(b.routeId));
  const routedWorkers=new Set(routes.flatMap(route=>route.workerIds));
  const assignedVehicles=new Set(routes.map(route=>route.vehicleId).filter((id):id is string=>!!id));
  return{
    routes,
    summary:{
      routeCount:routes.length,
      routedWorkerCount:routedWorkers.size,
      idleWorkerCount:state.workers.filter(worker=>worker.status==='idle').length,
      assignedVehicleCount:assignedVehicles.size,
      freeVehicleCount:state.fleet.filter(vehicle=>!vehicle.routeId).length,
      totalKgPerHour:routes.reduce((sum,route)=>sum+route.kgPerHour,0),
      totalValuePerHour:routes.reduce((sum,route)=>sum+route.valuePerHour,0),
      constrainedRouteCount:routes.filter(route=>route.bottleneck!=='none').length
    }
  };
}

export function previewCrewDispatchV1(state:WorkforceFleetV3State,args:{workerIds:string[];vehicleIds:string[];zone:ZoneId;shiftHours?:number;now?:number}):CrewDispatchPreviewV1{
  const now=args.now??Date.now(),clone=normalizeWorkforceFleetV3(state,now);
  const workers=args.workerIds.map(id=>clone.workers.find(worker=>worker.id===id)).filter(worker=>worker&&worker.status==='idle'&&['scavenger','logistician'].includes(worker.role)).sort((a,b)=>Number(b!.rank)-Number(a!.rank));
  const vehicles=args.vehicleIds.map(id=>clone.fleet.find(vehicle=>vehicle.id===id)).filter(vehicle=>vehicle&&!vehicle.routeId).sort((a,b)=>Number(b!.capacityKg)-Number(a!.capacityKg));
  const projections:RouteProjectionV3[]=[];
  workers.forEach((worker,index)=>{
    const route=createOrAssignRouteV3(clone,{workerId:worker!.id,zone:args.zone,vehicleId:vehicles[index]?.id??null,shiftHours:args.shiftHours??2,now});
    if(route)projections.push(projectRouteV3(clone,route,{stage:'salvage_yard',now,offline:false,offlineCapHours:0,workerOutputMultiplier:1,workerShiftMultiplier:1}));
  });
  return{
    workerIds:workers.map(worker=>worker!.id),
    vehicleIds:vehicles.map(vehicle=>vehicle!.id),
    zone:args.zone,
    routeCount:projections.length,
    totalKgPerHour:projections.reduce((sum,projection)=>sum+projection.kgPerHour,0),
    constrainedRouteCount:projections.filter(projection=>projection.bottleneck!=='none').length,
    unservedWorkerCount:Math.max(0,workers.length-vehicles.length)
  };
}

export const fleetNetworkBottleneckLabelV1=(value:FleetNetworkBottleneckV1)=>({
  none:'Поток сбалансирован',
  no_worker:'Нет рабочей бригады',
  no_vehicle:'Нет транспорта — малая партия',
  capacity:'Транспорт заполнится раньше конца смены',
  shift:'Смена закончится раньше загрузки'
}[value]);
