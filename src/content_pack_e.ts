import type {TargetClassId} from './sim.ts';

export type PackEZoneId='z8';
export type PackEProductionKind='alloyBillet';
export type PackEAdvancedComponent='industrialController'|'heavyHydraulicCylinder';

export interface PackEZoneProfile{
  id:PackEZoneId;
  name:string;
  description:string;
  hpMultiplier:number;
  yieldMultiplier:number;
  masteryTarget:number;
  nodeWeights:Record<TargetClassId,number>;
}

export interface PackEProductionJob{
  id:string;
  kind:PackEProductionKind;
  startedAt:number;
  endsAt:number;
  outputAmount:number;
}

export interface PackEState{
  portPowerAssemblies:number;
  portPowerPity:number;
  portPowerDiscovered:boolean;
  processingPlantOwned:boolean;
  plantLines:number;
  production:PackEProductionJob[];
}

export interface PackEFrontierContext{
  level:number;
  z7Mastered:boolean;
  industrialWorkshopOwned:boolean;
  recoveryRigOwned:boolean;
}

export interface ProcessingPlantContext{
  z8Mastered:boolean;
  industrialWorkshopOwned:boolean;
  recoveryRigOwned:boolean;
  worker4Hired:boolean;
}

export interface PackEInventory{
  cash:number;
  metal:number;
  cleanCopper:number;
  granulate:number;
  steelBlank:number;
  aluminiumBillet:number;
  alloyScrap:number;
  alloyBillet:number;
  drive:number;
  control:number;
  hydraulicPower:number;
  heavyFrame:number;
  industrialController:number;
  heavyHydraulicCylinder:number;
}

export const PACK_E_ZONE_PROFILE:PackEZoneProfile={
  id:'z8',
  name:'Портовый терминал',
  description:'Ричстакеры, рефконтейнеры, генераторы, тали и силовые шкафы. Самый тяжёлый фронтир: высокая ценность сосредоточена в крупных портовых узлах.',
  hpMultiplier:3.85,
  yieldMultiplier:2.90,
  masteryTarget:14_200,
  nodeWeights:{small_scrap:.02,cable:.04,small_appliance:.04,bike_fan:.04,medium_appliance:.26,large_appliance:.60}
};

export const Z8_MIN_LEVEL=16;
export const PORT_POWER_ASSEMBLY_PITY=8;
export const PROCESSING_PLANT_CASH=1_200_000;
export const PROCESSING_PLANT_STORAGE_KG=150_000;
export const PROCESSING_PLANT_LINES=2;
export const PLANT_ALLOY_INPUT=50;
export const PLANT_ALLOY_OUTPUT=40;
export const PLANT_ALLOY_SECONDS=300;

export const PROCESSING_PLANT_RECIPE={
  metal:720,
  cleanCopper:120,
  granulate:100,
  steelBlank:160,
  aluminiumBillet:72,
  alloyBillet:260,
  drive:5,
  control:6,
  hydraulicPower:6,
  heavyFrame:8,
  industrialController:4,
  heavyHydraulicCylinder:4,
  portPowerAssemblies:1
} as const;

export function createDefaultPackE():PackEState{
  return{portPowerAssemblies:0,portPowerPity:0,portPowerDiscovered:false,processingPlantOwned:false,plantLines:0,production:[]};
}

export function normalizePackE(value:Partial<PackEState>|undefined):PackEState{
  const base=createDefaultPackE();
  if(!value)return base;
  const processingPlantOwned=!!value.processingPlantOwned;
  const portPowerAssemblies=Math.max(0,Math.floor(Number(value.portPowerAssemblies)||0));
  const plantLines=processingPlantOwned?Math.max(1,Math.min(PROCESSING_PLANT_LINES,Math.floor(Number(value.plantLines)||PROCESSING_PLANT_LINES))):0;
  const production=(value.production??[])
    .filter(job=>job&&job.kind==='alloyBillet')
    .slice(0,plantLines)
    .map(job=>({
      id:String(job.id||`plant-${job.startedAt||0}`),kind:'alloyBillet' as const,
      startedAt:Math.max(0,Number(job.startedAt)||0),endsAt:Math.max(0,Number(job.endsAt)||0),
      outputAmount:Math.max(0,Number(job.outputAmount)||PLANT_ALLOY_OUTPUT)
    }));
  return{
    portPowerAssemblies,
    portPowerPity:Math.max(0,Math.min(PORT_POWER_ASSEMBLY_PITY-1,Math.floor(Number(value.portPowerPity)||0))),
    portPowerDiscovered:!!value.portPowerDiscovered||portPowerAssemblies>0||processingPlantOwned,
    processingPlantOwned,plantLines,production
  };
}

export function canUnlockZ8(ctx:PackEFrontierContext):{ok:boolean;reason?:string}{
  if(ctx.level<Z8_MIN_LEVEL)return{ok:false,reason:`Нужен уровень ${Z8_MIN_LEVEL}`};
  if(!ctx.z7Mastered)return{ok:false,reason:'Освой Тяжёлый парк на 100%'};
  if(!ctx.industrialWorkshopOwned)return{ok:false,reason:'Нужен Industrial Workshop'};
  if(!ctx.recoveryRigOwned)return{ok:false,reason:'Нужен Recovery Rig для портового маршрута'};
  return{ok:true};
}

export function rollPortPowerAssembly(state:PackEState,classId:TargetClassId,rng:()=>number):boolean{
  if(classId!=='large_appliance')return false;
  state.portPowerPity++;
  if(state.portPowerPity>=PORT_POWER_ASSEMBLY_PITY||rng()<.035){
    state.portPowerPity=0;state.portPowerAssemblies++;state.portPowerDiscovered=true;return true;
  }
  return false;
}

export function z8AdvancedMetalYield(classId:TargetClassId,rng:()=>number):{aluminiumScrap:number;alloyScrap:number}{
  const aluminium=({small_scrap:.04,cable:.02,small_appliance:.16,bike_fan:.22,medium_appliance:.95,large_appliance:2.20} as const)[classId];
  const alloy=({small_scrap:.10,cable:.05,small_appliance:.24,bike_fan:.34,medium_appliance:1.45,large_appliance:3.15} as const)[classId];
  return{
    aluminiumScrap:aluminium*(.86+rng()*.28),
    alloyScrap:alloy*(.88+rng()*.28)
  };
}

export function rollZ8IndustrialComponent(discovered:ReadonlyArray<PackEAdvancedComponent>,classId:TargetClassId,rng:()=>number):PackEAdvancedComponent|undefined{
  if(!['medium_appliance','large_appliance'].includes(classId)||!discovered.length)return undefined;
  const chance=classId==='large_appliance'?.07:.025;
  if(rng()>=chance)return undefined;
  const available=(['industrialController','heavyHydraulicCylinder'] as PackEAdvancedComponent[]).filter(kind=>discovered.includes(kind));
  if(!available.length)return undefined;
  return available[Math.min(available.length-1,Math.floor(rng()*available.length))];
}

export function canAcquireProcessingPlant(state:PackEState,inv:PackEInventory,ctx:ProcessingPlantContext):boolean{
  const r=PROCESSING_PLANT_RECIPE;
  return !state.processingPlantOwned&&ctx.industrialWorkshopOwned&&ctx.recoveryRigOwned&&ctx.z8Mastered&&ctx.worker4Hired&&
    inv.cash>=PROCESSING_PLANT_CASH&&inv.metal>=r.metal&&inv.cleanCopper>=r.cleanCopper&&inv.granulate>=r.granulate&&
    inv.steelBlank>=r.steelBlank&&inv.aluminiumBillet>=r.aluminiumBillet&&inv.alloyBillet>=r.alloyBillet&&
    inv.drive>=r.drive&&inv.control>=r.control&&inv.hydraulicPower>=r.hydraulicPower&&inv.heavyFrame>=r.heavyFrame&&
    inv.industrialController>=r.industrialController&&inv.heavyHydraulicCylinder>=r.heavyHydraulicCylinder&&
    state.portPowerAssemblies>=r.portPowerAssemblies;
}

export function acquireProcessingPlant(state:PackEState,inv:PackEInventory,ctx:ProcessingPlantContext):boolean{
  if(!canAcquireProcessingPlant(state,inv,ctx))return false;
  const r=PROCESSING_PLANT_RECIPE;
  inv.cash-=PROCESSING_PLANT_CASH;inv.metal-=r.metal;inv.cleanCopper-=r.cleanCopper;inv.granulate-=r.granulate;
  inv.steelBlank-=r.steelBlank;inv.aluminiumBillet-=r.aluminiumBillet;inv.alloyBillet-=r.alloyBillet;
  inv.drive-=r.drive;inv.control-=r.control;inv.hydraulicPower-=r.hydraulicPower;inv.heavyFrame-=r.heavyFrame;
  inv.industrialController-=r.industrialController;inv.heavyHydraulicCylinder-=r.heavyHydraulicCylinder;
  state.portPowerAssemblies-=r.portPowerAssemblies;state.processingPlantOwned=true;state.plantLines=PROCESSING_PLANT_LINES;return true;
}

export function canStartPlantAlloy(state:PackEState,alloyScrap:number):boolean{
  return state.processingPlantOwned&&state.plantLines>0&&state.production.length<state.plantLines&&alloyScrap>=PLANT_ALLOY_INPUT;
}

export function startPlantAlloy(state:PackEState,alloy:{value:number},now=Date.now()):boolean{
  if(!canStartPlantAlloy(state,alloy.value))return false;
  alloy.value-=PLANT_ALLOY_INPUT;
  const serial=state.production.reduce((max,job)=>Math.max(max,Number(job.id.split('-').at(-1))||0),0)+1;
  state.production.push({id:`plant-alloy-${now}-${serial}`,kind:'alloyBillet',startedAt:now,endsAt:now+PLANT_ALLOY_SECONDS*1000,outputAmount:PLANT_ALLOY_OUTPUT});
  return true;
}

export function advancePlantProduction(state:PackEState,alloyBillet:{value:number},now=Date.now()):number{
  let completed=0;
  const waiting:PackEProductionJob[]=[];
  for(const job of state.production){
    if(job.endsAt<=now){alloyBillet.value+=job.outputAmount;completed+=job.outputAmount}else waiting.push(job);
  }
  state.production=waiting;return completed;
}

export function plantProductionProgress(job:PackEProductionJob,now=Date.now()):number{
  const span=Math.max(1,job.endsAt-job.startedAt);
  return Math.max(0,Math.min(1,(now-job.startedAt)/span));
}
