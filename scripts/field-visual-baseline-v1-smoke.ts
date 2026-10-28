import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const source=readFileSync(fileURLToPath(new URL('../src/field_view.ts',import.meta.url)),'utf8');

for(const token of ['DECOR_COUNT_BY_ZONE','DECOR_SIZE_BOOST_BY_ZONE','drawScrapStack','isNestedSalvage','drawNestedSalvageFoundation','drawNestedPiece','targetVisualRadius']){
  assert.ok(source.includes(token),`field visual baseline must include ${token}`);
}

assert.ok(source.includes("t.classId==='large_appliance'&&zone!=='z1'&&zone!=='z2'"),'large salvage must receive the composite treatment from Z3 onward');
assert.ok(source.includes("t.classId==='medium_appliance'&&lateCompositeZone(zone)&&t.variant===3"),'late-zone medium targets may participate in the composite proof');
assert.ok(source.includes('const spread=hp>.72?1:hp>.35?8:17'),'composite silhouette must visibly open as HP falls');
assert.ok(source.includes("z1:92,z2:80,z3:112,z4:118,z5:124,z6:132,z7:138,z8:126"),'later zones must have a bounded deterministic decor-density ramp');
assert.ok(source.includes("else if(d.kind==='scrapstack'){drawScrapStack(ctx,d)}"),'scrapstack decor must use the dedicated junk-mass renderer');
assert.ok(source.includes('visualRadius=targetVisualRadius(t,zone)'),'selected ring / HP bar must follow the larger composite footprint');

for(const forbidden of ['rollDrops(','gainXp(','addActiveMastery(','componentChance','zoneYieldMultiplier(']){
  assert.ok(!source.includes(forbidden),`presentation renderer must remain reward-neutral: ${forbidden}`);
}

console.log('Field Visual Baseline V1: composite matryoshka proof + zone density ramp + economy-neutral renderer: PASS');
