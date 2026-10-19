import type { ComponentKind, ResourceKind } from './sim.ts';
import type { MachineId, MachineRequirement } from './garage.ts';

export type EquipmentId = 'tool' | 'cart';
export type ProcessKind = 'briquette' | 'cleanCopper' | 'granulate';

export interface EquipmentUpgradeDef {
  toLevel: number;
  name: string;
  benefit: string;
  minPlayerLevel: number;
  durationSec: number;
  requirements: MachineRequirement[];
}

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  icon: string;
  baseName: string;
  upgrades: EquipmentUpgradeDef[];
}

export const EQUIPMENT_DEFS: Record<EquipmentId, EquipmentDef> = {
  tool: {
    id: 'tool', name: 'Инструмент', icon: '⚒', baseName: 'Старый ломик',
    upgrades: [
      {
        toLevel: 2, name: 'Усиленная монтировка', benefit: '+22% базовой мощности разбора.', minPlayerLevel: 2, durationSec: 120,
        requirements: [
          { kind:'resource', key:'metal', amount:25, label:'Металл', source:'Любой металлический лом.' },
          { kind:'cash', amount:600, label:'Расходники', source:'Продажа сырья или первый контракт.' }
        ]
      },
      {
        toLevel: 3, name: 'Аккумуляторный резак', benefit: '+50% мощности относительно стартового инструмента.', minPlayerLevel: 4, durationSec: 300,
        requirements: [
          { kind:'resource', key:'metal', amount:60, label:'Металл', source:'Металлолом.' },
          { kind:'component', key:'motor', amount:1, label:'Электромотор', source:'Средняя техника.' },
          { kind:'cash', amount:2000, label:'Расходники', source:'Продажа и контракты.' }
        ]
      },
      {
        toLevel: 4, name: 'Гидроножницы', benefit: '+82% мощности и подготовка к тяжёлому лому.', minPlayerLevel: 6, durationSec: 600,
        requirements: [
          { kind:'resource', key:'metal', amount:120, label:'Металл', source:'Металлолом.' },
          { kind:'component', key:'hydraulic', amount:1, label:'Гидравлический узел', source:'Средняя/крупная техника.' },
          { kind:'component', key:'electronics', amount:1, label:'Электронный модуль', source:'Электронный лом.' },
          { kind:'cash', amount:5500, label:'Расходники', source:'Продажа переработки и контракты.' }
        ]
      }
    ]
  },
  cart: {
    id:'cart', name:'Тележка', icon:'🛒', baseName:'Ручная тележка',
    upgrades:[
      {
        toLevel:2, name:'Усиленная тележка', benefit:'Базовая вместимость 40 → 55 кг.', minPlayerLevel:2, durationSec:120,
        requirements:[
          { kind:'resource', key:'metal', amount:35, label:'Металл', source:'Металлолом.' },
          { kind:'cash', amount:900, label:'Колёса и крепёж', source:'Продажа сырья или контракт.' }
        ]
      },
      {
        toLevel:3, name:'Грузовая тележка', benefit:'Базовая вместимость 55 → 75 кг.', minPlayerLevel:4, durationSec:300,
        requirements:[
          { kind:'resource', key:'metal', amount:80, label:'Металл', source:'Металлолом.' },
          { kind:'component', key:'bearing', amount:2, label:'Подшипники', source:'Велосипеды / вентиляторы.' },
          { kind:'cash', amount:2500, label:'Колёса и крепёж', source:'Продажа и контракты.' }
        ]
      },
      {
        toLevel:4, name:'Моторизированная тележка', benefit:'Базовая вместимость 75 → 100 кг.', minPlayerLevel:6, durationSec:600,
        requirements:[
          { kind:'resource', key:'metal', amount:140, label:'Металл', source:'Металлолом.' },
          { kind:'component', key:'motor', amount:1, label:'Электромотор', source:'Средняя техника.' },
          { kind:'component', key:'electronics', amount:1, label:'Электронный модуль', source:'Электронный лом.' },
          { kind:'cash', amount:6500, label:'Ходовая и электрика', source:'Продажа переработки и контракты.' }
        ]
      }
    ]
  }
};

export function nextEquipmentUpgrade(id:EquipmentId,currentLevel:number):EquipmentUpgradeDef|undefined {
  return EQUIPMENT_DEFS[id].upgrades.find((upgrade)=>upgrade.toLevel===currentLevel+1);
}

export function toolPowerMultiplier(level:number):number {
  return [1,1,1.22,1.50,1.82][Math.max(1,Math.min(4,level))] ?? 1;
}

export function cartBaseCapacity(level:number):number {
  return [0,40,55,75,100][Math.max(1,Math.min(4,level))] ?? 40;
}

export interface WorkshopJob {
  id: string;
  kind: 'build_machine' | 'upgrade_machine' | 'equipment' | 'process';
  label: string;
  startedAt: number;
  endsAt: number;
  machineId?: MachineId;
  targetLevel?: number;
  equipmentId?: EquipmentId;
  processKind?: ProcessKind;
  inputResource?: ResourceKind;
  inputAmount?: number;
  outputAmount?: number;
}

export function jobProgress(job:WorkshopJob,now:number):number {
  const duration=Math.max(1,job.endsAt-job.startedAt);
  return Math.max(0,Math.min(1,(now-job.startedAt)/duration));
}

export function jobRemainingSec(job:WorkshopJob,now:number):number {
  return Math.max(0,Math.ceil((job.endsAt-now)/1000));
}

export interface ContractNeed {
  kind:'resource'|'component'|'processed';
  key:ResourceKind|ComponentKind|ProcessKind;
  amount:number;
  label:string;
}

export interface ContractDef {
  id:string;
  name:string;
  description:string;
  needs:ContractNeed[];
  cashReward:number;
  xpReward:number;
}

export interface ContractState {
  index:number;
  completed:number;
}

export const CONTRACTS:ContractDef[] = [
  {
    id:'metal_pickup', name:'Пункт приёма: железо', description:'Нужна небольшая партия чистого обычного лома. Хороший первый заказ.',
    needs:[{kind:'resource',key:'metal',amount:30,label:'Металл'}], cashReward:420, xpReward:20
  },
  {
    id:'repair_shop', name:'Ремонтная мастерская', description:'Мастеру нужны металл и рабочий подшипник.',
    needs:[{kind:'resource',key:'metal',amount:18,label:'Металл'},{kind:'component',key:'bearing',amount:1,label:'Подшипник'}], cashReward:850, xpReward:28
  },
  {
    id:'electrician', name:'Электромонтажники', description:'Собери небольшую партию меди и пластика для кабельных работ.',
    needs:[{kind:'resource',key:'copper',amount:5,label:'Медь'},{kind:'resource',key:'plastic',amount:10,label:'Пластик'}], cashReward:760, xpReward:25
  }
];

function contractExperienceNeedMultiplier(state:ContractState):number {
  return 1+Math.min(.25,state.completed*.025);
}

export function activeContract(state:ContractState):ContractDef {
  const def=CONTRACTS[((state.index%CONTRACTS.length)+CONTRACTS.length)%CONTRACTS.length];
  // main runtime scales all contract needs by experience and +8% for urgent orders.
  // Pre-normalize discrete components against the maximum multiplier so one bearing
  // always remains one whole bearing instead of becoming a hidden 1.025 -> ceil(2).
  const maxNeedMultiplier=contractExperienceNeedMultiplier(state)+.08;
  return {
    ...def,
    needs:def.needs.map(need=>need.kind==='component'?{...need,amount:need.amount/maxNeedMultiplier}:{...need})
  };
}

export function contractScale(state:ContractState,urgentUnlocked:boolean):number {
  const experience=Math.min(.40,state.completed*.04);
  return 1+experience+(urgentUnlocked ? .18 : 0);
}

export function buildDurationSec(machineId:MachineId):number {
  return ({workbench:180,press:720,wire:1080,plastic:1500} as const)[machineId];
}

export function upgradeDurationSec(machineId:MachineId,toLevel:number):number {
  const base=({workbench:240,press:480,wire:540,plastic:720} as const)[machineId];
  return base*Math.max(1,toLevel-1);
}

export function processSpec(machineId:MachineId,level:number,yieldMultiplier:number):{kind:ProcessKind;resource:ResourceKind;input:number;output:number;durationSec:number;label:string}|null {
  if(machineId==='workbench')return null;
  if(machineId==='press'){
    const input=10*level;return {kind:'briquette',resource:'metal',input,output:input*yieldMultiplier,durationSec:30/Math.max(1,level*.8),label:'Прессование металла'};
  }
  if(machineId==='wire'){
    const input=5*level;return {kind:'cleanCopper',resource:'copper',input,output:input*yieldMultiplier,durationSec:38/Math.max(1,level*.75),label:'Зачистка меди'};
  }
  const input=10*level;return {kind:'granulate',resource:'plastic',input,output:input*yieldMultiplier,durationSec:42/Math.max(1,level*.75),label:'Дробление пластика'};
}
