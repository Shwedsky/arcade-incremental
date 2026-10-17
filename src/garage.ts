import type { ComponentKind, ResourceKind } from './sim.ts';
import type { TalentId } from './progression.ts';

export type MachineId = 'workbench' | 'press' | 'wire' | 'plastic';

export interface MachineRequirement {
  kind: 'resource' | 'component' | 'cash';
  key?: ResourceKind | ComponentKind;
  amount: number;
  label: string;
  source: string;
}

export interface UnlockRequirement {
  kind: 'level' | 'machine' | 'talent';
  level?: number;
  machine?: MachineId;
  talent?: TalentId;
  label: string;
}

export interface MachineUpgradeDef {
  toLevel: number;
  name: string;
  benefit: string;
  unlocks: UnlockRequirement[];
  requirements: MachineRequirement[];
}

export interface MachineDef {
  id: MachineId;
  name: string;
  short: string;
  description: string;
  icon: string;
  buyPrice?: number;
  unlocks: UnlockRequirement[];
  requirements: MachineRequirement[];
  upgrades: MachineUpgradeDef[];
}

export const STARTING_CASH = 3000;

const level = (value:number):UnlockRequirement => ({ kind:'level', level:value, label:`Уровень игрока ${value}` });
const machine = (value:MachineId, label:string):UnlockRequirement => ({ kind:'machine', machine:value, label });
const talent = (value:TalentId, label:string):UnlockRequirement => ({ kind:'talent', talent:value, label });

export const MACHINE_DEFS: Record<MachineId, MachineDef> = {
  workbench: {
    id: 'workbench', name: 'Верстак', short: 'Ручной разбор и сборка', icon: '🛠️',
    description: 'Базовое место для ручной работы. Уже установлен и служит точкой сборки первых станков.',
    unlocks: [], requirements: [],
    upgrades: [
      { toLevel:2, name:'Усиленный верстак', benefit:'Подготавливает мастерскую к более сложным сборкам.', unlocks:[level(3)], requirements:[
        { kind:'resource', key:'metal', amount:40, label:'Металл', source:'Любой металлический лом.' },
        { kind:'cash', amount:1200, label:'Расходники', source:'Продай часть сырья в гараже.' }
      ]},
      { toLevel:3, name:'Точный верстак', benefit:'Требование для части поздних гаражных рецептов.', unlocks:[level(5),talent('workshop_2','Талант «Точная настройка»')], requirements:[
        { kind:'resource', key:'metal', amount:90, label:'Металл', source:'Металлический лом.' },
        { kind:'component', key:'electronics', amount:1, label:'Электронный модуль', source:'Мелкая/средняя техника.' },
        { kind:'cash', amount:3500, label:'Расходники', source:'Продажа сырья и компонентов.' }
      ]}
    ]
  },
  press: {
    id: 'press', name: 'Малый гидропресс', short: 'Металл → компактные брикеты', icon: '▥', buyPrice: 24000,
    description: 'Первый настоящий станок. Брикеты занимают меньше места и позже продаются дороже обычного лома.',
    unlocks: [],
    requirements: [
      { kind:'resource', key:'metal', amount:100, label:'Металл', source:'Любой металлический лом на карте.' },
      { kind:'component', key:'bearing', amount:2, label:'Подшипники', source:'Чаще: велосипеды / вентиляторы; также средняя техника.' },
      { kind:'component', key:'hydraulic', amount:1, label:'Гидравлический узел', source:'Средняя/крупная техника; действует защита от плохого RNG.' },
      { kind:'cash', amount:2500, label:'Расходники', source:'Продай часть сырья в гараже.' }
    ],
    upgrades: [
      { toLevel:2, name:'Пресс II', benefit:'Выше скорость и ценность переработки металла.', unlocks:[level(5),talent('workshop_1','Талант «Экономная сборка»')], requirements:[
        { kind:'resource', key:'metal', amount:160, label:'Металл', source:'Металлолом.' },
        { kind:'component', key:'bearing', amount:2, label:'Подшипники', source:'Велосипеды / вентиляторы.' },
        { kind:'component', key:'motor', amount:1, label:'Электромотор', source:'Средняя техника.' },
        { kind:'cash', amount:4000, label:'Расходники', source:'Продажа переработанного/сырого лома.' }
      ]},
      { toLevel:3, name:'Пресс III', benefit:'Подготовка к тяжёлому лому и промышленным рецептам.', unlocks:[level(7),talent('workshop_2','Талант «Точная настройка»')], requirements:[
        { kind:'resource', key:'metal', amount:300, label:'Металл', source:'Металлолом.' },
        { kind:'component', key:'hydraulic', amount:1, label:'Гидравлический узел', source:'Крупная техника.' },
        { kind:'component', key:'motor', amount:2, label:'Электромоторы', source:'Средняя/крупная техника.' },
        { kind:'cash', amount:9000, label:'Расходники', source:'Продажа и контракты.' }
      ]}
    ]
  },
  wire: {
    id:'wire', name:'Зачистка проводов', short:'Кабель → чистая медь', icon:'◉◉', buyPrice:38000,
    description:'Повышает ценность кабеля и открывает полноценную переработку меди.',
    unlocks:[level(3),machine('press','Установить малый гидропресс')],
    requirements:[
      { kind:'resource', key:'metal', amount:140, label:'Металл', source:'Металлический лом.' },
      { kind:'component', key:'motor', amount:1, label:'Электромотор', source:'Пылесосы, дрели, стиральные машины и средняя техника.' },
      { kind:'component', key:'electronics', amount:1, label:'Электронный модуль', source:'Мелкая техника и электронный лом.' },
      { kind:'cash', amount:6000, label:'Деньги', source:'Продажа сырья.' }
    ],
    upgrades:[
      { toLevel:2, name:'Зачистка II', benefit:'Больше выхода меди и выше скорость обработки.', unlocks:[level(5),talent('workshop_1','Талант «Экономная сборка»')], requirements:[
        { kind:'resource', key:'metal', amount:120, label:'Металл', source:'Металлолом.' },
        { kind:'resource', key:'copper', amount:25, label:'Медь', source:'Кабель и техника.' },
        { kind:'component', key:'motor', amount:1, label:'Электромотор', source:'Средняя техника.' },
        { kind:'cash', amount:4500, label:'Расходники', source:'Продажа.' }
      ]}
    ]
  },
  plastic: {
    id:'plastic', name:'Дробилка пластика', short:'Пластик → гранулы', icon:'▼', buyPrice:72000,
    description:'Поздний гаражный станок: превращает дешёвый пластик в более ценный материал.',
    unlocks:[level(5),machine('wire','Установить зачистку проводов'),talent('workshop_2','Талант «Точная настройка»')],
    requirements:[
      { kind:'resource', key:'metal', amount:220, label:'Металл', source:'Металлический лом.' },
      { kind:'resource', key:'plastic', amount:80, label:'Пластик', source:'Бытовая техника и пластиковый лом.' },
      { kind:'component', key:'motor', amount:2, label:'Электромоторы', source:'Средняя техника.' },
      { kind:'cash', amount:12000, label:'Деньги', source:'Продажа сырья и переработки.' }
    ],
    upgrades:[
      { toLevel:2, name:'Дробилка II', benefit:'Больше гранул и более длинная очередь.', unlocks:[level(7),talent('workshop_2','Талант «Точная настройка»')], requirements:[
        { kind:'resource', key:'metal', amount:260, label:'Металл', source:'Металлолом.' },
        { kind:'resource', key:'plastic', amount:140, label:'Пластик', source:'Бытовая техника.' },
        { kind:'component', key:'motor', amount:2, label:'Электромоторы', source:'Средняя техника.' },
        { kind:'cash', amount:15000, label:'Расходники', source:'Продажа и контракты.' }
      ]}
    ]
  }
};

export interface GarageInventory {
  resources: Record<ResourceKind, number>;
  components: Record<ComponentKind, number>;
  cash: number;
}

export interface ProgressContext {
  level: number;
  talents: ReadonlySet<TalentId>;
  installed: ReadonlySet<MachineId>;
}

export function ownedRequirement(req: MachineRequirement, inventory: GarageInventory): number {
  if (req.kind === 'cash') return inventory.cash;
  if (req.kind === 'resource') return inventory.resources[req.key as ResourceKind];
  return inventory.components[req.key as ComponentKind];
}

export function requirementAmount(req:MachineRequirement, costMultiplier=1):number {
  if (req.kind === 'component') return req.amount;
  return Math.max(req.kind === 'cash' ? 1 : .1, req.amount * costMultiplier);
}

export function canAfford(requirements:MachineRequirement[], inventory:GarageInventory, costMultiplier=1):boolean {
  return requirements.every((req)=>ownedRequirement(req,inventory)+1e-9>=requirementAmount(req,costMultiplier));
}

export function unlockRequirementMet(req:UnlockRequirement, context:ProgressContext):boolean {
  if (req.kind === 'level') return context.level >= (req.level ?? 1);
  if (req.kind === 'machine') return context.installed.has(req.machine!);
  return context.talents.has(req.talent!);
}

export function machineUnlocked(machineDef:MachineDef, context:ProgressContext):boolean {
  return machineDef.unlocks.every((req)=>unlockRequirementMet(req,context));
}

export function unmetUnlocks(reqs:UnlockRequirement[], context:ProgressContext):UnlockRequirement[] {
  return reqs.filter((req)=>!unlockRequirementMet(req,context));
}

export function nextUpgrade(machineDef:MachineDef, currentLevel:number):MachineUpgradeDef|undefined {
  return machineDef.upgrades.find((upgrade)=>upgrade.toLevel===currentLevel+1);
}
