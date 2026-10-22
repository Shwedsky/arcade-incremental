import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const field=readFileSync(`${root}src/field_view.ts`,'utf8');
const art=readFileSync(`${root}src/field_art_v2.ts`,'utf8');
const baseModule=readFileSync(`${root}src/base_stage_art_v2.ts`,'utf8');
const baseCss=readFileSync(`${root}src/base_stage_art_v2.css`,'utf8');
const atlasPath=`${root}public/art/v2/field_atlas.svg`;
const baseAtlasPath=`${root}public/art/v2/base_scenes.svg`;
const docPath=`${root}docs/VISUAL_REBUILD_V2.md`;

assert.ok(existsSync(atlasPath),'V2 field atlas must exist');
assert.ok(existsSync(baseAtlasPath),'V2 base scene atlas must exist');
assert.ok(existsSync(docPath),'Visual Rebuild V2 production contract must exist');
const atlas=readFileSync(atlasPath,'utf8');
const baseAtlas=readFileSync(baseAtlasPath,'utf8');
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

for(const marker of ['id="garage"','id="hangar"','id="yard"','id="industrial"','ЛИЧНЫЙ ГАРАЖ','ОПЕРАЦИОННЫЙ АНГАР','ПЛОЩАДКА РАЗБОРКИ','ПРОМЫШЛЕННАЯ МАСТЕРСКАЯ']){
  assert.ok(baseAtlas.includes(marker),`base atlas must contain authored scene marker: ${marker}`);
}
assert.ok(baseModule.includes("scene.prepend(art)"),'V2 base art must be attached behind live canonical overlays');
assert.ok(baseModule.includes("className='stageIllustrationV2'"),'V2 base layer must use a stable semantic class');
for(const stage of ['stage-garage','stage-hangar','stage-yard','stage-industrial'])assert.ok(baseCss.includes(`.${stage}`),`V2 CSS must author ${stage}`);
assert.ok(baseCss.includes("background-image:url('/art/v2/base_scenes.svg')"),'base surfaces must use the authored scene atlas rather than CSS-only primitive scenery');
assert.ok(baseCss.includes('.stage-industrial .productionCells'),'live production overlays must remain attached to the illustrated workshop');
assert.ok(doc.includes('Green CI alone is not acceptance.'),'V2 contract must explicitly keep visual quality as a human gate');

for(const forbidden of ['rollDrops(','gainXp(','addActiveMastery(','zoneYieldMultiplier(','componentChance']){
  assert.ok(!field.includes(forbidden),`V2 presentation path must remain economy-neutral: ${forbidden}`);
  assert.ok(!art.includes(forbidden),`V2 atlas renderer must remain economy-neutral: ${forbidden}`);
  assert.ok(!baseModule.includes(forbidden),`V2 base art integration must remain economy-neutral: ${forbidden}`);
}

console.log('Visual Rebuild V2 structural contract: illustrated field, real break debris and authored Garage/Hangar/Yard/Workshop scenes: PASS');
