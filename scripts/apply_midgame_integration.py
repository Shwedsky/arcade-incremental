#!/usr/bin/env python3
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
main_path=root/'src/main.ts'
text=main_path.read_text(encoding='utf-8')

def rep(old,new,label):
    global text
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected 1 match, got {count}')
    text=text.replace(old,new,1)

def sub(pattern,replacement,label,flags=0):
    global text
    text2,count=re.subn(pattern,replacement,text,count=1,flags=flags)
    if count!=1: raise SystemExit(f'{label}: expected 1 regex match, got {count}')
    text=text2

rep("import './completion.css';", "import './completion.css';\nimport './midgame.css';", 'css import')
rep(
"import { makeDecor, renderField, type Decor, type FloatText, type Pickup, type Spark } from './field_view.ts';",
"""import { makeDecor, renderField, type Decor, type FloatText, type Pickup, type Spark } from './field_view.ts';
import {
  BASIC_ROUTE_CAPACITY_KG, FIRST_WORKER_COST, VAN_CAPACITY_KG, VAN_RECIPE, ZONE_DEFS,
  addActiveMastery, applyZoneProfile, assignWorker as assignWorkerDomain, canAssignWorker, canBuyVan,
  canHireFirstWorker, createDefaultMidgame, discoverComponent, emptyMidComponentRecord,
  midComponentName, migrateMidgameFromV3, normalizeMidgame, rollMidComponent, simulateWorkerGain,
  transferCartToVan, unloadVanToStorage, vanRemaining, vanWeight, zoneMastered, zoneUnlock,
  zoneYieldMultiplier, masteryUnitsForTarget,
  type MidComponentKind, type MidgameState, type ZoneId
} from './midgame.ts';""", 'midgame import')

rep(
'  <div class="panel zone"><small>СТАРАЯ СВАЛКА · ЗОНА 1</small><b>Ломай всё, что видишь</b><span id="seed"></span></div>',
'''  <div class="panel zone"><small id="zoneLabel">ЗОНА 1</small><b id="zoneTitle">Старая свалка</b><span id="seed"></span><div class="zoneProgress"><span id="zoneMasteryText">Освоение 0%</span><i><em id="zoneMasteryFill"></em></i></div><div class="zoneActions"><button id="zonesOpen" class="secondary compact">Карта зон</button></div></div>''','zone header')
rep(
'  <div id="full" class="full">Тележка полна — можно вернуться домой</div><div id="toast" class="toast"></div>',
'''  <div id="full" class="full">Тележка полна — можно вернуться домой</div><div id="toast" class="toast"></div>
  <div id="vanHud" class="panel vanHud" hidden><span>🚐</span><div class="vanMeter"><b>Фургон <span id="vanText">0 / 400 кг</span></b><i><em id="vanFill"></em></i></div><button id="vanUnload" class="secondary">Разгрузить тележку</button></div>''','van hud')
rep(
'<header><div><small>ГАРАЖ · БАЗА</small><h1>Мастерская</h1><p>Возвращайся когда хочешь. Вылазка сохраняется, добыча разгружается автоматически, работа мастерской продолжается сама.</p></div><div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong><button id="talentsGarage" class="secondary compact">Развитие</button></div></header>',
'''<header><div><small>ГАРАЖ · БАЗА</small><h1>Мастерская</h1><p>Возвращайся когда хочешь. Вылазка сохраняется, добыча разгружается автоматически, работа мастерской продолжается сама.</p></div><div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong><button id="zonesGarage" class="secondary compact mapButton">Карта зон</button><button id="talentsGarage" class="secondary compact">Развитие</button></div></header>''','garage map button')
rep(
'    <div class="managementGrid"><section class="managementCard" id="equipmentPanel"></section><section class="managementCard" id="queuePanel"></section><section class="managementCard" id="contractPanel"></section></div>',
'''    <div class="managementGrid"><section class="managementCard" id="equipmentPanel"></section><section class="managementCard" id="queuePanel"></section><section class="managementCard" id="contractPanel"></section></div>
    <div class="managementGrid midgameManagement"><section class="managementCard" id="transportPanel"></section><section class="managementCard" id="workerPanel"></section></div>''','midgame garage panels')
rep(
'  <section id="talentScreen" class="talentScreen" hidden>',
'''  <section id="zoneScreen" class="zoneScreen" hidden><div class="zoneBox"><header><div><small>КАРТА СБОРА</small><h1>Зоны добычи</h1><p>Новый фронтир осваиваешь лично. Освоенные зоны можно отдать рабочим.</p></div><button id="zoneClose" class="secondary">Закрыть</button></header><div id="zoneGrid" class="zoneGrid"></div></div></section>

  <section id="talentScreen" class="talentScreen" hidden>''','zone screen')

rep(
"const inspectorEl=$<HTMLElement>('machineInspector'),machineGridEl=$<HTMLElement>('machineGrid'),talentScreen=$<HTMLElement>('talentScreen'),talentBranchesEl=$<HTMLElement>('talentBranches'),offlineScreen=$<HTMLElement>('offlineScreen');",
"""const inspectorEl=$<HTMLElement>('machineInspector'),machineGridEl=$<HTMLElement>('machineGrid'),talentScreen=$<HTMLElement>('talentScreen'),talentBranchesEl=$<HTMLElement>('talentBranches'),offlineScreen=$<HTMLElement>('offlineScreen');
const zoneScreen=$<HTMLElement>('zoneScreen'),zoneGridEl=$<HTMLElement>('zoneGrid'),vanHud=$<HTMLElement>('vanHud');""",'dom refs')

sub(r"interface SaveStateV3\{[^\n]*\n[^\n]*\n[^\n]*\n\}","""interface SaveStateV4{
  v:4;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;
  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;
  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;
}""",'save interface')

sub(r"const defaultSave=\(\):SaveStateV3=>\([^\n]+\);\nfunction loadSave\(\):SaveStateV3\{.*?\n\}","""const defaultSave=():SaveStateV4=>({v:4,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:STARTING_CASH,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),midgame:createDefaultMidgame()});
function loadSave():SaveStateV4{
  try{
    const raw=localStorage.getItem(SAVE_KEY),value=raw?JSON.parse(raw):null,base=defaultSave();
    if(value?.v===4)return {...base,...value,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame)};
    if(value?.v===3){const components={...base.components,...value.components};return {...base,...value,v:4,storage:{...base.storage,...value.storage},components,processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:migrateMidgameFromV3(value.totalDestroyed??0,components)};}
    if(value?.v===2){const components={...base.components,...value.components};return {...base,...value,v:4,equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},components,midgame:migrateMidgameFromV3(value.totalDestroyed??0,components)};}
  }catch{}
  return defaultSave();
}""",'save loader',re.S)

rep(
"let jobs:WorkshopJob[]=loaded.jobs.map(j=>({...j})),contractState:ContractState={...loaded.contract};",
"""let jobs:WorkshopJob[]=loaded.jobs.map(j=>({...j})),contractState:ContractState={...loaded.contract};
let midgame:MidgameState=normalizeMidgame(loaded.midgame);""",'midgame loaded')
rep(
"let mode:'field'|'garage'='field',last=performance.now(),rareUntil=0,toastUntil=0,cart=0,haul:Record<ResourceKind,number>={metal:0,copper:0,plastic:0},comps:Record<ComponentKind,number>={bearing:0,motor:0,hydraulic:0,electronics:0};",
"""let mode:'field'|'garage'='field',last=performance.now(),rareUntil=0,toastUntil=0,cart=0,haul:Record<ResourceKind,number>={metal:0,copper:0,plastic:0},comps:Record<ComponentKind,number>={bearing:0,motor:0,hydraulic:0,electronics:0};
let midHaul:Record<MidComponentKind,number>=emptyMidComponentRecord(),fieldZone:ZoneId=midgame.currentZone;""",'mid haul state')
rep(
"const context=():ProgressContext=>({level:level(),talents,installed}),inventory=():GarageInventory=>({resources:{...storage},components:{...storedComps},cash});",
"""const context=():ProgressContext=>({level:level(),talents,installed}),inventory=():GarageInventory=>({resources:{...storage},components:{...storedComps},cash});
const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});""",'zone context')

sub(r"function saveGame\(\)\{[^\n]*\}","""function saveGame(){const state:SaveStateV4={v:4,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame)};localStorage.setItem(SAVE_KEY,JSON.stringify(state))}""",'saveGame')

sub(r"function applyOffline\(\)\{[^\n]*\}","""function applyOffline(){
  const now=Date.now(),completed=advanceWorkshop(now,false),elapsed=Math.max(0,(now-loadedLastSeen)/3600000),e=effects(),hours=Math.min(elapsed,e.offlineCapHours);
  let gain={metal:0,copper:0,plastic:0};
  if(elapsed>=.1667){gain={metal:420*e.offlineEfficiency*hours,copper:27*e.offlineEfficiency*hours,plastic:75*e.offlineEfficiency*hours};storage.metal+=gain.metal;storage.copper+=gain.copper;storage.plastic+=gain.plastic}
  const workerGain=simulateWorkerGain(midgame,now,8);
  (Object.keys(workerGain.resources) as ResourceKind[]).forEach(k=>storage[k]+=workerGain.resources[k]);
  (Object.keys(workerGain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=workerGain.components[k]);
  if(completed.length||elapsed>=.1667||workerGain.weight>.01){
    $('offlineLoot').innerHTML=`<p>${hours.toFixed(1)} ч пассивной вылазки · эффективность ${(e.offlineEfficiency*100).toFixed(0)}%</p><div><span>Металл <b>+${gain.metal.toFixed(1)} кг</b></span><span>Медь <b>+${gain.copper.toFixed(1)} кг</b></span><span>Пластик <b>+${gain.plastic.toFixed(1)} кг</b></span></div>${workerGain.weight>.01?`<h3>Рабочий маршрут · ${ZONE_DEFS[midgame.worker.assignment!].name}</h3><p>+${workerGain.weight.toFixed(1)} кг за ${workerGain.hours.toFixed(1)} ч</p>`:''}${completed.length?`<h3>Мастерская завершила</h3><ul>${completed.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}`;offlineScreen.hidden=false
  }
  saveGame()
}""",'offline')

sub(r"function refreshField\(\)\{[^\n]*\}","""function refreshField(){trip++;rng=mulberry32(hashSeed(`${baseSeed}:${midgame.currentZone}:${trip}`));targets=generateField(`${baseSeed}:field:${midgame.currentZone}:${trip}`,FIELD_NODE_COUNT);applyZoneProfile(targets,midgame.currentZone,rng);fieldZone=midgame.currentZone;drops=[];texts=[];sparks=[];decor=makeDecor(mulberry32(hashSeed(`${baseSeed}:decor:${midgame.currentZone}:${trip}`)),WORLD.width,WORLD.height);player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;seedEl.textContent=`seed ${baseSeed} · поле ${trip}`}""",'refreshField')

sub(r"function breakTarget\(t:SalvageTarget\)\{[^\n]*\}","""function breakTarget(t:SalvageTarget){
  t.alive=false;t.hp=0;telemetry.destroyed++;totalDestroyed++;registerCombo();
  const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);
  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>r.resources[k]*=ym);
  r.component=applyPity(t,r.component);
  const mastery=addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));
  if(mastery.masteredNow)showToast(`${ZONE_DEFS[midgame.currentZone].name} освоена! Можно назначать рабочего.`);
  const total=r.resources.metal+r.resources.copper+r.resources.plastic;let left=def.fragments;
  shake=Math.min(12,4+def.radius*.12);spawnSparks(t,'#ffd36d',Math.round(8+def.fragments*.75),def.radius>31);
  (['metal','copper','plastic'] as ResourceKind[]).forEach((k,i)=>{const remaining=2-i,n=i===2?left:Math.max(1,Math.min(left-remaining,Math.round(def.fragments*r.resources[k]/Math.max(.001,total))));left-=n;spawnResource(k,r.resources[k],n,t);if(r.resources[k]>.03)texts.push({x:t.x+(rng()-.5)*34,y:t.y-24-i*18,text:`+${r.resources[k].toFixed(r.resources[k]<1?1:0)} ${resourceName[k].toLowerCase()}`,color:resourceColor[k],life:1.15})});
  gainXp(xpForTarget(t.classId),t);
  if(r.component){discoverComponent(midgame,r.component);comps[r.component]++;telemetry.components++;gainXp(xpForComponent());texts.push({x:t.x,y:t.y-76,text:`${componentIcon[r.component]} ${componentName[r.component]}!`,color:'#ffe56f',life:2,big:true});rareEl.innerHTML=`<small>${r.component==='motor'||r.component==='hydraulic'?'РЕДКИЙ КОМПОНЕНТ':'КОМПОНЕНТ'}</small><b>${componentIcon[r.component]} ${componentName[r.component]}</b><em>Сохрани — пригодится для станков, апгрейдов и контрактов</em>`;rareEl.className=`rare show ${r.component==='motor'||r.component==='hydraulic'?'strong':''}`;rareUntil=2.3;spawnSparks(t,'#78d8ff',20,true)}
  const mid=rollMidComponent(midgame,midgame.currentZone,t.classId,rng);
  if(mid){midHaul[mid]++;gainXp(4,t);texts.push({x:t.x,y:t.y-104,text:`◆ ${midComponentName(mid)}!`,color:'#8fe8ff',life:2.2,big:true});rareEl.innerHTML=`<small>НОВЫЙ КОМПОНЕНТ</small><b>◆ ${midComponentName(mid)}</b><em>${mid==='pump'?'Нужен для гидравлических модулей':'Редкий источник — крупная техника Зоны 3'}</em>`;rareEl.className='rare show strong';rareUntil=2.5;spawnSparks(t,'#63dfff',26,true)}
}""",'breakTarget')

sub(r"function updateGoal\(\)\{[^\n]*\}\nfunction hud\(\)\{[^\n]*\}","""function updateGoal(){
  const press=MACHINE_DEFS.press;
  if(!installed.has('press')&&!jobForMachine('press','build_machine')){const e=effects(),needs=press.requirements.map(r=>requirementAmount(r,e.machineCostMultiplier));$('goalCard').className='panel goal';$('goalCard').innerHTML=`<small>СЛЕДУЮЩАЯ ЦЕЛЬ</small><b>▥ Малый гидропресс</b><div class="goalReqs"><span>Металл ${reqProgress(storage.metal+haul.metal,needs[0],' кг')}</span><span>Подшипники ${reqProgress(storedComps.bearing+comps.bearing,needs[1])}</span><span>Гидравлика ${reqProgress(storedComps.hydraulic+comps.hydraulic,needs[2])}</span><span>Расходники ${reqProgress(cash,needs[3],' ₽')}</span></div><em>Параллельно можешь качать инструмент, тележку и выполнять контракт.</em>`;return}
  if(jobForMachine('press','build_machine')){$('goalCard').className='panel goal done';$('goalCard').innerHTML='<small>МАСТЕРСКАЯ</small><b>▥ Гидропресс собирается</b><em>Не нужно ждать в гараже: возвращайся на свалку, таймер продолжит идти.</em>';return}
  if(!zoneMastered(midgame,'z2')){$('goalCard').className='panel goal';$('goalCard').innerHTML=`<small>ФРОНТИР</small><b>Освой Зону 2</b><em>Освоение: ${midgame.mastery.z2.toFixed(0)}%. Новый фронтир открывает пассивные маршруты только после личного освоения.</em>`;return}
  if(!midgame.van.owned){$('goalCard').className='panel goal';$('goalCard').innerHTML=`<small>ЛОГИСТИКА</small><b>🚐 Подготовить фургон</b><em>400 кг полевого буфера: несколько тележек за одну экспедицию.</em>`;return}
  if(!midgame.worker.hired){$('goalCard').className='panel goal';$('goalCard').innerHTML=`<small>АВТОМАТИЗАЦИЯ</small><b>Нанять первого рабочего</b><em>${zoneMastered(midgame,'z1')?'Старая свалка готова к пассивному маршруту.':'Сначала освой Старую свалку.'}</em>`;return}
  $('goalCard').className='panel goal done';$('goalCard').innerHTML=`<small>MIDGAME PROOF</small><b>${ZONE_DEFS[midgame.currentZone].name}</b><em>Рабочий: ${midgame.worker.assignment?ZONE_DEFS[midgame.worker.assignment].name:'не назначен'} · Фургон ${vanWeight(midgame.van).toFixed(0)}/${VAN_CAPACITY_KG} кг.</em>`
}
function hud(){
  const min=Math.max((performance.now()-telemetry.start)/60000,1/60),z=ZONE_DEFS[midgame.currentZone];
  $('zoneLabel').textContent=`${z.subtitle}${zoneMastered(midgame,midgame.currentZone)?' · ОСВОЕНА':''}`;$('zoneTitle').textContent=z.name;$('zoneMasteryText').textContent=`Освоение ${midgame.mastery[midgame.currentZone].toFixed(0)}%`;$<HTMLElement>('zoneMasteryFill').style.width=`${midgame.mastery[midgame.currentZone]}%`;
  $('destroyed').textContent=String(telemetry.destroyed);$('rate').textContent=`${(telemetry.destroyed/min).toFixed(1)}/мин`;$('pickups').textContent=`${(telemetry.pickupVisuals/min).toFixed(0)}/мин`;$('timer').textContent=fmt((performance.now()-telemetry.start)/1000);$('cartText').textContent=`${cart.toFixed(1)} / ${capacity()} кг`;$<HTMLElement>('cartFill').style.width=`${Math.min(100,cart/capacity()*100)}%`;(['metal','copper','plastic'] as ResourceKind[]).forEach(k=>$(k).textContent=haul[k].toFixed(1));$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class="${comps[k]?'has':''}">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('')+`<span class="${midHaul.pump?'has':''}">P <b>${midHaul.pump}</b></span><span class="${midHaul.compressor?'has':''}">C <b>${midHaul.compressor}</b></span>`;
  fullEl.textContent=midgame.van.owned&&vanRemaining(midgame.van)>.01?'Тележка полна — разгрузи её в фургон':'Тележка полна — пора возвращаться домой';fullEl.classList.toggle('show',cart>=capacity()-.01);
  vanHud.hidden=!midgame.van.owned;if(midgame.van.owned){const vw=vanWeight(midgame.van);$('vanText').textContent=`${vw.toFixed(0)} / ${VAN_CAPACITY_KG} кг`;$<HTMLElement>('vanFill').style.width=`${vw/VAN_CAPACITY_KG*100}%`;$<HTMLButtonElement>('vanUnload').disabled=cart<=.01||vanRemaining(midgame.van)<=.01;vanHud.classList.toggle('vanFull',vanRemaining(midgame.van)<=.01)}
  if(selected){targetEl.classList.add('show');const d=getTargetClass(selected.classId),e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,targetDps=BASE_DPS*e.dpsMultiplier*toolPowerMultiplier(equipmentLevels.tool)*comboMult;targetEl.innerHTML=`<b>${d.label}</b><span>${(selected.hp/targetDps).toFixed(1)}с</span>`}else targetEl.classList.remove('show');renderProgress();updateGoal()
}""",'goal and hud')

anchor="function renderGarage(){advanceWorkshop(Date.now(),false);"
if anchor not in text: raise SystemExit('renderGarage anchor missing')
insert="""function renderZoneScreen(){zoneGridEl.innerHTML=(Object.keys(ZONE_DEFS) as ZoneId[]).map(id=>{const def=ZONE_DEFS[id],gate=zoneUnlock(midgame,id,zoneContext()),mastered=zoneMastered(midgame,id),current=midgame.currentZone===id;return`<article class=\"zoneCard ${current?'current':''} ${mastered?'mastered':''} ${gate.ok?'':'locked'}\" data-zone=\"${id}\"><span class=\"zoneNumber\">${def.subtitle}</span><h3>${def.name}</h3><p>${def.description}</p><div class=\"masteryLine\"><span>${mastered?'✓ Освоена':`Освоение ${midgame.mastery[id].toFixed(0)}%`}</span><i><em style=\"width:${midgame.mastery[id]}%\"></em></i></div><span class=\"gateText\">${gate.ok?(mastered?'Можно добывать самому или назначить рабочего':'Фронтир · осваивается только лично'):gate.reason}</span><button ${gate.ok?'':'disabled'}>${current?'Выбрана':'Выбрать зону'}</button></article>`}).join('')}
function openZoneScreen(){renderZoneScreen();zoneScreen.hidden=false}
function closeZoneScreen(){zoneScreen.hidden=true}
function buyVan(){if(!canBuyVan(midgame,zoneContext(),{cash,metal:storage.metal,cleanCopper:processed.cleanCopper,motor:storedComps.motor,electronics:storedComps.electronics}))return;cash-=VAN_RECIPE.cash;storage.metal-=VAN_RECIPE.metal;processed.cleanCopper-=VAN_RECIPE.cleanCopper;storedComps.motor--;storedComps.electronics--;midgame.van.owned=true;showToast('Фургон готов: 400 кг полевого буфера');saveGame();renderGarage();hud()}
function hireWorker(){if(!canHireFirstWorker(midgame,cash))return;cash-=FIRST_WORKER_COST;midgame.worker.hired=true;midgame.worker.lastTick=Date.now();showToast('Первый рабочий нанят · Basic Route Kit 150 кг');saveGame();renderGarage()}
function assignWorker(id:ZoneId){if(!assignWorkerDomain(midgame,id,Date.now()))return;showToast(`Рабочий назначен: ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}
function unloadCartToVan(){if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()}
function renderMidgamePanels(){
  const vanReady=canBuyVan(midgame,zoneContext(),{cash,metal:storage.metal,cleanCopper:processed.cleanCopper,motor:storedComps.motor,electronics:storedComps.electronics});
  $('transportPanel').innerHTML=midgame.van.owned?`<div class=\"transportCard\"><h2>🚐 Фургон</h2><p>Полевой буфер ${VAN_CAPACITY_KG} кг. Тележка остаётся твоим локальным сборщиком.</p><div class=\"workerStatus\">Сейчас: ${vanWeight(midgame.van).toFixed(1)} / ${VAN_CAPACITY_KG} кг</div></div>`:`<div class=\"transportCard\"><h2>🚐 Фургон</h2><p>Открывает длинные экспедиции в Зоне 3.</p><div class=\"midReqs\"><span class=\"${cash>=VAN_RECIPE.cash?'ok':'missing'}\">Деньги <b>${money(cash)} / ${money(VAN_RECIPE.cash)}</b></span><span class=\"${storage.metal>=VAN_RECIPE.metal?'ok':'missing'}\">Металл <b>${storage.metal.toFixed(0)} / ${VAN_RECIPE.metal} кг</b></span><span class=\"${processed.cleanCopper>=VAN_RECIPE.cleanCopper?'ok':'missing'}\">Чистая медь <b>${processed.cleanCopper.toFixed(1)} / ${VAN_RECIPE.cleanCopper} кг</b></span><span class=\"${storedComps.motor>=1?'ok':'missing'}\">Мотор <b>${storedComps.motor} / 1</b></span><span class=\"${storedComps.electronics>=1?'ok':'missing'}\">Электроника <b>${storedComps.electronics} / 1</b></span></div><button id=\"buyVan\" ${vanReady?'':'disabled'}>${zoneUnlock(midgame,'z3',zoneContext()).ok?'Подготовить фургон':'Сначала открыть Зону 3'}</button></div>`;
  const hireReady=canHireFirstWorker(midgame,cash);
  $('workerPanel').innerHTML=!midgame.worker.hired?`<div class=\"workerCard\"><h2>👷 Первый рабочий</h2><p>Автоматизирует одну освоенную старую зону. Сам новые зоны не открывает.</p><span>Basic Route Kit: ${BASIC_ROUTE_CAPACITY_KG} кг</span><button id=\"hireWorker\" ${hireReady?'':'disabled'}>${!midgame.van.owned?'Сначала нужен фургон':!zoneMastered(midgame,'z1')?'Сначала освой Z1':cash<FIRST_WORKER_COST?`Нужно ${money(FIRST_WORKER_COST)}`:`Нанять · ${money(FIRST_WORKER_COST)}`}</button></div>`:`<div class=\"workerCard\"><h2>👷 Рабочий · Scavenger</h2><div class=\"workerStatus\">Маршрут: ${midgame.worker.assignment?ZONE_DEFS[midgame.worker.assignment].name:'не назначен'}</div><p>Можно назначить только на освоенную зону.</p><div class=\"workerZones\">${(Object.keys(ZONE_DEFS) as ZoneId[]).map(id=>`<button data-worker-zone=\"${id}\" ${canAssignWorker(midgame,id)?'':'disabled'}>${ZONE_DEFS[id].name} · ${midgame.mastery[id].toFixed(0)}%</button>`).join('')}</div></div>`;
  const midEl=$('storageComponents');midEl.innerHTML+=`<div class=\"midComponents\"><span>◆ Насос <b>${midgame.midComponents.pump}</b></span><span>◆ Компрессор <b>${midgame.midComponents.compressor}</b></span></div>`;
}
"""
text=text.replace(anchor,insert+anchor,1)

sub(r"function renderGarage\(\)\{[^\n]*\}","""function renderGarage(){advanceWorkshop(Date.now(),false);$('cash').textContent=`Наличные: ${money(cash)}`;$('storage').innerHTML=(['metal','copper','plastic'] as ResourceKind[]).map(k=>`<span>${resourceName[k]} <b>${storage[k].toFixed(1)} кг</b></span>`).join('');$('processed').innerHTML=(Object.keys(processed) as ProcessKind[]).map(k=>`<span>${processedName[k]} <b>${processed[k].toFixed(1)} кг</b></span>`).join('');$('storageComponents').innerHTML=(Object.keys(storedComps) as ComponentKind[]).map(k=>`<span class="${storedComps[k]?'owned':''}">${componentIcon[k]} ${componentName[k]} <b>${storedComps[k]}</b></span>`).join('');renderMachineCards();renderInspector();renderEquipment();renderQueue();renderContract();renderMidgamePanels();const rawValue=(storage.metal*BASE_SALE.metal+storage.copper*BASE_SALE.copper+storage.plastic*BASE_SALE.plastic)*effects().saleMultiplier,processedValue=(processed.briquette*PROCESSED_SALE.briquette+processed.cleanCopper*PROCESSED_SALE.cleanCopper+processed.granulate*PROCESSED_SALE.granulate)*effects().saleMultiplier;$<HTMLButtonElement>('sellRaw').disabled=rawValue<1;$<HTMLButtonElement>('sellRaw').textContent=`Продать сырьё · ${money(rawValue)}`;$<HTMLButtonElement>('sellProcessed').disabled=processedValue<1;$<HTMLButtonElement>('sellProcessed').textContent=`Продать переработанное · ${money(processedValue)}`;nextBtn.textContent=`Ехать: ${ZONE_DEFS[midgame.currentZone].name}`;renderProgress();lastGarageRender=performance.now()}""",'renderGarage')

sub(r"function garage\(\)\{[^\n]*\}\nfunction leaveGarage\(\)\{[^\n]*\}","""function garage(){if(mode!=='field')return;mode='garage';for(const k of ['metal','copper','plastic'] as ResourceKind[]){storage[k]+=haul[k];haul[k]=0}for(const k of Object.keys(comps) as ComponentKind[]){storedComps[k]+=comps[k];comps[k]=0}for(const k of Object.keys(midHaul) as MidComponentKind[]){midgame.midComponents[k]+=midHaul[k];midHaul[k]=0}const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents);cart=0;$('tripSummary').textContent=`Последняя вылазка: ${telemetry.destroyed} целей · ${fmt((performance.now()-telemetry.start)/1000)}${vanKg?` · фургон ${vanKg.toFixed(0)} кг`:''}`;garageScreen.hidden=false;renderGarage();saveGame()}
function leaveGarage(){garageScreen.hidden=true;mode='field';if(fieldZone!==midgame.currentZone||targets.filter(t=>t.alive).length<12)refreshField();resetExcursionMetrics();hud()}""",'garage functions')

rep(
"else if(target.closest('#completeContract'))completeContract()});",
"""else if(target.closest('#completeContract'))completeContract();else if(target.closest('#buyVan'))buyVan();else if(target.closest('#hireWorker'))hireWorker();else{const workerZone=target.closest<HTMLElement>('[data-worker-zone]');if(workerZone)assignWorker(workerZone.dataset.workerZone as ZoneId)}});""",'garage delegated midgame')

rep(
"garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;",
"""garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;
$('zonesOpen').onclick=()=>{if(mode==='field')garage();openZoneScreen()};$('zonesGarage').onclick=openZoneScreen;$('zoneClose').onclick=closeZoneScreen;$<HTMLButtonElement>('vanUnload').onclick=unloadCartToVan;
zoneGridEl.addEventListener('click',e=>{const card=(e.target as HTMLElement).closest<HTMLElement>('[data-zone]');if(!card||!(e.target as HTMLElement).closest('button'))return;const id=card.dataset.zone as ZoneId;if(!zoneUnlock(midgame,id,zoneContext()).ok)return;midgame.currentZone=id;saveGame();closeZoneScreen();if(mode==='garage')renderGarage()});""",'midgame onclicks')

rep(
"setInterval(()=>{const completed=advanceWorkshop(Date.now(),mode==='garage');if(mode==='garage'&&(completed.length||performance.now()-lastGarageRender>1000))renderGarage()},1000);",
"""setInterval(()=>{const completed=advanceWorkshop(Date.now(),mode==='garage');if(mode==='garage'&&(completed.length||performance.now()-lastGarageRender>1000))renderGarage()},1000);
setInterval(()=>{const gain=simulateWorkerGain(midgame,Date.now(),8);if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k]);saveGame();if(mode==='garage')renderGarage()}},5000);""",'worker active tick')

sub(r"Object\.assign\(globalThis,\{__SALVAGE_TEST__:\{[^\n]*\}\}\);", """Object.assign(globalThis,{__SALVAGE_TEST__:{getState:()=>({saveVersion:4,xp,level:level(),mastery:masteryAvailable(),talents:[...talents],trip,cart,capacity:capacity(),alive:targets.filter(t=>t.alive).length,haul:{...haul},storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},comboCount,midgame:normalizeMidgame(midgame)}),forceGarage:garage,openTalents,openZones:openZoneScreen,selectMachine:(id:MachineId)=>{selectedMachine=id;if(mode==='garage')renderGarage()},selectZone:(id:ZoneId)=>{if(zoneUnlock(midgame,id,zoneContext()).ok){midgame.currentZone=id;saveGame()}},advanceWorkshopTo:(now:number)=>{const done=advanceWorkshop(now,false);if(mode==='garage')renderGarage();return done},startProcess:(id:MachineId)=>enqueueProcess(id),completeContract,buyVan,hireWorker,assignWorker,unloadCartToVan}});""",'test api')

main_path.write_text(text,encoding='utf-8')

# package scripts
pkg_path=root/'package.json'
pkg=json.loads(pkg_path.read_text(encoding='utf-8'))
pkg['scripts']['smoke:midgame']='tsx scripts/midgame-smoke.ts'
pkg['scripts']['smoke:browser:midgame']='tsx scripts/browser-midgame-smoke.ts'
pkg_path.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# main CI
ci_path=root/'.github/workflows/ci.yml'
ci=ci_path.read_text(encoding='utf-8')
if 'Midgame domain smoke' not in ci:
    ci=ci.replace('      - name: Progression pacing proof\n        run: python models/progression_sim_v0.py --check', '      - name: Midgame domain smoke\n        run: npm run smoke:midgame\n      - name: Progression pacing proof\n        run: python models/progression_sim_v0.py --check\n      - name: Mid/Late mechanics structural proof\n        run: python models/mid_late_mechanics_sim_v1.py --check')
    ci=ci.replace('      - name: Package web slice', '      - name: Headless browser midgame proof\n        run: npm run smoke:browser:midgame\n      - name: Package web slice')
ci_path.write_text(ci,encoding='utf-8')
print('midgame integration patch applied')
