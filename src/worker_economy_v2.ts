import type { ComponentKind, ResourceKind } from './sim.ts';

export type EconomyZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7'|'z8';
export type WorkerSlotId='w1'|'w2'|'w3'|'w4';

export interface WorkerBenchmark{
  durationMs:number;
  destroyed:number;
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  valuePerMin:number;
  recordedAt:number;
}

export interface BenchmarkCandidate{
  durationMs:number;
  destroyed:number;
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  devGranted?:boolean;
}

export interface WorkerShiftState{
  remainingOfflineMs:number;
  lastAccountedAt:number;
  componentRemainder:Record<ComponentKind,number>;
}

export interface WorkerEconomyV2State{
  benchmarks:Partial<Record<EconomyZoneId,WorkerBenchmark>>;
  medals:Record<EconomyZoneId,boolean>;
  shifts:Record<WorkerSlotId,WorkerShiftState>;
  vanWorker:WorkerSlotId|null;
}

export interface WorkerEconomyGain{
  hours:number;
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  weight:number;
  source:'benchmark'|'legacy'|'none';
  activeShare:number;
  offlineRemainingHours:number;
}

export const WORKER_SHIFT_HOURS=2;
export const WORKER_SHIFT_MS=WORKER_SHIFT_HOURS*3_600_000;
export const WORKER_PARCEL_MINUTES=10;
export const WORKER_COMPONENT_FACTOR=.35;
export const VAN_PARCEL_MULTIPLIER=1.35;
const RAW_VALUE:Record<ResourceKind,number>={metal:8,copper:60,plastic:5};
const ZONES:EconomyZoneId[]=['z1','z2','z3','z4','z5','z6','z7','z8'];
const SLOTS:WorkerSlotId[]=['w1','w2','w3','w4'];

const emptyResources=():Record<ResourceKind,number>=>({metal:0,copper:0,plastic:0});
const emptyComponents=():Record<ComponentKind,number>=>({bearing:0,motor:0,hydraulic:0,electronics:0});
const createShift=(now:number):WorkerShiftState=>({remainingOfflineMs:WORKER_SHIFT_MS,lastAccountedAt:now,componentRemainder:emptyComponents()});
const normalizeShiftBudget=(value:unknown):number=>{
  const parsed=Number(value);
  return Number.isFinite(parsed)?Math.max(0,Math.min(WORKER_SHIFT_MS,parsed)):WORKER_SHIFT_MS;
};

export function createDefaultWorkerEconomy(now=Date.now()):WorkerEconomyV2State{
  return{
    benchmarks:{},
    medals:{z1:false,z2:false,z3:false,z4:false,z5:false,z6:false,z7:false,z8:false},
    shifts:{w1:createShift(now),w2:createShift(now),w3:createShift(now),w4:createShift(now)},
    vanWorker:null
  };
}

export function normalizeWorkerEconomy(value:Partial<WorkerEconomyV2State>|undefined,now=Date.now()):WorkerEconomyV2State{
  const base=createDefaultWorkerEconomy(now);
  if(!value)return base;
  const benchmarks:Partial<Record<EconomyZoneId,WorkerBenchmark>>={};
  for(const zone of ZONES){
    const raw=value.benchmarks?.[zone];
    if(!raw)continue;
    benchmarks[zone]={
      durationMs:Math.max(1,Number(raw.durationMs)||1),
      destroyed:Math.max(0,Math.floor(Number(raw.destroyed)||0)),
      resources:{...emptyResources(),...raw.resources},
      components:{...emptyComponents(),...raw.components},
      valuePerMin:Math.max(0,Number(raw.valuePerMin)||0),
      recordedAt:Number(raw.recordedAt)||now
    };
  }
  const shifts={} as Record<WorkerSlotId,WorkerShiftState>;
  for(const slot of SLOTS){
    const raw=value.shifts?.[slot];
    shifts[slot]={
      remainingOfflineMs:normalizeShiftBudget(raw?.remainingOfflineMs),
      lastAccountedAt:Number(raw?.lastAccountedAt)||now,
      componentRemainder:{...emptyComponents(),...raw?.componentRemainder}
    };
  }
  const vanWorker=SLOTS.includes(value.vanWorker as WorkerSlotId)?value.vanWorker as WorkerSlotId:null;
  return{
    benchmarks,
    medals:{...base.medals,...value.medals},
    shifts,
    vanWorker
  };
}

export function benchmarkValuePerMin(candidate:BenchmarkCandidate):number{
  const minutes=Math.max(candidate.durationMs/60_000,1/60);
  const value=(Object.keys(RAW_VALUE) as ResourceKind[]).reduce((sum,key)=>sum+Math.max(0,candidate.resources[key])*RAW_VALUE[key],0);
  return value/minutes;
}

export function benchmarkEligible(candidate:BenchmarkCandidate):boolean{
  return !candidate.devGranted&&candidate.destroyed>=20&&candidate.durationMs>=45_000&&candidate.durationMs<=45*60_000;
}

export function recordActiveBenchmark(state:WorkerEconomyV2State,zone:EconomyZoneId,candidate:BenchmarkCandidate,now=Date.now()):{accepted:boolean;newBest:boolean;benchmark?:WorkerBenchmark}{
  if(!benchmarkEligible(candidate))return{accepted:false,newBest:false};
  const valuePerMin=benchmarkValuePerMin(candidate);
  const next:WorkerBenchmark={
    durationMs:candidate.durationMs,
    destroyed:candidate.destroyed,
    resources:{...candidate.resources},
    components:{...candidate.components},
    valuePerMin,
    recordedAt:now
  };
  const previous=state.benchmarks[zone];
  const newBest=!previous||valuePerMin>previous.valuePerMin*1.005;
  if(newBest)state.benchmarks[zone]=next;
  return{accepted:true,newBest,benchmark:newBest?next:previous};
}

export function awardClearMedal(state:WorkerEconomyV2State,zone:EconomyZoneId):boolean{
  if(state.medals[zone])return false;
  state.medals[zone]=true;return true;
}
export function hasClearMedal(state:WorkerEconomyV2State,zone:EconomyZoneId):boolean{return !!state.medals[zone]}

export function dispatchWorkerShifts(state:WorkerEconomyV2State,slots:ReadonlyArray<WorkerSlotId>,now=Date.now()):void{
  for(const slot of slots){
    const shift=state.shifts[slot];
    shift.remainingOfflineMs=WORKER_SHIFT_MS;
    shift.lastAccountedAt=now;
  }
}

export function setVanWorker(state:WorkerEconomyV2State,slot:WorkerSlotId|null):void{state.vanWorker=slot}
export function vanAssignedToWorker(state:WorkerEconomyV2State):boolean{return state.vanWorker!==null}

export function workerParcelFraction(durationMin:number,van:boolean):number{
  const safe=Math.max(durationMin,1e-6),base=Math.min(.50,2.20/safe);
  if(!van)return base;
  return Math.min(base*VAN_PARCEL_MULTIPLIER,.65,3.00/safe);
}

function legacyGain(rates:Record<ResourceKind,number>,hours:number):Record<ResourceKind,number>{
  return{metal:rates.metal*hours,copper:rates.copper*hours,plastic:rates.plastic*hours};
}

export function simulateBenchmarkedWorker(args:{
  state:WorkerEconomyV2State;
  slot:WorkerSlotId;
  zone:EconomyZoneId|null;
  lastTick:number;
  now?:number;
  offline?:boolean;
  discoveredComponents?:ReadonlyArray<ComponentKind>;
  legacyRates?:Record<ResourceKind,number>;
}):WorkerEconomyGain&{lastTick:number}{
  const now=args.now??Date.now(),empty:WorkerEconomyGain&{lastTick:number}={hours:0,resources:emptyResources(),components:emptyComponents(),weight:0,source:'none',activeShare:0,offlineRemainingHours:args.state.shifts[args.slot].remainingOfflineMs/3_600_000,lastTick:now};
  if(!args.zone)return empty;
  const elapsedMs=Math.max(0,now-args.lastTick);
  if(elapsedMs<=0)return{...empty,lastTick:now};
  const shift=args.state.shifts[args.slot];
  const creditMs=args.offline?Math.min(elapsedMs,shift.remainingOfflineMs):elapsedMs;
  if(args.offline)shift.remainingOfflineMs=Math.max(0,shift.remainingOfflineMs-creditMs);
  shift.lastAccountedAt=now;
  const hours=creditMs/3_600_000;
  if(hours<=0)return{...empty,offlineRemainingHours:shift.remainingOfflineMs/3_600_000,lastTick:now};

  const benchmark=args.state.benchmarks[args.zone];
  if(!benchmark){
    if(!args.legacyRates)return{...empty,hours,offlineRemainingHours:shift.remainingOfflineMs/3_600_000,lastTick:now};
    const resources=legacyGain(args.legacyRates,hours),weight=resources.metal+resources.copper+resources.plastic;
    return{hours,resources,components:emptyComponents(),weight,source:'legacy',activeShare:0,offlineRemainingHours:shift.remainingOfflineMs/3_600_000,lastTick:now};
  }

  const durationMin=benchmark.durationMs/60_000,van=args.state.vanWorker===args.slot,fraction=workerParcelFraction(durationMin,van),parcelsPerHour=60/WORKER_PARCEL_MINUTES;
  const scale=fraction*parcelsPerHour*hours;
  const resources:Record<ResourceKind,number>={
    metal:benchmark.resources.metal*scale,
    copper:benchmark.resources.copper*scale,
    plastic:benchmark.resources.plastic*scale
  };
  const components=emptyComponents(),discovered=new Set(args.discoveredComponents??[]);
  for(const kind of Object.keys(components) as ComponentKind[]){
    if(!discovered.has(kind))continue;
    const raw=benchmark.components[kind]*scale*WORKER_COMPONENT_FACTOR+shift.componentRemainder[kind];
    const whole=Math.floor(raw+1e-9);components[kind]=whole;shift.componentRemainder[kind]=raw-whole;
  }
  const weight=resources.metal+resources.copper+resources.plastic;
  const activeKgH=(benchmark.resources.metal+benchmark.resources.copper+benchmark.resources.plastic)/Math.max(durationMin,1e-9)*60;
  const workerKgH=hours>0?weight/hours:0;
  return{
    hours,resources,components,weight,source:'benchmark',activeShare:activeKgH>0?workerKgH/activeKgH:0,
    offlineRemainingHours:shift.remainingOfflineMs/3_600_000,lastTick:now
  };
}
