#!/usr/bin/env python3
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
p=root/'src/main.ts'
text=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global text
    c=text.count(old)
    if c!=1: raise SystemExit(f'{label}: expected 1 match, got {c}')
    text=text.replace(old,new,1)

def sub(pattern,repl,label,flags=0):
    global text
    new,c=re.subn(pattern,repl,text,count=1,flags=flags)
    if c!=1: raise SystemExit(f'{label}: expected 1 regex match, got {c}')
    text=new

if "import './content_pack_b.css';" in text:
    print('Pack B integration already applied')
    raise SystemExit(0)

rep("import './content_pack_a.css';","import './content_pack_a.css';\nimport './content_pack_b.css';",'css')
rep("} from './midgame.ts';","""} from './midgame.ts';
import {
  HANGAR_CASH,HANGAR_RECIPE,SECOND_WORKER_COST,TRUCK_CAPACITY_KG,TRUCK_CASH,TRUCK_RECIPE,
  acquireHangar,acquireTruck,assignSecondWorker,canAcquireHangar,canAcquireTruck,canFabricateModule,
  canHireSecondWorker,createDefaultPackB,fabricateModule,hireSecondWorker,industrialName,normalizePackB,
  refineAluminium,refineSteel,rollIndustrialComponent,simulateSecondWorker,transferCartToTruck,truckRemaining,truckWeight,unloadTruck,z4AluminiumYield,
  type FabricatedModuleKind,type IndustrialComponentKind,type PackBInventory,type PackBState
} from './content_pack_b.ts';""",'pack b import')

sub(r"interface SaveStateV4\{.*?\n\}","""interface SaveStateV5{
  v:5;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;
  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;
  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;
}""",'save interface',re.S)
sub(r"const defaultSave=\(\):SaveStateV4=>.*?return defaultSave\(\);\n\}","""const defaultSave=():SaveStateV5=>({v:5,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:STARTING_CASH,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),midgame:createDefaultMidgame(),packB:createDefaultPackB()});
function loadSave():SaveStateV5{
  try{
    const raw=initialSaveRead.raw,value=raw?JSON.parse(raw):null,base=defaultSave();
    if(value?.v===5)return {...base,...value,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB)};
    if(value?.v===4)return {...base,...value,v:5,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:createDefaultPackB()};
    if(value?.v===3){const components={...base.components,...value.components};return {...base,...value,v:5,storage:{...base.storage,...value.storage},components,processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB()};}
    if(value?.v===2){const components={...base.components,...value.components};return {...base,...value,v:5,equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},components,midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB()};}
  }catch{}
  return defaultSave();
}""",'save loader',re.S)
rep("let midgame:MidgameState=normalizeMidgame(loaded.midgame);","let midgame:MidgameState=normalizeMidgame(loaded.midgame);\nlet packB:PackBState=normalizePackB(loaded.packB);",'loaded pack b')
rep("let midHaul:Record<MidComponentKind,number>=emptyMidComponentRecord(),fieldZone:ZoneId=midgame.currentZone;","let midHaul:Record<MidComponentKind,number>=emptyMidComponentRecord(),fieldZone:ZoneId=midgame.currentZone;\nlet aluminiumHaul=0,industrialHaul:Record<IndustrialComponentKind,number>={gearbox:0,generator:0};",'field pack b haul')
rep("const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});","""const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});
const currentPackBInventory=():PackBInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,briquette:processed.briquette,components:storedComps});
function applyPackBInventory(inv:PackBInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.briquette=inv.briquette}""",'pack b inventory')
sub(r"function saveGame\(\)\{const state:SaveStateV4=.*?\}","""function saveGame(){const state:SaveStateV5={v:5,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}""",'save game')

# Second worker participates in offline simulation but never mastery/discovery.
rep("  (Object.keys(workerGain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=workerGain.components[k]);","""  (Object.keys(workerGain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=workerGain.components[k]);
  const worker2Gain=simulateSecondWorker(packB,now,10);
  (Object.keys(worker2Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker2Gain.resources[k]);""",'offline second worker')
rep("if(completed.length||elapsed>=.1667||workerGain.weight>.01){","if(completed.length||elapsed>=.1667||workerGain.weight>.01||Object.values(worker2Gain.resources).some(v=>v>.01)){",'offline report condition')

# Z4 active-only industrial drops.
sub(r"(  const mid=rollMidComponent\(midgame,midgame.currentZone,t.classId,rng\);\n  if\(mid\)\{.*?\}\n)(\})",r"""\1  if(midgame.currentZone==='z4'){
    const alu=z4AluminiumYield(t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alu);
    if(take>0){aluminiumHaul+=take;cart+=take;texts.push({x:t.x+22,y:t.y-92,text:`+${take.toFixed(1)} алюминий`,color:'#d7dbe0',life:1.5})}
    const industrial=rollIndustrialComponent(packB,t.classId,rng);
    if(industrial){industrialHaul[industrial]++;gainXp(6,t);texts.push({x:t.x,y:t.y-124,text:`◆ ${industrialName(industrial)}!`,color:'#ffd18b',life:2.4,big:true});rareEl.innerHTML=`<small>ПРОМЫШЛЕННЫЙ КОМПОНЕНТ</small><b>◆ ${industrialName(industrial)}</b><em>Нужен для модулей Hangar / Truck</em>`;rareEl.className='rare show strong industrialRare';rareUntil=2.7;spawnSparks(t,'#ffc45d',30,true)}
  }
\2""",'z4 drops',re.S)

# Wide Swing secondary target.
rep("function nearest(){if(cart>=capacity()-.01)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}","""function nearest(){if(cart>=capacity()-.01)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}
function secondaryTarget(primary:SalvageTarget){if(!effects().wideSwingUnlocked)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive||t===primary)continue;const max=118+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}""",'secondary target')
sub(r"function combat\(dt:number\)\{.*?\}\nfunction updateDrops", """function combat(dt:number){selected=nearest();if(!selected)return;const before=selected.hp,e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,tool=toolPowerMultiplier(equipmentLevels.tool),dps=BASE_DPS*e.dpsMultiplier*tool*comboMult;const second=secondaryTarget(selected);selected.hp-=dps*dt;if(second)second.hp-=dps*.55*dt;if(Math.floor(before/30)!==Math.floor(selected.hp/30))spawnSparks(selected,'#f2cf7b',2);if(second&&second.hp<=0)breakTarget(second);if(selected.hp<=0){breakTarget(selected);selected=null}}
function updateDrops""",'wide swing combat',re.S)

# Transport HUD dynamically promotes to Truck.
sub(r"  fullEl.textContent=.*?\n  vanHud.hidden=.*?\n", """  const transportOwned=packB.truck.owned||midgame.van.owned,transportRemaining=packB.truck.owned?truckRemaining(packB):vanRemaining(midgame.van);
  fullEl.textContent=transportOwned&&transportRemaining>.01?`Тележка полна — разгрузи её в ${packB.truck.owned?'грузовик':'фургон'}`:'Тележка полна — пора возвращаться домой';fullEl.classList.toggle('show',cart>=capacity()-.01);
  vanHud.hidden=!transportOwned;if(transportOwned){const tw=packB.truck.owned?truckWeight(packB):vanWeight(midgame.van),tc=packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG;vanHud.classList.toggle('truckMode',packB.truck.owned);vanHud.firstElementChild!.textContent=packB.truck.owned?'🚚':'🚐';$('vanText').textContent=`${tw.toFixed(0)} / ${tc} кг`;$<HTMLElement>('vanFill').style.width=`${tw/tc*100}%`;$<HTMLButtonElement>('vanUnload').disabled=cart<=.01||transportRemaining<=.01;vanHud.classList.toggle('vanFull',transportRemaining<=.01)}
""",'transport hud',re.S)
rep("$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class=\"${comps[k]?'has':''}\">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('')+`<span class=\"${midHaul.pump?'has':''}\">P <b>${midHaul.pump}</b></span><span class=\"${midHaul.compressor?'has':''}\">C <b>${midHaul.compressor}</b></span>`;","$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class=\"${comps[k]?'has':''}\">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('')+`<span class=\"${midHaul.pump?'has':''}\">P <b>${midHaul.pump}</b></span><span class=\"${midHaul.compressor?'has':''}\">C <b>${midHaul.compressor}</b></span><span class=\"${aluminiumHaul?'has':''}\">Al <b>${aluminiumHaul.toFixed(1)}</b></span><span class=\"${industrialHaul.gearbox?'has':''}\">GB <b>${industrialHaul.gearbox}</b></span><span class=\"${industrialHaul.generator?'has':''}\">GEN <b>${industrialHaul.generator}</b></span>`;",'pack b hud resources')

# Garage actions and panels.
rep("function unloadCartToVan(){if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()}","""function unloadCartToVan(){
  if(packB.truck.owned){const box={value:aluminiumHaul},moved=transferCartToTruck(packB,haul,box);aluminiumHaul=box.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul;if(moved>0)showToast(`В грузовик: +${moved.toFixed(1)} кг`);saveGame();hud();return}
  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()
}""",'transport unload')

packb_funcs=r'''
function doRefineSteel(){const inv=currentPackBInventory(),made=refineSteel(packB,inv,4);applyPackBInventory(inv);if(made)showToast(`Стальные заготовки: +${made}`);saveGame();renderGarage()}
function doRefineAluminium(){const made=refineAluminium(packB,4);if(made)showToast(`Алюминиевые слитки: +${made}`);saveGame();renderGarage()}
function doFabricateModule(kind:FabricatedModuleKind){const inv=currentPackBInventory();if(fabricateModule(packB,kind,inv)){applyPackBInventory(inv);showToast(`Модуль изготовлен: ${kind}`);saveGame();renderGarage()}}
function doAcquireHangar(){const inv=currentPackBInventory();if(acquireHangar(packB,inv,zoneMastered(midgame,'z3'))){applyPackBInventory(inv);showToast('Ангар открыт: новая база и второй слот команды');saveGame();renderGarage()}}
function doAcquireTruck(){const inv=currentPackBInventory();if(acquireTruck(packB,inv,zoneMastered(midgame,'z4'))){applyPackBInventory(inv);showToast('Грузовик готов: 1000 кг полевого буфера');saveGame();renderGarage();hud()}}
function doHireSecondWorker(){if(!canHireSecondWorker(packB,zoneMastered(midgame,'z1'),cash))return;cash-=SECOND_WORKER_COST;hireSecondWorker(packB,Date.now());showToast('Второй рабочий нанят');saveGame();renderGarage()}
function doAssignSecondWorker(id:ZoneId){if(!assignSecondWorker(packB,id,zoneMastered(midgame,id),Date.now()))return;showToast(`Рабочий №2: ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}
function renderPackBPanels(){
  const inv=currentPackBInventory(),hangarReady=canAcquireHangar(packB,inv,zoneMastered(midgame,'z3')),truckReady=canAcquireTruck(packB,inv,zoneMastered(midgame,'z4'));
  $('transportPanel').innerHTML+=`<div class="milestoneCard ${packB.hangarOwned?'done':''}"><span class="packBTag">PACK B</span><h3>${packB.hangarOwned?'✓ Ангар':'🏭 Ангар'}</h3><div class="industrialStack"><div class="row"><span>Al scrap / billet</span><b>${packB.materials.aluminiumScrap.toFixed(1)} / ${packB.materials.aluminiumBillet}</b></div><div class="row"><span>Steel Blank</span><b>${packB.materials.steelBlank}</b></div><div class="row"><span>Modules D/C/S</span><b>${packB.modules.drive}/${packB.modules.control}/${packB.modules.structural}</b></div><div class="row"><span>Gearbox / Generator</span><b>${packB.industrial.gearbox}/${packB.industrial.generator}</b></div></div><div class="industrialActions"><button id="refineSteel" class="secondary">25 кг брикета → Steel</button><button id="refineAluminium" class="secondary">12 кг Al → Billet</button><button id="fabDrive" class="secondary" ${canFabricateModule(packB,'drive',inv)?'':'disabled'}>Drive Module</button><button id="fabControl" class="secondary" ${canFabricateModule(packB,'control',inv)?'':'disabled'}>Control Module</button><button id="fabStructural" class="secondary" ${canFabricateModule(packB,'structural',inv)?'':'disabled'}>Structural Frame</button></div>${packB.hangarOwned?'':`<p>Hangar: ${money(HANGAR_CASH)} · ${HANGAR_RECIPE.metal} кг metal · ${HANGAR_RECIPE.cleanCopper} clean Cu · ${HANGAR_RECIPE.steelBlank} Steel · ${HANGAR_RECIPE.aluminiumBillet} Al billet · ${HANGAR_RECIPE.structural} Structural · ${HANGAR_RECIPE.control} Control</p><button id="acquireHangar" ${hangarReady?'':'disabled'}>Открыть ангар</button>`}</div>`;
  if(packB.hangarOwned)$('transportPanel').innerHTML+=`<div class="milestoneCard ${packB.truck.owned?'done':''}"><h3>${packB.truck.owned?'✓ Грузовик':'🚚 Truck conversion'}</h3><p>${packB.truck.owned?`Полевой буфер ${TRUCK_CAPACITY_KG} кг. Фургон теперь может обслуживать старые маршруты.`:`${money(TRUCK_CASH)} · ${TRUCK_RECIPE.steelBlank} Steel · ${TRUCK_RECIPE.aluminiumBillet} Al · ${TRUCK_RECIPE.drive} Drive · ${TRUCK_RECIPE.control} Control · Gearbox + Generator`}</p>${packB.truck.owned?'':`<button id="acquireTruck" ${truckReady?'':'disabled'}>Собрать грузовик</button>`}</div>`;
  if(packB.hangarOwned){const secondReady=canHireSecondWorker(packB,zoneMastered(midgame,'z1'),cash);$('workerPanel').innerHTML+=`<div class="milestoneCard ${packB.secondWorker.hired?'done':''}"><h3>${packB.secondWorker.hired?'👷 Рабочий №2':'👷 Второй рабочий'}</h3>${!packB.secondWorker.hired?`<p>Найм ${money(SECOND_WORKER_COST)}. Ангар даёт второй crew slot.</p><button id="hireWorker2" ${secondReady?'':'disabled'}>Нанять</button>`:`<p>Маршрут: ${packB.secondWorker.assignment?ZONE_DEFS[packB.secondWorker.assignment].name:'не назначен'}</p><div class="crewRoute">${(['z1','z2','z3'] as ZoneId[]).map(id=>`<button data-worker2-zone="${id}" ${zoneMastered(midgame,id)?'':'disabled'}>${ZONE_DEFS[id].name}</button>`).join('')}</div>`}</div>`}
}
'''
rep("function renderGarage(){",packb_funcs+"\nfunction renderGarage(){",'pack b garage funcs')
rep("renderMidgamePanels();","renderMidgamePanels();renderPackBPanels();",'render pack b panels')

# Garage deposit + truck unloading.
sub(r"function garage\(\)\{if\(mode!=='field'\)return;.*?saveGame\(\)\}","""function garage(){if(mode!=='field')return;mode='garage';platform.setGameplayActive(false,'garage');for(const k of ['metal','copper','plastic'] as ResourceKind[]){storage[k]+=haul[k];haul[k]=0}for(const k of Object.keys(comps) as ComponentKind[]){storedComps[k]+=comps[k];comps[k]=0}for(const k of Object.keys(midHaul) as MidComponentKind[]){midgame.midComponents[k]+=midHaul[k];midHaul[k]=0}packB.materials.aluminiumScrap+=aluminiumHaul;aluminiumHaul=0;(Object.keys(industrialHaul) as IndustrialComponentKind[]).forEach(k=>{packB.industrial[k]+=industrialHaul[k];industrialHaul[k]=0});const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents),truck=unloadTruck(packB,storage);cart=0;$('tripSummary').textContent=`Последняя вылазка: ${telemetry.destroyed} целей · ${fmt((performance.now()-telemetry.start)/1000)}${truck.weight?` · truck ${truck.weight.toFixed(0)} кг`:vanKg?` · фургон ${vanKg.toFixed(0)} кг`:''}`;garageScreen.hidden=false;renderGarage();saveGame()}""",'garage deposit',re.S)

# Click handlers.
rep("else if(target.closest('#hireWorker'))hireWorker();else{","""else if(target.closest('#hireWorker'))hireWorker();
else if(target.closest('#refineSteel'))doRefineSteel();else if(target.closest('#refineAluminium'))doRefineAluminium();
else if(target.closest('#fabDrive'))doFabricateModule('drive');else if(target.closest('#fabControl'))doFabricateModule('control');else if(target.closest('#fabStructural'))doFabricateModule('structural');
else if(target.closest('#acquireHangar'))doAcquireHangar();else if(target.closest('#acquireTruck'))doAcquireTruck();else if(target.closest('#hireWorker2'))doHireSecondWorker();
else{const worker2Zone=target.closest<HTMLElement>('[data-worker2-zone]');if(worker2Zone){doAssignSecondWorker(worker2Zone.dataset.worker2Zone as ZoneId);return}""",'garage pack b clicks')

# Realtime worker2 supply.
rep("setInterval(()=>{const gain=simulateWorkerGain(midgame,Date.now(),8);if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k]);saveGame();if(mode==='garage')renderGarage()}},5000);","""setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8),gain2=simulateSecondWorker(packB,now,10);let changed=gain.weight>.001;if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k])}(Object.keys(gain2.resources) as ResourceKind[]).forEach(k=>{if(gain2.resources[k]>.001)changed=true;storage[k]+=gain2.resources[k]});if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);""",'worker2 interval')

# Render active Truck through existing field vehicle socket.
rep("vanOwned:midgame.van.owned,vanLoad:vanWeight(midgame.van),vanCapacity:VAN_CAPACITY_KG,workerHere:midgame.worker.assignment===fieldZone","vanOwned:midgame.van.owned||packB.truck.owned,vanLoad:packB.truck.owned?truckWeight(packB):vanWeight(midgame.van),vanCapacity:packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG,workerHere:midgame.worker.assignment===fieldZone||packB.secondWorker.assignment===fieldZone",'field transport render')

# Test surface.
rep("saveVersion:4,","saveVersion:5,",'test save version')
rep("midgame:normalizeMidgame(midgame)}),forceGarage","midgame:normalizeMidgame(midgame),packB:normalizePackB(packB)}),forceGarage",'test pack b state')
rep("buyVan,hireWorker,assignWorker,unloadCartToVan}});","buyVan,hireWorker,assignWorker,unloadCartToVan,doRefineSteel,doRefineAluminium,doFabricateModule,doAcquireHangar,doAcquireTruck,doHireSecondWorker,doAssignSecondWorker}});",'test pack b actions')

p.write_text(text,encoding='utf-8')
print('Content Pack B integration applied')
