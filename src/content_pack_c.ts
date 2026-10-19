import type { TargetClassId } from './sim.ts';

export type PackCZoneId='z5'|'z6';
export type HeavyIndustrialComponentKind='industrialController'|'heavyHydraulicCylinder';
export type HeavyFabricatedModuleKind='hydraulicPower'|'heavyFrame';

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

export interface HeavyIndustrialComponents{
  industrialController:number;
  heavyHydraulicCylinder:number;
}

export interface PackCMaterials{
  alloyScrap:number;
  alloyBillet:number;
}

export interface HeavyFabricatedModules{
  hydraulicPower:number;
  heavyFrame:number;
}

export interface PackCState{
  materials:PackCMaterials;
  industrial:HeavyIndustrialComponents;
  discoveredIndustrial:HeavyIndustrialComponentKind[];
  pity:HeavyIndustrialComponents;
  modules:HeavyFabricatedModules;
  salvageYardOwned:boolean;
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
  steelBlank:number;
  structural:number;
  control:number;
  hydraulic:number;
  pump:number;
}

export const SALVAGE_YARD_CASH=250_000;
export const SALVAGE_YARD_RECIPE={
  metal:700,cleanCopper:24,steelBlank:20,alloyBillet:30,hydraulicPower:2,heavyFrame:2,control:2
} as const;

export function emptyHeavyIndustrialComponents():HeavyIndustrialComponents{return{industrialController:0,heavyHydraulicCylinder:0}}
export function emptyPackCMaterials():PackCMaterials{return{alloyScrap:0,alloyBillet:0}}
export function emptyHeavyFabricatedModules():HeavyFabricatedModules{return{hydraulicPower:0,heavyFrame:0}}

export function createDefaultPackC():PackCState{
  return{
    materials:emptyPackCMaterials(),industrial:emptyHeavyIndustrialComponents(),discoveredIndustrial:[],
    pity:emptyHeavyIndustrialComponents(),modules:emptyHeavyFabricatedModules(),salvageYardOwned:false
  };
}

export function normalizePackC(value:Partial<PackCState>|undefined):PackCState{
  const base=createDefaultPackC();
  if(!value)return base;
  return{
    ...base,...value,
    materials:{...base.materials,...value.materials},
    industrial:{...base.industrial,...value.industrial},
    discoveredIndustrial:[...(value.discoveredIndustrial??[])],
    pity:{...base.pity,...value.pity},
    modules:{...base.modules,...value.modules}
  };
}

export function packCComponentName(kind:HeavyIndustrialComponentKind):string{
  return kind==='industrialController'?'Промышленный контроллер':'Тяжёлый гидроцилиндр';
}

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
  const zoneMult=zone==='z6'?1.45:1;
  return base*zoneMult*(.85+rng()*.30);
}

function discover(state:PackCState,kind:HeavyIndustrialComponentKind){
  if(!state.discoveredIndustrial.includes(kind))state.discoveredIndustrial.push(kind);
}

export function rollPackCComponent(state:PackCState,zone:PackCZoneId,classId:TargetClassId,rng:()=>number):HeavyIndustrialComponentKind|undefined{
  if(!['medium_appliance','large_appliance'].includes(classId))return undefined;
  if(zone==='z5'){
    state.pity.industrialController++;
    if(state.pity.industrialController>=12||rng()<.03){
      state.pity.industrialController=0;discover(state,'industrialController');return'industrialController';
    }
    return undefined;
  }
  if(classId==='large_appliance'){
    state.pity.heavyHydraulicCylinder++;
    if(state.pity.heavyHydraulicCylinder>=10||rng()<.04){
      state.pity.heavyHydraulicCylinder=0;discover(state,'heavyHydraulicCylinder');return'heavyHydraulicCylinder';
    }
  }
  // Z6 remains a secondary source of already-known controllers without replacing Z5 discovery pacing.
  if(state.discoveredIndustrial.includes('industrialController')&&rng()<.018)return'industrialController';
  return undefined;
}

export function refineAlloy(state:PackCState,batches=1):number{
  const possible=Math.min(Math.max(0,Math.floor(batches)),Math.floor(state.materials.alloyScrap/25));
  if(possible<=0)return 0;
  state.materials.alloyScrap-=possible*25;
  const output=possible*18;
  state.materials.alloyBillet+=output;
  return output;
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
  state.modules[kind]++;
  return true;
}

export function canAcquireSalvageYard(state:PackCState,inv:PackCInventory,z6Mastered:boolean):boolean{
  return !state.salvageYardOwned&&z6Mastered&&inv.cash>=SALVAGE_YARD_CASH&&inv.metal>=SALVAGE_YARD_RECIPE.metal&&
    inv.cleanCopper>=SALVAGE_YARD_RECIPE.cleanCopper&&inv.steelBlank>=SALVAGE_YARD_RECIPE.steelBlank&&
    state.materials.alloyBillet>=SALVAGE_YARD_RECIPE.alloyBillet&&state.modules.hydraulicPower>=SALVAGE_YARD_RECIPE.hydraulicPower&&
    state.modules.heavyFrame>=SALVAGE_YARD_RECIPE.heavyFrame&&inv.control>=SALVAGE_YARD_RECIPE.control;
}

export function acquireSalvageYard(state:PackCState,inv:PackCInventory,z6Mastered:boolean):boolean{
  if(!canAcquireSalvageYard(state,inv,z6Mastered))return false;
  inv.cash-=SALVAGE_YARD_CASH;inv.metal-=SALVAGE_YARD_RECIPE.metal;inv.cleanCopper-=SALVAGE_YARD_RECIPE.cleanCopper;inv.steelBlank-=SALVAGE_YARD_RECIPE.steelBlank;
  state.materials.alloyBillet-=SALVAGE_YARD_RECIPE.alloyBillet;state.modules.hydraulicPower-=SALVAGE_YARD_RECIPE.hydraulicPower;state.modules.heavyFrame-=SALVAGE_YARD_RECIPE.heavyFrame;inv.control-=SALVAGE_YARD_RECIPE.control;
  state.salvageYardOwned=true;return true;
}
