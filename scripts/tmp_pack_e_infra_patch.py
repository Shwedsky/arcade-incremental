from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding='utf-8')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, got {count}')
    return text.replace(old, new, 1)


# Worker Economy V2: recognize Z8 benchmarks/medals while preserving the four-worker model.
p='src/worker_economy_v2.ts'; t=read(p)
t=replace_once(t,"export type EconomyZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7';","export type EconomyZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7'|'z8';",'worker zone union')
t=replace_once(t,"const ZONES:EconomyZoneId[]=['z1','z2','z3','z4','z5','z6','z7'];","const ZONES:EconomyZoneId[]=['z1','z2','z3','z4','z5','z6','z7','z8'];",'worker zones')
t=replace_once(t,"medals:{z1:false,z2:false,z3:false,z4:false,z5:false,z6:false,z7:false},","medals:{z1:false,z2:false,z3:false,z4:false,z5:false,z6:false,z7:false,z8:false},",'worker medals')
write(p,t)

# Worker #4 is the mature Pack-D worker that can service mastered Z8 in Pack E.
p='src/content_pack_d.ts'; t=read(p)
t=replace_once(t,"export type PackDCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7';","export type PackDCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7'|'z8';",'pack d crew zones')
t=replace_once(t,"z1:{metal:100,copper:6.5,plastic:17},z2:{metal:90,copper:11,plastic:14},z3:{metal:122,copper:12,plastic:16},z4:{metal:145,copper:13,plastic:10},z5:{metal:176,copper:15,plastic:8},z6:{metal:194,copper:16,plastic:6},z7:{metal:225,copper:17,plastic:5}","z1:{metal:100,copper:6.5,plastic:17},z2:{metal:90,copper:11,plastic:14},z3:{metal:122,copper:12,plastic:16},z4:{metal:145,copper:13,plastic:10},z5:{metal:176,copper:15,plastic:8},z6:{metal:194,copper:16,plastic:6},z7:{metal:225,copper:17,plastic:5},z8:{metal:252,copper:19,plastic:4}",'pack d crew rates')
write(p,t)

# Main zone model: Z8 becomes a first-class ZoneId using the Pack E profile.
p='src/midgame.ts'; t=read(p)
t=replace_once(t,"import { PACK_D_ZONE_PROFILE } from './content_pack_d.ts';","import { PACK_D_ZONE_PROFILE } from './content_pack_d.ts';\nimport { PACK_E_ZONE_PROFILE } from './content_pack_e.ts';",'midgame pack e import')
t=replace_once(t,"export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7';","export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7' | 'z8';",'midgame zone union')
t=replace_once(t,"  z7:{\n    id:'z7',order:7,name:PACK_D_ZONE_PROFILE.name,subtitle:'Зона 7',description:PACK_D_ZONE_PROFILE.description,\n    nodeWeights:PACK_D_ZONE_PROFILE.nodeWeights,hpMultiplier:PACK_D_ZONE_PROFILE.hpMultiplier,yieldMultiplier:PACK_D_ZONE_PROFILE.yieldMultiplier,masteryTarget:PACK_D_ZONE_PROFILE.masteryTarget,recommendedTool:7\n  }\n};","  z7:{\n    id:'z7',order:7,name:PACK_D_ZONE_PROFILE.name,subtitle:'Зона 7',description:PACK_D_ZONE_PROFILE.description,\n    nodeWeights:PACK_D_ZONE_PROFILE.nodeWeights,hpMultiplier:PACK_D_ZONE_PROFILE.hpMultiplier,yieldMultiplier:PACK_D_ZONE_PROFILE.yieldMultiplier,masteryTarget:PACK_D_ZONE_PROFILE.masteryTarget,recommendedTool:7\n  },\n  z8:{\n    id:'z8',order:8,name:PACK_E_ZONE_PROFILE.name,subtitle:'Зона 8',description:PACK_E_ZONE_PROFILE.description,\n    nodeWeights:PACK_E_ZONE_PROFILE.nodeWeights,hpMultiplier:PACK_E_ZONE_PROFILE.hpMultiplier,yieldMultiplier:PACK_E_ZONE_PROFILE.yieldMultiplier,masteryTarget:PACK_E_ZONE_PROFILE.masteryTarget,recommendedTool:8\n  }\n};",'midgame z8 definition')
t=replace_once(t,"currentZone:'z1',mastery:{z1:0,z2:0,z3:0,z4:0,z5:0,z6:0,z7:0},","currentZone:'z1',mastery:{z1:0,z2:0,z3:0,z4:0,z5:0,z6:0,z7:0,z8:0},",'midgame mastery default')
write(p,t)

# Visual theme: Port gets a distinct cool industrial palette and validates as a real zone.
p='src/visual_theme.ts'; t=read(p)
t=replace_once(t,"  z7:{id:'z7',label:'Тяжёлый парк',groundTop:'#49443b',groundBottom:'#24231f',groundDust:'#716758',lane:'#30302c',laneMark:'#e0ad58',edge:'#191916',accent:'#d6a05a',accentSoft:'#d6a05a48',shadow:'#0d0b08d0',decor:['scrapstack','scrapstack','pallet','barrel','fence','tire','puddle','cone']}\n};","  z7:{id:'z7',label:'Тяжёлый парк',groundTop:'#49443b',groundBottom:'#24231f',groundDust:'#716758',lane:'#30302c',laneMark:'#e0ad58',edge:'#191916',accent:'#d6a05a',accentSoft:'#d6a05a48',shadow:'#0d0b08d0',decor:['scrapstack','scrapstack','pallet','barrel','fence','tire','puddle','cone']},\n  z8:{id:'z8',label:'Портовый терминал',groundTop:'#344b52',groundBottom:'#1b2a30',groundDust:'#5b7379',lane:'#26363d',laneMark:'#e3cf6f',edge:'#111d22',accent:'#65c4cf',accentSoft:'#65c4cf48',shadow:'#061116d4',decor:['pallet','crate','fence','cone','puddle','barrel','scrapstack','tire']}\n};",'visual z8 theme')
t=replace_once(t,"for(const id of ['z1','z2','z3','z4','z5','z6','z7'] as ZoneId[])","for(const id of ['z1','z2','z3','z4','z5','z6','z7','z8'] as ZoneId[])",'visual validation zones')
write(p,t)

# Zone content: recognizable port machinery while reusing the existing visual vocabulary.
p='src/zone_content.ts'; t=read(p)
z8="""  },
  z8:{
    small_scrap:[v('Контейнерные твистлоки','cans','metal','alloy'),v('Секции портовой рамы','frame','metal','alloy'),v('Панели ричстакера','sheet','metal','aluminium'),v('Гидролинии терминала','pipes','metal')],
    cable:[v('Коса силового шкафа','loom','copper','controller'),v('Кабель рефконтейнера','coil','copper'),v('Жгут ричстакера','loom','copper','controller'),v('Шина портового генератора','coil','copper','generator')],
    small_appliance:[v('Контроллер рефконтейнера','tool','controller'),v('Насос подъёмного контура','pump','pump','hydraulic'),v('Привод замка контейнера','small_motor','motor'),v('Портовый блок автоматики','generator','electronics','controller')],
    bike_fan:[v('Ступица ричстакера','frame','bearing'),v('Вентилятор рефконтейнера','fan','bearing','motor'),v('Каретка портовой тали','cart','bearing'),v('Шкив подъёмного привода','frame','gearbox','bearing')],
    medium_appliance:[v('Рефрижераторный модуль','compressor','compressor','controller','alloy'),v('Портовая генераторная установка','generator','generator','controller'),v('Привод контейнерной тали','frame','gearbox','heavy_hydraulic'),v('Силовой шкаф терминала','generator','controller','electronics','port_power')],
    large_appliance:[v('Мачта ричстакера','frame','heavy_hydraulic','alloy','port_power'),v('Силовой модуль рефконтейнера','compressor','compressor','generator','port_power'),v('Подъёмная секция крана','frame','gearbox','heavy_hydraulic','port_power'),v('Портовая силовая сборка','generator','controller','generator','port_power')]
  }
};

export function targetContent"""
t=replace_once(t,"  }\n};\n\nexport function targetContent",z8,'zone content z8')
write(p,t)

# Main runtime infrastructure: Save V10 + Pack E state + Z8 gate. Gameplay integration follows in the next block.
p='src/main.ts'; t=read(p)
needle="} from './content_pack_d.ts';\n"
insert="""} from './content_pack_d.ts';
import {
  canUnlockZ8,createDefaultPackE,normalizePackE,
  type PackEState
} from './content_pack_e.ts';
"""
t=replace_once(t,needle,insert,'main pack e import')
t=replace_once(t,'interface SaveStateV9{','interface SaveStateV10{','save interface name')
t=replace_once(t,'  v:9;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;','  v:10;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;','save version field')
t=replace_once(t,'  scheduler:WorkshopSchedulerState;contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;','  scheduler:WorkshopSchedulerState;contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;packE:PackEState;','save pack e field')
t=replace_once(t,'const defaultSave=():SaveStateV9=>({v:9,','const defaultSave=():SaveStateV10=>({v:10,','default save version')
t=replace_once(t,'packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()});\nfunction loadSave():SaveStateV9{','packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD(),packE:createDefaultPackE()});\nfunction loadSave():SaveStateV10{','default pack e')
# Insert V10 normalization before the existing V9 migration branch.
marker='    if(value?.v===9)return '
idx=t.find(marker)
if idx<0: raise SystemExit('main v9 migration marker missing')
end=t.find('\n',idx)
v9line=t[idx:end]
v10line=v9line.replace('v===9','v===10',1).replace('v:9','v:10',1)
v10line=v10line.replace('packD:normalizePackD(value.packD)};','packD:normalizePackD(value.packD),packE:normalizePackE(value.packE)};',1)
t=t[:idx]+v10line+'\n'+t[idx:]
# Every older successful migration now writes the current schema. Base state supplies empty Pack E.
t=t.replace('return {...base,...value,v:9','return {...base,...value,v:10')
t=t.replace('return {...base,...value,v:9','return {...base,...value,v:10')
t=replace_once(t,'let packD:PackDState=normalizePackD(loaded.packD);','let packD:PackDState=normalizePackD(loaded.packD);\nlet packE:PackEState=normalizePackE(loaded.packE);','loaded pack e')
old_gate="function zoneGate(id:ZoneId){if(id==='z7')return canUnlockZ7({z6Mastered:zoneMastered(midgame,'z6'),salvageYardOwned:packC.salvageYardOwned,truckOwned:packB.truck.owned});if(id==='z5'||id==='z6')return canUnlockPackCZone(id,{z4Mastered:zoneMastered(midgame,'z4'),z5Mastered:zoneMastered(midgame,'z5'),hangarOwned:packB.hangarOwned,truckOwned:packB.truck.owned,controllerDiscovered:packC.discoveredIndustrial.includes('industrialController')});return zoneUnlock(midgame,id,zoneContext())}"
new_gate="function zoneGate(id:ZoneId){if(id==='z8')return canUnlockZ8({level:level(),z7Mastered:zoneMastered(midgame,'z7'),industrialWorkshopOwned:packD.industrialWorkshopOwned,recoveryRigOwned:packD.recoveryRig.owned});if(id==='z7')return canUnlockZ7({z6Mastered:zoneMastered(midgame,'z6'),salvageYardOwned:packC.salvageYardOwned,truckOwned:packB.truck.owned});if(id==='z5'||id==='z6')return canUnlockPackCZone(id,{z4Mastered:zoneMastered(midgame,'z4'),z5Mastered:zoneMastered(midgame,'z5'),hangarOwned:packB.hangarOwned,truckOwned:packB.truck.owned,controllerDiscovered:packC.discoveredIndustrial.includes('industrialController')});return zoneUnlock(midgame,id,zoneContext())}"
t=replace_once(t,old_gate,new_gate,'main z8 gate')
t=replace_once(t,'function saveGame(){const state:SaveStateV9={v:9,','function saveGame(){const state:SaveStateV10={v:10,','save function version')
t=replace_once(t,'packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD)},raw=JSON.stringify(state)','packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD),packE:normalizePackE(packE)},raw=JSON.stringify(state)','save pack e state')
t=replace_once(t,'saveVersion:9,','saveVersion:10,','test save version')
t=replace_once(t,'packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD)})','packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD),packE:normalizePackE(packE)})','test pack e state')
write(p,t)

print('Pack E infrastructure patch prepared')
