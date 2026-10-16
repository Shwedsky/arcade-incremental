import assert from 'node:assert/strict';
import { FIELD_NODE_COUNT, TARGET_CLASSES, WORLD, expectedFieldMix, generateField, getTargetClass, hashSeed, mulberry32, rollDrops } from '../src/sim.ts';

const a = generateField('smoke-seed');
const b = generateField('smoke-seed');
assert.equal(a.length, FIELD_NODE_COUNT);
assert.deepEqual(a, b, 'field generation must be deterministic for a fixed seed');
assert.equal(TARGET_CLASSES.reduce((sum, item) => sum + item.share, 0).toFixed(6), '1.000000');
assert.ok(a.every((target) => target.x > 0 && target.x < WORLD.width && target.y > 0 && target.y < WORLD.height));

const mix = expectedFieldMix();
for (const def of TARGET_CLASSES) assert.ok(mix[def.id] >= 4 || def.share < 0.05, `expected mix too sparse for ${def.id}`);

const rng = mulberry32(hashSeed('drop-smoke'));
const totals = { metal: 0, copper: 0, plastic: 0 };
const components = { bearing: 0, motor: 0, hydraulic: 0, electronics: 0 };
let rolls = 0;
for (let repeat = 0; repeat < 600; repeat += 1) {
  for (const def of TARGET_CLASSES) {
    const result = rollDrops(def.id, rng);
    totals.metal += result.resources.metal;
    totals.copper += result.resources.copper;
    totals.plastic += result.resources.plastic;
    if (result.component) components[result.component] += 1;
    rolls += 1;
    assert.ok(result.resources.metal >= 0 && result.resources.copper >= 0 && result.resources.plastic >= 0);
    assert.ok(getTargetClass(def.id).breakSeconds > 0);
  }
}
assert.ok(totals.metal > totals.copper * 3, 'metal should dominate early raw mass');
assert.ok(totals.plastic > totals.copper, 'plastic should be more common than copper by mass');
assert.ok(Object.values(components).reduce((sum, value) => sum + value, 0) > 10, 'component drops should exist');
assert.ok(components.hydraulic < components.bearing + components.motor, 'hydraulic should remain rarer than common mechanical drops');

console.log(JSON.stringify({ fieldNodes: a.length, rolls, totals, components, mix }, null, 2));
console.log('salvage slice smoke: PASS');
