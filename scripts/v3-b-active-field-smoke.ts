import assert from 'node:assert/strict';
import {
  V3B_BASE_CRIT_CHANCE,
  V3B_BASE_CRIT_MULTIPLIER,
  V3B_HIT_INTERVAL_SEC,
  effectiveCombatDps,
  pileChildBlueprints,
  resolveCombatHit,
  splitPileDropBudget,
  sumDropResources,
  unloadRawCargo
} from '../src/active_field_v3.ts';
import type { DropResult, SalvageTarget } from '../src/sim.ts';

const rawDps = 100;
assert.equal(
  effectiveCombatDps(rawDps),
  rawDps * (1 + V3B_BASE_CRIT_CHANCE * (V3B_BASE_CRIT_MULTIPLIER - 1)),
  'effective DPS must include expected crit contribution'
);

const normal = resolveCombatHit(rawDps, 0.99);
const crit = resolveCombatHit(rawDps, 0.01);
assert.equal(normal.critical, false);
assert.equal(crit.critical, true);
assert.equal(normal.damage, rawDps * V3B_HIT_INTERVAL_SEC);
assert.equal(crit.damage, normal.damage * V3B_BASE_CRIT_MULTIPLIER);

const cargo = { metal: 70, copper: 20, plastic: 10 };
const storage = { metal: 20, copper: 5, plastic: 5 };
const partial = unloadRawCargo(cargo, storage, 80);
assert.equal(partial.movedKg, 50, 'finite storage must only accept available room');
assert.equal(partial.remaining.metal, 20, 'overflow must remain in cargo');
assert.equal(partial.remaining.copper, 20);
assert.equal(partial.remaining.plastic, 10);
assert.equal(partial.storage.metal + partial.storage.copper + partial.storage.plastic, 80);

const full = unloadRawCargo(partial.remaining, partial.storage, Number.POSITIVE_INFINITY);
assert.equal(full.movedKg, 50);
assert.deepEqual(full.remaining, { metal: 0, copper: 0, plastic: 0 });

const budget: DropResult = {
  resources: { metal: 7.3, copper: 2.1, plastic: 0.8 },
  component: 'motor'
};
const pieces = splitPileDropBudget(budget, 3);
const recombined = sumDropResources(pieces);
for (const key of ['metal', 'copper', 'plastic'] as const) {
  assert.ok(Math.abs(recombined[key] - budget.resources[key]) < 1e-9, `${key} reward budget must be exact`);
}
assert.equal(pieces.filter(piece => piece.component === 'motor').length, 1, 'component must be assigned exactly once');

const parent: SalvageTarget = {
  id: 10,
  classId: 'large_appliance',
  x: 500,
  y: 420,
  hp: 500,
  maxHp: 500,
  rotation: 0,
  variant: 2,
  alive: true
};
const children = pileChildBlueprints(parent);
assert.equal(children.length, 3);
assert.equal(new Set(children.map(child => child.classId)).size, 3, 'pile should expose visibly different child target classes');
assert.ok(children.every(child => child.x !== parent.x || child.y !== parent.y));

console.log('V3-B active field domain smoke: PASS');
