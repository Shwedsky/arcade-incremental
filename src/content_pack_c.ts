import type { ComponentKind, ResourceKind, TargetClassId } from './sim.ts';
import {simulateBenchmarkedWorker,type WorkerEconomyV2State} from './worker_economy_v2.ts';

export type PackCZoneId='z5'|'z6';
export type PackCCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7'|'z8';
export type HeavyIndustrialComponentKind='industrialController'|'heavyHydraulicCylinder';
export type HeavyFabricatedModuleKind='hydraulicPower'|'heavyFrame';
export type PackCProductionKind='alloyBillet'|'hydraulicPower'|'heavyFrame';
export type PackCCrewRole='scavenger'|'operator';

export interface PackCZoneProfile{
  id:PackCZoneId;
  name:string;
  description:string;
  hpMultiplier:number;
  yieldMultiplier:number;
  masteryTarget:number;
  nodeWeights:Record<TargetClassId,number>;
}

export const PACK_C_ZONE_PROFILES:Record<PackCZoneId,PackCZoneProfile>={
  z5:{
    id:'z5',name:'Промышленная зона',description:'Промышленные моторы, насосные станции, шкафы управления и тяжёлые рамы.',
    hpMultiplier:2.25,yieldMultiplier:1.88,masteryTarget:7800,
    nodeWeights:{small_scrap:.06,cable:.10,small_appliance:.10,bike_fan:.08,medium_appliance:.34,large_appliance:.32}
  },
  z6:{
    id:'z6',name:'Заброшенный завод',description:'Прессы, станки, гидравлические узлы и производственные секции с ценными ядрами.',
    hpMultiplier:2.70,yieldMultiplier:2.18,masteryTarget:9600,
    nodeWeights:{small_scrap:.04,cable:.07,small_appliance:.07,bike_fan:.05,medium_appliance:.31,large_appliance:.46}
  }
};

export interface HeavyIndustrialComponents{industrialController:number;heavyHydraulicCylinder:number}
export interface PackCMaterials{alloyScrap:number;alloyBillet:number}
export interface HeavyFabricatedModules{hydraulicPower:number;heavyFrame:number}

export interface PackCProductionJob{
  kind:PackCProductionKind;
  startedAt:number;
  endsAt:number;
  outputAmount:number;
}

export interface PackCCrewState{
  hired:boolean;
  role:PackCCrewRole;
  assignment:PackCCrewZoneId|null;
  lastTick:number;
}

export interface PackCState{
  materials:PackCMaterials;
  industrial:HeavyIndustrialComponents;
  discoveredIndustrial:HeavyIndustrialComponentKind[];
  pity:HeavyIndustrialComponents;
  modules:HeavyFabricatedModules;
  salvageYardOwned:boolean;
  production:PackCProductionJob|null;
  crew3:PackCCrewState;
}

export interface PackCFrontierContext{
  z4Mastered:boolean;
  z5Mastered:boolean;
  hangarOwned:boolean;
  truckOwned:boolean;
  controllerDiscovered:boolean;
}

export interface PackCInventory{
  cash:number;
  metal:number;
  cleanCopper:number;
  briquette:number;
  steelBlank:number;
  aluminiumBillet:number;
  structural:number;
  control:number;
  hydraulic:number;
  pump:number;
}

export const SALVAGE_YARD_CASH=250_000;
export const THIRD_WORKER_COST=85_000;
export const SALVAGE_YARD_RECIPE={metal:280,cleanCopper:36,briquette:40,steelBlank:32,aluminiumBillet:12,alloyBillet:42,hydraulicPower:2,heavyFrame:2,control:2} as const;

export const PACK_C_PRODUCTION_SECONDS:Record<PackCProductionKind,number>={
  alloyBillet:240,
  hydraulicPower:480,
  heavyFrame:600
};

export function emptyHeavyIndustrialComponents():HeavyIndustrialComponents{return{industrialController:0,heavyHydraulicCylinder:0}}
export function emptyPackCMaterials():PackCMaterials{return{alloyScrap:0,alloyBillet:0}}
export function emptyHeavyFabricatedModules():HeavyFabricatedModules{return{hydraulicPower:0,heavyFrame:0}}
export function emptyResources():Record<ResourceKind,number>{return{metal:0,copper:0,plastic:0}}
export function emptyComponents():Record<ComponentKind,number>{return{bearing:0,motor:0,hydraulic:0,electronics:0}}

export function createDefaultPackC(now=Date.now()):PackCState{
  return{
    materials:emptyPackCMaterials(),industrial:emptyHeavyIndustrialComponents(),discoveredIndustrial:[],
    pity:emptyHeavyIndustrialComponents(),modules:emptyHeavyFabricatedModules(),salvageYardOwned:false,
    production:null,crew3:{hired:false,role:'scavenger',assignment:null,lastTick:now}
  };
}

export function normalizePackC(value:Partial<PackCState>|undefined,now=Date.now()):PackCState{
  const base=createDefaultPackC(now);
  if(!value)return base;
  return{
    ...base,...value,
    materials:{...base.materials,...value.materials},
    industrial:{...base.industrial,...value.industrial},
    discoveredIndustrial:[...(value.discoveredIndustrial??[])],
    pity:{...base.pity,...value.pity},
    modules:{...base.modules,...value.modules},
    production:value.production?{...value.production}:null,
    crew3:{...base.crew3,...value.crew3}
  };
}

export function packCComponentName(kind:HeavyIndustrialComponentKind):string{return kind==='industrialController'?'Промышленный контроллер':'Тяжёлый гидроцилиндр'}

export function canUnlockPackCZone(id:PackCZoneId,ctx:PackCFrontierContext):{ok:boolean;reason?:string}{
  if(id==='z5'){
    if(!ctx.z4Mastered)return{ok:false,reason:'Сначала освой Авторазборку'};
    if(!ctx.hangarOwned)return{ok:false,reason:'Нужен Ангар'};
    if(!ctx.truckOwned)return{ok:false,reason:'Нужен грузовик для промышленного маршрута'};
    return{ok:true};
  }
  if(!ctx.z5Mastered)return{ok:false,reason:'Освой Промышленную зону на 100%'};
  if(!ctx.controllerDiscovered)return{ok:false,reason:'Найди промышленный контроллер лично'};
  if(!ctx.truckOwned)return{ok:false,reason:'Нужен грузовик'};
  return{ok:true};
}

export function alloyYield(zone:PackCZoneId,classId:TargetClassId,rng:()=>number):number{
  const base=({small_scrap:.05,cable:.03,small_appliance:.12,bike_fan:.18,medium_appliance:.72,large_appliance:1.55} as const)[classId];
  return base*(zone==='z6'?1.45:1)*(.85+rng()*.30);
}

function discover(state:PackCState,kind:HeavyIndustrialComponentKind){if(!state.discoveredIndustrial.includes(kind))state.discoveredIndustrial.push(kind)}

export function rollPackCComponent(state:PackCState,zone:PackCZoneId,classId:TargetClassId,rng:()=>number):HeavyIndustrialComponentKind|undefined{
  if(!['medium_appliance','large_appliance'].includes(classId))return undefined;
  if(zone==='z5'){
    state.pity.industrialController++;
    if(state.pity.industrialController>=12||rng()<.03){state.pity.industrialController=0;discover(state,'industrialController');return'industrialController'}
    return undefined;
  }
  if(classId==='large_appliance'){
    state.pity.heavyHydraulicCylinder++;
    if(state.pity.heavyHydraulicCylinder>=10||rng()<.04){state.pity.heavyHydraulicCylinder=0;discover(state,'heavyHydraulicCylinder');return'heavyHydraulicCylinder'}
  }
  if(state.discoveredIndustrial.includes('industrialController')&&rng()<.018)return'industrialController';
  return undefined;
}

export function refineAlloy(state:PackCState,batches=1):number{
  const possible=Math.min(Math.max(0,Math.floor(batches)),Math.floor(state.materials.alloyScrap/25));
  if(possible<=0)return 0;
  state.materials.alloyScrap-=possible*25;const output=possible*18;state.materials.alloyBillet+=output;return output;
}

export function canFabricateHeavyModule(state:PackCState,kind:HeavyFabricatedModuleKind,inv:PackCInventory):boolean{
  if(kind==='hydraulicPower')return state.materials.alloyBillet>=8&&inv.steelBlank>=10&&inv.hydraulic>=1&&inv.pump>=1&&state.industrial.heavyHydraulicCylinder>=1;
  return state.materials.alloyBillet>=12&&inv.steelBlank>=16&&inv.structural>=1&&inv.control>=1&&state.industrial.industrialController>=1;
}

export function fabricateHeavyModule(state:PackCState,kind:HeavyFabricatedModuleKind,inv:PackCInventory):boolean{
  if(!canFabricateHeavyModule(state,kind,inv))return false;
  if(kind==='hydraulicPower'){
    state.materials.alloyBillet-=8;inv.steelBlank-=10;inv.hydraulic--;inv.pump--;state.industrial.heavyHydraulicCylinder--;
  }else{
    state.materials.alloyBillet-=12;inv.steelBlank-=16;inv.structural--;inv.control--;state.industrial.industrialController--;
  }
  state.modules[kind]++;return true;
}

export function productionDurationSec(state:PackCState,kind:PackCProductionKind):number{
  const operator=state.crew3.hired&&state.crew3.role==='operator';
  return PACK_C_PRODUCTION_SECONDS[kind]*(operator ? .75 : 1);
}

export function canStartPackCProduction(state:PackCState,kind:PackCProductionKind,inv:PackCInventory):boolean{
  if(state.production)return false;
  if(kind==='alloyBillet')return state.materials.alloyScrap>=25;
  return canFabricateHeavyModule(state,kind,inv);
}

export function startPackCProduction(state:PackCState,kind:PackCProductionKind,inv:PackCInventory,now=Date.now()):boolean{
  if(!canStartPackCProduction(state,kind,inv))return false;
  if(kind==='alloyBillet')state.materials.alloyScrap-=25;
  else if(kind==='hydraulicPower'){
    state.materials.alloyBillet-=8;inv.steelBlank-=10;inv.hydraulic--;inv.pump--;state.industrial.heavyHydraulicCylinder--;
  }else{
    state.materials.alloyBillet-=12;inv.steelBlank-=16;inv.structural--;inv.control--;state.industrial.industrialController--;
  }
  const duration=productionDurationSec(state,kind);
  state.production={kind,startedAt:now,endsAt:now+duration*1000,outputAmount:kind==='alloyBillet'?18:1};
  return true;
}

export function advancePackCProduction(state:PackCState,now=Date.now()):PackCProductionKind|undefined{
  const job=state.production;if(!job||job.endsAt>now)return undefined;
  if(job.kind==='alloyBillet')state.materials.alloyBillet+=job.outputAmount;
  else state.modules[job.kind]+=job.outputAmount;
  state.production=null;return job.kind;
}

export function productionProgress(state:PackCState,now=Date.now()):number{
  const job=state.production;if(!job)return 0;
  return Math.max(0,Math.min(1,(now-job.startedAt)/(job.endsAt-job.startedAt)));
}

export function canAcquireSalvageYard(state:PackCState,inv:PackCInventory,z6Mastered:boolean):boolean{
  return !state.salvageYardOwned&&z6Mastered&&inv.cash>=SALVAGE_YARD_CASH&&inv.metal>=SALVAGE_YARD_RECIPE.metal&&
    inv.cleanCopper>=SALVAGE_YARD_RECIPE.cleanCopper&&inv.briquette>=SALVAGE_YARD_RECIPE.briquette&&inv.steelBlank>=SALVAGE_YARD_RECIPE.steelBlank&&inv.aluminiumBillet>=SALVAGE_YARD_RECIPE.aluminiumBillet&&
    state.materials.alloyBillet>=SALVAGE_YARD_RECIPE.alloyBillet&&state.modules.hydraulicPower>=SALVAGE_YARD_RECIPE.hydraulicPower&&
    state.modules.heavyFrame>=SALVAGE_YARD_RECIPE.heavyFrame&&inv.control>=SALVAGE_YARD_RECIPE.control;
}

export function acquireSalvageYard(state:PackCState,inv:PackCInventory,z6Mastered:boolean):boolean{
  if(!canAcquireSalvageYard(state,inv,z6Mastered))return false;
  inv.cash-=SALVAGE_YARD_CASH;inv.metal-=SALVAGE_YARD_RECIPE.metal;inv.cleanCopper-=SALVAGE_YARD_RECIPE.cleanCopper;inv.briquette-=SALVAGE_YARD_RECIPE.briquette;inv.steelBlank-=SALVAGE_YARD_RECIPE.steelBlank;inv.aluminiumBillet-=SALVAGE_YARD_RECIPE.aluminiumBillet;
  state.materials.alloyBillet-=SALVAGE_YARD_RECIPE.alloyBillet;state.modules.hydraulicPower-=SALVAGE_YARD_RECIPE.hydraulicPower;state.modules.heavyFrame-=SALVAGE_YARD_RECIPE.heavyFrame;inv.control-=SALVAGE_YARD_RECIPE.control;
  state.salvageYardOwned=true;return true;
}

export function canHireThirdWorker(state:PackCState,cash:number):boolean{return state.salvageYardOwned&&!state.crew3.hired&&cash>=THIRD_WORKER_COST}
export function hireThirdWorker(state:PackCState,now=Date.now()):boolean{
  if(state.crew3.hired||!state.salvageYardOwned)return false;
  state.crew3={hired:true,role:'scavenger',assignment:null,lastTick:now};return true;
}
export function assignThirdWorkerScavenger(state:PackCState,zone:PackCCrewZoneId,mastered:boolean,now=Date.now()):boolean{
  if(!state.crew3.hired||!mastered)return false;
  state.crew3.role='scavenger';state.crew3.assignment=zone;state.crew3.lastTick=now;return true;
}
export function assignThirdWorkerOperator(state:PackCState,now=Date.now()):boolean{
  if(!state.crew3.hired||!state.salvageYardOwned)return false;
  state.crew3.role='operator';state.crew3.assignment=null;state.crew3.lastTick=now;return true;
}

const CREW3_RATES:Record<PackCCrewZoneId,Record<ResourceKind,number>>={
  z1:{metal:92,copper:6,plastic:16},z2:{metal:82,copper:10,plastic:13},z3:{metal:112,copper:11,plastic:15},
  z4:{metal:132,copper:12,plastic:10},z5:{metal:162,copper:14,plastic:8},z6:{metal:178,copper:15,plastic:6},
  z7:{metal:205,copper:16,plastic:5},z8:{metal:232,copper:18,plastic:4}
};

export function simulateThirdWorker(state:PackCState,economy:WorkerEconomyV2State,discoveredComponents:ReadonlyArray<ComponentKind>,now=Date.now(),offline=false):{hours:number;resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;weight:number;source:string;offlineRemainingHours:number}{
  const empty={hours:0,resources:emptyResources(),components:emptyComponents(),weight:0,source:'none',offlineRemainingHours:economy.shifts.w3.remainingOfflineMs/3_600_000},w=state.crew3;
  if(!w.hired||w.role!=='scavenger'||!w.assignment){w.lastTick=now;return empty}
  const gain=simulateBenchmarkedWorker({state:economy,slot:'w3',zone:w.assignment,lastTick:w.lastTick,now,offline,discoveredComponents,legacyRates:CREW3_RATES[w.assignment]});
  w.lastTick=gain.lastTick;
  return{hours:gain.hours,resources:gain.resources,components:gain.components,weight:gain.weight,source:gain.source,offlineRemainingHours:gain.offlineRemainingHours};
}
