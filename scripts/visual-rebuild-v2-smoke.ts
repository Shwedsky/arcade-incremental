import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const field=readFileSync(`${root}src/field_view.ts`,'utf8');
const art=readFileSync(`${root}src/field_art_v2.ts`,'utf8');
const atlasPath=`${root}public/art/v2/field_atlas.svg`;
const docPath=`${root}docs/VISUAL_REBUILD_V2.md`;

assert.ok(existsSync(atlasPath),'V2 field atlas must exist');
assert.ok(existsSync(docPath),'Visual Rebuild V2 production contract must exist');
const atlas=readFileSync(atlasPath,'utf8');
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
assert.ok(doc.includes('Green CI alone is not acceptance.'),'V2 contract must explicitly keep visual quality as a human gate');

for(const forbidden of ['rollDrops(','gainXp(','addActiveMastery(','zoneYieldMultiplier(','componentChance']){
  assert.ok(!field.includes(forbidden),`V2 presentation path must remain economy-neutral: ${forbidden}`);
  assert.ok(!art.includes(forbidden),`V2 atlas renderer must remain economy-neutral: ${forbidden}`);
}

console.log('Visual Rebuild V2 Sprint 1 structural contract: illustrated character + salvage families + 3-state large damage + reward-neutral break debris: PASS');
