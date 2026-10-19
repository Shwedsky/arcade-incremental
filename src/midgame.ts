import { BASE_DPS, getTargetClass, type ComponentKind, type ResourceKind, type SalvageTarget, type TargetClassId } from './sim.ts';
import type { MachineId } from './garage.ts';
import { PACK_C_ZONE_PROFILES } from './content_pack_c.ts';

export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6';
export type MidComponentKind = 'pump' | 'compressor';

export interface ZoneDef {
  id: ZoneId;
  order: number;
  name: string;
  subtitle: string;
  description: string;
  nodeWeights: Record<TargetClassId, number>;
  hpMultiplier: number;
  yieldMultiplier: number;
  masteryTarget: number;
  recommendedTool: number;
}

const z1Weights: Record<TargetClassId, number> = {
  small_scrap:.34,cable:.18,small_appliance:.20,bike_fan:.13,medium_appliance:.10,large_appliance:.05
};

export const ZONE_DEFS: Record<ZoneId, ZoneDef> = {
  z1:{
    id:'z1',order:1,name:'Старая свалка',subtitle:'Зона 1',description:'Знакомый лёгкий лом, кабель и бытовая мелочь.',
    nodeWeights:z1Weights,hpMultiplier:1,yieldMultiplier:1,masteryTarget:1300,recommendedTool:1
  },
  z2:{
    id:'z2',order:2,name:'Гаражи и дворы',subtitle:'Зона 2',description:'Больше техники, насосов, моторов и кабеля. Первый настоящий шаг за пределы старой свалки.',
    nodeWeights:{small_scrap:.20,cable:.20,small_appliance:.22,bike_fan:.16,medium_appliance:.15,large_appliance:.07},
    hpMultiplier:1.25,yieldMultiplier:1.15,masteryTarget:2400,recommendedTool:2
  },
  z3:{
    id:'z3',order:3,name:'Свалка бытовой техники',subtitle:'Зона 3',description:'Плотная крупная техника, холодильники и компрессорные цели. Здесь фургон начинает менять длину вылазки.',
    nodeWeights:{small_scrap:.10,cable:.08,small_appliance:.20,bike_fan:.10,medium_appliance:.32,large_appliance:.20},
    hpMultiplier:1.50,yieldMultiplier:1.35,masteryTarget:4500,recommendedTool:3
  },
  z4:{
    id:'z4',order:4,name:'Авторазборка',subtitle:'Зона 4',description:'Кузовщина, агрегаты и силовая электрика. Первый источник коробок передач и генераторов для тяжёлой логистики.',
    nodeWeights:{small_scrap:.10,cable:.11,small_appliance:.11,bike_fan:.14,medium_appliance:.30,large_appliance:.24},
    hpMultiplier:1.85,yieldMultiplier:1.58,masteryTarget:6200,recommendedTool:4
  },
  z5:{
    id:'z5',order:5,name:PACK_C_ZONE_PROFILES.z5.name,subtitle:'Зона 5',description:PACK_C_ZONE_PROFILES.z5.description,
    nodeWeights:PACK_C_ZONE_PROFILES.z5.nodeWeights,hpMultiplier:PACK_C_ZONE_PROFILES.z5.hpMultiplier,yieldMultiplier:PACK_C_ZONE_PROFILES.z5.yieldMultiplier,masteryTarget:PACK_C_ZONE_PROFILES.z5.masteryTarget,recommendedTool:5
  },
  z6:{
    id:'z6',order:6,name:PACK_C_ZONE_PROFILES.z6.name,subtitle:'Зона 6',description:PACK_C_ZONE_PROFILES.z6.description,
    nodeWeights:PACK_C_ZONE_PROFILES.z6.nodeWeights,hpMultiplier:PACK_C_ZONE_PROFILES.z6.hpMultiplier,yieldMultiplier:PACK_C_ZONE_PROFILES.z6.yieldMultiplier,masteryTarget:PACK_C_ZONE_PROFILES.z6.masteryTarget,recommendedTool:6
  }
};

export interface VanState {
  owned:boolean;
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  midComponents:Record<MidComponentKind,number>;
}

export interface WorkerState {
  hired:boolean;
  assignment:ZoneId|null;
  lastTick:number;
}

export interface MidgameState {
  currentZone:ZoneId;
  mastery:Record<ZoneId,number>;
  discoveredComponents:ComponentKind[];
  discoveredMidComponents:MidComponentKind[];
  midComponents:Record<MidComponentKind,number>;
  pity:Record<MidComponentKind,number>;
  van:VanState;
  worker:WorkerState;
}

export interface ZoneUnlockContext {
  level:number;
  installed:ReadonlySet<MachineId>;
  mastery:Record<ZoneId,number>;
}

export interface VanInventory {
  cash:number;
  metal:number;
  cleanCopper:number;
  motor:number;
  electronics:number;
}

export const VAN_CAPACITY_KG=400;
export const BASIC_ROUTE_CAPACITY_KG=150;
export const FIRST_WORKER_COST=35_000;
export const VAN_RECIPE={cash:70_000,metal:50,cleanCopper:8,motor:1,electronics:1} as const;

export function emptyResourceRecord():Record<ResourceKind,number>{return{metal:0,copper:0,plastic:0}}
export function emptyComponentRecord():Record<ComponentKind,number>{return{bearing:0,motor:0,hydraulic:0,electronics:0}}
export function emptyMidComponentRecord():Record<MidComponentKind,number>{return{pump:0,compressor:0}}

export function createDefaultMidgame(now=Date.now()):MidgameState{
  return{
    currentZone:'z1',mastery:{z1:0,z2:0,z3:0,z4:0,z5:0,z6:0},discoveredComponents:[],discoveredMidComponents:[],midComponents:emptyMidComponentRecord(),
    pity:{pump:0,compressor:0},
    van:{owned:false,resources:emptyResourceRecord(),components:emptyComponentRecord(),midComponents:emptyMidComponentRecord()},
    worker:{hired:false,assignment:null,lastTick:now}
  };
}

export function migrateMidgameFromV3(totalDestroyed:number,components:Record<ComponentKind,number>,now=Date.now()):MidgameState{
  const state=createDefaultMidgame(now);
  state.mastery.z1=Math.min(100,totalDestroyed/750*100);
  state.discoveredComponents=(Object.keys(components) as ComponentKind[]).filter(k=>components[k]>0);
  return state;
}

export function normalizeMidgame(value:Partial<MidgameState>|undefined,now=Date.now()):MidgameState{
  const base=createDefaultMidgame(now);
  if(!value)return base;
  const current=(value.currentZone&&ZONE_DEFS[value.currentZone])?value.currentZone:'z1';
  return{
    ...base,...value,currentZone:current,
    mastery:{...base.mastery,...value.mastery},
    discoveredComponents:[...(value.discoveredComponents??[])],
    discoveredMidComponents:[...(value.discoveredMidComponents??[])],
    midComponents:{...base.midComponents,...value.midComponents},
    pity:{...base.pity,...value.pity},
    van:{...base.van,...value.van,resources:{...base.van.resources,...value.van?.resources},components:{...base.van.components,...value.van?.components},midComponents:{...base.van.midComponents,...value.van?.midComponents}},
    worker:{...base.worker,...value.worker}
  };
}

export function zoneMastered(state:MidgameState,id:ZoneId):boolean{return state.mastery[id]>=100-1e-9}

export function zoneUnlock(state:MidgameState,id:ZoneId,ctx:ZoneUnlockContext):{ok:boolean;reason?:string}{
  if(id==='z1')return{ok:true};
  if(id==='z2'){
    if(ctx.level<4)return{ok:false,reason:'Нужен уровень 4'};
    if(!ctx.installed.has('press'))return{ok:false,reason:'Сначала установи малый гидропресс'};
    return{ok:true};
  }
  if(id==='z3'){
    if(ctx.level<6)return{ok:false,reason:'Нужен уровень 6'};
    if(!ctx.installed.has('wire'))return{ok:false,reason:'Нужна зачистка проводов'};
    if(!zoneMastered(state,'z2'))return{ok:false,reason:'Освой Зону 2 на 100%'};
    return{ok:true};
  }
  if(id==='z4'){
    if(ctx.level<8)return{ok:false,reason:'Нужен уровень 8'};
    if(!zoneMastered(state,'z3'))return{ok:false,reason:'Освой Зону 3 на 100%'};
    if(!state.van.owned)return{ok:false,reason:'Нужен фургон для дальнего маршрута'};
    return{ok:true};
  }
  if(id==='z5'){
    if(ctx.level<10)return{ok:false,reason:'Нужен уровень 10'};
    if(!zoneMastered(state,'z4'))return{ok:false,reason:'Освой Авторазборку на 100%'};
    if(!state.van.owned)return{ok:false,reason:'Нужна тяжёлая логистика'};
    return{ok:true};
  }
  if(ctx.level<12)return{ok:false,reason:'Нужен уровень 12'};
  if(!zoneMastered(state,'z5'))return{ok:false,reason:'Освой Промышленную зону на 100%'};
  return{ok:true};
}

export function masteryUnitsForTarget(classId:TargetClassId):number{
  return({small_scrap:1,cable:1,small_appliance:2,bike_fan:2,medium_appliance:4,large_appliance:6} as const)[classId];
}

export function addActiveMastery(state:MidgameState,id:ZoneId,units:number):{before:number;after:number;masteredNow:boolean}{
  const def=ZONE_DEFS[id],before=state.mastery[id];
  const after=Math.min(100,before+Math.max(0,units)/def.masteryTarget*100);
  state.mastery[id]=after;
  return{before,after,masteredNow:before<100&&after>=100};
}

function weightedClass(weights:Record<TargetClassId,number>,rng:()=>number):TargetClassId{
  let roll=rng();
  for(const id of Object.keys(weights) as TargetClassId[]){roll-=weights[id];if(roll<=0)return id}
  return 'large_appliance';
}

export function applyZoneProfile(targets:SalvageTarget[],zoneId:ZoneId,rng:()=>number):SalvageTarget[]{
  const zone=ZONE_DEFS[zoneId];
  for(const target of targets){
    const classId=weightedClass(zone.nodeWeights,rng),def=getTargetClass(classId);
    target.classId=classId;
    target.hp=def.breakSeconds*BASE_DPS*zone.hpMultiplier;
    target.maxHp=target.hp;
    target.variant=Math.floor(rng()*4);
  }
  return targets;
}

export function zoneYieldMultiplier(id:ZoneId):number{return ZONE_DEFS[id].yieldMultiplier}

export function discoverComponent(state:MidgameState,kind:ComponentKind):void{
  if(!state.discoveredComponents.includes(kind))state.discoveredComponents.push(kind);
}

export function rollMidComponent(state:MidgameState,zoneId:ZoneId,classId:TargetClassId,rng:()=>number):MidComponentKind|undefined{
  if(zoneId==='z2'&&['medium_appliance','large_appliance'].includes(classId)){
    state.pity.pump++;
    if(state.pity.pump>=8||rng()<.035){state.pity.pump=0;if(!state.discoveredMidComponents.includes('pump'))state.discoveredMidComponents.push('pump');return'pump'}
  }
  if(zoneId==='z3'&&classId==='large_appliance'){
    state.pity.compressor++;
    if(state.pity.compressor>=10||rng()<.055){state.pity.compressor=0;if(!state.discoveredMidComponents.includes('compressor'))state.discoveredMidComponents.push('compressor');return'compressor'}
  }
  return undefined;
}

export function vanWeight(van:VanState):number{return van.resources.metal+van.resources.copper+van.resources.plastic}
export function vanRemaining(van:VanState):number{return Math.max(0,VAN_CAPACITY_KG-vanWeight(van))}
export function canBuyVan(state:MidgameState,ctx:ZoneUnlockContext,inv:VanInventory):boolean{
  return !state.van.owned&&ctx.level>=7&&zoneUnlock(state,'z3',ctx).ok&&inv.cash>=VAN_RECIPE.cash&&inv.metal>=VAN_RECIPE.metal&&inv.cleanCopper>=VAN_RECIPE.cleanCopper&&inv.motor>=1&&inv.electronics>=1;
}

export interface CartTransferResult { movedKg:number; remainingKg:number }
export function transferCartToVan(van:VanState,haul:Record<ResourceKind,number>,components:Record<ComponentKind,number>,midComponents:Record<MidComponentKind,number>):CartTransferResult{
  if(!van.owned)return{movedKg:0,remainingKg:haul.metal+haul.copper+haul.plastic};
  const weight=haul.metal+haul.copper+haul.plastic,remaining=vanRemaining(van),factor=weight<=0?0:Math.min(1,remaining/weight);
  let moved=0;
  (Object.keys(haul) as ResourceKind[]).forEach(k=>{const amount=haul[k]*factor;haul[k]-=amount;van.resources[k]+=amount;moved+=amount});
  (Object.keys(components) as ComponentKind[]).forEach(k=>{van.components[k]+=components[k];components[k]=0});
  (Object.keys(midComponents) as MidComponentKind[]).forEach(k=>{van.midComponents[k]+=midComponents[k];midComponents[k]=0});
  return{movedKg:moved,remainingKg:haul.metal+haul.copper+haul.plastic};
}

export function unloadVanToStorage(van:VanState,storage:Record<ResourceKind,number>,components:Record<ComponentKind,number>,midComponents:Record<MidComponentKind,number>):number{
  const weight=vanWeight(van);
  (Object.keys(van.resources) as ResourceKind[]).forEach(k=>{storage[k]+=van.resources[k];van.resources[k]=0});
  (Object.keys(van.components) as ComponentKind[]).forEach(k=>{components[k]+=van.components[k];van.components[k]=0});
  (Object.keys(van.midComponents) as MidComponentKind[]).forEach(k=>{midComponents[k]+=van.midComponents[k];van.midComponents[k]=0});
  return weight;
}

export function canHireFirstWorker(state:MidgameState,cash:number):boolean{return state.van.owned&&!state.worker.hired&&zoneMastered(state,'z1')&&cash>=FIRST_WORKER_COST}
export function canAssignWorker(state:MidgameState,id:ZoneId):boolean{return state.worker.hired&&zoneMastered(state,id)}
export function assignWorker(state:MidgameState,id:ZoneId,now=Date.now()):boolean{
  if(!canAssignWorker(state,id))return false;
  state.worker.assignment=id;state.worker.lastTick=now;return true;
}

export interface WorkerGain {
  hours:number;
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  weight:number;
}

const WORKER_RATES:Record<ZoneId,Record<ResourceKind,number>>={
  z1:{metal:84,copper:5.4,plastic:15},
  z2:{metal:72,copper:9,plastic:12},
  z3:{metal:104,copper:9.6,plastic:15},
  z4:{metal:118,copper:10.5,plastic:10},
  z5:{metal:148,copper:12,plastic:8},
  z6:{metal:164,copper:13,plastic:6}
};

export function simulateWorkerGain(state:MidgameState,now=Date.now(),maxHours=8):WorkerGain{
  const empty:WorkerGain={hours:0,resources:emptyResourceRecord(),components:emptyComponentRecord(),weight:0};
  if(!state.worker.hired||!state.worker.assignment){state.worker.lastTick=now;return empty}
  const elapsed=Math.max(0,(now-state.worker.lastTick)/3_600_000),hours=Math.min(elapsed,maxHours);
  if(hours<=0)return empty;
  const rates=WORKER_RATES[state.worker.assignment],resources:Record<ResourceKind,number>={metal:rates.metal*hours,copper:rates.copper*hours,plastic:rates.plastic*hours};
  const components=emptyComponentRecord();
  if(state.discoveredComponents.includes('bearing'))components.bearing=Math.floor(hours*.12);
  if(state.discoveredComponents.includes('motor'))components.motor=Math.floor(hours*.045);
  if(state.discoveredComponents.includes('electronics'))components.electronics=Math.floor(hours*.04);
  if(state.discoveredComponents.includes('hydraulic'))components.hydraulic=Math.floor(hours*.015);
  state.worker.lastTick=now;
  return{hours,resources,components,weight:resources.metal+resources.copper+resources.plastic};
}

export function midComponentName(kind:MidComponentKind):string{return kind==='pump'?'Насос':'Компрессор'}
