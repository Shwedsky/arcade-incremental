import type {RouteProjectionV3,WorkforceFleetV3State} from './workforce_fleet_v3.ts';
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

export type FleetProjectionProviderV1=(routeId:string)=>RouteProjectionV3|null|undefined;

export function deriveFleetNetworkV1(state:WorkforceFleetV3State,project:FleetProjectionProviderV1,now=Date.now()):FleetNetworkViewV1{
  const routes=state.routes.map(route=>{
    const projection=project(route.id);
    const workers=route.workerIds.map(id=>state.workers.find(worker=>worker.id===id)).filter(Boolean);
    const vehicle=route.vehicleId?state.fleet.find(item=>item.id===route.vehicleId):undefined;
    const capacityKg=Math.max(1,Number(projection?.capacityKg??vehicle?.capacityKg??150));
    const deliveredKg=Math.max(0,Number(route.deliveredKg)||0);
    const bottleneck=(projection?.bottleneck??(!workers.length?'no_worker':!vehicle?'no_vehicle':'none')) as FleetNetworkBottleneckV1;
    return{
      routeId:route.id,
      zone:route.zone,
      workerIds:[...route.workerIds],
      workerNames:projection?.workerNames?.length?[...projection.workerNames]:workers.map(worker=>worker!.name),
      vehicleId:route.vehicleId,
      vehicleName:projection?.vehicleName??vehicle?.name??null,
      vehicleType:vehicle?.type??null,
      kgPerHour:Math.max(0,Number(projection?.kgPerHour)||0),
      valuePerHour:Math.max(0,Number(projection?.valuePerHour)||0),
      capacityKg,
      deliveredKg,
      loadRatio:Math.min(1,deliveredKg/capacityKg),
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

export const fleetNetworkBottleneckLabelV1=(value:FleetNetworkBottleneckV1)=>({
  none:'Поток сбалансирован',
  no_worker:'Нет рабочей бригады',
  no_vehicle:'Нет транспорта — малая партия',
  capacity:'Транспорт заполнится раньше конца смены',
  shift:'Смена закончится раньше загрузки'
}[value]);
