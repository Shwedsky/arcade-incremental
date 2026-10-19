#!/usr/bin/env python3
from pathlib import Path

p=Path(__file__).resolve().parents[1]/'src/main.ts'
text=p.read_text(encoding='utf-8')
marker="Нужен талант: Оператор"
if marker in text:
    print('Pack C talent runtime already integrated')
    raise SystemExit(0)

def rep(old,new,label):
    global text
    c=text.count(old)
    if c!=1: raise SystemExit(f'{label}: expected 1 match, got {c}')
    text=text.replace(old,new,1)

rep(
"function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);showToast(`${kind} поставлен в промышленную ячейку · ${fmtLong(productionDurationSec(packC,kind))}`);saveGame();renderGarage()}}",
"function doStartPackCProduction(kind:PackCProductionKind){const inv=currentPackCInventory();if(startPackCProduction(packC,kind,inv,Date.now())){applyPackCInventory(inv);if(packC.production&&effects().industrialProductionMultiplier<1){const raw=packC.production.endsAt-packC.production.startedAt;packC.production.endsAt=packC.production.startedAt+raw*effects().industrialProductionMultiplier}const duration=packC.production?Math.max(0,(packC.production.endsAt-packC.production.startedAt)/1000):productionDurationSec(packC,kind);showToast(`${kind} поставлен в промышленную ячейку · ${fmtLong(duration)}`);saveGame();renderGarage()}}",
'workshop tier ii production effect')
rep(
"function doAssignOperator(){if(!assignThirdWorkerOperator(packC,Date.now()))return;showToast('Рабочий №3 → Operator: цикл промышленной ячейки ×0.75');saveGame();renderGarage()}",
"function doAssignOperator(){if(!effects().operatorUnlocked){showToast('Нужен талант «Оператор ячейки»');return}if(!assignThirdWorkerOperator(packC,Date.now()))return;showToast('Рабочий №3 → Operator: цикл промышленной ячейки ×0.75');saveGame();renderGarage()}",
'automation tier ii operator gate')
rep(
"<button id=\"assignOperator\" class=\"${packC.crew3.role==='operator'?'active':''}\">Operator ×0.75</button>",
"<button id=\"assignOperator\" class=\"${packC.crew3.role==='operator'?'active':''}\" ${effects().operatorUnlocked?'':'disabled'}>${effects().operatorUnlocked?'Operator ×0.75':'Нужен талант: Оператор'}</button>",
'operator ui gate')
p.write_text(text,encoding='utf-8')
print('Pack C Tier-II talent runtime integration applied')
