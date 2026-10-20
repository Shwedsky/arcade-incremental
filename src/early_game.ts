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

const r=(key:ResourceKind,amount:number,label:string):MachineRequirement=>({kind:'resource',key,amount,label,source:'Полевая добыча и склад.'});
const c=(key:ComponentKind,amount:number,label:string):MachineRequirement=>({kind:'component',key,amount,label,source:'Редкие узлы из техники.'});
const money=(amount:number,label='Расходники'):MachineRequirement=>({kind:'cash',amount,label,source:'Продажи, постоянные покупатели и спецзаказы.'});

export const EQUIPMENT_DEFS: Record<EquipmentId, EquipmentDef> = {
  tool: {
    id:'tool',name:'Инструмент',icon:'⚒',baseName:'Старый ломик',
    upgrades:[
      {toLevel:2,name:'Усиленная монтировка',benefit:'+22% базовой мощности разбора.',minPlayerLevel:2,durationSec:120,requirements:[r('metal',25,'Металл'),money(600)]},
      {toLevel:3,name:'Аккумуляторный резак',benefit:'+50% мощности относительно стартового инструмента.',minPlayerLevel:4,durationSec:300,requirements:[r('metal',60,'Металл'),c('motor',1,'Электромотор'),money(2000)]},
      {toLevel:4,name:'Гидроножницы',benefit:'+82% мощности и уверенный разбор тяжёлой бытовой техники.',minPlayerLevel:6,durationSec:600,requirements:[r('metal',120,'Металл'),c('hydraulic',1,'Гидравлический узел'),c('electronics',1,'Электронный модуль'),money(5500)]},
      {toLevel:5,name:'Компактный плазморез',benefit:'Мощность ×2,18 от старта. Первый инструмент ангарного класса.',minPlayerLevel:9,durationSec:900,requirements:[r('metal',180,'Металл'),r('copper',35,'Медь'),c('electronics',2,'Электронные модули'),money(11000)]},
      {toLevel:6,name:'Гидрорезак Mk II',benefit:'Мощность ×2,60. Тяжёлые цели перестают быть длинной паузой.',minPlayerLevel:12,durationSec:1200,requirements:[r('metal',260,'Металл'),r('copper',45,'Медь'),c('hydraulic',2,'Гидравлические узлы'),c('motor',2,'Электромоторы'),money(19000)]},
      {toLevel:7,name:'Индукционный ломатель',benefit:'Мощность ×3,10. Сильный скачок для промышленного фронтира.',minPlayerLevel:16,durationSec:1800,requirements:[r('metal',360,'Металл'),r('copper',65,'Медь'),c('electronics',3,'Электронные модули'),c('motor',2,'Электромоторы'),money(32000)]},
      {toLevel:8,name:'Промышленный резак',benefit:'Мощность ×3,70. Инструмент для постоянной работы с крупным ломом.',minPlayerLevel:21,durationSec:2400,requirements:[r('metal',520,'Металл'),r('copper',90,'Медь'),c('hydraulic',3,'Гидравлические узлы'),c('electronics',3,'Электронные модули'),money(52000)]},
      {toLevel:9,name:'Силовой демонтажный модуль',benefit:'Мощность ×4,45. Поздний промышленный класс.',minPlayerLevel:27,durationSec:3000,requirements:[r('metal',720,'Металл'),r('copper',120,'Медь'),c('hydraulic',4,'Гидравлические узлы'),c('motor',4,'Электромоторы'),money(80000)]},
      {toLevel:10,name:'Демонтажный комплекс',benefit:'Мощность ×5,35. Верх личного инструмента текущей бизнес-эры.',minPlayerLevel:34,durationSec:4200,requirements:[r('metal',1000,'Металл'),r('copper',160,'Медь'),c('hydraulic',5,'Гидравлические узлы'),c('electronics',5,'Электронные модули'),money(125000)]}
    ]
  },
  cart:{
    id:'cart',name:'Тележка',icon:'🛒',baseName:'Ручная тележка',
    upgrades:[
      {toLevel:2,name:'Усиленная тележка',benefit:'Базовая вместимость 40 → 55 кг.',minPlayerLevel:2,durationSec:120,requirements:[r('metal',35,'Металл'),money(900,'Колёса и крепёж')]},
      {toLevel:3,name:'Грузовая тележка',benefit:'Базовая вместимость 55 → 75 кг.',minPlayerLevel:4,durationSec:300,requirements:[r('metal',80,'Металл'),c('bearing',2,'Подшипники'),money(2500,'Колёса и крепёж')]},
      {toLevel:4,name:'Моторизированная тележка',benefit:'Базовая вместимость 75 → 100 кг.',minPlayerLevel:6,durationSec:600,requirements:[r('metal',140,'Металл'),c('motor',1,'Электромотор'),c('electronics',1,'Электронный модуль'),money(6500,'Ходовая и электрика')]},
      {toLevel:5,name:'Самоходная платформа',benefit:'Вместимость 100 → 135 кг. Полевая логистика становится отдельным слоем прогресса.',minPlayerLevel:9,durationSec:900,requirements:[r('metal',210,'Металл'),c('bearing',3,'Подшипники'),c('motor',2,'Электромоторы'),money(12000,'Ходовая')]},
      {toLevel:6,name:'Усиленная платформа',benefit:'Вместимость 135 → 175 кг.',minPlayerLevel:12,durationSec:1200,requirements:[r('metal',300,'Металл'),c('bearing',4,'Подшипники'),c('hydraulic',1,'Гидравлический узел'),money(21000,'Рама и ходовая')]},
      {toLevel:7,name:'Электроплатформа',benefit:'Вместимость 175 → 220 кг.',minPlayerLevel:16,durationSec:1800,requirements:[r('metal',420,'Металл'),r('copper',55,'Медь'),c('motor',2,'Электромоторы'),c('electronics',2,'Электронные модули'),money(35000,'Электропривод')]},
      {toLevel:8,name:'Промышленная тележка',benefit:'Вместимость 220 → 270 кг.',minPlayerLevel:21,durationSec:2400,requirements:[r('metal',580,'Металл'),c('bearing',5,'Подшипники'),c('hydraulic',2,'Гидравлические узлы'),money(55000,'Промышленная рама')]},
      {toLevel:9,name:'Малая грузовая платформа',benefit:'Вместимость 270 → 330 кг.',minPlayerLevel:27,durationSec:3000,requirements:[r('metal',780,'Металл'),r('copper',80,'Медь'),c('motor',3,'Электромоторы'),c('electronics',3,'Электронные модули'),money(85000,'Привод и рама')]},
      {toLevel:10,name:'Полевой транспортер',benefit:'Вместимость 330 → 400 кг. Верх личного носителя текущей эры.',minPlayerLevel:34,durationSec:4200,requirements:[r('metal',1050,'Металл'),r('copper',120,'Медь'),c('hydraulic',3,'Гидравлические узлы'),c('electronics',4,'Электронные модули'),money(130000,'Промышленная сборка')]}
    ]
  }
};

export function nextEquipmentUpgrade(id:EquipmentId,currentLevel:number):EquipmentUpgradeDef|undefined{return EQUIPMENT_DEFS[id].upgrades.find(upgrade=>upgrade.toLevel===currentLevel+1)}

const TOOL_POWER=[0,1,1.22,1.50,1.82,2.18,2.60,3.10,3.70,4.45,5.35];
const CART_CAPACITY=[0,40,55,75,100,135,175,220,270,330,400];
export function toolPowerMultiplier(level:number):number{return TOOL_POWER[Math.max(1,Math.min(10,Math.floor(level)))]??1}
export function cartBaseCapacity(level:number):number{return CART_CAPACITY[Math.max(1,Math.min(10,Math.floor(level)))]??40}

export interface WorkshopJob {
  id:string;kind:'build_machine'|'upgrade_machine'|'equipment'|'process';label:string;startedAt:number;endsAt:number;
  machineId?:MachineId;targetLevel?:number;equipmentId?:EquipmentId;processKind?:ProcessKind;inputResource?:ResourceKind;inputAmount?:number;outputAmount?:number;
}
export function jobProgress(job:WorkshopJob,now:number):number{const duration=Math.max(1,job.endsAt-job.startedAt);return Math.max(0,Math.min(1,(now-job.startedAt)/duration))}
export function jobRemainingSec(job:WorkshopJob,now:number):number{return Math.max(0,Math.ceil((job.endsAt-now)/1000))}

export interface ContractNeed{kind:'resource'|'component'|'processed';key:ResourceKind|ComponentKind|ProcessKind;amount:number;label:string}
export interface ContractDef{id:string;name:string;description:string;needs:ContractNeed[];cashReward:number;xpReward:number}
export interface ContractState{index:number;completed:number;[key:string]:unknown}
export const CONTRACTS:ContractDef[]=[
  {id:'metal_pickup',name:'Пункт приёма: железо',description:'Небольшая партия обычного лома.',needs:[{kind:'resource',key:'metal',amount:30,label:'Металл'}],cashReward:420,xpReward:20},
  {id:'repair_shop',name:'Ремонтная мастерская',description:'Металл и рабочий подшипник.',needs:[{kind:'resource',key:'metal',amount:18,label:'Металл'},{kind:'component',key:'bearing',amount:1,label:'Подшипник'}],cashReward:850,xpReward:28},
  {id:'electrician',name:'Электромонтажники',description:'Медь и пластик для кабельных работ.',needs:[{kind:'resource',key:'copper',amount:5,label:'Медь'},{kind:'resource',key:'plastic',amount:10,label:'Пластик'}],cashReward:760,xpReward:25}
];
function contractExperienceNeedMultiplier(state:ContractState):number{return 1+Math.min(.25,state.completed*.025)}
export function activeContract(state:ContractState):ContractDef{const def=CONTRACTS[((state.index%CONTRACTS.length)+CONTRACTS.length)%CONTRACTS.length],maxNeedMultiplier=contractExperienceNeedMultiplier(state)+.08;return{...def,needs:def.needs.map(need=>need.kind==='component'?{...need,amount:need.amount/maxNeedMultiplier}:{...need})}}
export function contractScale(state:ContractState,urgentUnlocked:boolean):number{const experience=Math.min(.40,state.completed*.04);return 1+experience+(urgentUnlocked?.18:0)}

export function buildDurationSec(machineId:MachineId):number{return({workbench:180,press:720,wire:1080,plastic:1500} as const)[machineId]}
export function upgradeDurationSec(machineId:MachineId,toLevel:number):number{const base=({workbench:240,press:480,wire:540,plastic:720} as const)[machineId];return base*Math.max(1,toLevel-1)}
export function processSpec(machineId:MachineId,level:number,yieldMultiplier:number):{kind:ProcessKind;resource:ResourceKind;input:number;output:number;durationSec:number;label:string}|null{
  if(machineId==='workbench')return null;
  if(machineId==='press'){const input=10*level;return{kind:'briquette',resource:'metal',input,output:input*yieldMultiplier,durationSec:30/Math.max(1,level*.8),label:'Прессование металла'}}
  if(machineId==='wire'){const input=5*level;return{kind:'cleanCopper',resource:'copper',input,output:input*yieldMultiplier,durationSec:38/Math.max(1,level*.75),label:'Зачистка меди'}}
  const input=10*level;return{kind:'granulate',resource:'plastic',input,output:input*yieldMultiplier,durationSec:42/Math.max(1,level*.75),label:'Дробление пластика'}
}
