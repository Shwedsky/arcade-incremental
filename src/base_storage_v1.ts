import type {BusinessStageId} from './business_stage.ts';
import type {ResourceKind} from './sim.ts';

export type RawStorageV1=Partial<Record<ResourceKind,number>>;

export const BASE_STORAGE_CAPACITY_KG:Record<BusinessStageId,number>={
  starter_garage:2_500,
  equipped_garage:4_000,
  workforce_garage:6_500,
  hangar:12_000,
  salvage_yard:30_000,
  industrial_workshop:60_000,
  processing_plant:150_000
};
const STAGE_RANK:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};

export interface BaseStoragePressureV1{
  capacityKg:number;
  storedKg:number;
  freeKg:number;
  loadRatio:number;
  full:boolean;
  nearFull:boolean;
  hoursToFull:number|null;
}

export function baseStorageCapacityKg(stage:BusinessStageId):number{return BASE_STORAGE_CAPACITY_KG[stage]}
export function baseStorageNetworkEnabled(stage:BusinessStageId):boolean{return STAGE_RANK[stage]>=STAGE_RANK.salvage_yard}

export function rawStorageKg(storage:RawStorageV1|undefined):number{
  if(!storage)return 0;
  return(['metal','copper','plastic'] as ResourceKind[]).reduce((sum,key)=>sum+Math.max(0,Number(storage[key]??0)),0);
}

export function baseStoragePressureV1(stage:BusinessStageId,storage:RawStorageV1|undefined,networkKgPerHour=0):BaseStoragePressureV1{
  const capacityKg=baseStorageCapacityKg(stage),storedKg=rawStorageKg(storage),freeKg=Math.max(0,capacityKg-storedKg),loadRatio=capacityKg>0?storedKg/capacityKg:1;
  return{capacityKg,storedKg,freeKg,loadRatio,full:freeKg<=.001,nearFull:loadRatio>=.85,hoursToFull:networkKgPerHour>0?freeKg/networkKgPerHour:null};
}

export function runtimeBaseStorageFreeKg(stage:BusinessStageId):number{
  if(!baseStorageNetworkEnabled(stage))return Infinity;
  try{
    const state=(globalThis as any).__SALVAGE_TEST__?.getState?.();
    if(!state?.storage)return Infinity;
    return baseStoragePressureV1(stage,state.storage).freeKg;
  }catch{return Infinity}
}
