import type { MachineId } from './garage.ts';
import type { ZoneId } from './midgame.ts';
import type { TargetClassId } from './sim.ts';

export interface ZoneVisualTheme {
  id: ZoneId;
  label: string;
  groundTop: string;
  groundBottom: string;
  groundDust: string;
  lane: string;
  laneMark: string;
  edge: string;
  accent: string;
  accentSoft: string;
  shadow: string;
  decor: readonly DecorVisualKind[];
}

export type DecorVisualKind = 'patch'|'barrel'|'tire'|'crate'|'fence'|'cone'|'pallet'|'puddle'|'scrapstack';

export interface TargetVisualSpec {
  id: TargetClassId;
  family: 'scrap'|'cable'|'appliance'|'frame'|'machine';
  base: string;
  dark: string;
  light: string;
  accent: string;
  depthPx: number;
}

export interface MachineVisualSpec {
  id: MachineId;
  floorW: number;
  floorH: number;
  accent: string;
  label: string;
}

export const ZONE_VISUALS:Record<ZoneId,ZoneVisualTheme>={
  z1:{id:'z1',label:'Старая свалка',groundTop:'#40583f',groundBottom:'#26392f',groundDust:'#56654c',lane:'#414741',laneMark:'#d5c56f',edge:'#243029',accent:'#e1b45c',accentSoft:'#e1b45c44',shadow:'#0c1711aa',decor:['patch','patch','barrel','tire','crate','fence','scrapstack']},
  z2:{id:'z2',label:'Гаражи / дворы',groundTop:'#485358',groundBottom:'#30393d',groundDust:'#69757a',lane:'#343b40',laneMark:'#e4d49c',edge:'#222a2e',accent:'#70bdd0',accentSoft:'#70bdd044',shadow:'#091116b5',decor:['puddle','cone','pallet','crate','tire','fence','barrel']},
  z3:{id:'z3',label:'Свалка бытовой техники',groundTop:'#665c4b',groundBottom:'#3f3b34',groundDust:'#88765d',lane:'#49463f',laneMark:'#e6c670',edge:'#2d2b28',accent:'#e48f57',accentSoft:'#e48f5748',shadow:'#140f0bb8',decor:['scrapstack','pallet','crate','barrel','cone','puddle','fence']},
  z4:{id:'z4',label:'Авторазборка',groundTop:'#474b52',groundBottom:'#252b31',groundDust:'#686b72',lane:'#2d3338',laneMark:'#e8b64f',edge:'#1b2025',accent:'#f0a63c',accentSoft:'#f0a63c48',shadow:'#090d12c2',decor:['tire','tire','scrapstack','pallet','barrel','fence','puddle','cone']},
  z5:{id:'z5',label:'Промышленная зона',groundTop:'#3f4b50',groundBottom:'#202a2f',groundDust:'#657177',lane:'#2a3439',laneMark:'#e6c15a',edge:'#171f23',accent:'#6dc8d5',accentSoft:'#6dc8d548',shadow:'#071014c8',decor:['pallet','barrel','fence','puddle','cone','scrapstack','crate']},
  z6:{id:'z6',label:'Заброшенный завод',groundTop:'#51483f',groundBottom:'#292724',groundDust:'#78695b',lane:'#363431',laneMark:'#d9934d',edge:'#211d19',accent:'#d97845',accentSoft:'#d9784548',shadow:'#100b08cc',decor:['scrapstack','pallet','barrel','fence','puddle','crate','cone']}
};

export const TARGET_VISUALS:Record<TargetClassId,TargetVisualSpec>={
  small_scrap:{id:'small_scrap',family:'scrap',base:'#909a92',dark:'#56615b',light:'#c4c9c4',accent:'#a97752',depthPx:5},
  cable:{id:'cable',family:'cable',base:'#d9763f',dark:'#7b3d25',light:'#f5a46e',accent:'#d98945',depthPx:4},
  small_appliance:{id:'small_appliance',family:'appliance',base:'#a8bbb5',dark:'#485b57',light:'#e1e3db',accent:'#5e8794',depthPx:7},
  bike_fan:{id:'bike_fan',family:'frame',base:'#d2a44f',dark:'#655736',light:'#f0ca75',accent:'#b85f49',depthPx:5},
  medium_appliance:{id:'medium_appliance',family:'machine',base:'#d2d7d0',dark:'#4f605c',light:'#f2f0e9',accent:'#728b92',depthPx:9},
  large_appliance:{id:'large_appliance',family:'machine',base:'#cfc0a2',dark:'#5c645e',light:'#e8ddca',accent:'#8d7757',depthPx:11}
};

export const MACHINE_VISUALS:Record<MachineId,MachineVisualSpec>={
  workbench:{id:'workbench',floorW:1.1,floorH:.75,accent:'#c59455',label:'Ручная зона'},
  press:{id:'press',floorW:1,floorH:1.15,accent:'#d4a245',label:'Гидравлика'},
  wire:{id:'wire',floorW:1.15,floorH:.8,accent:'#cf884f',label:'Медь'},
  plastic:{id:'plastic',floorW:1.1,floorH:1,accent:'#7fb167',label:'Пластик'}
};

export function zoneVisual(id:ZoneId):ZoneVisualTheme{return ZONE_VISUALS[id]}

export function validateVisualFoundation():string[]{
  const errors:string[]=[];
  for(const id of ['z1','z2','z3','z4','z5','z6'] as ZoneId[]){
    const t=ZONE_VISUALS[id];
    if(!t||!t.groundTop||!t.accent||t.decor.length<5)errors.push(`zone:${id}`);
  }
  const targetIds:TargetClassId[]=['small_scrap','cable','small_appliance','bike_fan','medium_appliance','large_appliance'];
  for(const id of targetIds){const v=TARGET_VISUALS[id];if(!v||v.depthPx<=0||!v.base||!v.dark||!v.light)errors.push(`target:${id}`)}
  for(const id of ['workbench','press','wire','plastic'] as MachineId[]){const v=MACHINE_VISUALS[id];if(!v||v.floorW<=0||v.floorH<=0||!v.accent)errors.push(`machine:${id}`)}
  return errors;
}
