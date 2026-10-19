#!/usr/bin/env python3
from pathlib import Path
import re

p=Path(__file__).resolve().parents[1]/'src/main.ts'
text=p.read_text(encoding='utf-8')
replacement="""function saveGame(){const state:SaveStateV6={v:6,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}
setInterval(saveGame"""
text,count=re.subn(r"function saveGame\(\)\{const state:SaveStateV6=.*?\nsetInterval\(saveGame",replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit(f'saveGame repair expected 1 match, got {count}')
p.write_text(text,encoding='utf-8')
print('Pack C saveGame integration output repaired')
