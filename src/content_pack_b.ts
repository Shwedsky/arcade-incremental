import type { ComponentKind, ResourceKind, TargetClassId } from './sim.ts';
import type { ZoneId } from './midgame.ts';
import {simulateBenchmarkedWorker,type WorkerEconomyV2State} from './worker_economy_v2.ts';

export type IndustrialComponentKind='gearbox'|'generator';
export type FabricatedModuleKind='drive'|'control'|'structural';
export interface IndustrialMaterials{aluminiumScrap:number;steelBlank:number;aluminiumBillet:number}
export interface IndustrialComponents{gearbox:number;generator:number}
export interface FabricatedModules{drive:number;control:number;structural:number}
export interface TruckState{owned:boolean;resources:Record<ResourceKind,number>;aluminiumScrap:number}
export interface SecondWorkerState{hired:boolean;assignment:ZoneId|null;lastTick:number}
export interface PackBState{materials:IndustrialMaterials;industrial:IndustrialComponents;discoveredIndustrial:IndustrialComponentKind[];pity:IndustrialComponents;modules:FabricatedModules;hangarOwned:boolean;truck:TruckState;secondWorker:SecondWorkerState}
export interface PackBInventory{cash:number;metal:number;cleanCopper:number;briquette:number;components:Record<ComponentKind,number>}

export const HANGAR_CASH=220_000;
export const TRUCK_CASH=220_000;
export const SECOND_WORKER_COST=55_000;
export const TRUCK_CAPACITY_KG=1_000;
export const HANGAR_RECIPE={metal:240,cleanCopper:24,briquette:40,steelBlank:12,aluminiumBillet:6,structural:2,control:1} as const;
export const TRUCK_RECIPE={cleanCopper:12,steelBlank:10,aluminiumBillet:6,drive:1,control:1,gearbox:1,generator:1} as const;

export function emptyIndustrialMaterials():IndustrialMaterials{return{aluminiumScrap:0,steelBlank:0,aluminiumBillet:0}}
export function emptyIndustrialComponents():IndustrialComponents{return{gearbox:0,generator:0}}
export function emptyFabricatedModules():FabricatedModules{return{drive:0,control:0,structural:0}}
export function emptyResourceRecord():Record<ResourceKind,number>{return{metal:0,copper:0,plastic:0}}
export function emptyComponentRecord():Record<ComponentKind,number>{return{bearing:0,motor:0,hydraulic:0,electronics:0}}
export function createDefaultPackB(now=Date.now()):PackBState{return{materials:emptyIndustrialMaterials(),industrial:emptyIndustrialComponents(),discoveredIndustrial:[],pity:emptyIndustrialComponents(),modules:emptyFabricatedModules(),hangarOwned:false,truck:{owned:false,resources:emptyResourceRecord(),aluminiumScrap:0},secondWorker:{hired:false,assignment:null,lastTick:now}}}
export function normalizePackB(value:Partial<PackBState>|undefined,now=Date.now()):PackBState{const base=createDefaultPackB(now);if(!value)return base;return{...base,...value,materials:{...base.materials,...value.materials},industrial:{...base.industrial,...value.industrial},discoveredIndustrial:[...(value.discoveredIndustrial??[])],pity:{...base.pity,...value.pity},modules:{...base.modules,...value.modules},truck:{...base.truck,...value.truck,resources:{...base.truck.resources,...value.truck?.resources}},secondWorker:{...base.secondWorker,...value.secondWorker}}}
export function industrialName(kind:IndustrialComponentKind):string{return kind==='gearbox'?'Коробка передач':'Генератор / альтернатор'}
export function rollIndustrialComponent(state:PackBState,classId:TargetClassId,rng:()=>number):IndustrialComponentKind|undefined{if(!['medium_appliance','large_appliance'].includes(classId))return undefined;if(classId==='large_appliance'){state.pity.gearbox++;if(state.pity.gearbox>=8||rng()<.045){state.pity.gearbox=0;if(!state.discoveredIndustrial.includes('gearbox'))state.discoveredIndustrial.push('gearbox');return'gearbox'}}state.pity.generator++;if(state.pity.generator>=10||rng()<.04){state.pity.generator=0;if(!state.discoveredIndustrial.includes('generator'))state.discoveredIndustrial.push('generator');return'generator'}return undefined}
export function z4AluminiumYield(classId:TargetClassId,rng:()=>number):number{const base=({small_scrap:.08,cable:.03,small_appliance:.18,bike_fan:.24,medium_appliance:.55,large_appliance:1.15} as const)[classId];return base*(.85+rng()*.30)}
export function refineSteel(state:PackBState,inv:PackBInventory,batches=1):number{const possible=Math.min(Math.max(0,Math.floor(batches)),Math.floor(inv.briquette/25));if(possible<=0)return 0;inv.briquette-=possible*25;state.materials.steelBlank+=possible;return possible}
export function refineAluminium(state:PackBState,batches=1):number{const possible=Math.min(Math.max(0,Math.floor(batches)),Math.floor(state.materials.aluminiumScrap/12));if(possible<=0)return 0;state.materials.aluminiumScrap-=possible*12;state.materials.aluminiumBillet+=possible;return possible}
export function canFabricateModule(state:PackBState,kind:FabricatedModuleKind,inv:PackBInventory):boolean{if(kind==='drive')return state.materials.steelBlank>=2&&inv.cleanCopper>=6&&state.industrial.gearbox>=1&&inv.components.motor>=1;if(kind==='control')return state.materials.aluminiumBillet>=1&&inv.cleanCopper>=6&&inv.components.electronics>=2;return state.materials.steelBlank>=4&&inv.components.bearing>=2}
export function fabricateModule(state:PackBState,kind:FabricatedModuleKind,inv:PackBInventory):boolean{if(!canFabricateModule(state,kind,inv))return false;if(kind==='drive'){state.materials.steelBlank-=2;inv.cleanCopper-=6;state.industrial.gearbox--;inv.components.motor--}else if(kind==='control'){state.materials.aluminiumBillet--;inv.cleanCopper-=6;inv.components.electronics-=2}else{state.materials.steelBlank-=4;inv.components.bearing-=2}state.modules[kind]++;return true}
export function canAcquireHangar(state:PackBState,inv:PackBInventory,z3Mastered:boolean):boolean{return !state.hangarOwned&&z3Mastered&&inv.cash>=HANGAR_CASH&&inv.metal>=HANGAR_RECIPE.metal&&inv.cleanCopper>=HANGAR_RECIPE.cleanCopper&&inv.briquette>=HANGAR_RECIPE.briquette&&state.materials.steelBlank>=HANGAR_RECIPE.steelBlank&&state.materials.aluminiumBillet>=HANGAR_RECIPE.aluminiumBillet&&state.modules.structural>=HANGAR_RECIPE.structural&&state.modules.control>=HANGAR_RECIPE.control}
export function acquireHangar(state:PackBState,inv:PackBInventory,z3Mastered:boolean):boolean{if(!canAcquireHangar(state,inv,z3Mastered))return false;inv.cash-=HANGAR_CASH;inv.metal-=HANGAR_RECIPE.metal;inv.cleanCopper-=HANGAR_RECIPE.cleanCopper;inv.briquette-=HANGAR_RECIPE.briquette;state.materials.steelBlank-=HANGAR_RECIPE.steelBlank;state.materials.aluminiumBillet-=HANGAR_RECIPE.aluminiumBillet;state.modules.structural-=HANGAR_RECIPE.structural;state.modules.control-=HANGAR_RECIPE.control;state.hangarOwned=true;return true}
export function canAcquireTruck(state:PackBState,inv:PackBInventory,z4Unlocked:boolean):boolean{return state.hangarOwned&&!state.truck.owned&&z4Unlocked&&inv.cash>=TRUCK_CASH&&inv.cleanCopper>=TRUCK_RECIPE.cleanCopper&&state.materials.steelBlank>=TRUCK_RECIPE.steelBlank&&state.materials.aluminiumBillet>=TRUCK_RECIPE.aluminiumBillet&&state.modules.drive>=TRUCK_RECIPE.drive&&state.modules.control>=TRUCK_RECIPE.control&&state.industrial.gearbox>=TRUCK_RECIPE.gearbox&&state.industrial.generator>=TRUCK_RECIPE.generator}
export function acquireTruck(state:PackBState,inv:PackBInventory,z4Unlocked:boolean):boolean{if(!canAcquireTruck(state,inv,z4Unlocked))return false;inv.cash-=TRUCK_CASH;inv.cleanCopper-=TRUCK_RECIPE.cleanCopper;state.materials.steelBlank-=TRUCK_RECIPE.steelBlank;state.materials.aluminiumBillet-=TRUCK_RECIPE.aluminiumBillet;state.modules.drive-=TRUCK_RECIPE.drive;state.modules.control-=TRUCK_RECIPE.control;state.industrial.gearbox-=TRUCK_RECIPE.gearbox;state.industrial.generator-=TRUCK_RECIPE.generator;state.truck.owned=true;return true}
export function truckWeight(state:PackBState):number{return state.truck.resources.metal+state.truck.resources.copper+state.truck.resources.plastic+state.truck.aluminiumScrap}
export function truckRemaining(state:PackBState):number{return Math.max(0,TRUCK_CAPACITY_KG-truckWeight(state))}
export function transferCartToTruck(state:PackBState,haul:Record<ResourceKind,number>,aluminium:{value:number}):number{if(!state.truck.owned)return 0;const baseWeight=haul.metal+haul.copper+haul.plastic+aluminium.value,remaining=truckRemaining(state),factor=baseWeight<=0?0:Math.min(1,remaining/baseWeight);let moved=0;(Object.keys(haul) as ResourceKind[]).forEach(k=>{const amount=haul[k]*factor;haul[k]-=amount;state.truck.resources[k]+=amount;moved+=amount});const alu=aluminium.value*factor;aluminium.value-=alu;state.truck.aluminiumScrap+=alu;moved+=alu;return moved}
export function unloadTruck(state:PackBState,storage:Record<ResourceKind,number>):{weight:number;aluminium:number}{const weight=truckWeight(state),aluminium=state.truck.aluminiumScrap;(Object.keys(state.truck.resources) as ResourceKind[]).forEach(k=>{storage[k]+=state.truck.resources[k];state.truck.resources[k]=0});state.materials.aluminiumScrap+=aluminium;state.truck.aluminiumScrap=0;return{weight,aluminium}}
export function canHireSecondWorker(state:PackBState,z1Mastered:boolean,cash:number):boolean{return state.hangarOwned&&!state.secondWorker.hired&&z1Mastered&&cash>=SECOND_WORKER_COST}
export function hireSecondWorker(state:PackBState,now=Date.now()):boolean{if(state.secondWorker.hired)return false;state.secondWorker={hired:true,assignment:null,lastTick:now};return true}
export function assignSecondWorker(state:PackBState,zone:ZoneId,zoneIsMastered:boolean,now=Date.now()):boolean{if(!state.secondWorker.hired||!zoneIsMastered)return false;state.secondWorker.assignment=zone;state.secondWorker.lastTick=now;return true}

// Legacy compatibility only. V3 migrates every worker into the same generic route
// model; until that migration owns runtime, worker #2 must no longer mysteriously
// stop producing outside Z1-Z3.
const SECOND_WORKER_RATES:Record<ZoneId,Record<ResourceKind,number>>={
 z1:{metal:76,copper:5,plastic:14},z2:{metal:68,copper:8.5,plastic:11},z3:{metal:96,copper:9,plastic:14},
 z4:{metal:118,copper:11,plastic:10},z5:{metal:145,copper:13,plastic:8},z6:{metal:162,copper:14,plastic:6},
 z7:{metal:185,copper:15,plastic:5},z8:{metal:210,copper:17,plastic:4}
};
export function simulateSecondWorker(state:PackBState,economy:WorkerEconomyV2State,discoveredComponents:ReadonlyArray<ComponentKind>,now=Date.now(),offline=false):{hours:number;resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;weight:number;source:string;offlineRemainingHours:number}{const empty={hours:0,resources:emptyResourceRecord(),components:emptyComponentRecord(),weight:0,source:'none',offlineRemainingHours:economy.shifts.w2.remainingOfflineMs/3_600_000};const worker=state.secondWorker;if(!worker.hired||!worker.assignment){worker.lastTick=now;return empty}const rates=SECOND_WORKER_RATES[worker.assignment];const gain=simulateBenchmarkedWorker({state:economy,slot:'w2',zone:worker.assignment,lastTick:worker.lastTick,now,offline,discoveredComponents,legacyRates:rates});worker.lastTick=gain.lastTick;return{hours:gain.hours,resources:gain.resources,components:gain.components,weight:gain.weight,source:gain.source,offlineRemainingHours:gain.offlineRemainingHours}}
