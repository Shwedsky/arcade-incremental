import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=(path:string)=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
const source=read('../src/industrial_visual_baseline_v1.ts');
const css=read('../src/industrial_visual_baseline_v1.css');
const artCss=read('../src/industrial_visual_art_v1.css');
const refining=read('../public/art/industrial/refining_bay_v1.svg');
const fabrication=read('../public/art/industrial/fabrication_bay_v1.svg');
const heavy=read('../public/art/industrial/heavy_bay_v1.svg');

for(const title of ['Участок подготовки сырья','Сборочный участок','Участок тяжёлой сборки']){
  assert.ok(source.includes(title),`visual baseline must expose canonical P5 title: ${title}`);
}
for(const selector of ['ivRefiningMachine','ivFabricationMachine','ivHeavyMachine','ivWarehouse','ivFleetStage','ivWorkerSpot','ivHeavySupport']){
  assert.ok(source.includes(selector),`runtime scene must render ${selector}`);
}
for(const selector of ['.ivScrapPile','.ivHopper','.ivPartsRack','.ivWorkbench','.ivGantry','.ivHeavyPlatform','.ivForklift','.ivFleetVehicle']){
  assert.ok(css.includes(selector),`visual baseline CSS must contain differentiated asset ${selector}`);
}
for(const path of ['/art/industrial/refining_bay_v1.svg','/art/industrial/fabrication_bay_v1.svg','/art/industrial/heavy_bay_v1.svg']){
  assert.ok(artCss.includes(path),`visual art layer must reference ${path}`);
}
for(const [name,svg] of [['refining',refining],['fabrication',fabrication],['heavy',heavy]] as const){
  assert.match(svg,/^<svg[\s\S]*viewBox="0 0 420 190"/i,`${name} bay art must be a scalable 420x190 SVG scene`);
  assert.ok(svg.length<12_000,`${name} bay art should stay lightweight for browser/mobile delivery`);
}
assert.ok(source.includes('state.workforceV3?.fleet'),'fleet visuals must come from canonical Workforce/Fleet V3');
assert.ok(source.includes("heavy?.job?.support?.kind==='recovery_rig'"),'heavy support must come from the active Heavy Assembly job');
assert.ok(source.includes('data-visual-baseline-v1'),'scene must expose a stable browser-acceptance root');
assert.ok(source.includes('legacyP5Signature'),'new overview renderer must explicitly prevent legacy/new scene ownership flicker');
assert.ok(css.includes('@media(max-width:620px)'),'phone composition must be explicitly authored');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'visual motion must respect reduced-motion preference');
assert.ok(!source.includes('<img'),'runtime remains DOM/CSS driven; decorative SVGs stay in CSS rather than owning state');

console.log('Visual Baseline V1 structural contract: live P5 scene + distinct vector art + warehouse/fleet/crew/support + responsive lightweight delivery: PASS');
