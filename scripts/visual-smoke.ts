import { strict as assert } from 'node:assert';
import { MACHINE_DEFS } from '../src/garage.ts';
import { ZONE_DEFS, type ZoneId } from '../src/midgame.ts';
import { TARGET_CLASSES } from '../src/sim.ts';
import { makeDecor } from '../src/field_view.ts';
import { MACHINE_VISUALS, TARGET_VISUALS, ZONE_VISUALS, validateVisualFoundation } from '../src/visual_theme.ts';

const errors=validateVisualFoundation();
assert.deepEqual(errors,[],`visual metadata errors: ${errors.join(', ')}`);

for(const id of ['z1','z2','z3'] as ZoneId[]){
  assert.ok(ZONE_DEFS[id],`missing gameplay zone ${id}`);
  const theme=ZONE_VISUALS[id];
  assert.ok(theme.label.length>3);
  assert.notEqual(theme.groundTop,theme.groundBottom);
  let seed=17;
  const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const decor=makeDecor(rng,2200,1400,id);
  assert.ok(decor.length>=70,`${id} decor too sparse`);
  assert.ok(new Set(decor.map(d=>d.kind)).size>=4,`${id} decor variety too low`);
}

for(const target of TARGET_CLASSES){
  const visual=TARGET_VISUALS[target.id];
  assert.ok(visual,`missing target visual ${target.id}`);
  assert.ok(visual.depthPx>=4,`${target.id} missing pseudo depth`);
}

for(const id of Object.keys(MACHINE_DEFS) as (keyof typeof MACHINE_DEFS)[]){
  assert.ok(MACHINE_VISUALS[id],`missing machine floor metadata ${id}`);
}

assert.notEqual(ZONE_VISUALS.z1.groundTop,ZONE_VISUALS.z2.groundTop);
assert.notEqual(ZONE_VISUALS.z2.groundTop,ZONE_VISUALS.z3.groundTop);
assert.notEqual(ZONE_VISUALS.z1.accent,ZONE_VISUALS.z3.accent);

console.log(JSON.stringify({
  zones:Object.values(ZONE_VISUALS).map(z=>({id:z.id,label:z.label,decorFamilies:new Set(z.decor).size})),
  targetVisuals:Object.keys(TARGET_VISUALS).length,
  machineVisuals:Object.keys(MACHINE_VISUALS).length
},null,2));
console.log('visual foundation smoke: PASS');
