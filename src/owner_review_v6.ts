import './owner_review_v6.css';

type RuntimeState=Record<string,any>;
type NoticeTone='ok'|'warn';

const api=()=> (globalThis as any).__SALVAGE_TEST__??null;
const shell=()=> (globalThis as any).__SALVAGE_BASE_SHELL__??null;
const money=(value:number)=>`${Math.round(Number(value)||0).toLocaleString('ru-RU')} ₽`;
const qty=(value:number,digits=0)=>Number(value||0).toLocaleString('ru-RU',{maximumFractionDigits:digits});

const TEXT_REPLACEMENTS:[RegExp,string][]=[
  [/Processing Plant/g,'Перерабатывающий завод'],
  [/Industrial Workshop/g,'Промышленная мастерская'],
  [/Salvage Yard/g,'Площадка разборки'],
  [/Recovery Rig/g,'Тяжёлая эвакуационная платформа'],
  [/Workshop Queue/g,'Очередь мастерской'],
  [/Production Cells/g,'Производственные участки'],
  [/Refining Cell/g,'Участок подготовки сырья'],
  [/Fabrication Cell/g,'Сборочный участок'],
  [/Heavy Assembly Cell/g,'Участок тяжёлой сборки'],
  [/Truck conversion/g,'Переоборудование грузовика'],
  [/BULK SCRAP FIELD/g,'ПОЛЕ МАССОВОГО ЛОМА'],
  [/RECOVERED OBJECTS/g,'ИЗВЛЕЧЁННЫЕ ОБЪЕКТЫ'],
  [/CREW MUSTER/g,'СБОР БРИГАДЫ'],
  [/FLEET APRON/g,'СТОЯНКА ТЕХНИКИ'],
  [/HEAVY BAY/g,'ЗОНА ТЯЖЁЛОЙ СБОРКИ'],
  [/PLANT ONLINE/g,'ЗАВОД РАБОТАЕТ'],
  [/Plant-линии/g,'Заводские линии'],
  [/Port Power Assembly/g,'Портовая силовая сборка'],
  [/Recovery Assembly/g,'Тяжёлая восстановленная сборка'],
  [/Hydraulic Power/g,'Гидравлический силовой модуль'],
  [/Heavy Frame/g,'Тяжёлая рама'],
  [/Drive Module/g,'Приводной модуль'],
  [/Control Module/g,'Модуль управления'],
  [/Structural Frame/g,'Конструкционная секция'],
  [/Alloy Billet/g,'Усиленный сплав'],
  [/Alloy Scrap/g,'Сплав-сырьё'],
  [/Basic Route Kit/g,'Базовый маршрутный комплект'],
  [/MIDGAME PROOF/g,'ТЕКУЩАЯ ЦЕЛЬ'],
  [/PACK B/g,'РАЗВИТИЕ БАЗЫ'],
  [/PACK C/g,'ПРОМЫШЛЕННЫЙ ЭТАП'],
  [/PACK D/g,'ТЯЖЁЛЫЙ ЭТАП'],
  [/PACK E/g,'ЗАВОДСКОЙ ЭТАП'],
  [/\bOPERATOR\b/g,'ОПЕРАТОР'],
  [/\bOperator\b/g,'Оператор'],
  [/\bScavenger\b/g,'Сборщик'],
  [/\bBenchmark\b/g,'Эталонный темп'],
  [/\boffline\b/gi,'автономная'],
  [/\bBatch\b/g,'Партия'],
  [/\bETA\b/g,'Осталось'],
  [/\bTier III\b/g,'Этап III'],
  [/\bTier II\b/g,'Этап II'],
  [/\bTier I\b/g,'Этап I'],
  [/\bACTIVE\b/g,'РАБОТАЕТ'],
  [/\bREADY\b/g,'ГОТОВО'],
  [/\bseed\b/gi,'генерация'],
];

const PRESSURE_REPLACEMENTS=new Map<string,string>([
  ['Людям, машинам, складу и станкам становится тесно. Следующая потребность должна ощущаться как новый масштаб базы.',
   'Гараж упёрся во вместимость людей, транспорта и склада. Следующий шаг — ангар: больше мест для команды и техники.'],
  ['Следующее ограничение — объём сырья, тяжёлые объекты и несколько параллельных маршрутов.',
   'Ангар уже работает как база. Следующий предел — объём сырья, тяжёлый лом и несколько параллельных маршрутов.']
]);

let noticeTimer:number|undefined;
function ensureNotice(){
  let node=document.querySelector<HTMLElement>('#ownerV6Notice');
  if(!node){node=document.createElement('aside');node.id='ownerV6Notice';document.body.append(node)}
  return node;
}
function showNotice(text:string,tone:NoticeTone='warn'){
  const node=ensureNotice();
  if(node.textContent!==text)node.textContent=text;
  if(node.dataset.tone!==tone)node.dataset.tone=tone;
  node.classList.add('show');
  if(noticeTimer)window.clearTimeout(noticeTimer);
  noticeTimer=window.setTimeout(()=>node.classList.remove('show'),3200);
}
window.addEventListener('salvage:ui-notice',(event:Event)=>{
  const detail=(event as CustomEvent<{text?:string;tone?:NoticeTone}>).detail;
  if(detail?.text)showNotice(detail.text,detail.tone??'warn');
});

function localizeText(root:ParentNode|null){
  if(!root)return;
  const walker=document.createTreeWalker(root as Node,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];let current:Node|null;
  while((current=walker.nextNode()))nodes.push(current as Text);
  for(const node of nodes){
    const raw=node.nodeValue??'';let next=PRESSURE_REPLACEMENTS.get(raw.trim())??raw;
    for(const [pattern,replacement] of TEXT_REPLACEMENTS)next=next.replace(pattern,replacement);
    if(next!==raw)node.nodeValue=next;
  }
}

function hangarRequirements(state:RuntimeState){
  const pack=state.packB??{},materials=pack.materials??{},modules=pack.modules??{},processed=state.processed??{},storage=state.storage??{},mastery=state.midgame?.mastery??{};
  return[
    {label:'Освоить Зону 3',owned:Number(mastery.z3??0),need:100,show:(v:number)=>`${qty(v,0)}%`},
    {label:'Деньги',owned:Number(state.cash??0),need:220_000,show:(v:number)=>money(v)},
    {label:'Металл',owned:Number(storage.metal??0),need:240,show:(v:number)=>`${qty(v,0)} кг`},
    {label:'Чистая медь',owned:Number(processed.cleanCopper??0),need:24,show:(v:number)=>`${qty(v,1)} кг`},
    {label:'Металлические брикеты',owned:Number(processed.briquette??0),need:40,show:(v:number)=>`${qty(v,0)} кг`},
    {label:'Конструкционный профиль',owned:Number(materials.steelBlank??0),need:18,show:(v:number)=>qty(v,0)},
    {label:'Конструкционная секция',owned:Number(modules.structural??0),need:2,show:(v:number)=>qty(v,0)},
    {label:'Модуль управления',owned:Number(modules.control??0),need:1,show:(v:number)=>qty(v,0)}
  ].map(item=>({...item,ok:item.owned+1e-9>=item.need}));
}

function hideLegacyHangarAcquisition(){
  const button=document.querySelector<HTMLButtonElement>('#acquireHangar');if(!button)return;
  if(!button.hidden)button.hidden=true;
  const previous=button.previousElementSibling as HTMLElement|null;if(previous?.tagName==='P'&&!previous.hidden)previous.hidden=true;
  const card=button.closest<HTMLElement>('.milestoneCard');if(card&&!card.querySelector('.ownerHangarMovedHint')){
    const hint=document.createElement('p');hint.className='ownerHangarMovedHint';hint.textContent='Переход в ангар теперь находится во вкладке «Обзор». Здесь остаётся подготовка материалов и модулей.';card.append(hint);
  }
}

function renderHangarMilestone(state:RuntimeState){
  const overview=document.querySelector<HTMLElement>('#baseStageOverview');if(!overview)return;
  let card=overview.querySelector<HTMLElement>('#ownerHangarMilestone');
  if(state.packB?.hangarOwned){card?.remove();return}
  if(!card){card=document.createElement('section');card.id='ownerHangarMilestone';card.className='ownerHangarMilestone';const rail=overview.querySelector('.baseStageRail');rail?.insertAdjacentElement('afterend',card)}
  const requirements=hangarRequirements(state),ready=requirements.every(item=>item.ok),missing=requirements.filter(item=>!item.ok);
  const signature=JSON.stringify(requirements.map(item=>[item.label,Math.round(item.owned*10)/10,item.ok]));
  if(card.dataset.signature!==signature){
    card.dataset.signature=signature;
    card.innerHTML=`<header><div><small>СЛЕДУЮЩИЙ ОБЪЕКТ БАЗЫ</small><h3>Ангар</h3><p>Открывает более крупную операционную базу: до 5 сотрудников и 4 транспортных мест. Это развитие базы, поэтому открывается здесь, а не в логистике.</p></div><b class="ownerHangarState">${ready?'ГОТОВ К ОТКРЫТИЮ':'СОБИРАЕМ УСЛОВИЯ'}</b></header><div class="ownerHangarReqs">${requirements.map(item=>`<div class="ownerHangarReq ${item.ok?'ok':'missing'}"><span>${item.ok?'✓':'●'} ${item.label}</span><b>${item.show(item.owned)} / ${item.show(item.need)}</b></div>`).join('')}</div>${missing.length?`<p class="ownerHangarMissing">Сейчас не хватает: ${missing.map(item=>item.label.toLowerCase()).join(', ')}.</p>`:''}<button type="button" data-owner-acquire-hangar ${ready?'':'disabled'}>${ready?'Открыть ангар':'Сначала выполни условия выше'}</button>`;
  }
  const button=card.querySelector<HTMLButtonElement>('[data-owner-acquire-hangar]');
  if(button&&!button.dataset.bound){button.dataset.bound='1';button.addEventListener('click',()=>{
    const before=!!api()?.getState?.()?.packB?.hangarOwned;api()?.doAcquireHangar?.();
    window.setTimeout(()=>{
      const after=!!api()?.getState?.()?.packB?.hangarOwned;
      if(!before&&after){showNotice('Ангар открыт. База перешла на новый масштаб.','ok');shell()?.refresh?.();refreshOwnerReviewV6()}
      else if(!after)showNotice('Ангар пока не открыт: одно из условий изменилось. Проверь список выше.','warn');
    },0);
  })}
}

function setTextIfChanged(node:HTMLElement|null,text:string){if(node&&node.textContent!==text)node.textContent=text}

function enhancePlantScene(state:RuntimeState){
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2.stage-plant');if(!scene)return;
  setTextIfChanged(scene.querySelector<HTMLElement>('.baseSceneLabel b'),'Перерабатывающий завод');
  const warehouse=scene.querySelector<HTMLElement>('.plantWarehouse');
  if(warehouse&&!warehouse.querySelector('.ownerWarehouseHelp')){
    const help=document.createElement('small');help.className='ownerWarehouseHelp';help.textContent='Входящий запас сырья для производственных линий';warehouse.append(help);
  }
  const jobs=Array.isArray(state.packE?.production)?state.packE.production:[];
  const lines=Array.from(scene.querySelectorAll<HTMLElement>('.plantLines > div'));
  lines.forEach((line,index)=>{
    const job=jobs[index],busy=!!job;
    let status=line.querySelector<HTMLElement>('.ownerPlantLineStatus');if(!status){status=document.createElement('span');status.className='ownerPlantLineStatus';line.append(status)}
    status.classList.toggle('busy',busy);setTextIfChanged(status,busy?'РАБОТАЕТ':'СВОБОДНА');
    let help=line.querySelector<HTMLElement>('.ownerPlantLineHelp');if(!help){help=document.createElement('small');help.className='ownerPlantLineHelp';line.append(help)}
    setTextIfChanged(help,busy?'Идёт обработка партии':'Готова принять следующую партию');
  });
  let legend=scene.querySelector<HTMLElement>('.ownerPlantLegend');
  if(!legend){legend=document.createElement('div');legend.className='ownerPlantLegend';legend.innerHTML='<span><b>Склад</b> — входящий запас сырья</span><span><b>Линии</b> — занятость переработки</span><span><b>Доки</b> — места входящей и исходящей логистики</span>';scene.append(legend)}
}

let refreshing=false;
export function refreshOwnerReviewV6(){
  if(refreshing)return;refreshing=true;
  try{
    const state=api()?.getState?.() as RuntimeState|undefined;if(!state)return;
    hideLegacyHangarAcquisition();renderHangarMilestone(state);enhancePlantScene(state);
    localizeText(document.querySelector('#app'));
  }finally{refreshing=false}
}

function boot(){
  if(!api()?.getState||!document.querySelector('#app')){window.setTimeout(boot,80);return}
  const app=document.querySelector('#app')!;
  new MutationObserver(()=>queueMicrotask(refreshOwnerReviewV6)).observe(app,{subtree:true,childList:true,characterData:true});
  window.addEventListener('salvage:business-state-changed',refreshOwnerReviewV6);
  Object.assign(globalThis,{__SALVAGE_OWNER_V6__:{refresh:refreshOwnerReviewV6,showNotice}});
  refreshOwnerReviewV6();
  window.setInterval(refreshOwnerReviewV6,350);
}
boot();
