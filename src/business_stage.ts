export type BusinessStageId=
  |'starter_garage'
  |'equipped_garage'
  |'workforce_garage'
  |'hangar'
  |'salvage_yard'
  |'industrial_workshop'
  |'processing_plant';

export type BaseSurfaceId='overview'|'production'|'storage'|'contracts'|'crew'|'logistics'|'development';

export interface BusinessStageSignals{
  installedMachineCount:number;
  vanOwned:boolean;
  firstWorkerHired:boolean;
  hangarOwned:boolean;
  salvageYardOwned:boolean;
  industrialWorkshopOwned:boolean;
  processingPlantOwned:boolean;
}

export interface BusinessStageDef{
  id:BusinessStageId;
  rank:number;
  title:string;
  shortTitle:string;
  eyebrow:string;
  fantasy:string;
  pressure:string;
  nextMilestone:string|null;
  surfaces:readonly BaseSurfaceId[];
}

const CORE_SURFACES=['overview','production','storage','contracts','development'] as const satisfies readonly BaseSurfaceId[];
const EQUIPPED_SURFACES=['overview','production','storage','crew','logistics','contracts','development'] as const satisfies readonly BaseSurfaceId[];
const WORKFORCE_SURFACES=EQUIPPED_SURFACES;

export const BUSINESS_STAGES:Record<BusinessStageId,BusinessStageDef>={
  starter_garage:{
    id:'starter_garage',rank:0,title:'Стартовый гараж',shortTitle:'Гараж',eyebrow:'ЛИЧНАЯ МАСТЕРСКАЯ',
    fantasy:'Ты работаешь один: вылазка, тележка, верстак и первые решения — продать добычу или вложить её в рост.',
    pressure:'Нужны первые станки и стабильная переработка, чтобы гараж перестал быть пустым помещением.',
    nextMilestone:'Оборудовать гараж',surfaces:CORE_SURFACES
  },
  equipped_garage:{
    id:'equipped_garage',rank:1,title:'Рабочий гараж',shortTitle:'Гараж',eyebrow:'РАБОЧАЯ МАСТЕРСКАЯ',
    fantasy:'Гараж уже производит ценность: несколько станков, склад и очередь работают между вылазками.',
    pressure:'Активные поездки становятся длиннее, а повторный фарм старых зон просится в транспорт и автоматизацию.',
    nextMilestone:'Фургон и первый рабочий',surfaces:EQUIPPED_SURFACES
  },
  workforce_garage:{
    id:'workforce_garage',rank:2,title:'Гараж с бригадой',shortTitle:'Гараж + команда',eyebrow:'МАЛЫЙ БИЗНЕС',
    fantasy:'Ты уже не один: старые зоны могут работать пассивно, а транспорт становится общим активом игрока и команды.',
    pressure:'Людям, машинам, складу и станкам становится тесно. Следующая потребность должна ощущаться как новый масштаб базы.',
    nextMilestone:'Перейти в ангар',surfaces:WORKFORCE_SURFACES
  },
  hangar:{
    id:'hangar',rank:3,title:'Ангар',shortTitle:'Ангар',eyebrow:'ОПЕРАЦИОННАЯ БАЗА',
    fantasy:'Это уже не личный гараж: несколько рабочих, транспорт, производство и склад должны управляться как единая база.',
    pressure:'Следующее ограничение — объём сырья, тяжёлые объекты и несколько параллельных маршрутов.',
    nextMilestone:'Развернуть Salvage Yard',surfaces:WORKFORCE_SURFACES
  },
  salvage_yard:{
    id:'salvage_yard',rank:4,title:'Ангар + площадка разборки',shortTitle:'Salvage Yard',eyebrow:'СЕТЬ УТИЛИЗАЦИИ',
    fantasy:'Старые зоны становятся supply-узлами, а несколько машин и бригад формируют сеть снабжения.',
    pressure:'Поток сырья уже требует промышленной переработки и специализированных производственных ролей.',
    nextMilestone:'Промышленная мастерская',surfaces:WORKFORCE_SURFACES
  },
  industrial_workshop:{
    id:'industrial_workshop',rank:5,title:'Промышленная мастерская',shortTitle:'Industrial Workshop',eyebrow:'ПРОМЫШЛЕННОЕ ПРОИЗВОДСТВО',
    fantasy:'Сырьё превращается в сложные материалы и модули через несколько производственных ячеек.',
    pressure:'Следующий предел — масштаб хранения, линий, контрактов и координации потоков.',
    nextMilestone:'Processing Plant',surfaces:WORKFORCE_SURFACES
  },
  processing_plant:{
    id:'processing_plant',rank:6,title:'Перерабатывающий завод',shortTitle:'Processing Plant',eyebrow:'ИНДУСТРИАЛЬНЫЙ БИЗНЕС',
    fantasy:'Освоенные зоны и бригады питают крупное производство, пока ты лично двигаешь фронтир и закрываешь редкие дефициты.',
    pressure:'Текущая вершина бизнес-лестницы: оптимизируй линии, маршруты, контракты и специализацию талантов.',
    nextMilestone:null,surfaces:WORKFORCE_SURFACES
  }
};

export function deriveBusinessStage(signals:BusinessStageSignals):BusinessStageId{
  if(signals.processingPlantOwned)return'processing_plant';
  if(signals.industrialWorkshopOwned)return'industrial_workshop';
  if(signals.salvageYardOwned)return'salvage_yard';
  if(signals.hangarOwned)return'hangar';
  if(signals.firstWorkerHired||signals.vanOwned)return'workforce_garage';
  if(signals.installedMachineCount>=2)return'equipped_garage';
  return'starter_garage';
}

export function businessStage(signals:BusinessStageSignals):BusinessStageDef{return BUSINESS_STAGES[deriveBusinessStage(signals)]}

export function stageAtLeast(stage:BusinessStageId,target:BusinessStageId):boolean{return BUSINESS_STAGES[stage].rank>=BUSINESS_STAGES[target].rank}
