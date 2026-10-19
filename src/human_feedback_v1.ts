import './human_feedback_v1.css';

type AnyState=Record<string,any>;
type Rarity='common'|'uncommon'|'rare'|'epic'|'legendary';

interface MaterialSlot{
  id:string;
  name:string;
  icon:string;
  rarity:Rarity;
  value:(s:AnyState)=>number;
  discovered:(s:AnyState)=>boolean;
  unit?:string;
}

interface ComponentSlot{
  id:string;
  name:string;
  icon:string;
  rarity:Rarity;
  value:(s:AnyState)=>number;
  discovered:(s:AnyState)=>boolean;
}

const MATERIALS:MaterialSlot[]=[
  {id:'metal',name:'Металл',icon:'◻',rarity:'common',value:s=>s.storage?.metal??0,discovered:()=>true,unit:'кг'},
  {id:'copper',name:'Медь',icon:'◆',rarity:'common',value:s=>s.storage?.copper??0,discovered:()=>true,unit:'кг'},
  {id:'plastic',name:'Пластик',icon:'●',rarity:'common',value:s=>s.storage?.plastic??0,discovered:()=>true,unit:'кг'},
  {id:'alScrap',name:'Алюминиевый лом',icon:'⬡',rarity:'uncommon',value:s=>s.packB?.materials?.aluminiumScrap??0,discovered:s=>(s.packB?.materials?.aluminiumScrap??0)>0||(s.midgame?.mastery?.z4??0)>0||!!s.packB?.hangarOwned,unit:'кг'},
  {id:'steelBlank',name:'Стальная заготовка',icon:'▰',rarity:'rare',value:s=>s.packB?.materials?.steelBlank??0,discovered:s=>(s.packB?.materials?.steelBlank??0)>0||!!s.packB?.hangarOwned},
  {id:'alBillet',name:'Алюминиевый слиток',icon:'▱',rarity:'rare',value:s=>s.packB?.materials?.aluminiumBillet??0,discovered:s=>(s.packB?.materials?.aluminiumBillet??0)>0||!!s.packB?.hangarOwned},
  {id:'alloyScrap',name:'Лом сплава',icon:'⬢',rarity:'epic',value:s=>s.packC?.materials?.alloyScrap??0,discovered:s=>(s.packC?.materials?.alloyScrap??0)>0||(s.midgame?.mastery?.z5??0)>0||!!s.packC?.salvageYardOwned,unit:'кг'},
  {id:'alloyBillet',name:'Заготовка сплава',icon:'⬣',rarity:'epic',value:s=>s.packC?.materials?.alloyBillet??0,discovered:s=>(s.packC?.materials?.alloyBillet??0)>0||!!s.packC?.salvageYardOwned||!!s.packD?.recoveryRig?.owned}
];

const COMPONENTS:ComponentSlot[]=[
  {id:'bearing',name:'Подшипник',icon:'◉',rarity:'uncommon',value:s=>s.components?.bearing??0,discovered:s=>s.midgame?.discoveredComponents?.includes('bearing')||(s.components?.bearing??0)>0},
  {id:'motor',name:'Электромотор',icon:'⚙',rarity:'uncommon',value:s=>s.components?.motor??0,discovered:s=>s.midgame?.discoveredComponents?.includes('motor')||(s.components?.motor??0)>0},
  {id:'hydraulic',name:'Гидравлика',icon:'◆',rarity:'rare',value:s=>s.components?.hydraulic??0,discovered:s=>s.midgame?.discoveredComponents?.includes('hydraulic')||(s.components?.hydraulic??0)>0},
  {id:'electronics',name:'Электронный модуль',icon:'▦',rarity:'rare',value:s=>s.components?.electronics??0,discovered:s=>s.midgame?.discoveredComponents?.includes('electronics')||(s.components?.electronics??0)>0},
  {id:'pump',name:'Насос',icon:'◍',rarity:'rare',value:s=>s.midgame?.midComponents?.pump??0,discovered:s=>s.midgame?.discoveredMidComponents?.includes('pump')||(s.midgame?.midComponents?.pump??0)>0},
  {id:'compressor',name:'Компрессор',icon:'◫',rarity:'rare',value:s=>s.midgame?.midComponents?.compressor??0,discovered:s=>s.midgame?.discoveredMidComponents?.includes('compressor')||(s.midgame?.midComponents?.compressor??0)>0},
  {id:'gearbox',name:'Коробка передач',icon:'⚙',rarity:'epic',value:s=>s.packB?.industrial?.gearbox??0,discovered:s=>s.packB?.discoveredIndustrial?.includes('gearbox')||(s.packB?.industrial?.gearbox??0)>0},
  {id:'generator',name:'Генератор',icon:'ϟ',rarity:'epic',value:s=>s.packB?.industrial?.generator??0,discovered:s=>s.packB?.discoveredIndustrial?.includes('generator')||(s.packB?.industrial?.generator??0)>0},
  {id:'controller',name:'Промышленный контроллер',icon:'▣',rarity:'legendary',value:s=>s.packC?.industrial?.industrialController??0,discovered:s=>s.packC?.discoveredIndustrial?.includes('industrialController')||(s.packC?.industrial?.industrialController??0)>0},
  {id:'cylinder',name:'Тяжёлый гидроцилиндр',icon:'⬒',rarity:'legendary',value:s=>s.packC?.industrial?.heavyHydraulicCylinder??0,discovered:s=>s.packC?.discoveredIndustrial?.includes('heavyHydraulicCylinder')||(s.packC?.industrial?.heavyHydraulicCylinder??0)>0},
  {id:'recovery',name:'Эвакуационный узел',icon:'✦',rarity:'legendary',value:s=>s.packD?.recoveryAssemblies??0,discovered:s=>(s.packD?.recoveryAssemblies??0)>0||!!s.packD?.recoveryRig?.owned}
];

const REPLACEMENTS:[RegExp,string][]=[
  [/PACK B/g,'ЭТАП B'],[/PACK C/g,'ЭТАП C'],[/PACK D/g,'ЭТАП D'],
  [/Al scrap \/ billet/g,'Алюминий: лом / слиток'],[/Steel Blank/g,'Стальная заготовка'],[/Modules D\/C\/S/g,'Модули: привод / управление / рама'],[/Gearbox \/ Generator/g,'Коробка передач / генератор'],
  [/25 кг брикета → Steel/g,'25 кг брикетов → стальная заготовка'],[/12 кг Al → Billet/g,'12 кг алюминия → слиток'],[/Drive Module/g,'Приводной модуль'],[/Control Module/g,'Модуль управления'],[/Structural Frame/g,'Несущая рама'],
  [/Truck conversion/g,'Переоборудование грузовика'],[/crew slot/g,'слот команды'],[/Hangar:/g,'Ангар:'],
  [/Salvage Yard/g,'Сортировочная площадка'],[/Alloy scrap \/ billet/g,'Сплав: лом / заготовка'],[/Controller \/ Cylinder/g,'Контроллер / гидроцилиндр'],[/Hydraulic Power/g,'Гидросиловой модуль'],[/Heavy Frame/g,'Тяжёлая рама'],
  [/Recovery Rig/g,'Тяжёлая эвакуационная платформа'],[/Z7 signature assemblies/g,'Спецузлы Z7'],[/Industrial Workshop/g,'Промышленная мастерская'],[/Recovery Assembly/g,'Эвакуационный узел'],
  [/Operator/g,'Оператор'],[/Scavenger/g,'Сборщик'],[/Truck/g,'Грузовик'],[/Rig:/g,'Платформа:'],[/capacity/g,'вместимость'],[/clean Cu/g,'очищенная медь'],[/metal/g,'металл'],[/Alloy/g,'сплав'],[/Drive/g,'привод'],[/Control/g,'управление']
];

const rarityLabel:Record<Rarity,string>={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};

function state():AnyState|null{
  try{return (globalThis as any).__SALVAGE_TEST__?.getState?.()??null}catch{return null}
}
function amount(value:number,unit='шт.'){
  const rounded=Math.abs(value-Math.round(value))<.001?String(Math.round(value)):value.toFixed(1);
  return `${rounded} ${unit}`;
}
function materialCard(def:MaterialSlot,s:AnyState){
  const known=def.discovered(s),value=def.value(s),rarity=`hf${def.rarity[0].toUpperCase()}${def.rarity.slice(1)}`;
  return `<span class="hfDiscoverySlot ${rarity} ${known?'':'hfUnknown'}" data-hf-slot="${def.id}"><i class="hfIcon">${known?def.icon:'?'}</i><span class="hfMeta"><b>${known?def.name:'Неизвестный материал'}</b><small>${known?rarityLabel[def.rarity]:'Ещё не найден'}</small></span><strong>${known?amount(value,def.unit??'шт.'):'?'}</strong></span>`
}
function componentCard(def:ComponentSlot,s:AnyState){
  const known=def.discovered(s),value=def.value(s),rarity=`hf${def.rarity[0].toUpperCase()}${def.rarity.slice(1)}`;
  return `<span class="hfDiscoverySlot ${rarity} ${known?'':'hfUnknown'}" data-hf-slot="${def.id}"><i class="hfIcon">${known?def.icon:'?'}</i><span class="hfMeta"><b>${known?def.name:'Неизвестный компонент'}</b><small>${known?rarityLabel[def.rarity]:'Ещё не найден'}</small></span><strong>${known?Math.round(value):'?'}</strong></span>`
}
function signature(values:unknown){try{return JSON.stringify(values)}catch{return String(Date.now())}}

function renderDiscoveryInventory(){
  const s=state();if(!s)return;
  const materialRoot=document.querySelector<HTMLElement>('#storage');
  const componentRoot=document.querySelector<HTMLElement>('#storageComponents');
  if(materialRoot){
    const sig=signature(MATERIALS.map(d=>[d.id,d.discovered(s),d.value(s)]));
    if(materialRoot.dataset.hfSignature!==sig||!materialRoot.querySelector('[data-hf-slot]')){
      materialRoot.dataset.hfSignature=sig;materialRoot.classList.add('hfMaterialGrid');materialRoot.innerHTML=MATERIALS.map(d=>materialCard(d,s)).join('');
    }
  }
  if(componentRoot){
    const sig=signature(COMPONENTS.map(d=>[d.id,d.discovered(s),d.value(s)]));
    if(componentRoot.dataset.hfSignature!==sig||!componentRoot.querySelector('[data-hf-slot]')){
      componentRoot.dataset.hfSignature=sig;componentRoot.classList.add('hfDiscoveryGrid');componentRoot.innerHTML=COMPONENTS.map(d=>componentCard(d,s)).join('');
    }
    const store=componentRoot.closest('.store');
    if(store&&!store.querySelector('.hfLegend'))componentRoot.insertAdjacentHTML('afterend','<div class="hfLegend" aria-label="Редкость"><span class="common"><i></i>обычный</span><span class="uncommon"><i></i>необычный</span><span class="rare"><i></i>редкий</span><span class="epic"><i></i>эпический</span><span class="legendary"><i></i>легендарный</span></div>');
  }
}

function translateGarage(){
  const root=document.querySelector('#garageScreen');if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];let node:Node|null;
  while((node=walker.nextNode()))nodes.push(node as Text);
  for(const textNode of nodes){
    const parent=textNode.parentElement;if(!parent||parent.closest('script,style'))continue;
    let text=textNode.nodeValue??'',translated=text;
    for(const [pattern,replacement] of REPLACEMENTS)translated=translated.replace(pattern,replacement);
    if(translated!==text)textNode.nodeValue=translated;
  }
}

let scheduled=false;
function enhance(){scheduled=false;renderDiscoveryInventory();translateGarage()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
function boot(){
  const garage=document.querySelector('#garageScreen');
  if(!garage){setTimeout(boot,40);return}
  new MutationObserver(schedule).observe(garage,{subtree:true,childList:true,characterData:true});
  schedule();
}
boot();
