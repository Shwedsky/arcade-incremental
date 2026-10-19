#!/usr/bin/env python3
from pathlib import Path


def replace_once(path:str,old:str,new:str)->None:
    p=Path(path);text=p.read_text(encoding='utf-8')
    if old not in text: raise SystemExit(f'anchor not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Pack C worker #3 intentionally remains a Z1-Z6 worker after ZoneId gains Z7.
replace_once('src/main.ts',
"function doAssignThirdWorker(id:ZoneId){if(!assignThirdWorkerScavenger(packC,id,zoneMastered(midgame,id),Date.now()))return;showToast(`Рабочий №3 → ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}",
"function doAssignThirdWorker(id:ZoneId){if(id==='z7')return;if(!assignThirdWorkerScavenger(packC,id,zoneMastered(midgame,id),Date.now()))return;showToast(`Рабочий №3 → ${ZONE_DEFS[id].name}`);saveGame();renderGarage()}")

# Z7 gets a distinct heavy-yard visual identity rather than inheriting Z6.
replace_once('src/visual_theme.ts',
"  z6:{id:'z6',label:'Заброшенный завод',groundTop:'#51483f',groundBottom:'#292724',groundDust:'#78695b',lane:'#363431',laneMark:'#d9934d',edge:'#211d19',accent:'#d97845',accentSoft:'#d9784548',shadow:'#100b08cc',decor:['scrapstack','pallet','barrel','fence','puddle','crate','cone']}\n};",
"  z6:{id:'z6',label:'Заброшенный завод',groundTop:'#51483f',groundBottom:'#292724',groundDust:'#78695b',lane:'#363431',laneMark:'#d9934d',edge:'#211d19',accent:'#d97845',accentSoft:'#d9784548',shadow:'#100b08cc',decor:['scrapstack','pallet','barrel','fence','puddle','crate','cone']},\n  z7:{id:'z7',label:'Тяжёлый парк',groundTop:'#49443b',groundBottom:'#24231f',groundDust:'#716758',lane:'#30302c',laneMark:'#e0ad58',edge:'#191916',accent:'#d6a05a',accentSoft:'#d6a05a48',shadow:'#0d0b08d0',decor:['scrapstack','scrapstack','pallet','barrel','fence','tire','puddle','cone']}\n};")
replace_once('src/visual_theme.ts',
"for(const id of ['z1','z2','z3','z4','z5','z6'] as ZoneId[])",
"for(const id of ['z1','z2','z3','z4','z5','z6','z7'] as ZoneId[])")

print('Pack D type integration repair applied')