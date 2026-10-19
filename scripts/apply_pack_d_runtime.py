#!/usr/bin/env python3
from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'anchor not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


def sub_once(path: str, pattern: str, repl: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'pattern matched {count} times in {path}: {pattern[:120]!r}')
    p.write_text(out, encoding='utf-8')

# ---------------------------------------------------------------------------
# Pack D domain: Recovery Rig is the next complete bulk depot, including both
# aluminium and alloy scrap, so old zones still unload correctly after upgrade.
# ---------------------------------------------------------------------------
replace_once('src/content_pack_d.ts',
"""export interface RecoveryRigState{\n  owned:boolean;\n  resources:Record<ResourceKind,number>;\n  alloyScrap:number;\n}""",
"""export interface RecoveryRigState{\n  owned:boolean;\n  resources:Record<ResourceKind,number>;\n  aluminiumScrap:number;\n  alloyScrap:number;\n}""")
replace_once('src/content_pack_d.ts',
"recoveryRig:{owned:false,resources:emptyResources(),alloyScrap:0},",
"recoveryRig:{owned:false,resources:emptyResources(),aluminiumScrap:0,alloyScrap:0},")
replace_once('src/content_pack_d.ts',
"const r=state.recoveryRig.resources;return r.metal+r.copper+r.plastic+state.recoveryRig.alloyScrap;",
"const r=state.recoveryRig.resources;return r.metal+r.copper+r.plastic+state.recoveryRig.aluminiumScrap+state.recoveryRig.alloyScrap;")
sub_once('src/content_pack_d.ts',
r"export function transferToRecoveryRig\(state:PackDState,haul:Record<ResourceKind,number>,alloy:\{value:number\}\):number\{.*?\n\}",
"""export function transferToRecoveryRig(state:PackDState,haul:Record<ResourceKind,number>,aluminium:{value:number},alloy:{value:number}):number{\n  if(!state.recoveryRig.owned)return 0;\n  const remaining=recoveryRigRemaining(state),bulk=haul.metal+haul.copper+haul.plastic+Math.max(0,aluminium.value)+Math.max(0,alloy.value);\n  if(remaining<=0||bulk<=0)return 0;\n  const factor=Math.min(1,remaining/bulk);let moved=0;\n  (Object.keys(haul) as ResourceKind[]).forEach(k=>{const amount=haul[k]*factor;haul[k]-=amount;state.recoveryRig.resources[k]+=amount;moved+=amount});\n  const aluminiumMoved=aluminium.value*factor;aluminium.value-=aluminiumMoved;state.recoveryRig.aluminiumScrap+=aluminiumMoved;moved+=aluminiumMoved;\n  const alloyMoved=alloy.value*factor;alloy.value-=alloyMoved;state.recoveryRig.alloyScrap+=alloyMoved;moved+=alloyMoved;\n  return moved;\n}""")
sub_once('src/content_pack_d.ts',
r"export function unloadRecoveryRig\(state:PackDState,storage:Record<ResourceKind,number>\):\{weight:number;alloyScrap:number\}\{.*?\n\}",
"""export function unloadRecoveryRig(state:PackDState,storage:Record<ResourceKind,number>):{weight:number;aluminiumScrap:number;alloyScrap:number}{\n  const weight=recoveryRigWeight(state),aluminiumScrap=state.recoveryRig.aluminiumScrap,alloyScrap=state.recoveryRig.alloyScrap;\n  (Object.keys(state.recoveryRig.resources) as ResourceKind[]).forEach(k=>{storage[k]+=state.recoveryRig.resources[k];state.recoveryRig.resources[k]=0});\n  state.recoveryRig.aluminiumScrap=0;state.recoveryRig.alloyScrap=0;return{weight,aluminiumScrap,alloyScrap};\n}""")

# Domain smoke adapts to full bulk transport.
replace_once('scripts/content-pack-d-smoke.ts',
"const moved=transferToRecoveryRig(state,haul,alloy);",
"const aluminium={value:40};const moved=transferToRecoveryRig(state,haul,aluminium,alloy);")
replace_once('scripts/content-pack-d-smoke.ts',
"assert.ok(moved>0&&recoveryRigWeight(state)<=RECOVERY_RIG_CAPACITY_KG+1e-9);",
"assert.ok(moved>0&&recoveryRigWeight(state)<=RECOVERY_RIG_CAPACITY_KG+1e-9);assert.ok(state.recoveryRig.aluminiumScrap>0);")

# ---------------------------------------------------------------------------
# Shared zone model: Z7 is a first-class ZoneId so map/mastery/save/rendering all
# speak the same language.
# ---------------------------------------------------------------------------
replace_once('src/midgame.ts',
"import { PACK_C_ZONE_PROFILES } from './content_pack_c.ts';",
"import { PACK_C_ZONE_PROFILES } from './content_pack_c.ts';\nimport { PACK_D_ZONE_PROFILE } from './content_pack_d.ts';")
replace_once('src/midgame.ts',
"export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6';",
"export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7';")
replace_once('src/midgame.ts',
"""  z6:{\n    id:'z6',order:6,name:PACK_C_ZONE_PROFILES.z6.name,subtitle:'Зона 6',description:PACK_C_ZONE_PROFILES.z6.description,\n    nodeWeights:PACK_C_ZONE_PROFILES.z6.nodeWeights,hpMultiplier:PACK_C_ZONE_PROFILES.z6.hpMultiplier,yieldMultiplier:PACK_C_ZONE_PROFILES.z6.yieldMultiplier,masteryTarget:PACK_C_ZONE_PROFILES.z6.masteryTarget,recommendedTool:6\n  }\n};""",
"""  z6:{\n    id:'z6',order:6,name:PACK_C_ZONE_PROFILES.z6.name,subtitle:'Зона 6',description:PACK_C_ZONE_PROFILES.z6.description,\n    nodeWeights:PACK_C_ZONE_PROFILES.z6.nodeWeights,hpMultiplier:PACK_C_ZONE_PROFILES.z6.hpMultiplier,yieldMultiplier:PACK_C_ZONE_PROFILES.z6.yieldMultiplier,masteryTarget:PACK_C_ZONE_PROFILES.z6.masteryTarget,recommendedTool:6\n  },\n  z7:{\n    id:'z7',order:7,name:PACK_D_ZONE_PROFILE.name,subtitle:'Зона 7',description:PACK_D_ZONE_PROFILE.description,\n    nodeWeights:PACK_D_ZONE_PROFILE.nodeWeights,hpMultiplier:PACK_D_ZONE_PROFILE.hpMultiplier,yieldMultiplier:PACK_D_ZONE_PROFILE.yieldMultiplier,masteryTarget:PACK_D_ZONE_PROFILE.masteryTarget,recommendedTool:7\n  }\n};""")
replace_once('src/midgame.ts',
"currentZone:'z1',mastery:{z1:0,z2:0,z3:0,z4:0,z5:0,z6:0},",
"currentZone:'z1',mastery:{z1:0,z2:0,z3:0,z4:0,z5:0,z6:0,z7:0},")
replace_once('src/midgame.ts',
"""  if(ctx.level<12)return{ok:false,reason:'Нужен уровень 12'};\n  if(!zoneMastered(state,'z5'))return{ok:false,reason:'Освой Промышленную зону на 100%'};\n  return{ok:true};""",
"""  if(id==='z6'){\n    if(ctx.level<12)return{ok:false,reason:'Нужен уровень 12'};\n    if(!zoneMastered(state,'z5'))return{ok:false,reason:'Освой Промышленную зону на 100%'};\n    return{ok:true};\n  }\n  if(ctx.level<14)return{ok:false,reason:'Нужен уровень 14'};\n  if(!zoneMastered(state,'z6'))return{ok:false,reason:'Освой Заброшенный завод на 100%'};\n  return{ok:true};""")
replace_once('src/midgame.ts',
"z5:{metal:148,copper:12,plastic:8},\n  z6:{metal:164,copper:13,plastic:6}",
"z5:{metal:148,copper:12,plastic:8},\n  z6:{metal:164,copper:13,plastic:6},\n  z7:{metal:188,copper:14,plastic:5}")

# Recognizable Z7 sources; reuse proven visual primitives instead of adding an
# asset dependency inside this content pack.
replace_once('src/zone_content.ts',
"""  z6:{\n    small_scrap:[v('Обломки станочной станины','frame','metal','alloy'),v('Защитные панели пресса','sheet','metal','alloy'),v('Крепёж гидролинии','cans','metal'),v('Трубопровод цеха','pipes','metal')],\n    cable:[v('Магистральный силовой кабель','coil','copper'),v('Жгут станка ЧПУ','loom','copper','controller'),v('Проводка гидропресса','loom','copper'),v('Обмотка промышленного мотора','coil','copper')],\n    small_appliance:[v('Панель управления станка','tool','controller'),v('Маслонасос','pump','pump'),v('Привод подачи','small_motor','motor'),v('Блок автоматики','tool','electronics','controller')],\n    bike_fan:[v('Подшипниковая опора','frame','bearing'),v('Цеховой вентилятор','fan','bearing','motor'),v('Роликовая каретка','cart','bearing'),v('Муфта привода','frame','bearing')],\n    medium_appliance:[v('Гидравлический агрегат','pump','hydraulic','heavy_hydraulic'),v('Станочный привод','generator','motor','alloy'),v('Шкаф ЧПУ','generator','controller','electronics'),v('Промышленный компрессор','compressor','compressor','alloy')],\n    large_appliance:[v('Секция гидропресса','frame','heavy_hydraulic','alloy'),v('Токарный станок','generator','controller','alloy'),v('Фрезерный станок','generator','controller','alloy'),v('Гидростанция линии','pump','heavy_hydraulic','pump','alloy')]\n  }\n};""",
"""  z6:{\n    small_scrap:[v('Обломки станочной станины','frame','metal','alloy'),v('Защитные панели пресса','sheet','metal','alloy'),v('Крепёж гидролинии','cans','metal'),v('Трубопровод цеха','pipes','metal')],\n    cable:[v('Магистральный силовой кабель','coil','copper'),v('Жгут станка ЧПУ','loom','copper','controller'),v('Проводка гидропресса','loom','copper'),v('Обмотка промышленного мотора','coil','copper')],\n    small_appliance:[v('Панель управления станка','tool','controller'),v('Маслонасос','pump','pump'),v('Привод подачи','small_motor','motor'),v('Блок автоматики','tool','electronics','controller')],\n    bike_fan:[v('Подшипниковая опора','frame','bearing'),v('Цеховой вентилятор','fan','bearing','motor'),v('Роликовая каретка','cart','bearing'),v('Муфта привода','frame','bearing')],\n    medium_appliance:[v('Гидравлический агрегат','pump','hydraulic','heavy_hydraulic'),v('Станочный привод','generator','motor','alloy'),v('Шкаф ЧПУ','generator','controller','electronics'),v('Промышленный компрессор','compressor','compressor','alloy')],\n    large_appliance:[v('Секция гидропресса','frame','heavy_hydraulic','alloy'),v('Токарный станок','generator','controller','alloy'),v('Фрезерный станок','generator','controller','alloy'),v('Гидростанция линии','pump','heavy_hydraulic','pump','alloy')]\n  },\n  z7:{\n    small_scrap:[v('Листы стрелы погрузчика','sheet','metal','alloy'),v('Крепёж тяжёлой рамы','cans','metal'),v('Секции противовеса','frame','metal','alloy'),v('Гидролинии спецтехники','pipes','metal')],\n    cable:[v('Коса силового блока','loom','copper','controller'),v('Кабель тягового привода','coil','copper'),v('Жгут погрузчика','loom','copper','controller'),v('Силовая шина генератора','coil','copper','generator')],\n    small_appliance:[v('Контроллер погрузчика','tool','controller'),v('Насос рулевого контура','pump','pump','hydraulic'),v('Привод навесного','small_motor','motor'),v('Блок силовой автоматики','generator','electronics','controller')],\n    bike_fan:[v('Ступичный узел погрузчика','frame','bearing'),v('Вентилятор силового блока','fan','bearing','motor'),v('Каретка мачты','cart','bearing'),v('Приводной кардан','frame','gearbox','bearing')],\n    medium_appliance:[v('Гидроблок погрузчика','pump','heavy_hydraulic','recovery'),v('Тяговый привод','generator','gearbox','alloy'),v('Генераторная установка','generator','generator','controller'),v('Редуктор мачты','frame','gearbox','recovery')],\n    large_appliance:[v('Мачта вилочного погрузчика','frame','heavy_hydraulic','recovery','alloy'),v('Силовой модуль экскаватора','generator','gearbox','generator','recovery'),v('Гидростанция спецтехники','pump','heavy_hydraulic','controller','recovery'),v('Тяжёлый приводной мост','frame','gearbox','heavy_hydraulic','recovery')]\n  }\n};""")
replace_once('src/zone_content.ts',
"for(const zone of ['z1','z2','z3','z4','z5','z6'] as ZoneId[])",
"for(const zone of ['z1','z2','z3','z4','z5','z6','z7'] as ZoneId[])")
replace_once('src/zone_content.ts',
"if(sourceObjects('z6','alloy').length<3)errors.push('z6:alloy-sources');",
"if(sourceObjects('z6','alloy').length<3)errors.push('z6:alloy-sources');\n  if(sourceObjects('z7','recovery').length<4)errors.push('z7:recovery-sources');\n  if(sourceObjects('z7','alloy').length<2)errors.push('z7:alloy-sources');")

# ---------------------------------------------------------------------------
# Runtime + Save V7.
# ---------------------------------------------------------------------------
replace_once('src/main.ts', "import './content_pack_c.css';", "import './content_pack_c.css';\nimport './content_pack_d.css';")
replace_once('src/main.ts',
"import {packCTruckRemaining,packCTruckWeight,transferPackCAlloyToTruck,unloadPackCTruckAlloy} from './content_pack_c_transport.ts';",
"""import {packCTruckRemaining,packCTruckWeight,transferPackCAlloyToTruck,unloadPackCTruckAlloy} from './content_pack_c_transport.ts';\nimport {\n  FOURTH_WORKER_COST,INDUSTRIAL_WORKSHOP_CASH,INDUSTRIAL_WORKSHOP_RECIPE,RECOVERY_RIG_CAPACITY_KG,RECOVERY_RIG_CASH,RECOVERY_RIG_RECIPE,\n  acquireIndustrialWorkshop,acquireRecoveryRig,assignFourthWorkerOperator,assignFourthWorkerScavenger,canAcquireIndustrialWorkshop,canAcquireRecoveryRig,canHireFourthWorker,canUnlockZ7,\n  createDefaultPackD,hireFourthWorker,normalizePackD,recoveryRigRemaining,recoveryRigWeight,rollRecoveryAssembly,simulateFourthWorker,transferToRecoveryRig,unloadRecoveryRig,z7AlloyYield,\n  type PackDInventory,type PackDState\n} from './content_pack_d.ts';""")
replace_once('src/main.ts',
"""interface SaveStateV6{\n  v:6;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;\n  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;\n  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;\n}""",
"""interface SaveStateV7{\n  v:7;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;\n  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;\n  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;\n}""")
sub_once('src/main.ts',
r"const defaultSave=\(\):SaveStateV6=>.*?\nconst loaded=loadSave\(\),loadedLastSeen=loaded\.lastSeen;",
"""const defaultSave=():SaveStateV7=>({v:7,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:STARTING_CASH,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),midgame:createDefaultMidgame(),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()});\nfunction loadSave():SaveStateV7{\n  try{\n    const raw=initialSaveRead.raw,value=raw?JSON.parse(raw):null,base=defaultSave();\n    if(value?.v===7)return {...base,...value,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:normalizePackD(value.packD)};\n    if(value?.v===6)return {...base,...value,v:7,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:createDefaultPackD()};\n    if(value?.v===5)return {...base,...value,v:7,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:createDefaultPackC(),packD:createDefaultPackD()};\n    if(value?.v===4)return {...base,...value,v:7,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};\n    if(value?.v===3){const components={...base.components,...value.components};return {...base,...value,v:7,storage:{...base.storage,...value.storage},components,processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},contract:{...base.contract,...value.contract},midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};}\n    if(value?.v===2){const components={...base.components,...value.components};return {...base,...value,v:7,equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},components,midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};}\n  }catch{}\n  return defaultSave();\n}\nconst loaded=loadSave(),loadedLastSeen=loaded.lastSeen;""")
replace_once('src/main.ts',
"let packC:PackCState=normalizePackC(loaded.packC);",
"let packC:PackCState=normalizePackC(loaded.packC);\nlet packD:PackDState=normalizePackD(loaded.packD);")
replace_once('src/main.ts',
"""function applyPackCInventory(inv:PackCInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packB.modules.structural=inv.structural;packB.modules.control=inv.control;storedComps.hydraulic=inv.hydraulic;midgame.midComponents.pump=inv.pump}\nfunction packCZoneGate(id:ZoneId){if(id!=='z5'&&id!=='z6')return zoneUnlock(midgame,id,zoneContext());return canUnlockPackCZone(id,{z4Mastered:zoneMastered(midgame,'z4'),z5Mastered:zoneMastered(midgame,'z5'),hangarOwned:packB.hangarOwned,truckOwned:packB.truck.owned,controllerDiscovered:packC.discoveredIndustrial.includes('industrialController')})}\nconst freeWorkshopSlots=()=>Math.max(0,effects().workshopSlots-jobs.length);""",
"""function applyPackCInventory(inv:PackCInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packB.modules.structural=inv.structural;packB.modules.control=inv.control;storedComps.hydraulic=inv.hydraulic;midgame.midComponents.pump=inv.pump}\nconst currentPackDInventory=():PackDInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,steelBlank:packB.materials.steelBlank,alloyBillet:packC.materials.alloyBillet,drive:packB.modules.drive,control:packB.modules.control,hydraulicPower:packC.modules.hydraulicPower,heavyFrame:packC.modules.heavyFrame,gearbox:packB.industrial.gearbox,generator:packB.industrial.generator,industrialController:packC.industrial.industrialController,heavyHydraulicCylinder:packC.industrial.heavyHydraulicCylinder});\nfunction applyPackDInventory(inv:PackDInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packB.industrial.gearbox=inv.gearbox;packB.industrial.generator=inv.generator;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}\nfunction zoneGate(id:ZoneId){if(id==='z7')return canUnlockZ7({z6Mastered:zoneMastered(midgame,'z6'),salvageYardOwned:packC.salvageYardOwned,truckOwned:packB.truck.owned});if(id==='z5'||id==='z6')return canUnlockPackCZone(id,{z4Mastered:zoneMastered(midgame,'z4'),z5Mastered:zoneMastered(midgame,'z5'),hangarOwned:packB.hangarOwned,truckOwned:packB.truck.owned,controllerDiscovered:packC.discoveredIndustrial.includes('industrialController')});return zoneUnlock(midgame,id,zoneContext())}\nconst workshopSlots=()=>effects().workshopSlots+(packD.industrialWorkshopOwned?1:0);\nconst freeWorkshopSlots=()=>Math.max(0,workshopSlots()-jobs.length);""")
replace_once('src/main.ts',
"function saveGame(){const state:SaveStateV6={v:6,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}",
"function saveGame(){const state:SaveStateV7={v:7,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}")
replace_once('src/main.ts',
"const worker3Gain=simulateThirdWorker(packC,now,12);\n  (Object.keys(worker3Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker3Gain.resources[k]);",
"const worker3Gain=simulateThirdWorker(packC,now,12);\n  (Object.keys(worker3Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker3Gain.resources[k]);\n  const worker4Gain=simulateFourthWorker(packD,now,18);\n  (Object.keys(worker4Gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=worker4Gain.resources[k]);")
replace_once('src/main.ts',
"Object.values(worker3Gain.resources).some(v=>v>.01))",
"Object.values(worker3Gain.resources).some(v=>v>.01)||Object.values(worker4Gain.resources).some(v=>v>.01))")

# Z7 active frontier loot.
replace_once('src/main.ts',
"""  if(midgame.currentZone==='z5'||midgame.currentZone==='z6'){\n    const packZone=midgame.currentZone as PackCZoneId,alloy=alloyYield(packZone,t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);\n    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} сплав`,color:'#86d7df',life:1.5})}\n    const industrial=rollPackCComponent(packC,packZone,t.classId,rng);\n    if(industrial){packCIndustrialHaul[industrial]++;gainXp(8,t);texts.push({x:t.x,y:t.y-132,text:`◆ ${packCComponentName(industrial)}!`,color:'#8ee8f0',life:2.5,big:true});rareEl.innerHTML=`<small>ТЯЖЁЛЫЙ КОМПОНЕНТ</small><b>◆ ${packCComponentName(industrial)}</b><em>Активное открытие промышленной цепочки Pack C</em>`;rareEl.className='rare show strong industrialRare packC';rareUntil=2.9;spawnSparks(t,'#70d9e5',34,true)}\n  }\n}""",
"""  if(midgame.currentZone==='z5'||midgame.currentZone==='z6'){\n    const packZone=midgame.currentZone as PackCZoneId,alloy=alloyYield(packZone,t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);\n    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} сплав`,color:'#86d7df',life:1.5})}\n    const industrial=rollPackCComponent(packC,packZone,t.classId,rng);\n    if(industrial){packCIndustrialHaul[industrial]++;gainXp(8,t);texts.push({x:t.x,y:t.y-132,text:`◆ ${packCComponentName(industrial)}!`,color:'#8ee8f0',life:2.5,big:true});rareEl.innerHTML=`<small>ТЯЖЁЛЫЙ КОМПОНЕНТ</small><b>◆ ${packCComponentName(industrial)}</b><em>Активное открытие промышленной цепочки Pack C</em>`;rareEl.className='rare show strong industrialRare packC';rareUntil=2.9;spawnSparks(t,'#70d9e5',34,true)}\n  }\n  if(midgame.currentZone==='z7'){\n    const alloy=z7AlloyYield(t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);\n    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} тяжёлый сплав`,color:'#e2b477',life:1.5})}\n    if(rollRecoveryAssembly(packD,t.classId,rng)){gainXp(12,t);texts.push({x:t.x,y:t.y-136,text:'◆ Recovery Assembly!',color:'#ffd08a',life:2.8,big:true});rareEl.innerHTML='<small>ТЯЖЁЛОЕ ВОССТАНОВЛЕНИЕ</small><b>◆ Recovery Assembly</b><em>Ключевая сборка для Recovery Rig</em>';rareEl.className='rare show strong industrialRare packD';rareUntil=3.1;spawnSparks(t,'#e4a55e',38,true)}\n  }\n}""")

# Transport hierarchy: Recovery Rig supersedes truck as active depot once owned.
replace_once('src/main.ts',
"""  const transportOwned=packB.truck.owned||midgame.van.owned,transportRemaining=packB.truck.owned?packCTruckRemaining(packC,truckWeight(packB),TRUCK_CAPACITY_KG):vanRemaining(midgame.van);\n  fullEl.textContent=transportOwned&&transportRemaining>.01?`Тележка полна — разгрузи её в ${packB.truck.owned?'грузовик':'фургон'}`:'Тележка полна — пора возвращаться домой';fullEl.classList.toggle('show',cart>=capacity()-.01);\n  vanHud.hidden=!transportOwned;if(transportOwned){const tw=packB.truck.owned?packCTruckWeight(packC,truckWeight(packB)):vanWeight(midgame.van),tc=packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG;vanHud.classList.toggle('truckMode',packB.truck.owned);vanHud.firstElementChild!.textContent=packB.truck.owned?'🚚':'🚐';$('vanText').textContent=`${tw.toFixed(0)} / ${tc} кг`;$<HTMLElement>('vanFill').style.width=`${tw/tc*100}%`;$<HTMLButtonElement>('vanUnload').disabled=cart<=.01||transportRemaining<=.01;vanHud.classList.toggle('vanFull',transportRemaining<=.01)}""",
"""  const transportOwned=packD.recoveryRig.owned||packB.truck.owned||midgame.van.owned,transportRemaining=packD.recoveryRig.owned?recoveryRigRemaining(packD):packB.truck.owned?packCTruckRemaining(packC,truckWeight(packB),TRUCK_CAPACITY_KG):vanRemaining(midgame.van);\n  const transportName=packD.recoveryRig.owned?'Recovery Rig':packB.truck.owned?'грузовик':'фургон';fullEl.textContent=transportOwned&&transportRemaining>.01?`Тележка полна — разгрузи её в ${transportName}`:'Тележка полна — пора возвращаться домой';fullEl.classList.toggle('show',cart>=capacity()-.01);\n  vanHud.hidden=!transportOwned;if(transportOwned){const tw=packD.recoveryRig.owned?recoveryRigWeight(packD):packB.truck.owned?packCTruckWeight(packC,truckWeight(packB)):vanWeight(midgame.van),tc=packD.recoveryRig.owned?RECOVERY_RIG_CAPACITY_KG:packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG;vanHud.classList.toggle('truckMode',packB.truck.owned||packD.recoveryRig.owned);vanHud.classList.toggle('rigMode',packD.recoveryRig.owned);vanHud.firstElementChild!.textContent=packD.recoveryRig.owned?'🏗️':packB.truck.owned?'🚚':'🚐';$('vanText').textContent=`${tw.toFixed(0)} / ${tc} кг`;$<HTMLElement>('vanFill').style.width=`${tw/tc*100}%`;$<HTMLButtonElement>('vanUnload').disabled=cart<=.01||transportRemaining<=.01;vanHud.classList.toggle('vanFull',transportRemaining<=.01)}""")
replace_once('src/main.ts',
"""function unloadCartToVan(){\n  if(packB.truck.owned){const box={value:aluminiumHaul},movedBase=transferCartToTruck(packB,haul,box);aluminiumHaul=box.value;const alloyBox={value:alloyHaul},movedAlloy=transferPackCAlloyToTruck(packC,truckWeight(packB),TRUCK_CAPACITY_KG,alloyBox);alloyHaul=alloyBox.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;const moved=movedBase+movedAlloy;if(moved>0)showToast(`В грузовик: +${moved.toFixed(1)} кг`);saveGame();hud();return}\n  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()\n}""",
"""function unloadCartToVan(){\n  if(packD.recoveryRig.owned){const aluminium={value:aluminiumHaul},alloy={value:alloyHaul},moved=transferToRecoveryRig(packD,haul,aluminium,alloy);aluminiumHaul=aluminium.value;alloyHaul=alloy.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;if(moved>0)showToast(`В Recovery Rig: +${moved.toFixed(1)} кг`);saveGame();hud();return}\n  if(packB.truck.owned){const box={value:aluminiumHaul},movedBase=transferCartToTruck(packB,haul,box);aluminiumHaul=box.value;const alloyBox={value:alloyHaul},movedAlloy=transferPackCAlloyToTruck(packC,truckWeight(packB),TRUCK_CAPACITY_KG,alloyBox);alloyHaul=alloyBox.value;cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;const moved=movedBase+movedAlloy;if(moved>0)showToast(`В грузовик: +${moved.toFixed(1)} кг`);saveGame();hud();return}\n  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);cart=haul.metal+haul.copper+haul.plastic+aluminiumHaul+alloyHaul;if(result.movedKg>0)showToast(`В фургон: +${result.movedKg.toFixed(1)} кг`);saveGame();hud()\n}""")

# Pack D milestone/actions/UI. Workshop acquisition adds one real generic
# concurrent workshop slot now; the full reorderable scheduler is Issue #19.
replace_once('src/main.ts',
"""function renderPackCPanels(){\n  if(!packB.truck.owned)return;""",
"""function renderPackCPanels(){\n  if(!packB.truck.owned)return;""")
replace_once('src/main.ts',
"\nfunction renderGarage(){advanceWorkshop(Date.now(),false);",
"""
function doAcquireRecoveryRig(){const inv=currentPackDInventory(),gate=zoneGate('z7');if(acquireRecoveryRig(packD,inv,gate.ok)){applyPackDInventory(inv);showToast('Recovery Rig готов: 1800 кг тяжёлого полевого буфера');saveGame();renderGarage();hud()}}
function doAcquireIndustrialWorkshop(){const inv=currentPackDInventory();if(acquireIndustrialWorkshop(packD,inv,zoneMastered(midgame,'z7'))){applyPackDInventory(inv);showToast('Industrial Workshop открыт: +1 реальный слот мастерской');saveGame();renderGarage()}}
function doHireFourthWorker(){if(!canHireFourthWorker(packD,cash))return;cash-=FOURTH_WORKER_COST;if(hireFourthWorker(packD,Date.now())){showToast('Рабочий №4 нанят');saveGame();renderGarage()}}
function doAssignFourthWorker(id:ZoneId){if(!assignFourthWorkerScavenger(packD,id,zoneMastered(midgame,id),Date.now()))return;showToast(`Рабочий №4 → ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}
function doAssignFourthOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Оператор ячейки»');return}if(!assignFourthWorkerOperator(packD,0,Date.now()))return;showToast('Рабочий №4 → Operator: промышленная ячейка ×0.85');saveGame();renderGarage()}
function renderPackDPanels(){
  if(!packC.salvageYardOwned)return;const inv=currentPackDInventory(),gate=zoneGate('z7'),rigReady=canAcquireRecoveryRig(packD,inv,gate.ok),workshopReady=canAcquireIndustrialWorkshop(packD,inv,zoneMastered(midgame,'z7'));
  $('transportPanel').innerHTML+=`<div class="milestoneCard packDCard ${packD.recoveryRig.owned?'done':''}"><span class="packDTag">PACK D</span><h3>${packD.recoveryRig.owned?'✓ Recovery Rig':'🏗️ Recovery Rig'}</h3><p>Z7 signature assemblies: <b>${packD.recoveryAssemblies}</b> · capacity ${RECOVERY_RIG_CAPACITY_KG} кг.</p>${packD.recoveryRig.owned?`<div class="workerStatus">Rig: ${recoveryRigWeight(packD).toFixed(0)} / ${RECOVERY_RIG_CAPACITY_KG} кг · Truck теперь остаётся инфраструктурой старых маршрутов.</div>`:`<p>${money(RECOVERY_RIG_CASH)} · ${RECOVERY_RIG_RECIPE.metal} metal · ${RECOVERY_RIG_RECIPE.alloyBillet} Alloy · Drive ${RECOVERY_RIG_RECIPE.drive} · Control ${RECOVERY_RIG_RECIPE.control} · Recovery Assembly ${RECOVERY_RIG_RECIPE.recoveryAssemblies}</p><button id="acquireRecoveryRig" ${rigReady?'':'disabled'}>${gate.ok?'Собрать Recovery Rig':'Сначала открыть Z7'}</button>`}</div>`;
  if(packD.recoveryRig.owned)$('transportPanel').innerHTML+=`<div class="milestoneCard packDCard ${packD.industrialWorkshopOwned?'done':''}"><h3>${packD.industrialWorkshopOwned?'✓ Industrial Workshop':'🏭 Industrial Workshop'}</h3><p>${packD.industrialWorkshopOwned?`Производственных ячеек: ${packD.productionCells}. Общих слотов мастерской: ${workshopSlots()}.`:`Тяжёлая база после полного освоения Z7 · ${money(INDUSTRIAL_WORKSHOP_CASH)} · ${INDUSTRIAL_WORKSHOP_RECIPE.alloyBillet} Alloy · Heavy Frame ${INDUSTRIAL_WORKSHOP_RECIPE.heavyFrame}.`}</p>${packD.industrialWorkshopOwned?'':`<button id="acquireIndustrialWorkshop" ${workshopReady?'':'disabled'}>Развернуть Industrial Workshop</button>`}</div>`;
  if(packD.industrialWorkshopOwned){const hireReady=canHireFourthWorker(packD,cash);$('workerPanel').innerHTML+=`<div class="milestoneCard packDCard ${packD.crew4.hired?'done':''}"><h3>${packD.crew4.hired?'👷 Рабочий №4':'👷 Четвёртый рабочий'}</h3>${!packD.crew4.hired?`<p>${money(FOURTH_WORKER_COST)} · слот Industrial Workshop.</p><button id="hireWorker4" ${hireReady?'':'disabled'}>Нанять</button>`:`<p>Роль: <b>${packD.crew4.role==='operator'?'Operator':packD.crew4.assignment?`Scavenger · ${ZONE_DEFS[packD.crew4.assignment].name}`:'Scavenger · без маршрута'}</b></p><div class="crewRole"><button id="assignOperator4" class="${packD.crew4.role==='operator'?'active':''}" ${effects().operatorUnlocked?'':'disabled'}>${effects().operatorUnlocked?'Operator ×0.85':'Нужен талант: Оператор'}</button>${(['z1','z2','z3','z4','z5','z6','z7'] as ZoneId[]).map(id=>`<button data-worker4-zone="${id}" ${zoneMastered(midgame,id)?'':'disabled'}>${ZONE_DEFS[id].name}</button>`).join('')}</div>`}</div>`}
}

function renderGarage(){advanceWorkshop(Date.now(),false);""")
replace_once('src/main.ts',
"renderMidgamePanels();renderPackBPanels();renderPackCPanels();",
"renderMidgamePanels();renderPackBPanels();renderPackCPanels();renderPackDPanels();")
replace_once('src/main.ts',
"function renderQueue(){const now=Date.now(),slots=effects().workshopSlots;",
"function renderQueue(){const now=Date.now(),slots=workshopSlots();")
replace_once('src/main.ts',
"${effects().workshopSlots>1?'<small>«Параллельная работа» даёт второй слот.</small>':''}`}",
"${workshopSlots()>1?'<small>Параллельные слоты складываются из талантов и Industrial Workshop.</small>':''}`}")
replace_once('src/main.ts',
"const def=ZONE_DEFS[id],gate=packCZoneGate(id)",
"const def=ZONE_DEFS[id],gate=zoneGate(id)")
replace_once('src/main.ts',
"if(!packCZoneGate(id).ok)return;",
"if(!zoneGate(id).ok)return;")
replace_once('src/main.ts',
"selectZone:(id:ZoneId)=>{if(packCZoneGate(id).ok){midgame.currentZone=id;saveGame()}}",
"selectZone:(id:ZoneId)=>{if(zoneGate(id).ok){midgame.currentZone=id;saveGame()}}")

# Fourth operator gives a real Pack C industrial-cycle effect while keeping the
# second generic workshop slot useful before Issue #19 replaces scheduler internals.
replace_once('src/main.ts',
"if(packC.production&&effects().industrialProductionMultiplier<1){const raw=packC.production.endsAt-packC.production.startedAt;packC.production.endsAt=packC.production.startedAt+raw*effects().industrialProductionMultiplier}",
"if(packC.production){const raw=packC.production.endsAt-packC.production.startedAt,mult=effects().industrialProductionMultiplier*(packD.crew4.hired&&packD.crew4.role==='operator'?.85:1);if(mult<1)packC.production.endsAt=packC.production.startedAt+raw*mult}")

# Garage return unloads every transport layer safely, including old saves with
# material still inside van/truck.
replace_once('src/main.ts',
"const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents),truck=unloadTruck(packB,storage);packC.materials.alloyScrap+=unloadPackCTruckAlloy(packC);cart=0;",
"const vanKg=unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents),truck=unloadTruck(packB,storage);packC.materials.alloyScrap+=unloadPackCTruckAlloy(packC);const rig=unloadRecoveryRig(packD,storage);packB.materials.aluminiumScrap+=rig.aluminiumScrap;packC.materials.alloyScrap+=rig.alloyScrap;cart=0;")
replace_once('src/main.ts',
"${truck.weight?` · truck ${truck.weight.toFixed(0)} кг`:vanKg?` · фургон ${vanKg.toFixed(0)} кг`:''}`;",
"${rig.weight?` · Rig ${rig.weight.toFixed(0)} кг`:truck.weight?` · truck ${truck.weight.toFixed(0)} кг`:vanKg?` · фургон ${vanKg.toFixed(0)} кг`:''}`;")

# Action wiring.
replace_once('src/main.ts',
"else if(target.closest('#acquireSalvageYard'))doAcquireSalvageYard();else if(target.closest('#hireWorker3'))doHireThirdWorker();else if(target.closest('#assignOperator'))doAssignOperator();",
"else if(target.closest('#acquireSalvageYard'))doAcquireSalvageYard();else if(target.closest('#hireWorker3'))doHireThirdWorker();else if(target.closest('#assignOperator'))doAssignOperator();else if(target.closest('#acquireRecoveryRig'))doAcquireRecoveryRig();else if(target.closest('#acquireIndustrialWorkshop'))doAcquireIndustrialWorkshop();else if(target.closest('#hireWorker4'))doHireFourthWorker();else if(target.closest('#assignOperator4'))doAssignFourthOperator();")
replace_once('src/main.ts',
"else{const worker3Zone=target.closest<HTMLElement>('[data-worker3-zone]');",
"else{const worker4Zone=target.closest<HTMLElement>('[data-worker4-zone]');if(worker4Zone){doAssignFourthWorker(worker4Zone.dataset.worker4Zone as ZoneId);return}const worker3Zone=target.closest<HTMLElement>('[data-worker3-zone]');")

# Test API: dedicated browser proof can drive Pack D without brittle DOM setup.
replace_once('src/main.ts',
"saveVersion:6,",
"saveVersion:7,")
replace_once('src/main.ts',
"packC:normalizePackC(packC)}),",
"packC:normalizePackC(packC),packD:normalizePackD(packD)}),")
replace_once('src/main.ts',
"doAcquireSalvageYard,doHireThirdWorker,doAssignThirdWorker,doAssignOperator}});",
"doAcquireSalvageYard,doHireThirdWorker,doAssignThirdWorker,doAssignOperator,doAcquireRecoveryRig,doAcquireIndustrialWorkshop,doHireFourthWorker,doAssignFourthWorker,doAssignFourthOperator}});")

# Pack D styling generated as a normal source file by the integrator.
Path('src/content_pack_d.css').write_text(""".packDCard{border:1px solid #d3a05d66;background:linear-gradient(180deg,#352819e8,#18140fe8)}.packDTag{display:inline-block;padding:4px 7px;border-radius:999px;background:#d7a45d22;color:#f0bd76;font-size:9px;font-weight:900;letter-spacing:.12em}.packDCard.done{border-color:#e0b66f88}.industrialRare.packD{background:#4b321cf4;border-color:#e0ae68dd}.vanHud.rigMode{box-shadow:inset 0 0 0 1px #dda75f66}.packDCard .workerStatus{margin-top:7px}@media(max-width:720px){.packDCard button{min-height:40px}}\n""", encoding='utf-8')

print('Pack D runtime integration applied')
