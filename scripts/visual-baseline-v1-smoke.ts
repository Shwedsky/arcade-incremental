import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const source=readFileSync(fileURLToPath(new URL('../src/industrial_visual_baseline_v1.ts',import.meta.url)),'utf8');
const css=readFileSync(fileURLToPath(new URL('../src/industrial_visual_baseline_v1.css',import.meta.url)),'utf8');

for(const title of ['Участок подготовки сырья','Сборочный участок','Участок тяжёлой сборки']){
  assert.ok(source.includes(title),`visual baseline must expose canonical P5 title: ${title}`);
}
for(const selector of ['ivRefiningMachine','ivFabricationMachine','ivHeavyMachine','ivWarehouse','ivFleetStage','ivWorkerSpot','ivHeavySupport']){
  assert.ok(source.includes(selector),`runtime scene must render ${selector}`);
}
for(const selector of ['.ivScrapPile','.ivHopper','.ivPartsRack','.ivWorkbench','.ivGantry','.ivHeavyPlatform','.ivForklift','.ivFleetVehicle']){
  assert.ok(css.includes(selector),`visual baseline CSS must contain differentiated asset ${selector}`);
}
assert.ok(source.includes('state.workforceV3?.fleet'),'fleet visuals must come from canonical Workforce/Fleet V3');
assert.ok(source.includes("heavy?.job?.support?.kind==='recovery_rig'"),'heavy support must come from the active Heavy Assembly job');
assert.ok(source.includes('data-visual-baseline-v1'),'scene must expose a stable browser-acceptance root');
assert.ok(css.includes('@media(max-width:620px)'),'phone composition must be explicitly authored');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'visual motion must respect reduced-motion preference');
assert.ok(!source.includes('<img'),'B1 stays lightweight and does not smuggle heavyweight raster scene dependencies into runtime');

console.log('Visual Baseline V1 structural contract: three differentiated live P5 zones + warehouse/fleet/crew/support + responsive lightweight scene: PASS');
