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
  tier: number;
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
  salvage: { name: 'Разбор', icon: '⚒', fantasy: 'Личная мощность, серия и охота за редкими узлами.' },
  logistics: { name: 'Логистика', icon: '🛒', fantasy: 'Больше груза, быстрее сбор и сильнее транспорт.' },
  workshop: { name: 'Мастерская', icon: '▥', fantasy: 'Дешевле, быстрее и параллельнее производство.' },
  automation: { name: 'Автоматизация', icon: '⏱', fantasy: 'Работа базы и команды без постоянного ручного контроля.' },
  trade: { name: 'Торговля', icon: '₽', fantasy: 'Маржа, поставщики и выбор выгодных заказов.' }
};

export const TALENT_MILESTONE_LABELS: Record<TalentMilestone,string> = {
  van:'Нужен фургон',
  first_worker:'Нужен первый рабочий',
  hangar:'Нужен ангар',
  salvage_yard:'Нужна Salvage Yard',
  industrial_workshop:'Нужна Industrial Workshop'
};

const t=(branch:BranchId,index:number,name:string,description:string,minLevel:number,options:Partial<Pick<TalentDef,'pointCost'|'milestone'|'progressionTier'>>={}):TalentDef=>({
  id:`${branch}_${index}` as TalentId,
  branch,
  tier:index,
  progressionTier:options.progressionTier??(index<=4?1:index<=6?2:3),
  pointCost:options.pointCost??(index===8?2:1),
  name,
  description,
  minLevel,
  requires:index>1?`${branch}_${index-1}` as TalentId:undefined,
  milestone:options.milestone,
  runtime:true
});

export const TALENTS: TalentDef[] = [
  t('salvage',1,'Заточенный инструмент','+12% к мощности авторазбора.',2),
  t('salvage',2,'Слабые места','Ещё +12% к мощности авторазбора.',4),
  t('salvage',3,'Combo','Открывает Combo: каждое быстрое разрушение разгоняет следующую цель.',6),
  t('salvage',4,'Длинная серия','Окно Combo увеличивается с 3,0 до 4,5 сек.',8),
  t('salvage',5,'Разгон','Максимальная серия увеличивается с 5 до 8.',11,{progressionTier:2}),
  t('salvage',6,'На кураже','Стек Combo сильнее ускоряет разбор, а высокая серия даёт +8% скорости движения.',15,{progressionTier:2}),
  t('salvage',7,'Охотник за деталями','Высокая активность даёт +6 п.п. к шансу редкого компонента.',20,{progressionTier:3}),
  t('salvage',8,'Широкий замах','Авторазбор одновременно цепляет вторую ближайшую цель с 55% мощности.',26,{pointCost:2,progressionTier:3,milestone:'van'}),

  t('logistics',1,'Усиленная тележка','+15 кг к вместимости тележки.',2),
  t('logistics',2,'Лёгкая упряжь','+10% к скорости движения.',4),
  t('logistics',3,'Сильный магнит','+70 к радиусу магнитного подбора.',6),
  t('logistics',4,'Грузовая рама','Ещё +25 кг к вместимости.',8),
  t('logistics',5,'Разгрузочный жилет','Ещё +20 кг к полезной вместимости.',11,{progressionTier:2}),
  t('logistics',6,'Широкая тележка','Ещё +35 кг к вместимости.',15,{progressionTier:2}),
  t('logistics',7,'Полевой сборщик','Ещё +90 к радиусу подбора и +8% к скорости движения.',20,{progressionTier:3,milestone:'first_worker'}),
  t('logistics',8,'Укладка фургона','Полезная вместимость фургона увеличивается на 150 кг.',26,{pointCost:2,progressionTier:3,milestone:'van'}),

  t('workshop',1,'Экономная сборка','-8% ресурсов и денег на сборку и апгрейды станков.',2),
  t('workshop',2,'Точная настройка','+15% выхода переработанных материалов.',4),
  t('workshop',3,'Параллельная работа','Открывает второй слот очереди мастерской.',6),
  t('workshop',4,'Калибровка','Станки и изготовление работают на 20% быстрее.',8),
  t('workshop',5,'Серийные детали','Общая стоимость станков снижается до -15% от базы.',12,{progressionTier:2,milestone:'first_worker'}),
  t('workshop',6,'Мастерская II','Выход переработки повышается до +25%.',16,{progressionTier:2,milestone:'hangar'}),
  t('workshop',7,'Промышленная оснастка','Открывает третий параллельный слот мастерской.',22,{progressionTier:3,milestone:'salvage_yard'}),
  t('workshop',8,'Тяжёлая фабрикация','Тяжёлые производственные циклы сокращаются на 22%.',28,{pointCost:2,progressionTier:3,milestone:'industrial_workshop'}),

  t('automation',1,'Не выключать свет','Offline эффективность повышается с 20% до 30%.',2),
  t('automation',2,'Дольше без хозяина','Offline лимит увеличивается с 2 до 4 часов.',4),
  t('automation',3,'Автоподача','Одиночная переработка автоматически ставит следующую партию, пока есть сырьё.',6),
  t('automation',4,'Ночная смена','Offline эффективность повышается до 45%.',9,{milestone:'first_worker'}),
  t('automation',5,'Буфер смены','Offline лимит увеличивается до 6 часов.',13,{progressionTier:2,milestone:'first_worker'}),
  t('automation',6,'Диспетчер','Offline эффективность повышается до 55%, открывается роль Operator.',17,{progressionTier:2,milestone:'hangar'}),
  t('automation',7,'Автономный цех','Offline лимит увеличивается до 10 часов, эффективность — до 65%.',23,{progressionTier:3,milestone:'salvage_yard'}),
  t('automation',8,'Начальник смены','Offline лимит 12 часов, эффективность 75%; промышленный Operator доступен на поздней базе.',30,{pointCost:2,progressionTier:3,milestone:'industrial_workshop'}),

  t('trade',1,'Свои покупатели','+8% к цене продажи сырья и переработки.',2),
  t('trade',2,'Торг с поставщиком','-8% к цене готовых станков и деталей.',4),
  t('trade',3,'Срочные заказы','Спецзаказы платят больше, но требуют более ценные товары.',6),
  t('trade',4,'Специалист по меди','Медь и чистая медь продаются ещё на 12% дороже.',8),
  t('trade',5,'Оптовик','Общая цена продажи повышается до +14% от базы.',12,{progressionTier:2,milestone:'first_worker'}),
  t('trade',6,'Контрактник','Доска показывает два специальных заказа вместо одного.',16,{progressionTier:2,milestone:'first_worker'}),
  t('trade',7,'Биржа лома','Цена готовых покупок снижается до -14%, продажи получают +18% от базы.',22,{progressionTier:3,milestone:'hangar'}),
  t('trade',8,'Выбор заказов','Доска показывает до трёх специальных заказов одновременно.',28,{pointCost:2,progressionTier:3,milestone:'salvage_yard'})
];

export const TALENT_BY_ID = new Map(TALENTS.map((talent) => [talent.id, talent]));

export const LEVEL_XP = [
  0,120,420,1800,3200,5200,7800,11000,15000,20000,
  23000,26000,29500,33000,37000,41000,45500,50000,55000,60000,
  65500,71000,77000,83000,89500,96000,103000,110000,117500,125000,
  133000,141500,150500,160000,170000,180500,191500,203000,215000,227500,
  240500,254000,268000,282500,297500,313000,329000,345500,362500,380000
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

export function earnedMasteryPoints(level: number): number { return Math.max(0, level - 1); }

export function spentMasteryPoints(unlocked:ReadonlySet<TalentId>):number{
  let total=0;
  for(const id of unlocked)total+=TALENT_BY_ID.get(id)?.pointCost??1;
  return total;
}

export function totalTalentPointCost():number{return TALENTS.reduce((sum,talent)=>sum+talent.pointCost,0)}

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
  workerOutputMultiplier:number;
  workerShiftMultiplier:number;
}

export function deriveEffects(unlocked: ReadonlySet<TalentId>): RuntimeEffects {
  const has = (id: TalentId) => unlocked.has(id);
  const saleMultiplier=has('trade_7')?1.18:has('trade_5')?1.14:has('trade_1')?1.08:1;
  const shopPriceMultiplier=has('trade_7')?.86:has('trade_2')?.92:1;
  const offlineEfficiency=has('automation_8')?.75:has('automation_7')?.65:has('automation_6')?.55:has('automation_4')?.45:has('automation_1')?.30:.20;
  const offlineCapHours=has('automation_8')?12:has('automation_7')?10:has('automation_5')?6:has('automation_2')?4:2;
  return {
    dpsMultiplier: 1 + (has('salvage_1') ? .12 : 0) + (has('salvage_2') ? .12 : 0),
    moveMultiplier: 1 + (has('logistics_2') ? .10 : 0) + (has('logistics_7') ? .08 : 0),
    capacityBonus: (has('logistics_1') ? 15 : 0) + (has('logistics_4') ? 25 : 0) + (has('logistics_5') ? 20 : 0) + (has('logistics_6') ? 35 : 0),
    magnetRadius: 180 + (has('logistics_3') ? 70 : 0) + (has('logistics_7') ? 90 : 0),
    comboUnlocked: has('salvage_3'),
    comboTimeout: 3 + (has('salvage_4') ? 1.5 : 0),
    comboCap: has('salvage_5') ? 8 : 5,
    comboSpeedPerStack: has('salvage_6') ? .05 : .03,
    comboMoveBonus: has('salvage_6') ? .08 : 0,
    componentChanceBonus: has('salvage_7') ? .06 : 0,
    wideSwingUnlocked: has('salvage_8'),
    vanCapacityBonus: has('logistics_8') ? 150 : 0,
    machineCostMultiplier: has('workshop_5') ? .85 : has('workshop_1') ? .92 : 1,
    workshopYieldMultiplier: has('workshop_6') ? 1.25 : has('workshop_2') ? 1.15 : 1,
    workshopSlots: has('workshop_7') ? 3 : has('workshop_3') ? 2 : 1,
    workshopSpeedMultiplier: has('workshop_4') ? 1.20 : 1,
    industrialProductionMultiplier: has('workshop_8') ? .78 : 1,
    operatorUnlocked: has('automation_6') || has('automation_8'),
    autoFeed: has('automation_3'),
    offlineEfficiency,
    offlineCapHours,
    saleMultiplier,
    copperSaleMultiplier:has('trade_4')?1.12:1,
    shopPriceMultiplier,
    urgentContracts: has('trade_3'),
    contractChoices:has('trade_8')?3:has('trade_6')?2:1,
    workerOutputMultiplier:has('automation_8')?1.35:has('automation_7')?1.25:has('automation_6')?1.15:1,
    workerShiftMultiplier:has('automation_8')?1.50:has('automation_7')?1.30:has('automation_5')?1.15:1
  };
}

export function canUnlockTalent(talent: TalentDef, level: number, unlocked: ReadonlySet<TalentId>, milestones:ReadonlySet<TalentMilestone>=new Set()): { ok: boolean; reason?: string } {
  if (unlocked.has(talent.id)) return { ok: false, reason: 'Уже изучено' };
  if (!talent.runtime) return { ok: false, reason: 'Пока недоступно' };
  if (level < talent.minLevel) return { ok: false, reason: `Нужен уровень ${talent.minLevel}` };
  if (talent.milestone && !milestones.has(talent.milestone)) return {ok:false,reason:TALENT_MILESTONE_LABELS[talent.milestone]};
  if (talent.requires && !unlocked.has(talent.requires)) return { ok: false, reason: `Сначала: ${TALENT_BY_ID.get(talent.requires)?.name ?? talent.requires}` };
  return { ok: true };
}
