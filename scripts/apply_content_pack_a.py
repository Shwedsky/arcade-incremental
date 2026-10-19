#!/usr/bin/env python3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
main_path=root/'src/main.ts'
field_path=root/'src/field_view.ts'
main=main_path.read_text(encoding='utf-8')
field=field_path.read_text(encoding='utf-8')

def rep(text,old,new,label):
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected 1 match, got {count}')
    return text.replace(old,new,1)

main=rep(main,"import './visual_foundation.css';","import './visual_foundation.css';\nimport './content_pack_a.css';",'content css')
main=rep(main,
"import { makeDecor, renderField, type Decor, type FloatText, type Pickup, type Spark } from './field_view.ts';",
"import { makeDecor, renderField, type Decor, type FloatText, type Pickup, type Spark } from './field_view.ts';\nimport { GARAGE_GROWTH_LABEL, garageGrowthStage, targetContent } from './zone_content.ts';",
'content import')
main=rep(main,
"const d=getTargetClass(selected.classId),e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,targetDps=BASE_DPS*e.dpsMultiplier*toolPowerMultiplier(equipmentLevels.tool)*comboMult;targetEl.innerHTML=`<b>${d.label}</b><span>${(selected.hp/targetDps).toFixed(1)}с</span>`",
"const d=getTargetClass(selected.classId),content=targetContent(fieldZone,selected.classId,selected.variant),e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,targetDps=BASE_DPS*e.dpsMultiplier*toolPowerMultiplier(equipmentLevels.tool)*comboMult;targetEl.innerHTML=`<b>${content.label}</b><span>${(selected.hp/targetDps).toFixed(1)}с</span>`",
'target content label')
main=rep(main,
"function renderGarage(){advanceWorkshop(Date.now(),false);",
"function renderGarage(){advanceWorkshop(Date.now(),false);const growth=garageGrowthStage(installed,midgame.van.owned,midgame.worker.hired),garageBox=document.querySelector<HTMLElement>('.garageBox');if(garageBox)garageBox.dataset.growth=growth;$('garageTip').innerHTML=`<span class=\"garageGrowthBadge\">${GARAGE_GROWTH_LABEL[growth]}</span> · Инструмент и тележка качаются отдельно от талантов.`;",
'garage growth')

field=rep(field,
"import { TARGET_VISUALS, zoneVisual, type DecorVisualKind } from './visual_theme.ts';",
"import { TARGET_VISUALS, zoneVisual, type DecorVisualKind } from './visual_theme.ts';\nimport { targetContent } from './zone_content.ts';\nimport { drawContentDetail } from './content_visual.ts';",
'field content imports')
field=rep(field,"targetBody(ctx,t);","targetBody(ctx,t);drawContentDetail(ctx,targetContent(zone,t.classId,t.variant).visual);",'content detail render')

main_path.write_text(main,encoding='utf-8')
field_path.write_text(field,encoding='utf-8')
print('content pack A runtime wiring applied')
