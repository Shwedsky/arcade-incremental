import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const field=readFileSync(`${root}src/field_view.ts`,'utf8');
const art=readFileSync(`${root}src/field_art_v2.ts`,'utf8');
const baseModule=readFileSync(`${root}src/base_stage_art_v2.ts`,'utf8');
const baseCss=readFileSync(`${root}src/base_stage_art_v2.css`,'utf8');
const sceneFirstCss=readFileSync(`${root}src/base_stage_art_scene_first_v3.css`,'utf8');
const uiCss=readFileSync(`${root}src/visual_rebuild_v2_ui.css`,'utf8');
const matureCss=readFileSync(`${root}src/ui_maturity_v1.css`,'utf8');
const workforceUi=readFileSync(`${root}src/workforce_fleet_ui_v3.ts`,'utf8');
const operatorUi=readFileSync(`${root}src/operator_ui_v3.ts`,'utf8');
const productionUi=readFileSync(`${root}src/production_cells_ui_v1.ts`,'utf8');
const indexHtml=readFileSync(`${root}index.html`,'utf8');
const atlasPath=`${root}public/art/v2/field_atlas.svg`;
const baseAtlasPath=`${root}public/art/v2/base_scenes.svg`;
const zoneMapPath=`${root}public/art/v2/zone_map.svg`;
const docPath=`${root}docs/VISUAL_REBUILD_V2.md`;

assert.ok(existsSync(atlasPath),'V2 field atlas must exist');
assert.ok(existsSync(baseAtlasPath),'V2 base scene atlas must exist');
assert.ok(existsSync(zoneMapPath),'V2 zone map art must exist');
assert.ok(existsSync(docPath),'Visual Rebuild V2 production contract must exist');
const atlas=readFileSync(atlasPath,'utf8');
const baseAtlas=readFileSync(baseAtlasPath,'utf8');
const zoneMap=readFileSync(zoneMapPath,'utf8');
const doc=readFileSync(docPath,'utf8');

for(const frame of ['player-idle','player-move','player-attack','small-scrap','cable','small-appliance','machine-frame','medium-generator','large-intact','large-damaged','large-critical','debris']){
  assert.ok(art.includes(`'${frame}'`),`field atlas renderer must expose ${frame}`);
}
for(const marker of ['player idle','player move','player attack','small scrap bundle','cable coil','small appliance','damaged machine frame','medium generator','large industrial machine intact','large industrial machine damaged','large machine near destroyed','debris cluster']){
  assert.ok(atlas.includes(marker),`SVG atlas must contain illustrated cell: ${marker}`);
}
for(const token of ['drawFieldArtFrame','artFrameForTarget','playerFrame','spawnBreakVisuals','syncBreakVisuals','drawBreakVisuals']){
  assert.ok(field.includes(token),`field renderer must integrate V2 art behavior: ${token}`);
}
assert.ok(field.includes("return hp>.72?'large-intact':hp>.35?'large-damaged':'large-critical'"),'large target must have three materially different HP art states');
assert.ok(field.includes("before===true&&!t.alive"),'break debris must be triggered by an actual alive -> destroyed transition');
assert.ok(field.includes("const frames:FieldArtFrame[]=big?['large-critical','debris','small-scrap','cable','machine-frame','debris']"),'large break event must visibly split into multiple illustrated pieces');
assert.ok(art.includes("const playerFrame=frame==='player-idle'||frame==='player-move'||frame==='player-attack'"),'player atlas frames must use dedicated upright handling');
assert.ok(art.includes('const facingLeft=Math.sin(rotation)<-.08'),'player orientation must mirror horizontally instead of rotating the whole body upside down');

for(const marker of ['id="garage"','id="hangar"','id="yard"','id="industrial"','ЛИЧНЫЙ ГАРАЖ','ОПЕРАЦИОННЫЙ АНГАР','ПЛОЩАДКА РАЗБОРКИ','ПРОМЫШЛЕННАЯ МАСТЕРСКАЯ']){
  assert.ok(baseAtlas.includes(marker),`base atlas must contain authored scene marker: ${marker}`);
}
assert.ok(baseModule.includes("scene.prepend(art)"),'V2 base art must be attached behind live canonical overlays');
assert.ok(baseModule.includes("className='stageIllustrationV2'"),'V2 base layer must use a stable semantic class');
assert.ok(baseModule.includes("import './base_stage_art_scene_first_v3.css'"),'scene-first composition must load after the baseline art layer');
for(const stage of ['stage-garage','stage-hangar','stage-yard','stage-industrial'])assert.ok(baseCss.includes(`.${stage}`),`V2 CSS must author ${stage}`);
assert.ok(baseCss.includes("background-image:url('/art/v2/base_scenes.svg')"),'base surfaces must use the authored scene atlas rather than CSS-only primitive scenery');
assert.ok(baseCss.includes('.stage-industrial .productionCells'),'live production overlays must remain attached to the illustrated workshop');
for(const token of ['.stage-hangar .machineZone{','.stage-hangar .dispatchZone{','.stage-yard .yardVehicleApron{','.stage-yard .yardCrewMuster{'])assert.ok(sceneFirstCss.includes(token),`scene-first layer must preserve compact canonical status dock: ${token}`);
assert.ok(sceneFirstCss.includes('The authored location remains the hero.'),'scene-first layer must document the visual hierarchy contract');
assert.ok(sceneFirstCss.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),'Hangar production status must be a compact dock rather than a large dashboard grid');
assert.ok(sceneFirstCss.includes('height:42px!important'),'Yard semantic badges must stay compact so the authored yard remains visible');

assert.ok(zoneMap.includes('МАРШРУТ СБОРА'),'zone map must be an authored salvage-route illustration');
assert.ok(zoneMap.includes('<circle cx="1360" cy="527" r="22"/>'),'zone map art must contain all eight route nodes');
assert.ok(uiCss.includes("url('/art/v2/zone_map.svg')"),'zone screen must use the illustrated V2 map');
for(let i=1;i<=8;i++)assert.ok(uiCss.includes(`.zoneCard:nth-child(${i})`),`desktop map must author route position ${i}`);
assert.ok(uiCss.includes('@media(max-width:900px)'),'zone map must include intentional phone/tablet composition');
assert.ok(doc.includes('Green CI alone is not acceptance.'),'V2 contract must explicitly keep visual quality as a human gate');

// Owner-reported UI stability bugs are now hard contracts.
assert.ok(!workforceUi.includes('cash:Math.floor(s.cash)'),'live cash must not invalidate the workforce structural signature and rebuild focused selects');
assert.ok(workforceUi.includes('function updateActionAvailability'),'cash-dependent buttons must update in place instead of rebuilding worker cards');
assert.ok(operatorUi.includes('dataset.opSignature=signature'),'operator assignment block must preserve DOM identity across 300 ms live ticks');
assert.ok(operatorUi.includes("if(wrapper?.dataset.opSignature===signature){updateOperatorLive(wrapper,activeCell);continue}"),'operator live updates must not recreate the dropdown each tick');
assert.ok(productionUi.includes('function managementStructureSignature'),'production management must separate structural state from live progress/stock changes');
assert.ok(productionUi.includes('function updateManagementLive'),'production live progress/stock must update in place without replacing assignment selects');
assert.ok(!productionUi.includes('const signature=JSON.stringify({cells:view?.cells,stock:view?.stock'),'production management must not treat every live cell/stock tick as a structural rebuild');
assert.ok(productionUi.includes('function updateIndustrialSceneLive'),'industrial scene countdown must update in place instead of rebuilding the scene every few seconds');

for(const token of ['--ui-accent:#c28b45','--ui-radius:6px','.baseShellTab>span{display:none!important}','border-radius:5px!important','.v3WorkerCard{padding:11px!important'])assert.ok(matureCss.includes(token),`mature industrial UI layer must contain ${token}`);
assert.ok(indexHtml.includes('/src/ui_maturity_v1.ts'),'mature UI layer must load after the feature modules');

for(const forbidden of ['rollDrops(','gainXp(','addActiveMastery(','zoneYieldMultiplier(','componentChance']){
  assert.ok(!field.includes(forbidden),`V2 presentation path must remain economy-neutral: ${forbidden}`);
  assert.ok(!art.includes(forbidden),`V2 atlas renderer must remain economy-neutral: ${forbidden}`);
  assert.ok(!baseModule.includes(forbidden),`V2 base art integration must remain economy-neutral: ${forbidden}`);
}

console.log('Visual Rebuild V2 structural contract: illustrated field, upright player, stable assignment controls, mature industrial chrome, authored base scenes and route map: PASS');
