import type { ContractState } from './early_game.ts';

export type ContractBoardNeedKind=
  |'resource'|'component'|'processed'|'midComponent'
  |'materialB'|'moduleB'|'industrialB'
  |'materialC'|'moduleC'|'industrialC';

export interface ContractBoardNeed{
  kind:ContractBoardNeedKind;
  key:string;
  amount:number;
  label:string;
}

export type ContractFamily='raw'|'processed'|'component'|'industrial';

export interface ContractBoardDef{
  id:string;
  family:ContractFamily;
  name:string;
  description:string;
  needs:ContractBoardNeed[];
  cashReward:number;
  xpReward:number;
  minLevel:number;
  requires?:string[];
  weight?:number;
}

export interface ContractBoardContext{
  level:number;
  capabilities:ReadonlySet<string>;
}

export interface ContractBoardState extends ContractState{
  currentId?:string;
  recentIds?:string[];
  recentSignatures?:string[];
}

const raw=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'resource',key,amount,label});
const processed=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'processed',key,amount,label});
const component=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'component',key,amount,label});
const mid=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'midComponent',key,amount,label});
const materialB=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'materialB',key,amount,label});
const moduleB=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'moduleB',key,amount,label});
const industrialB=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'industrialB',key,amount,label});
const materialC=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'materialC',key,amount,label});
const moduleC=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'moduleC',key,amount,label});
const industrialC=(key:string,amount:number,label:string):ContractBoardNeed=>({kind:'industrialC',key,amount,label});

export const CONTRACT_BOARD_V2:ContractBoardDef[]=[
  {id:'metal_pickup',family:'raw',name:'Пункт приёма: железо',description:'Небольшая партия обычного металлолома.',needs:[raw('metal',30,'Металл')],cashReward:420,xpReward:20,minLevel:1},
  {id:'electrician',family:'raw',name:'Электромонтажники',description:'Медь и пластик для кабельных работ.',needs:[raw('copper',5,'Медь'),raw('plastic',10,'Пластик')],cashReward:760,xpReward:25,minLevel:1},
  {id:'mixed_scrap',family:'raw',name:'Сортировочная площадка',description:'Смешанный лом нужен без глубокой переработки.',needs:[raw('metal',22,'Металл'),raw('copper',3,'Медь'),raw('plastic',8,'Пластик')],cashReward:690,xpReward:24,minLevel:2},
  {id:'plastic_shop',family:'raw',name:'Мастерская корпусов',description:'Нужна партия пластика и немного металла для крепежа.',needs:[raw('plastic',20,'Пластик'),raw('metal',12,'Металл')],cashReward:620,xpReward:22,minLevel:2},
  {id:'copper_buyer',family:'raw',name:'Скупка цветмета',description:'Небольшой заказ на медь с доплатой за срочность.',needs:[raw('copper',9,'Медь')],cashReward:650,xpReward:24,minLevel:3},

  {id:'repair_shop',family:'component',name:'Ремонтная мастерская',description:'Металл и рабочий подшипник для срочного ремонта.',needs:[raw('metal',18,'Металл'),component('bearing',1,'Подшипник')],cashReward:900,xpReward:30,minLevel:2,requires:['component:bearing']},
  {id:'motor_rebuild',family:'component',name:'Перемотка двигателей',description:'Нужен рабочий электромотор и медь на восстановление.',needs:[component('motor',1,'Электромотор'),raw('copper',5,'Медь')],cashReward:1250,xpReward:36,minLevel:3,requires:['component:motor']},
  {id:'hydraulic_service',family:'component',name:'Гидросервис',description:'Гидравлический узел и металл для ремонтной партии.',needs:[component('hydraulic',1,'Гидравлический узел'),raw('metal',25,'Металл')],cashReward:1550,xpReward:42,minLevel:4,requires:['component:hydraulic']},
  {id:'electronics_lab',family:'component',name:'Лаборатория автоматики',description:'Электронный модуль и чистая медь для стенда.',needs:[component('electronics',1,'Электронный модуль'),processed('cleanCopper',4,'Чистая медь')],cashReward:1800,xpReward:46,minLevel:5,requires:['component:electronics','processed:cleanCopper']},

  {id:'briquette_foundry',family:'processed',name:'Литейный участок',description:'Прессованный металл ценят выше обычного лома.',needs:[processed('briquette',28,'Брикеты')],cashReward:360,xpReward:26,minLevel:4,requires:['processed:briquette']},
  {id:'clean_copper_grid',family:'processed',name:'Щитовая служба',description:'Партия зачищенной меди для ремонта сети.',needs:[processed('cleanCopper',9,'Чистая медь')],cashReward:820,xpReward:32,minLevel:5,requires:['processed:cleanCopper']},
  {id:'granulate_molding',family:'processed',name:'Литьё пластика',description:'Гранулы для небольшой формовочной серии.',needs:[processed('granulate',24,'Гранулы')],cashReward:230,xpReward:28,minLevel:6,requires:['processed:granulate']},
  {id:'processed_combo',family:'processed',name:'Комплект для мастерской',description:'Смешанная партия переработанного сырья.',needs:[processed('briquette',20,'Брикеты'),processed('cleanCopper',6,'Чистая медь')],cashReward:760,xpReward:38,minLevel:6,requires:['processed:briquette','processed:cleanCopper']},

  {id:'pump_service',family:'component',name:'Насосная бригада',description:'Нужен найденный насос и металл для установки.',needs:[mid('pump',1,'Насос'),raw('metal',35,'Металл')],cashReward:3200,xpReward:58,minLevel:6,requires:['mid:pump']},
  {id:'cold_chain',family:'component',name:'Холодильный сервис',description:'Компрессор для восстановления промышленной холодильной линии.',needs:[mid('compressor',1,'Компрессор'),processed('cleanCopper',8,'Чистая медь')],cashReward:4300,xpReward:66,minLevel:7,requires:['mid:compressor','processed:cleanCopper']},

  {id:'steel_contract',family:'industrial',name:'Металлоконструкции',description:'Стальные заготовки для небольшой несущей партии.',needs:[materialB('steelBlank',4,'Стальные заготовки')],cashReward:5200,xpReward:72,minLevel:8,requires:['materialB:steelBlank']},
  {id:'aluminium_contract',family:'industrial',name:'Лёгкие рамы',description:'Алюминиевые слитки для транспортных рам.',needs:[materialB('aluminiumBillet',3,'Алюминиевые слитки')],cashReward:6100,xpReward:78,minLevel:8,requires:['materialB:aluminiumBillet']},
  {id:'drive_control_pair',family:'industrial',name:'Автоматизация ворот',description:'Пара готовых модулей вместо сырья.',needs:[moduleB('drive',1,'Приводной модуль'),moduleB('control',1,'Модуль управления')],cashReward:9800,xpReward:95,minLevel:9,requires:['moduleB:drive','moduleB:control']},
  {id:'powertrain_order',family:'industrial',name:'Ремонт силовой линии',description:'Коробка передач и генератор для восстановительной бригады.',needs:[industrialB('gearbox',1,'Коробка передач'),industrialB('generator',1,'Генератор')],cashReward:14500,xpReward:115,minLevel:9,requires:['industrialB:gearbox','industrialB:generator']},

  {id:'alloy_billet_order',family:'industrial',name:'Тяжёлые заготовки',description:'Сплавные слитки для промышленной оснастки.',needs:[materialC('alloyBillet',8,'Слитки сплава')],cashReward:18000,xpReward:130,minLevel:10,requires:['materialC:alloyBillet']},
  {id:'hydraulic_power_order',family:'industrial',name:'Гидростанция',description:'Готовый гидравлический силовой модуль.',needs:[moduleC('hydraulicPower',1,'Гидравлический силовой модуль')],cashReward:24500,xpReward:150,minLevel:10,requires:['moduleC:hydraulicPower']},
  {id:'heavy_frame_order',family:'industrial',name:'Тяжёлая рама',description:'Усиленная рама для промышленной установки.',needs:[moduleC('heavyFrame',1,'Тяжёлая рама')],cashReward:27000,xpReward:160,minLevel:10,requires:['moduleC:heavyFrame']},
  {id:'industrial_controls',family:'industrial',name:'Промышленная автоматика',description:'Контроллер и гидроцилиндр для модернизации линии.',needs:[industrialC('industrialController',1,'Промышленный контроллер'),industrialC('heavyHydraulicCylinder',1,'Тяжёлый гидроцилиндр')],cashReward:36000,xpReward:190,minLevel:10,requires:['industrialC:industrialController','industrialC:heavyHydraulicCylinder']},
  {id:'plant_alloy_shipment',family:'industrial',name:'Портовая партия сплава',description:'Processing Plant собирает крупную отгрузку Alloy Billet.',needs:[materialC('alloyBillet',28,'Слитки сплава')],cashReward:75000,xpReward:260,minLevel:16,requires:['materialC:alloyBillet','base:processingPlant']},
  {id:'plant_module_bundle',family:'industrial',name:'Комплект тяжёлой линии',description:'Пакет модулей для модернизации промышленного заказчика.',needs:[moduleC('heavyFrame',2,'Тяжёлые рамы'),moduleC('hydraulicPower',2,'Гидравлические силовые модули'),moduleB('control',2,'Модули управления')],cashReward:125000,xpReward:320,minLevel:16,requires:['moduleC:heavyFrame','moduleC:hydraulicPower','moduleB:control','base:processingPlant']},
  {id:'plant_controls_lot',family:'industrial',name:'Партия промышленной автоматики',description:'Крупный Plant-scale заказ на контроллеры и тяжёлую гидравлику.',needs:[industrialC('industrialController',2,'Промышленные контроллеры'),industrialC('heavyHydraulicCylinder',2,'Тяжёлые гидроцилиндры')],cashReward:150000,xpReward:360,minLevel:16,requires:['industrialC:industrialController','industrialC:heavyHydraulicCylinder','base:processingPlant']}
];

export function contractNeedCapability(need:ContractBoardNeed):string{
  const prefix=need.kind==='midComponent'?'mid':need.kind;
  return `${prefix}:${need.key}`;
}

export function contractSignature(def:ContractBoardDef):string{
  return def.needs.map(contractNeedCapability).sort().join('|');
}

export function isDiscreteContractNeed(need:ContractBoardNeed):boolean{
  return !['resource','processed'].includes(need.kind);
}

export function contractFamilyLabel(family:ContractFamily):string{
  return ({raw:'СЫРЬЁ',processed:'ПЕРЕРАБОТКА',component:'КОМПОНЕНТЫ',industrial:'ПРОМЫШЛЕННЫЙ'})[family];
}

export function eligibleBoardContracts(ctx:ContractBoardContext):ContractBoardDef[]{
  return CONTRACT_BOARD_V2.filter(def=>def.minLevel<=ctx.level&&(def.requires??[]).every(cap=>ctx.capabilities.has(cap)));
}

function boardState(state:ContractState):ContractBoardState{return state as ContractBoardState}

export function boardContractOffers(state:ContractState,ctx:ContractBoardContext,count=1):ContractBoardDef[]{
  const eligible=eligibleBoardContracts(ctx);
  if(!eligible.length)return[CONTRACT_BOARD_V2[0]];
  const s=boardState(state),recentIds=(s.recentIds??[]).slice(-4),recentSignatures=(s.recentSignatures??[]).slice(-3),pointer=Math.max(0,state.index)+Math.max(0,state.completed)*3;
  let first=s.currentId&&eligible.find(def=>def.id===s.currentId);
  if(!first){
    let candidates=eligible.filter(def=>!recentIds.includes(def.id)&&!recentSignatures.includes(contractSignature(def)));
    if(!candidates.length)candidates=eligible.filter(def=>!recentIds.includes(def.id));
    if(!candidates.length)candidates=eligible;
    first=candidates[pointer%candidates.length];s.currentId=first.id;
  }
  const offers=[first];
  if(count<=1)return offers;
  const firstSig=contractSignature(first);
  let extras=eligible.filter(def=>def.id!==first!.id&&!recentIds.includes(def.id)&&!recentSignatures.includes(contractSignature(def))&&contractSignature(def)!==firstSig);
  if(!extras.length)extras=eligible.filter(def=>def.id!==first!.id&&!recentIds.includes(def.id)&&contractSignature(def)!==firstSig);
  if(!extras.length)extras=eligible.filter(def=>def.id!==first!.id);
  let offset=1;
  while(offers.length<Math.min(Math.max(1,count),eligible.length)&&extras.length){const idx=(pointer+offset)%extras.length;offers.push(extras.splice(idx,1)[0]);offset+=2}
  return offers;
}

export function activeBoardContract(state:ContractState,ctx:ContractBoardContext):ContractBoardDef{return boardContractOffers(state,ctx,1)[0]}

export function advanceBoardContract(state:ContractState,completed:ContractBoardDef):void{
  const s=boardState(state);
  s.recentIds=[...(s.recentIds??[]),completed.id].slice(-4);
  s.recentSignatures=[...(s.recentSignatures??[]),contractSignature(completed)].slice(-3);
  s.currentId=undefined;
  state.completed=Math.max(0,state.completed)+1;
  state.index=Math.max(0,state.index)+1;
}

export function contractBoardPoolStats(ctx:ContractBoardContext){
  const eligible=eligibleBoardContracts(ctx);
  return{eligible:eligible.length,total:CONTRACT_BOARD_V2.length,families:new Set(eligible.map(x=>x.family)).size};
}
