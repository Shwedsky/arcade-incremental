import type { ComponentKind, ResourceKind, TargetClassId } from './sim.ts';
import {simulateBenchmarkedWorker,type WorkerEconomyV2State} from './worker_economy_v2.ts';

export type PackDZoneId='z7';
export type PackDCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7';
export type PackDCrewRole='scavenger'|'operator';

export interface PackDZoneProfile{
  id:PackDZoneId;
  name:string;
  description:string;
  hpMultiplier:number;
  yieldMultiplier:number;
  masteryTarget:number;
  nodeWeights:Record<TargetClassId,number>;
}

export const PACK_D_ZONE_PROFILE:PackDZoneProfile={
  id:'z7',name:'Тяжёлый парк',description:'Погрузчики, генераторные установки, гидравлика и тяжёлые приводные узлы. Здесь нужен Recovery Rig, но первую ценную сборку игрок находит лично.',
  hpMultiplier:3.25,yieldMultiplier:2.55,masteryTarget:12_200,
  nodeWeights:{small_scrap:.03,cable:.06,small_appliance:.05,bike_fan:.05,medium_appliance:.29,large_appliance:.52}
};

export interface RecoveryRigState{
  owned:boolean;
  resources:Record<ResourceKind,number>;
  aluminiumScrap:number;
  alloyScrap:number;
}

export interface PackDCrewState{
  hired:boolean;
  role:PackDCrewRole;
  assignment:PackDCrewZoneId|null;
  operatorCell:number|null;
  lastTick:number;
}

export interface PackDState{
  recoveryAssemblies:number;
  recoveryPity:number;
  recoveryRig:RecoveryRigState;
  industrialWorkshopOwned:boolean;
  productionCells:number;
  crew4:PackDCrewState;
}

export interface PackDFrontierContext{
  z6Mastered:boolean;
  salvageYardOwned:boolean;
  truckOwned:boolean;
}

export interface PackDInventory{
  cash:number;
  metal:number;
  cleanCopper:number;
  granulate:number;
  steelBlank:number;
  aluminiumBillet:number;
  alloyBillet:number;
  drive:number;
  control:number;
  hydraulicPower:number;
  heavyFrame:number;
  gearbox:number;
  generator:number;
  industrialController:number;
  heavyHydraulicCylinder:number;
}

export const RECOVERY_RIG_CAPACITY_KG=1800;
export const RECOVERY_RIG_CASH=420_000;
export const INDUSTRIAL_WORKSHOP_CASH=650_000;
export const FOURTH_WORKER_COST=130_000;
export const RECOVERY_ASSEMBLY_PITY=8;

export const RECOVERY_RIG_RECIPE={
  metal:900,cleanCopper:30,steelBlank:35,alloyBillet:60,drive:2,control:2,hydraulicPower:2,heavyFrame:2,
  gearbox:1,generator:1,industrialController:1,heavyHydraulicCylinder:2,recoveryAssemblies:1
} as const;

export const INDUSTRIAL_WORKSHOP_RECIPE={
  metal:360,cleanCopper:70,granulate:60,steelBlank:90,aluminiumBillet:36,alloyBillet:150,drive:3,control:4,hydraulicPower:4,heavyFrame:5,
  industrialController:2,heavyHydraulicCylinder:2
} as const;

const emptyResources=():Record<ResourceKind,number>=>({metal:0,copper:0,plastic:0});
const emptyComponents=():Record<ComponentKind,number>=>({bearing:0,motor:0,hydraulic:0,electronics:0});

export function createDefaultPackD(now=Date.now()):PackDState{
  return{
    recoveryAssemblies:0,recoveryPity:0,
    recoveryRig:{owned:false,resources:emptyResources(),aluminiumScrap:0,alloyScrap:0},
    industrialWorkshopOwned:false,productionCells:1,
    crew4:{hired:false,role:'scavenger',assignment:null,operatorCell:null,lastTick:now}
  };
}

export function normalizePackD(value:Partial<PackDState>|undefined,now=Date.now()):PackDState{
  const base=createDefaultPackD(now);
  if(!value)return base;
  return{
    ...base,...value,
    recoveryRig:{...base.recoveryRig,...value.recoveryRig,resources:{...base.recoveryRig.resources,...value.recoveryRig?.resources}},
    crew4:{...base.crew4,...value.crew4}
  };
}

export function canUnlockZ7(ctx:PackDFrontierContext):{ok:boolean;reason?:string}{
  if(!ctx.z6Mastered)return{ok:false,reason:'Освой Заброшенный завод на 100%'};
  if(!ctx.salvageYardOwned)return{ok:false,reason:'Нужен Salvage Yard'};
  if(!ctx.truckOwned)return{ok:false,reason:'Нужен грузовик для первого тяжёлого маршрута'};
  return{ok:true};
}

export function rollRecoveryAssembly(state:PackDState,classId:TargetClassId,rng:()=>number):boolean{
  if(!['medium_appliance','large_appliance'].includes(classId))return false;
  state.recoveryPity++;
  const chance=classId==='large_appliance'?.045:.018;
  if(state.recoveryPity>=RECOVERY_ASSEMBLY_PITY||rng()<chance){
    state.recoveryPity=0;state.recoveryAssemblies++;return true;
  }
  return false;
}

export function z7AlloyYield(classId:TargetClassId,rng:()=>number):number{
  const base=({small_scrap:.08,cable:.05,small_appliance:.18,bike_fan:.26,medium_appliance:1.15,large_appliance:2.45} as const)[classId];
  return base*(.88+rng()*.28);
}

export function recoveryRigWeight(state:PackDState):number{
  const r=state.recoveryRig.resources;return r.metal+r.copper+r.plastic+state.recoveryRig.aluminiumScrap+state.recoveryRig.alloyScrap;
}
export function recoveryRigRemaining(state:PackDState):number{return Math.max(0,RECOVERY_RIG_CAPACITY_KG-recoveryRigWeight(state))}

export function transferToRecoveryRig(state:PackDState,haul:Record<ResourceKind,number>,aluminium:{value:number},alloy:{value:number}):number{
  if(!state.recoveryRig.owned)return 0;
  const remaining=recoveryRigRemaining(state),bulk=haul.metal+haul.copper+haul.plastic+Math.max(0,aluminium.value)+Math.max(0,alloy.value);
  if(remaining<=0||bulk<=0)return 0;
  const factor=Math.min(1,remaining/bulk);let moved=0;
  (Object.keys(haul) as ResourceKind[]).forEach(k=>{const amount=haul[k]*factor;haul[k]-=amount;state.recoveryRig.resources[k]+=amount;moved+=amount});
  const aluminiumMoved=aluminium.value*factor;aluminium.value-=aluminiumMoved;state.recoveryRig.aluminiumScrap+=aluminiumMoved;moved+=aluminiumMoved;
  const alloyMoved=alloy.value*factor;alloy.value-=alloyMoved;state.recoveryRig.alloyScrap+=alloyMoved;moved+=alloyMoved;
  return moved;
}

export function unloadRecoveryRig(state:PackDState,storage:Record<ResourceKind,number>):{weight:number;aluminiumScrap:number;alloyScrap:number}{
  const weight=recoveryRigWeight(state),aluminiumScrap=state.recoveryRig.aluminiumScrap,alloyScrap=state.recoveryRig.alloyScrap;
  (Object.keys(state.recoveryRig.resources) as ResourceKind[]).forEach(k=>{storage[k]+=state.recoveryRig.resources[k];state.recoveryRig.resources[k]=0});
  state.recoveryRig.aluminiumScrap=0;state.recoveryRig.alloyScrap=0;return{weight,aluminiumScrap,alloyScrap};
}

export function canAcquireRecoveryRig(state:PackDState,inv:PackDInventory,z7Unlocked:boolean):boolean{
  const r=RECOVERY_RIG_RECIPE;
  return !state.recoveryRig.owned&&z7Unlocked&&inv.cash>=RECOVERY_RIG_CASH&&inv.metal>=r.metal&&inv.cleanCopper>=r.cleanCopper&&inv.steelBlank>=r.steelBlank&&inv.alloyBillet>=r.alloyBillet&&inv.drive>=r.drive&&inv.control>=r.control&&inv.hydraulicPower>=r.hydraulicPower&&inv.heavyFrame>=r.heavyFrame&&inv.gearbox>=r.gearbox&&inv.generator>=r.generator&&inv.industrialController>=r.industrialController&&inv.heavyHydraulicCylinder>=r.heavyHydraulicCylinder&&state.recoveryAssemblies>=r.recoveryAssemblies;
}

export function acquireRecoveryRig(state:PackDState,inv:PackDInventory,z7Unlocked:boolean):boolean{
  if(!canAcquireRecoveryRig(state,inv,z7Unlocked))return false;const r=RECOVERY_RIG_RECIPE;
  inv.cash-=RECOVERY_RIG_CASH;inv.metal-=r.metal;inv.cleanCopper-=r.cleanCopper;inv.steelBlank-=r.steelBlank;inv.alloyBillet-=r.alloyBillet;inv.drive-=r.drive;inv.control-=r.control;inv.hydraulicPower-=r.hydraulicPower;inv.heavyFrame-=r.heavyFrame;inv.gearbox-=r.gearbox;inv.generator-=r.generator;inv.industrialController-=r.industrialController;inv.heavyHydraulicCylinder-=r.heavyHydraulicCylinder;state.recoveryAssemblies-=r.recoveryAssemblies;state.recoveryRig.owned=true;return true;
}

export function truckWorkerRouteEligible(state:PackDState):boolean{return state.recoveryRig.owned}

export function canAcquireIndustrialWorkshop(state:PackDState,inv:PackDInventory,z7Mastered:boolean):boolean{
  const r=INDUSTRIAL_WORKSHOP_RECIPE;
  return state.recoveryRig.owned&&!state.industrialWorkshopOwned&&z7Mastered&&inv.cash>=INDUSTRIAL_WORKSHOP_CASH&&inv.metal>=r.metal&&inv.cleanCopper>=r.cleanCopper&&inv.granulate>=r.granulate&&inv.steelBlank>=r.steelBlank&&inv.aluminiumBillet>=r.aluminiumBillet&&inv.alloyBillet>=r.alloyBillet&&inv.drive>=r.drive&&inv.control>=r.control&&inv.hydraulicPower>=r.hydraulicPower&&inv.heavyFrame>=r.heavyFrame&&inv.industrialController>=r.industrialController&&inv.heavyHydraulicCylinder>=r.heavyHydraulicCylinder;
}

export function acquireIndustrialWorkshop(state:PackDState,inv:PackDInventory,z7Mastered:boolean):boolean{
  if(!canAcquireIndustrialWorkshop(state,inv,z7Mastered))return false;const r=INDUSTRIAL_WORKSHOP_RECIPE;
  inv.cash-=INDUSTRIAL_WORKSHOP_CASH;inv.metal-=r.metal;inv.cleanCopper-=r.cleanCopper;inv.granulate-=r.granulate;inv.steelBlank-=r.steelBlank;inv.aluminiumBillet-=r.aluminiumBillet;inv.alloyBillet-=r.alloyBillet;inv.drive-=r.drive;inv.control-=r.control;inv.hydraulicPower-=r.hydraulicPower;inv.heavyFrame-=r.heavyFrame;inv.industrialController-=r.industrialController;inv.heavyHydraulicCylinder-=r.heavyHydraulicCylinder;state.industrialWorkshopOwned=true;state.productionCells=2;return true;
}

export function canHireFourthWorker(state:PackDState,cash:number):boolean{return state.industrialWorkshopOwned&&!state.crew4.hired&&cash>=FOURTH_WORKER_COST}
export function hireFourthWorker(state:PackDState,now=Date.now()):boolean{
  if(state.crew4.hired||!state.industrialWorkshopOwned)return false;state.crew4={hired:true,role:'scavenger',assignment:null,operatorCell:null,lastTick:now};return true;
}
export function assignFourthWorkerScavenger(state:PackDState,zone:PackDCrewZoneId,mastered:boolean,now=Date.now()):boolean{
  if(!state.crew4.hired||!mastered)return false;state.crew4.role='scavenger';state.crew4.assignment=zone;state.crew4.operatorCell=null;state.crew4.lastTick=now;return true;
}
export function assignFourthWorkerOperator(state:PackDState,cell:number,now=Date.now()):boolean{
  if(!state.crew4.hired||!state.industrialWorkshopOwned||cell<0||cell>=state.productionCells)return false;state.crew4.role='operator';state.crew4.assignment=null;state.crew4.operatorCell=cell;state.crew4.lastTick=now;return true;
}

const CREW4_RATES:Record<PackDCrewZoneId,Record<ResourceKind,number>>={
  z1:{metal:100,copper:6.5,plastic:17},z2:{metal:90,copper:11,plastic:14},z3:{metal:122,copper:12,plastic:16},z4:{metal:145,copper:13,plastic:10},z5:{metal:176,copper:15,plastic:8},z6:{metal:194,copper:16,plastic:6},z7:{metal:225,copper:17,plastic:5}
};
export function simulateFourthWorker(state:PackDState,economy:WorkerEconomyV2State,discoveredComponents:ReadonlyArray<ComponentKind>,now=Date.now(),offline=false):{hours:number;resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;weight:number;source:string;offlineRemainingHours:number}{
  const empty={hours:0,resources:emptyResources(),components:emptyComponents(),weight:0,source:'none',offlineRemainingHours:economy.shifts.w4.remainingOfflineMs/3_600_000},w=state.crew4;if(!w.hired||w.role!=='scavenger'||!w.assignment){w.lastTick=now;return empty}
  const gain=simulateBenchmarkedWorker({state:economy,slot:'w4',zone:w.assignment,lastTick:w.lastTick,now,offline,discoveredComponents,legacyRates:CREW4_RATES[w.assignment]});
  w.lastTick=gain.lastTick;return{hours:gain.hours,resources:gain.resources,components:gain.components,weight:gain.weight,source:gain.source,offlineRemainingHours:gain.offlineRemainingHours};
}
