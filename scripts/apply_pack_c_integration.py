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

if "import './content_pack_c.css';" in text:
    print('Pack C integration already applied')
    raise SystemExit(0)

rep("import './content_pack_b.css';","import './content_pack_b.css';\nimport './content_pack_c.css';",'css import')
rep("} from './content_pack_b.ts';","""} from './content_pack_b.ts';
import {
  SALVAGE_YARD_CASH,SALVAGE_YARD_RECIPE,THIRD_WORKER_COST,acquireSalvageYard,advancePackCProduction,alloyYield,
  assignThirdWorkerOperator,assignThirdWorkerScavenger,canAcquireSalvageYard,canHireThirdWorker,canStartPackCProduction,
  canUnlockPackCZone,createDefaultPackC,hireThirdWorker,normalizePackC,packCComponentName,productionDurationSec,productionProgress,
  rollPackCComponent,simulateThirdWorker,startPackCProduction,
  type HeavyIndustrialComponentKind,type PackCInventory,type PackCProductionKind,type PackCState,type PackCZoneId
} from './content_pack_c.ts';
import {packCTruckRemaining,packCTruckWeight,transferPackCAlloyToTruck,unloadPackCTruckAlloy} from './content_pack_c_transport.ts';""",'pack c imports')

sub(r"interface SaveStateV5\{.*?\n\}","""interface SaveStateV6{
  v:6;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;
  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;
  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;
}""",'save interface',re.S)
sub(r"const defaultSave=\(\):SaveStateV5=>.*?return defaultSave\(\);\n\}","""const defaultSave=():SaveStateV6=>({v:6,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:STARTING_CASH,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),midgame:createDefaultMidgame(),packB:createDefaultPackB(),packC:createDefaultPackC()});
function loadSave():SaveStateV6{
  try{
    const raw=initialSaveRead.raw,value=raw?JSON.parse(raw):null,base=defaultSave();
    if(value?.v===6)return {...base,...value,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC)};
    if(value?.v===5)return {...base,...value,v:6,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:createDefaultPackC()};
    if(value?.v===4)return {...base,...value,v:6,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:createDefaultPackB(),packC:createDefaultPackC()};
    if(value?.v===3){const components={...base.components,...value.components};return {...base,...value,v:6,storage:{...base.storage,...value.storage},components,processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC()};}
    if(value?.v===2){const components={...base.components,...value.components};return {...base,...value,v:6,equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},components,midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC()};}
  }catch{}
  return defaultSave();
}""",'save loader',re.S)
rep("let packB:PackBState=normalizePackB(loaded.packB);","let packB:PackBState=normalizePackB(loaded.packB);\nlet packC:PackCState=normalizePackC(loaded.packC);",'pack c state')
rep("let aluminiumHaul=0,industrialHaul:Record<IndustrialComponentKind,number>={gearbox:0,generator:0};","let aluminiumHaul=0,industrialHaul:Record<IndustrialComponentKind,number>={gearbox:0,generator:0};\nlet alloyHaul=0,packCIndustrialHaul:Record<HeavyIndustrialComponentKind,number>={industrialController:0,heavyHydraulicCylinder:0};",'pack c haul')

rep("function applyPackBInventory(inv:PackBInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.briquette=inv.briquette}","""function applyPackBInventory(inv:PackBInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.briquette=inv.briquette}
const currentPackCInventory=():PackCInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,steelBlank:packB.materials.steelBlank,structural:packB.modules.structural,control:packB.modules.control,hydraulic:storedComps.hydraulic,pump:midgame.midComponents.pump});
function applyPackCInventory(inv:PackCInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packB.modules.structural=inv.structural;packB.modules.control=inv.control;storedComps.hydraulic=inv.hydraulic;midgame.midComponents.pump=inv.pump}
function packCZoneGate(id:ZoneId){if(id!=='z5'&&id!=='z6')return zoneUnlock(midgame,id,zoneContext());return canUnlockPackCZone(id,{z4Mastered:zoneMastered(midgame,'z4'),z5Mastered:zoneMastered(midgame,'z5'),hangarOwned:packB.hangarOwned,truckOwned:packB.truck.owned,controllerDiscovered:packC.discoveredIndustrial.includes('industrialController')})}""",'pack c inventory/gate')
sub(r"function saveGame\(\)\{const state:SaveStateV5=.*?\}","""function saveGame(){const state:SaveStateV6={v:6,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}""",'save game')

# Pack C offline completion + third worker.
rep("  const workerGain=simulateWorkerGain(midgame,now,8);","  const packCCompleted=advancePackCProduction(packC,now);\n  const workerGain=simulateWorkerGain(midgame,now,8);",'offline production completion')
rep("  (Object.keys(worker2Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker2Gain.resources[k]);","""  (Object.keys(worker2Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker2Gain.resources[k]);
  const worker3Gain=simulateThirdWorker(packC,now,12);
  (Object.keys(worker3Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker3Gain.resources[k]);""",'offline third worker')
rep("if(completed.length||elapsed>=.1667||workerGain.weight>.01||Object.values(worker2Gain.resources).some(v=>v>.01)){","if(completed.length||packCCompleted||elapsed>=.1667||workerGain.weight>.01||Object.values(worker2Gain.resources).some(v=>v>.01)||Object.values(worker3Gain.resources).some(v=>v>.01)){",'offline report condition')

# Active Z5/Z6 material and first-discovery drops.
needle="""  if(midgame.currentZone==='z4'){
    const alu=z4AluminiumYield(t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alu);
    if(take>0){aluminiumHaul+=take;cart+=take;texts.push({x:t.x+22,y:t.y-92,text:`+${take.toFixed(1)} алюминий`,color:'#d7dbe0',life:1.5})}
    const industrial=rollIndustrialComponent(packB,t.classId,rng);
    if(industrial){industrialHaul[industrial]++;gainXp(6,t);texts.push({x:t.x,y:t.y-124,text:`◆ ${industrialName(industrial)}!`,color:'#ffd18b',life:2.4,big:true});rareEl.innerHTML=`<small>ПРОМЫШЛЕННЫЙ КОМПОНЕНТ</small><b>◆ ${industrialName(industrial)}</b><em>Нужен для модулей Hangar / Truck</em>`;rareEl.className='rare show strong industrialRare';rareUntil=2.7;spawnSparks(t,'#ffc45d',30,true)}
  }"""
insert=needle+"""
  if(midgame.currentZone==='z5'||midgame.currentZone==='z6'){
    const packZone=midgame.currentZone as PackCZoneId,alloy=alloyYield(packZone,t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);
    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} сплав`,color:'#86d7df',life:1.5})}
    const industrial=rollPackCComponent(packC,packZone,t.classId,rng);
    if(industrial){packCIndustrialHaul[industrial]++;gainXp(8,t);texts.push({x:t.x,y:t.y-132,text:`◆ ${packCComponentName(industrial)}!`,color:'#8ee8f0',life:2.5,big:true});rareEl.innerHTML=`<small>ТЯЖЁЛЫЙ КОМПОНЕНТ</small><b>◆ ${packCComponentName(industrial)}</b><em>Активное открытие промышленной цепочки Pack C</em>`;rareEl.className='rare show strong industrialRare packC';rareUntil=2.9;spawnSparks(t,'#70d9e5',34,true)}
  }"""
rep(needle,insert,'pack c active drops')

rep("function renderZoneScreen(){zoneGridEl.innerHTML=(Object.keys(ZONE_DEFS) as ZoneId[]).map(id=>{const def=ZONE_DEFS[id],gate=zoneUnlock(midgame,id,zoneContext()),mastered=zoneMastered(midgame,id),current=midgame.currentZone===id;", "function renderZoneScreen(){zoneGridEl.innerHTML=(Object.keys(ZONE_DEFS) as ZoneId[]).map(id=>{const def=ZONE_DEFS[id],gate=packCZoneGate(id),mastered=zoneMastered(midgame,id),current=midgame.currentZone===id;",'zone gate render')

# Truck now stores Pack C alloy as part of its same 1000kg mobile depot.
old_unload="""function unloadCartToVan(){
  if(packB.truck.owned){const box={value:aluminiumHaul},moved=transferCartToTruck(packB,haul,box);aluminiumHaul=box.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul;if(moved>0)showToast(`В грузовик: +${moved.toFixed(1)} кг`);saveGame();hud();return}
  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()
}"""
new_unload="""function unloadCartToVan(){
  if(packB.truck.owned){const box={value:aluminiumHaul},movedBase=transferCartToTruck(packB,haul,box);aluminiumHaul=box.value;const alloyBox={value:alloyHaul},movedAlloy=transferPackCAlloyToTruck(packC,truckWeight(packB),TRUCK_CAPACITY_KG,alloyBox);alloyHaul=alloyBox.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;const moved=movedBase+movedAlloy;if(moved>0)showToast(`В грузовик: +${moved.toFixed(1)} кг`);saveGame();hud();return}
  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()
}"""
rep(old_unload,new_unload,'truck alloy unload')

# HUD must include Pack C alloy in Truck capacity.
rep("transportRemaining=packB.truck.owned?truckRemaining(packB):vanRemaining(midgame.van);","transportRemaining=packB.truck.owned?packCTruckRemaining(packC,truckWeight(packB),TRUCK_CAPACITY_KG):vanRemaining(midgame.van);",'truck remaining hud')
rep("const tw=packB.truck.owned?truckWeight(packB):vanWeight(midgame.van),tc=packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG;","const tw=packB.truck.owned?packCTruckWeight(packC,truckWeight(packB)):vanWeight(midgame.van),tc=packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG;",'truck weight hud')

packc_funcs=r'''
function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);showToast(`${kind} поставлен в промышленную ячейку · ${fmtLong(productionDurationSec(packC,kind))}`);saveGame();renderGarage()}}
function doAcquireSalvageYard(){const inv=currentPackCInventory();if(acquireSalvageYard(packC,inv,zoneMastered(midgame,'z6'))){applyPackCInventory(inv);showToast('Salvage Yard открыт: третий слот команды и тяжёлая ячейка');saveGame();renderGarage()}}
function doHireThirdWorker(){if(!canHireThirdWorker(packC,cash))return;cash-=THIRD_WORKER_COST;if(hireThirdWorker(packC,Date.now())){showToast('Третий рабочий нанят');saveGame();renderGarage()}}
function doAssignThirdWorker(id:ZoneId){if(!assignThirdWorkerScavenger(packC,id,zoneMastered(midgame,id),Date.now()))return;showToast(`Рабочий №3 → ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}
function doAssignOperator(){if(!assignThirdWorkerOperator(packC,Date.now()))return;showToast('Рабочий №3 → Operator: цикл промышленной ячейки ×0.75');saveGame();renderGarage()}
function renderPackCPanels(){
  if(!packB.truck.owned)return;
  const inv=currentPackCInventory(),yardReady=canAcquireSalvageYard(packC,inv,zoneMastered(midgame,'z6')),job=packC.production;
  $('transportPanel').innerHTML+=`<div class="milestoneCard packCCard ${packC.salvageYardOwned?'yardDone':''}"><span class="packCTag">PACK C</span><h3>${packC.salvageYardOwned?'✓ Salvage Yard':'🏗 Salvage Yard'}</h3><div class="packCGrid"><span>Alloy scrap / billet <b>${packC.materials.alloyScrap.toFixed(1)} / ${packC.materials.alloyBillet.toFixed(1)}</b></span><span>Controller / Cylinder <b>${packC.industrial.industrialController}/${packC.industrial.heavyHydraulicCylinder}</b></span><span>Hydraulic Power <b>${packC.modules.hydraulicPower}</b></span><span>Heavy Frame <b>${packC.modules.heavyFrame}</b></span></div><div class="packCActions"><button id="packCAlloy" class="secondary" ${canStartPackCProduction(packC,'alloyBillet',inv)?'':'disabled'}>Alloy Billet</button><button id="packCHydraulic" class="secondary" ${canStartPackCProduction(packC,'hydraulicPower',inv)?'':'disabled'}>Hydraulic Power</button><button id="packCFrame" class="secondary" ${canStartPackCProduction(packC,'heavyFrame',inv)?'':'disabled'}>Heavy Frame</button></div>${job?`<div class="packCQueue"><b>⏱ ${job.kind}</b><span>${fmtLong(Math.max(0,(job.endsAt-Date.now())/1000))}</span><i><em style="width:${productionProgress(packC,Date.now())*100}%"></em></i><small>${packC.crew3.role==='operator'?'Operator ×0.75':'Базовый цикл'}</small></div>`:''}${packC.salvageYardOwned?'':`<p>Yard: ${money(SALVAGE_YARD_CASH)} · ${SALVAGE_YARD_RECIPE.metal} metal · ${SALVAGE_YARD_RECIPE.cleanCopper} clean Cu · ${SALVAGE_YARD_RECIPE.steelBlank} Steel · ${SALVAGE_YARD_RECIPE.alloyBillet} Alloy · ${SALVAGE_YARD_RECIPE.hydraulicPower} Hydraulic · ${SALVAGE_YARD_RECIPE.heavyFrame} Heavy Frame · ${SALVAGE_YARD_RECIPE.control} Control</p><button id="acquireSalvageYard" ${yardReady?'':'disabled'}>Развернуть Salvage Yard</button>`}</div>`;
  if(packC.salvageYardOwned){const hireReady=canHireThirdWorker(packC,cash);$('workerPanel').innerHTML+=`<div class="milestoneCard packCCard ${packC.crew3.hired?'done':''}"><h3>${packC.crew3.hired?'👷 Рабочий №3':'👷 Третий рабочий'}</h3>${!packC.crew3.hired?`<p>${money(THIRD_WORKER_COST)} · новый слот Salvage Yard.</p><button id="hireWorker3" ${hireReady?'':'disabled'}>Нанять</button>`:`<p>Роль: <b>${packC.crew3.role==='operator'?'Operator':packC.crew3.assignment?`Scavenger · ${ZONE_DEFS[packC.crew3.assignment].name}`:'Scavenger · без маршрута'}</b></p><div class="crewRole"><button id="assignOperator" class="${packC.crew3.role==='operator'?'active':''}">Operator ×0.75</button>${(['z1','z2','z3','z4','z5','z6'] as ZoneId[]).map(id=>`<button data-worker3-zone="${id}" ${zoneMastered(midgame,id)?'':'disabled'}>${ZONE_DEFS[id].name}</button>`).join('')}</div>`}</div>`}
}
'''
rep("function renderGarage(){",packc_funcs+"\nfunction renderGarage(){",'pack c functions')
rep("renderMidgamePanels();renderPackBPanels();","renderMidgamePanels();renderPackBPanels();renderPackCPanels();",'render pack c')

# Garage commits field Pack C haul and Truck Pack C alloy.
old_garage="packB.materials.aluminiumScrap+=aluminiumHaul;aluminiumHaul=0;(Object.keys(industrialHaul) as IndustrialComponentKind[]).forEach(k=>{packB.industrial[k]+=industrialHaul[k];industrialHaul[k]=0});const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents),truck=unloadTruck(packB,storage);cart=0;"
new_garage="packB.materials.aluminiumScrap+=aluminiumHaul;aluminiumHaul=0;(Object.keys(industrialHaul) as IndustrialComponentKind[]).forEach(k=>{packB.industrial[k]+=industrialHaul[k];industrialHaul[k]=0});packC.materials.alloyScrap+=alloyHaul;alloyHaul=0;(Object.keys(packCIndustrialHaul) as HeavyIndustrialComponentKind[]).forEach(k=>{packC.industrial[k]+=packCIndustrialHaul[k];packCIndustrialHaul[k]=0});const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents),truck=unloadTruck(packB,storage);packC.materials.alloyScrap+=unloadPackCTruckAlloy(packC);cart=0;"
rep(old_garage,new_garage,'garage pack c deposit')

# Garage click actions.
rep("else if(target.closest('#acquireHangar'))doAcquireHangar();else if(target.closest('#acquireTruck'))doAcquireTruck();else if(target.closest('#hireWorker2'))doHireSecondWorker();","else if(target.closest('#acquireHangar'))doAcquireHangar();else if(target.closest('#acquireTruck'))doAcquireTruck();else if(target.closest('#hireWorker2'))doHireSecondWorker();else if(target.closest('#packCAlloy'))doStartPackCProduction('alloyBillet');else if(target.closest('#packCHydraulic'))doStartPackCProduction('hydraulicPower');else if(target.closest('#packCFrame'))doStartPackCProduction('heavyFrame');else if(target.closest('#acquireSalvageYard'))doAcquireSalvageYard();else if(target.closest('#hireWorker3'))doHireThirdWorker();else if(target.closest('#assignOperator'))doAssignOperator();",'pack c garage actions')
rep("else{const worker2Zone=target.closest<HTMLElement>('[data-worker2-zone]');if(worker2Zone){doAssignSecondWorker(worker2Zone.dataset.worker2Zone as ZoneId);return}const workerZone=target.closest<HTMLElement>('[data-worker-zone]');if(workerZone)assignWorker(workerZone.dataset.workerZone as ZoneId)}});","else{const worker3Zone=target.closest<HTMLElement>('[data-worker3-zone]');if(worker3Zone){doAssignThirdWorker(worker3Zone.dataset.worker3Zone as ZoneId);return}const worker2Zone=target.closest<HTMLElement>('[data-worker2-zone]');if(worker2Zone){doAssignSecondWorker(worker2Zone.dataset.worker2Zone as ZoneId);return}const workerZone=target.closest<HTMLElement>('[data-worker-zone]');if(workerZone)assignWorker(workerZone.dataset.workerZone as ZoneId)}});",'worker3 action')
rep("if(!zoneUnlock(midgame,id,zoneContext()).ok)return;midgame.currentZone=id;","if(!packCZoneGate(id).ok)return;midgame.currentZone=id;",'zone click gate')

# Production/worker ticking.
rep("setInterval(()=>{const completed=advanceWorkshop(Date.now(),mode==='garage');if(mode==='garage'&&(completed.length||performance.now()-lastGarageRender>1000))renderGarage()},1000);","setInterval(()=>{const now=Date.now(),completed=advanceWorkshop(now,mode==='garage'),packDone=advancePackCProduction(packC,now);if(packDone){showToast(`Промышленная ячейка завершила: ${packDone}`);saveGame()}if(mode==='garage'&&(completed.length||packDone||performance.now()-lastGarageRender>1000))renderGarage()},1000);",'pack c production tick')
sub(r"setInterval\(\(\)=>\{const now=Date\.now\(\),gain=simulateWorkerGain\(midgame,now,8\),gain2=simulateSecondWorker\(packB,now,10\);.*?\},5000\);", """setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8),gain2=simulateSecondWorker(packB,now,10),gain3=simulateThirdWorker(packC,now,12);let changed=gain.weight>.001;if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k])}(Object.keys(gain2.resources) as ResourceKind[]).forEach(k=>{if(gain2.resources[k]>.001)changed=true;storage[k]+=gain2.resources[k]});(Object.keys(gain3.resources) as ResourceKind[]).forEach(k=>{if(gain3.resources[k]>.001)changed=true;storage[k]+=gain3.resources[k]});if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);""",'worker tick',re.S)

# Global test surface and scripted selectZone follow the same Pack C gate.
text=text.replace("saveVersion:5","saveVersion:6")
rep("packB:normalizePackB(packB)}),forceGarage","packB:normalizePackB(packB),packC:normalizePackC(packC)}),forceGarage",'test pack c state')
rep("selectZone:(id:ZoneId)=>{if(zoneUnlock(midgame,id,zoneContext()).ok){midgame.currentZone=id;saveGame()}}","selectZone:(id:ZoneId)=>{if(packCZoneGate(id).ok){midgame.currentZone=id;saveGame()}}",'test zone gate')
rep("doAcquireTruck,doHireSecondWorker,doAssignSecondWorker}});","doAcquireTruck,doHireSecondWorker,doAssignSecondWorker,doStartPackCProduction,doAcquireSalvageYard,doHireThirdWorker,doAssignThirdWorker,doAssignOperator}});",'test pack c actions')

p.write_text(text,encoding='utf-8')
print('Pack C runtime integration applied')
