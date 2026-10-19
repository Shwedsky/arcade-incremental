import type { MachineId } from './garage.ts';
import type { ZoneId } from './midgame.ts';
import type { TargetClassId } from './sim.ts';

export type ContentVisualKind='sheet'|'pipes'|'frame'|'cans'|'coil'|'loom'|'tool'|'small_motor'|'fan'|'bike'|'cart'|'pump'|'compressor'|'welder'|'heater'|'vacuum'|'microwave'|'washer'|'dishwasher'|'dryer'|'oven'|'fridge'|'freezer'|'boiler'|'generator';

export interface TargetContentVariant {label:string;visual:ContentVisualKind;sourceTags:readonly string[]}
export type ZoneContentMatrix=Record<TargetClassId,readonly TargetContentVariant[]>;
const v=(label:string,visual:ContentVisualKind,...sourceTags:string[]):TargetContentVariant=>({label,visual,sourceTags});

export const ZONE_CONTENT:Record<ZoneId,ZoneContentMatrix>={
  z1:{
    small_scrap:[v('Ржавые листы','sheet','metal'),v('Связка труб','pipes','metal'),v('Металлическая рама','frame','metal'),v('Ящик жестянки','cans','metal')],
    cable:[v('Бухта старого кабеля','coil','copper'),v('Удлинитель','coil','copper'),v('Пучок проводов','loom','copper'),v('Медный хвост','loom','copper')],
    small_appliance:[v('Старый чайник','heater','electronics'),v('Тостер','heater','electronics'),v('Лампа с блоком питания','small_motor','electronics'),v('Корпус пылесоса','vacuum','motor')],
    bike_fan:[v('Старый велосипед','bike','bearing'),v('Напольный вентилятор','fan','bearing','motor'),v('Тележка на колёсах','cart','bearing'),v('Велорама с колёсами','bike','bearing')],
    medium_appliance:[v('Пылесос','vacuum','motor'),v('Микроволновка','microwave','electronics'),v('Небольшая стиралка','washer','motor','hydraulic'),v('Электропечь','oven','electronics')],
    large_appliance:[v('Стиральная машина','washer','motor','hydraulic'),v('Холодильник','fridge','motor'),v('Кухонная плита','oven','electronics'),v('Водонагреватель','boiler','hydraulic')]
  },
  z2:{
    small_scrap:[v('Домкрат и крепёж','frame','metal'),v('Лоток инструмента','tool','metal'),v('Обрезки выхлопа','pipes','metal'),v('Кронштейны и уголок','sheet','metal')],
    cable:[v('Гаражный жгут проводки','loom','copper'),v('Катушка удлинителя','coil','copper'),v('Силовой кабель','coil','copper'),v('Проводка стартера','loom','copper')],
    small_appliance:[v('Углошлифовальная машина','tool','motor'),v('Электродрель','tool','motor'),v('Зарядное устройство','small_motor','electronics'),v('Малый водяной насос','pump','pump')],
    bike_fan:[v('Гаражный вентилятор','fan','bearing','motor'),v('Велосипедная рама','bike','bearing'),v('Сервисная тележка','cart','bearing'),v('Вытяжной вентилятор','fan','bearing','motor')],
    medium_appliance:[v('Компрессорный блок','compressor','motor'),v('Водяной насос','pump','pump'),v('Сварочный аппарат','welder','electronics'),v('Гаражный обогреватель','heater','electronics')],
    large_appliance:[v('Большой компрессор','compressor','motor','pump'),v('Насосная станция','pump','pump','hydraulic'),v('Бензогенератор','generator','motor','electronics'),v('Старый котёл','boiler','hydraulic')]
  },
  z3:{
    small_scrap:[v('Панели от техники','sheet','metal'),v('Крепления барабана','frame','metal'),v('Полки холодильника','frame','metal'),v('Корзина деталей','cans','metal')],
    cable:[v('Проводка холодильника','loom','copper'),v('Жгут стиральной машины','loom','copper'),v('Обмотка мотора','coil','copper'),v('Силовой кабель техники','coil','copper')],
    small_appliance:[v('Микроволновка','microwave','electronics'),v('Пылесос','vacuum','motor'),v('Кофемашина','pump','pump','electronics'),v('Мотор вытяжки','small_motor','motor')],
    bike_fan:[v('Напольный вентилятор','fan','bearing','motor'),v('Барабан сушилки','dryer','bearing'),v('Тележка для техники','cart','bearing'),v('Вентилятор холодильника','fan','bearing','motor')],
    medium_appliance:[v('Стиральная машина','washer','motor','hydraulic'),v('Посудомоечная машина','dishwasher','pump','electronics'),v('Сушильная машина','dryer','motor','bearing'),v('Духовой шкаф','oven','electronics')],
    large_appliance:[v('Холодильник','fridge','compressor','motor'),v('Морозильный ларь','freezer','compressor'),v('Большая стиральная машина','washer','motor','hydraulic'),v('Двухсекционная печь','oven','electronics')]
  },
  z4:{
    small_scrap:[v('Кузовные панели','sheet','metal','aluminium'),v('Тормозные диски и крепёж','cans','metal'),v('Выхлопные трубы','pipes','metal'),v('Кронштейны подвески','frame','metal')],
    cable:[v('Автомобильный жгут проводки','loom','copper'),v('Проводка моторного отсека','loom','copper'),v('Силовой кабель стартера','coil','copper'),v('Жгут блока предохранителей','loom','copper','electronics')],
    small_appliance:[v('Стартер','small_motor','motor'),v('Мотор стеклоподъёмника','small_motor','motor'),v('Блок управления','tool','electronics'),v('Насос омывателя','pump','pump')],
    bike_fan:[v('Ступица колеса','frame','bearing'),v('Вентилятор радиатора','fan','bearing','motor'),v('Полуось','frame','bearing'),v('Рулевая колонка','frame','bearing')],
    medium_appliance:[v('Генератор автомобиля','generator','generator','electronics'),v('Радиатор с вентилятором','fan','motor','aluminium'),v('Малая коробка передач','frame','gearbox'),v('Компрессор кондиционера','compressor','compressor','motor')],
    large_appliance:[v('Коробка передач','frame','gearbox'),v('Силовой агрегат','generator','gearbox','generator','motor'),v('Кузовной модуль','frame','metal','aluminium'),v('Задний мост','frame','gearbox','bearing')]
  },
  z5:{
    small_scrap:[v('Обрезки промышленной рамы','frame','metal','alloy'),v('Листы станочной обшивки','sheet','metal','alloy'),v('Крепёж производственной линии','cans','metal'),v('Патрубки гидростанции','pipes','metal')],
    cable:[v('Силовая коса цеха','loom','copper'),v('Кабель частотника','coil','copper','controller'),v('Проводка шкафа управления','loom','copper','controller'),v('Шина электродвигателя','coil','copper')],
    small_appliance:[v('Промышленный датчиковый блок','tool','controller'),v('Малый привод конвейера','small_motor','motor'),v('Насос охлаждения','pump','pump'),v('Сервопривод заслонки','small_motor','electronics')],
    bike_fan:[v('Роликовый узел конвейера','frame','bearing'),v('Вентилятор электрошкафа','fan','bearing','electronics'),v('Тележка оснастки','cart','bearing'),v('Приводной вал','frame','bearing')],
    medium_appliance:[v('Шкаф управления','generator','controller','electronics'),v('Промышленный насос','pump','pump','hydraulic'),v('Сварочный агрегат','welder','electronics','alloy'),v('Компрессорная секция','compressor','compressor','motor')],
    large_appliance:[v('Большой электродвигатель','generator','motor','alloy'),v('Насосная станция','pump','pump','hydraulic','alloy'),v('Секция конвейера','frame','bearing','alloy'),v('Силовой шкаф ЧПУ','generator','controller','electronics')]
  },
  z6:{
    small_scrap:[v('Обломки станочной станины','frame','metal','alloy'),v('Защитные панели пресса','sheet','metal','alloy'),v('Крепёж гидролинии','cans','metal'),v('Трубопровод цеха','pipes','metal')],
    cable:[v('Магистральный силовой кабель','coil','copper'),v('Жгут станка ЧПУ','loom','copper','controller'),v('Проводка гидропресса','loom','copper'),v('Обмотка промышленного мотора','coil','copper')],
    small_appliance:[v('Панель управления станка','tool','controller'),v('Маслонасос','pump','pump'),v('Привод подачи','small_motor','motor'),v('Блок автоматики','tool','electronics','controller')],
    bike_fan:[v('Подшипниковая опора','frame','bearing'),v('Цеховой вентилятор','fan','bearing','motor'),v('Роликовая каретка','cart','bearing'),v('Муфта привода','frame','bearing')],
    medium_appliance:[v('Гидравлический агрегат','pump','hydraulic','heavy_hydraulic'),v('Станочный привод','generator','motor','alloy'),v('Шкаф ЧПУ','generator','controller','electronics'),v('Промышленный компрессор','compressor','compressor','alloy')],
    large_appliance:[v('Секция гидропресса','frame','heavy_hydraulic','alloy'),v('Токарный станок','generator','controller','alloy'),v('Фрезерный станок','generator','controller','alloy'),v('Гидростанция линии','pump','heavy_hydraulic','pump','alloy')]
  }
};

export function targetContent(zone:ZoneId,classId:TargetClassId,variant:number):TargetContentVariant{
  const list=ZONE_CONTENT[zone][classId];return list[Math.abs(variant)%list.length];
}

export function sourceObjects(zone:ZoneId,tag:string):string[]{
  const out:string[]=[];for(const classId of Object.keys(ZONE_CONTENT[zone]) as TargetClassId[]){for(const item of ZONE_CONTENT[zone][classId])if(item.sourceTags.includes(tag)&&!out.includes(item.label))out.push(item.label)}return out;
}

export type GarageGrowthStage='starter'|'press'|'copper'|'processing'|'crew';
export function garageGrowthStage(installed:ReadonlySet<MachineId>,vanOwned:boolean,workerHired:boolean):GarageGrowthStage{if(vanOwned||workerHired)return'crew';if(installed.has('plastic'))return'processing';if(installed.has('wire'))return'copper';if(installed.has('press'))return'press';return'starter'}
export const GARAGE_GROWTH_LABEL:Record<GarageGrowthStage,string>={starter:'Пустой гараж · ручная работа',press:'Гараж оживает · первый станок',copper:'Мастерская · переработка меди',processing:'Оборудованный гараж',crew:'Гараж + транспорт + команда'};

export function validateContentPack():string[]{
  const errors:string[]=[],classes:TargetClassId[]=['small_scrap','cable','small_appliance','bike_fan','medium_appliance','large_appliance'];
  for(const zone of ['z1','z2','z3','z4','z5','z6'] as ZoneId[]){for(const classId of classes){const list=ZONE_CONTENT[zone][classId];if(!list||list.length<4)errors.push(`${zone}:${classId}:variants`);if(list?.some(x=>!x.label||!x.visual))errors.push(`${zone}:${classId}:invalid`)}}
  if(sourceObjects('z2','pump').length<3)errors.push('z2:pump-sources');
  if(sourceObjects('z3','compressor').length<2)errors.push('z3:compressor-sources');
  if(sourceObjects('z4','gearbox').length<3)errors.push('z4:gearbox-sources');
  if(sourceObjects('z4','generator').length<2)errors.push('z4:generator-sources');
  if(sourceObjects('z4','aluminium').length<2)errors.push('z4:aluminium-sources');
  if(sourceObjects('z5','controller').length<3)errors.push('z5:controller-sources');
  if(sourceObjects('z5','alloy').length<3)errors.push('z5:alloy-sources');
  if(sourceObjects('z6','heavy_hydraulic').length<2)errors.push('z6:heavy-hydraulic-sources');
  if(sourceObjects('z6','alloy').length<3)errors.push('z6:alloy-sources');
  return errors;
}
