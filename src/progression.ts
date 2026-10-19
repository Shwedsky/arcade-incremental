import type { TargetClassId } from './sim.ts';

export type BranchId = 'salvage' | 'logistics' | 'workshop' | 'automation' | 'trade';
export type TalentMilestone = 'van' | 'first_worker' | 'hangar' | 'salvage_yard' | 'industrial_workshop';
export type TalentId =
  | 'salvage_1' | 'salvage_2' | 'salvage_3' | 'salvage_4' | 'salvage_5' | 'salvage_6' | 'salvage_7' | 'salvage_8'
  | 'logistics_1' | 'logistics_2' | 'logistics_3' | 'logistics_4' | 'logistics_5' | 'logistics_6' | 'logistics_7' | 'logistics_8'
  | 'workshop_1' | 'workshop_2' | 'workshop_3' | 'workshop_4' | 'workshop_5' | 'workshop_6' | 'workshop_7' | 'workshop_8'
  | 'automation_1' | 'automation_2' | 'automation_3' | 'automation_4' | 'automation_5' | 'automation_6' | 'automation_7' | 'automation_8'
  | 'trade_1' | 'trade_2' | 'trade_3' | 'trade_4' | 'trade_5' | 'trade_6' | 'trade_7' | 'trade_8';

export interface TalentDef {
  id: TalentId;
  branch: BranchId;
  /** Sequence position inside this branch. Historical field kept for compatibility. */
  tier: number;
  /** User-facing long-term progression tier. */
  progressionTier: 1 | 2 | 3;
  pointCost: number;
  name: string;
  description: string;
  minLevel: number;
  requires?: TalentId;
  milestone?: TalentMilestone;
  runtime: boolean;
}

export const BRANCHES: Record<BranchId, { name: string; icon: string; fantasy: string }> = {
  salvage: { name: 'Разбор', icon: '⚒', fantasy: 'Быстрее и азартнее крушить хлам.' },
  logistics: { name: 'Логистика', icon: '🛒', fantasy: 'Дольше оставаться в поле и быстрее собирать.' },
  workshop: { name: 'Мастерская', icon: '▥', fantasy: 'Дешевле строить и эффективнее перерабатывать.' },
  automation: { name: 'Автоматизация', icon: '⏱', fantasy: 'Больше пользы, пока игра закрыта.' },
  trade: { name: 'Торговля', icon: '₽', fantasy: 'Лучше продавать и дешевле покупать.' }
};

export const TALENT_MILESTONE_LABELS: Record<TalentMilestone,string> = {
  van:'Нужен фургон',
  first_worker:'Нужен первый рабочий',
  hangar:'Нужен ангар',
  salvage_yard:'Нужна база «Площадка разборки»',
  industrial_workshop:'Нужна промышленная мастерская'
};

const chain = (branch: BranchId, names: [string,string,string,string,string,string,string], descriptions: [string,string,string,string,string,string,string], runtimeUntil = 3): TalentDef[] =>
  names.map((name, index) => ({
    id: `${branch}_${index + 1}` as TalentId,
    branch,
    tier: index + 1,
    progressionTier:1,
    pointCost:1,
    name,
    description: descriptions[index],
    minLevel: [2,3,4,5,6,7,8][index],
    requires: index ? `${branch}_${index}` as TalentId : undefined,
    runtime: index + 1 <= runtimeUntil
  }));

export const TALENTS: TalentDef[] = [
  ...chain('salvage',
    ['Заточенный инструмент','Слабые места','Combo','Длинная серия','Разгон','На кураже','Охотник за деталями'],
    ['+10% скорость авторазбора.','Ещё +10% скорость авторазбора.','Открывает Combo: серия разрушений ускоряет разбор.','Окно Combo дольше на 1,2 сек.','Максимум Combo увеличен с 5 до 8.','На высокой серии растёт скорость движения.','Высокий Combo повышает шанс редких компонентов.'], 7),
  {id:'salvage_8',branch:'salvage',tier:8,progressionTier:2,pointCost:1,name:'Широкий замах',description:'Авторазбор одновременно цепляет вторую ближайшую цель с 55% мощности.',minLevel:10,requires:'salvage_7',milestone:'van',runtime:true},
  ...chain('logistics',
    ['Усиленная тележка','Лёгкая упряжь','Сильный магнит','Грузовая рама','Карман для деталей','Широкая тележка','Полевой сборщик'],
    ['+10 кг к вместимости тележки.','+8% скорость движения.','+45 к радиусу магнитного подбора.','Ещё +15 кг вместимости.','Редкие компоненты не считаются грузом.','Ещё +20 кг вместимости.','Часть мелкого лома автоматически собирается рядом.'], 4),
  {id:'logistics_8',branch:'logistics',tier:8,progressionTier:2,pointCost:1,name:'Укладка фургона',description:'Полезная вместимость фургона увеличивается с 400 до 500 кг.',minLevel:10,requires:'logistics_4',milestone:'van',runtime:true},
  ...chain('workshop',
    ['Экономная сборка','Точная настройка','Параллельная работа','Калибровка','Серийные детали','Мастерская II','Промышленная оснастка'],
    ['-5% ресурсов и денег на сборку/апгрейд станков.','+10% выход переработанных материалов.','Открывает второй слот очереди мастерской.','Станки и изготовление работают на 15% быстрее.','Снижает расход компонентов в продвинутых рецептах.','Открывает улучшенные версии гаражных станков.','Подготовка к промышленному оборудованию.'], 4),
  {id:'workshop_8',branch:'workshop',tier:8,progressionTier:2,pointCost:1,name:'Тяжёлая фабрикация',description:'Промышленная ячейка выполняет тяжёлые циклы на 10% быстрее.',minLevel:12,requires:'workshop_4',milestone:'hangar',runtime:true},
  ...chain('automation',
    ['Не выключать свет','Дольше без хозяина','Автоподача','Ночная смена','Буфер очереди','Диспетчер','Автономный цех'],
    ['Offline эффективность: 20% → 25%.','Offline лимит: 2 → 3 часа.','Завершённая переработка сама ставит следующую такую же партию, пока есть сырьё.','Offline эффективность: 25% → 30%.','Увеличивает очередь станков.','Рабочие распределяются автоматически.','Поздняя почти автономная мастерская.'], 4),
  {id:'automation_8',branch:'automation',tier:8,progressionTier:2,pointCost:1,name:'Оператор ячейки',description:'Разрешает назначить промышленного рабочего Operator.',minLevel:12,requires:'automation_3',milestone:'salvage_yard',runtime:true},
  ...chain('trade',
    ['Свои покупатели','Торг с поставщиком','Срочные заказы','Специалист по меди','Оптовик','Контрактник','Биржа лома'],
    ['+5% цена продажи сырья.','-5% цены готовых станков/деталей в магазине.','Контракты становятся сложнее, но награда повышается примерно на 18%.','Медь и чистая медь продаются на 8% дороже.','Бонус за крупные партии.','Дополнительный слот контракта.','Поздние динамические цены рынка.'], 4),
  {id:'trade_8',branch:'trade',tier:8,progressionTier:2,pointCost:1,name:'Выбор заказов',description:'Доска заказов показывает два подходящих предложения вместо одного.',minLevel:11,requires:'trade_3',milestone:'first_worker',runtime:true}
];

export const TALENT_BY_ID = new Map(TALENTS.map((talent) => [talent.id, talent]));

export const LEVEL_XP = [
  0,120,420,1800,3200,5200,7800,11000,15000,20000,
  23000,26000,29500,33000,37000,41000,45500,50000,55000,60000,
  65500,71000,77000,83000,89500,96000,103000,110000,117500,125000
];

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i += 1) if (xp >= LEVEL_XP[i]) level = i + 1;
  return level;
}

export function xpWindow(xp: number): { level: number; current: number; needed: number; ratio: number } {
  const level = levelForXp(xp);
  const floor = LEVEL_XP[level - 1] ?? LEVEL_XP.at(-1)!;
  const ceil = LEVEL_XP[level] ?? floor;
  if (ceil <= floor) return { level, current: 0, needed: 0, ratio: 1 };
  return { level, current: xp - floor, needed: ceil - floor, ratio: Math.min(1, (xp - floor) / (ceil - floor)) };
}

export function earnedMasteryPoints(level: number): number {
  return Math.max(0, level - 1);
}

export function spentMasteryPoints(unlocked:ReadonlySet<TalentId>):number{
  let total=0;
  for(const id of unlocked)total+=TALENT_BY_ID.get(id)?.pointCost??1;
  return total;
}

export function xpForTarget(classId: TargetClassId): number {
  return ({ small_scrap:1, cable:1, small_appliance:2, bike_fan:2, medium_appliance:3, large_appliance:5 } as const)[classId];
}

export function xpForComponent(): number { return 3; }

export interface RuntimeEffects {
  dpsMultiplier: number;
  moveMultiplier: number;
  capacityBonus: number;
  magnetRadius: number;
  comboUnlocked: boolean;
  comboTimeout: number;
  comboCap: number;
  comboSpeedPerStack: number;
  comboMoveBonus: number;
  componentChanceBonus: number;
  wideSwingUnlocked: boolean;
  vanCapacityBonus: number;
  machineCostMultiplier: number;
  workshopYieldMultiplier: number;
  workshopSlots: number;
  workshopSpeedMultiplier: number;
  industrialProductionMultiplier: number;
  operatorUnlocked: boolean;
  autoFeed: boolean;
  offlineEfficiency: number;
  offlineCapHours: number;
  saleMultiplier: number;
  copperSaleMultiplier: number;
  shopPriceMultiplier: number;
  urgentContracts: boolean;
  contractChoices:number;
}

export function deriveEffects(unlocked: ReadonlySet<TalentId>): RuntimeEffects {
  const has = (id: TalentId) => unlocked.has(id);
  return {
    dpsMultiplier: 1 + (has('salvage_1') ? .10 : 0) + (has('salvage_2') ? .10 : 0),
    moveMultiplier: 1 + (has('logistics_2') ? .08 : 0),
    capacityBonus: (has('logistics_1') ? 10 : 0) + (has('logistics_4') ? 15 : 0) + (has('logistics_6') ? 20 : 0),
    magnetRadius: 180 + (has('logistics_3') ? 45 : 0),
    comboUnlocked: has('salvage_3'),
    comboTimeout: 3 + (has('salvage_4') ? 1.2 : 0),
    comboCap: has('salvage_5') ? 8 : 5,
    comboSpeedPerStack: .03,
    comboMoveBonus: has('salvage_6') ? .08 : 0,
    componentChanceBonus: has('salvage_7') ? .03 : 0,
    wideSwingUnlocked: has('salvage_8'),
    vanCapacityBonus: has('logistics_8') ? 100 : 0,
    machineCostMultiplier: has('workshop_1') ? .95 : 1,
    workshopYieldMultiplier: has('workshop_2') ? 1.10 : 1,
    workshopSlots: has('workshop_3') ? 2 : 1,
    workshopSpeedMultiplier: has('workshop_4') ? 1.15 : 1,
    industrialProductionMultiplier: has('workshop_8') ? .90 : 1,
    operatorUnlocked: has('automation_8'),
    autoFeed: has('automation_3'),
    offlineEfficiency: has('automation_4') ? .30 : has('automation_1') ? .25 : .20,
    offlineCapHours: has('automation_2') ? 3 : 2,
    saleMultiplier: has('trade_1') ? 1.05 : 1,
    copperSaleMultiplier:has('trade_4')?1.08:1,
    shopPriceMultiplier: has('trade_2') ? .95 : 1,
    urgentContracts: has('trade_3'),
    contractChoices:has('trade_8')?2:1
  };
}

export function canUnlockTalent(talent: TalentDef, level: number, unlocked: ReadonlySet<TalentId>, milestones:ReadonlySet<TalentMilestone>=new Set()): { ok: boolean; reason?: string } {
  if (unlocked.has(talent.id)) return { ok: false, reason: 'Уже изучено' };
  if (!talent.runtime) return { ok: false, reason: 'Откроется вместе с соответствующей системой' };
  if (level < talent.minLevel) return { ok: false, reason: `Нужен уровень ${talent.minLevel}` };
  if (talent.milestone && !milestones.has(talent.milestone)) return {ok:false,reason:TALENT_MILESTONE_LABELS[talent.milestone]};
  if (talent.requires && !unlocked.has(talent.requires)) return { ok: false, reason: `Сначала: ${TALENT_BY_ID.get(talent.requires)?.name ?? talent.requires}` };
  return { ok: true };
}
