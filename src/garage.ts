import type { ComponentKind, ResourceKind } from './sim.ts';
import type { TalentId } from './progression.ts';

export type MachineId='workbench'|'press'|'wire'|'plastic';
export interface MachineRequirement{kind:'resource'|'component'|'cash';key?:ResourceKind|ComponentKind;amount:number;label:string;source:string}
export interface UnlockRequirement{kind:'level'|'machine'|'talent';level?:number;machine?:MachineId;talent?:TalentId;label:string}
export interface MachineUpgradeDef{toLevel:number;name:string;benefit:string;unlocks:UnlockRequirement[];requirements:MachineRequirement[]}
export interface MachineDef{id:MachineId;name:string;short:string;description:string;icon:string;buyPrice?:number;unlocks:UnlockRequirement[];requirements:MachineRequirement[];upgrades:MachineUpgradeDef[]}
export const STARTING_CASH=3000;
const level=(value:number):UnlockRequirement=>({kind:'level',level:value,label:`Уровень игрока ${value}`});
const machine=(value:MachineId,label:string):UnlockRequirement=>({kind:'machine',machine:value,label});
const talent=(value:TalentId,label:string):UnlockRequirement=>({kind:'talent',talent:value,label});
const r=(key:ResourceKind,amount:number,label:string):MachineRequirement=>({kind:'resource',key,amount,label,source:'Склад и полевая добыча.'});
const c=(key:ComponentKind,amount:number,label:string):MachineRequirement=>({kind:'component',key,amount,label,source:'Редкие узлы из разобранной техники.'});
const cash=(amount:number,label='Расходники'):MachineRequirement=>({kind:'cash',amount,label,source:'Продажи и контракты.'});

export const MACHINE_DEFS:Record<MachineId,MachineDef>={
 workbench:{
  id:'workbench',name:'Верстак',short:'Ручной разбор и сборка',icon:'🛠️',description:'Сборочный центр личного оборудования и гаражных машин.',unlocks:[],requirements:[],
  upgrades:[
   {toLevel:2,name:'Усиленный верстак',benefit:'Подготавливает мастерскую к более сложным сборкам.',unlocks:[level(3)],requirements:[r('metal',40,'Металл'),cash(1200)]},
   {toLevel:3,name:'Точный верстак',benefit:'Открывает точную сборку узлов и поздние гаражные рецепты.',unlocks:[level(5),talent('workshop_2','Талант «Точная настройка»')],requirements:[r('metal',90,'Металл'),c('electronics',1,'Электронный модуль'),cash(3500)]},
   {toLevel:4,name:'Сборочный пост',benefit:'Полноценное рабочее место для серийной сборки оборудования.',unlocks:[level(10),talent('workshop_3','Талант «Параллельная работа»')],requirements:[r('metal',180,'Металл'),c('bearing',3,'Подшипники'),c('electronics',2,'Электронные модули'),cash(9000)]},
   {toLevel:5,name:'Ангарный пост',benefit:'Сборка тяжёлого личного и транспортного оборудования.',unlocks:[level(16),talent('workshop_4','Талант «Калибровка»')],requirements:[r('metal',340,'Металл'),r('copper',45,'Медь'),c('hydraulic',2,'Гидравлические узлы'),cash(22000)]},
   {toLevel:6,name:'Промышленный сборочный пост',benefit:'Верх текущей эры: подготовка к промышленным модулям и большим модернизациям.',unlocks:[level(24),talent('workshop_6','Талант «Мастерская II»')],requirements:[r('metal',620,'Металл'),r('copper',90,'Медь'),c('electronics',4,'Электронные модули'),c('hydraulic',3,'Гидравлические узлы'),cash(52000)]}
  ]
 },
 press:{
  id:'press',name:'Малый гидропресс',short:'Металл → компактные брикеты',icon:'▥',buyPrice:24000,description:'Базовая металлургическая машина гаража. С ростом уровня увеличивает размер и скорость партий.',unlocks:[],requirements:[r('metal',100,'Металл'),c('bearing',2,'Подшипники'),c('hydraulic',1,'Гидравлический узел'),cash(2500)],
  upgrades:[
   {toLevel:2,name:'Пресс II',benefit:'Выше скорость и объём переработки металла.',unlocks:[level(5),talent('workshop_1','Талант «Экономная сборка»')],requirements:[r('metal',160,'Металл'),c('bearing',2,'Подшипники'),c('motor',1,'Электромотор'),cash(4000)]},
   {toLevel:3,name:'Пресс III',benefit:'Подготовка к тяжёлому лому и промышленным рецептам.',unlocks:[level(7),talent('workshop_2','Талант «Точная настройка»')],requirements:[r('metal',300,'Металл'),c('hydraulic',1,'Гидравлический узел'),c('motor',2,'Электромоторы'),cash(9000)]},
   {toLevel:4,name:'Пресс IV',benefit:'Крупные партии металла; заметный прирост кг/мин.',unlocks:[level(11),talent('workshop_3','Талант «Параллельная работа»')],requirements:[r('metal',460,'Металл'),c('bearing',4,'Подшипники'),c('hydraulic',2,'Гидравлические узлы'),cash(18000)]},
   {toLevel:5,name:'Тяжёлый пресс',benefit:'Ангарный класс переработки для постоянного потока сырья.',unlocks:[level(17),talent('workshop_4','Талант «Калибровка»')],requirements:[r('metal',700,'Металл'),c('motor',3,'Электромоторы'),c('hydraulic',3,'Гидравлические узлы'),cash(36000)]},
   {toLevel:6,name:'Промышленный пресс',benefit:'Максимальная пропускная способность гаражной линии текущей эры.',unlocks:[level(25),talent('workshop_6','Талант «Мастерская II»')],requirements:[r('metal',1050,'Металл'),r('copper',90,'Медь'),c('hydraulic',4,'Гидравлические узлы'),c('electronics',3,'Электронные модули'),cash(76000)]}
  ]
 },
 wire:{
  id:'wire',name:'Зачистка проводов',short:'Кабель → чистая медь',icon:'◉◉',buyPrice:38000,description:'Линия подготовки меди. С ростом уровня принимает всё более крупные партии.',unlocks:[level(3),machine('press','Установить малый гидропресс')],requirements:[r('metal',140,'Металл'),c('motor',1,'Электромотор'),c('electronics',1,'Электронный модуль'),cash(6000,'Деньги')],
  upgrades:[
   {toLevel:2,name:'Зачистка II',benefit:'Больше выхода меди и выше скорость обработки.',unlocks:[level(5),talent('workshop_1','Талант «Экономная сборка»')],requirements:[r('metal',120,'Металл'),r('copper',25,'Медь'),c('motor',1,'Электромотор'),cash(4500)]},
   {toLevel:3,name:'Зачистка III',benefit:'Серийная линия для больших кабельных партий.',unlocks:[level(9),talent('workshop_3','Талант «Параллельная работа»')],requirements:[r('metal',240,'Металл'),r('copper',45,'Медь'),c('bearing',2,'Подшипники'),c('electronics',2,'Электронные модули'),cash(11000)]},
   {toLevel:4,name:'Кабельная линия',benefit:'Ангарный объём: заметно выше медь/мин.',unlocks:[level(14),talent('workshop_4','Талант «Калибровка»')],requirements:[r('metal',390,'Металл'),r('copper',70,'Медь'),c('motor',2,'Электромоторы'),cash(22000)]},
   {toLevel:5,name:'Сортировщик меди',benefit:'Высокая загрузка без превращения меди в ручной bottleneck.',unlocks:[level(20),talent('workshop_5','Талант «Серийные детали»')],requirements:[r('metal',600,'Металл'),r('copper',110,'Медь'),c('electronics',3,'Электронные модули'),cash(42000)]},
   {toLevel:6,name:'Промышленная кабельная линия',benefit:'Верх текущей линии переработки меди.',unlocks:[level(27),talent('workshop_6','Талант «Мастерская II»')],requirements:[r('metal',900,'Металл'),r('copper',160,'Медь'),c('motor',3,'Электромоторы'),c('electronics',4,'Электронные модули'),cash(82000)]}
  ]
 },
 plastic:{
  id:'plastic',name:'Дробилка пластика',short:'Пластик → гранулы',icon:'▼',buyPrice:72000,description:'Линия переработки пластика. Позднее становится постоянным поставщиком промышленного сырья.',unlocks:[level(5),machine('wire','Установить зачистку проводов'),talent('workshop_2','Талант «Точная настройка»')],requirements:[r('metal',220,'Металл'),r('plastic',80,'Пластик'),c('motor',2,'Электромоторы'),cash(12000,'Деньги')],
  upgrades:[
   {toLevel:2,name:'Дробилка II',benefit:'Больше гранул и длиннее эффективные партии.',unlocks:[level(7),talent('workshop_2','Талант «Точная настройка»')],requirements:[r('metal',260,'Металл'),r('plastic',140,'Пластик'),c('motor',2,'Электромоторы'),cash(15000)]},
   {toLevel:3,name:'Дробилка III',benefit:'Серийная переработка пластика для растущей базы.',unlocks:[level(10),talent('workshop_3','Талант «Параллельная работа»')],requirements:[r('metal',380,'Металл'),r('plastic',220,'Пластик'),c('bearing',3,'Подшипники'),c('electronics',2,'Электронные модули'),cash(24000)]},
   {toLevel:4,name:'Ангарная дробилка',benefit:'Крупные партии и заметный прирост гранул/мин.',unlocks:[level(15),talent('workshop_4','Талант «Калибровка»')],requirements:[r('metal',540,'Металл'),r('plastic',340,'Пластик'),c('motor',3,'Электромоторы'),cash(39000)]},
   {toLevel:5,name:'Грануляционная линия',benefit:'Стабильный промышленный поток гранул.',unlocks:[level(21),talent('workshop_5','Талант «Серийные детали»')],requirements:[r('metal',760,'Металл'),r('plastic',520,'Пластик'),c('motor',4,'Электромоторы'),c('electronics',3,'Электронные модули'),cash(62000)]},
   {toLevel:6,name:'Промышленная грануляция',benefit:'Верх текущей пластиковой линии.',unlocks:[level(28),talent('workshop_6','Талант «Мастерская II»')],requirements:[r('metal',1100,'Металл'),r('plastic',760,'Пластик'),c('motor',5,'Электромоторы'),c('electronics',4,'Электронные модули'),cash(105000)]}
  ]
 }
};

export interface GarageInventory{resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;cash:number}
export interface ProgressContext{level:number;talents:ReadonlySet<TalentId>;installed:ReadonlySet<MachineId>}
export function ownedRequirement(req:MachineRequirement,inventory:GarageInventory):number{if(req.kind==='cash')return inventory.cash;if(req.kind==='resource')return inventory.resources[req.key as ResourceKind];return inventory.components[req.key as ComponentKind]}
export function requirementAmount(req:MachineRequirement,costMultiplier=1):number{if(req.kind==='component')return req.amount;return Math.max(req.kind==='cash'?1:.1,req.amount*costMultiplier)}
export function canAfford(requirements:MachineRequirement[],inventory:GarageInventory,costMultiplier=1):boolean{return requirements.every(req=>ownedRequirement(req,inventory)+1e-9>=requirementAmount(req,costMultiplier))}
export function unlockRequirementMet(req:UnlockRequirement,context:ProgressContext):boolean{if(req.kind==='level')return context.level>=(req.level??1);if(req.kind==='machine')return context.installed.has(req.machine!);return context.talents.has(req.talent!)}
export function machineUnlocked(machineDef:MachineDef,context:ProgressContext):boolean{return machineDef.unlocks.every(req=>unlockRequirementMet(req,context))}
export function unmetUnlocks(reqs:UnlockRequirement[],context:ProgressContext):UnlockRequirement[]{return reqs.filter(req=>!unlockRequirementMet(req,context))}
export function nextUpgrade(machineDef:MachineDef,currentLevel:number):MachineUpgradeDef|undefined{return machineDef.upgrades.find(upgrade=>upgrade.toLevel===currentLevel+1)}
