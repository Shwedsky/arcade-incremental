import type { ComponentKind, ResourceKind } from './sim.ts';

export type MachineId = 'workbench' | 'press' | 'wire' | 'plastic';

export interface MachineRequirement {
  kind: 'resource' | 'component' | 'cash';
  key?: ResourceKind | ComponentKind;
  amount: number;
  label: string;
  source: string;
}

export interface MachineDef {
  id: MachineId;
  name: string;
  short: string;
  description: string;
  icon: string;
  buyPrice?: number;
  requirements: MachineRequirement[];
  unlockHint: string;
}

export const STARTING_CASH = 3000;

export const MACHINE_DEFS: Record<MachineId, MachineDef> = {
  workbench: {
    id: 'workbench',
    name: 'Верстак',
    short: 'Ручной разбор и сборка',
    description: 'Базовое место для ручной работы. Уже установлен.',
    icon: '🛠️',
    requirements: [],
    unlockHint: 'Доступен со старта.'
  },
  press: {
    id: 'press',
    name: 'Малый гидропресс',
    short: 'Металл → компактные брикеты',
    description: 'Первый настоящий станок. Брикеты занимают меньше места и позже продаются дороже обычного лома.',
    icon: '▥',
    buyPrice: 24000,
    requirements: [
      { kind: 'resource', key: 'metal', amount: 100, label: 'Металл', source: 'Любой металлический лом на карте.' },
      { kind: 'component', key: 'bearing', amount: 2, label: 'Подшипники', source: 'Чаще: велосипеды / вентиляторы; также средняя техника.' },
      { kind: 'component', key: 'hydraulic', amount: 1, label: 'Гидравлический узел', source: 'Редко: средняя/крупная техника. Позже основной источник — домкраты и подъёмники.' },
      { kind: 'cash', amount: 2500, label: 'Деньги на расходники', source: 'В полном loop — продажа сырья и контракты. В slice стартовый запас уже выдан.' }
    ],
    unlockHint: 'Соберите рецепт или позже купите готовый станок в магазине.'
  },
  wire: {
    id: 'wire',
    name: 'Зачистка проводов',
    short: 'Кабель → чистая медь',
    description: 'Повышает ценность кабеля и открывает полноценную переработку меди.',
    icon: '◉◉',
    buyPrice: 38000,
    requirements: [
      { kind: 'resource', key: 'metal', amount: 140, label: 'Металл', source: 'Металлический лом.' },
      { kind: 'component', key: 'motor', amount: 1, label: 'Электромотор', source: 'Пылесосы, дрели, стиральные машины и средняя техника.' },
      { kind: 'component', key: 'electronics', amount: 1, label: 'Электронный модуль', source: 'Телевизоры, мелкая техника, электронный лом.' },
      { kind: 'cash', amount: 6000, label: 'Деньги', source: 'Продажа и контракты.' }
    ],
    unlockHint: 'Откроется после первого пресса в полном progression.'
  },
  plastic: {
    id: 'plastic',
    name: 'Дробилка пластика',
    short: 'Пластик → гранулы',
    description: 'Поздний гаражный станок: перерабатывает дешёвый пластик в более ценный материал.',
    icon: '▼',
    buyPrice: 72000,
    requirements: [
      { kind: 'resource', key: 'metal', amount: 220, label: 'Металл', source: 'Металлический лом.' },
      { kind: 'resource', key: 'plastic', amount: 80, label: 'Пластик', source: 'Бытовая техника и пластиковый лом.' },
      { kind: 'component', key: 'motor', amount: 2, label: 'Электромоторы', source: 'Средняя техника.' },
      { kind: 'cash', amount: 12000, label: 'Деньги', source: 'Продажа и контракты.' }
    ],
    unlockHint: 'Позднее: после развития мастерской.'
  }
};

export interface GarageInventory {
  resources: Record<ResourceKind, number>;
  components: Record<ComponentKind, number>;
  cash: number;
}

export function ownedRequirement(req: MachineRequirement, inventory: GarageInventory): number {
  if (req.kind === 'cash') return inventory.cash;
  if (req.kind === 'resource') return inventory.resources[req.key as ResourceKind];
  return inventory.components[req.key as ComponentKind];
}

export function canBuild(machine: MachineDef, inventory: GarageInventory): boolean {
  return machine.requirements.every((req) => ownedRequirement(req, inventory) + 1e-9 >= req.amount);
}
