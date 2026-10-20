import type {FleetVehicleV3,VehicleTypeV3,WorkforceFleetV3State} from './workforce_fleet_v3.ts';

export const VEHICLE_PURCHASE_COST:Record<VehicleTypeV3,number>={
  van:90_000,
  truck:260_000,
  recovery_rig:480_000
};

export const VEHICLE_SELL_REFUND_RATE=.60;

export interface VehicleSaleV1{
  vehicle:FleetVehicleV3;
  refund:number;
}

export function vehicleSellRefund(type:VehicleTypeV3):number{
  return Math.round(VEHICLE_PURCHASE_COST[type]*VEHICLE_SELL_REFUND_RATE);
}

export function sellVehicleV3(state:WorkforceFleetV3State,vehicleId:string):VehicleSaleV1|null{
  const index=state.fleet.findIndex(vehicle=>vehicle.id===vehicleId);
  if(index<0)return null;
  const vehicle=state.fleet[index];
  if(vehicle.routeId)return null;
  state.fleet.splice(index,1);
  return{vehicle,refund:vehicleSellRefund(vehicle.type)};
}
