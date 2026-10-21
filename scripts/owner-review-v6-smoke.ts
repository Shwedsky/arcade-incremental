import assert from 'node:assert/strict';
import {createDefaultWorkforceFleetV3,hireWorkerV3,nextWorkerHireCost,workerHireBandForCount} from '../src/workforce_fleet_v3.ts';
import {formatXpGain,formatUiNumber} from '../src/ui_format.ts';

const state=createDefaultWorkforceFleetV3(1);
const expected=[
  [0,35_000],[1,35_000],[2,35_000],
  [3,55_000],[4,55_000],
  [5,90_000],[7,90_000],
  [8,140_000],[11,140_000],
  [12,220_000],[15,220_000]
] as const;

for(let count=0;count<=15;count++){
  while(state.workers.length<count)assert.ok(hireWorkerV3(state,'processing_plant',1));
  const pair=expected.find(([n])=>n===count);
  if(pair)assert.equal(nextWorkerHireCost(state),pair[1],`hire cost at ${count} workers`);
}
assert.equal(workerHireBandForCount(13).cost,220_000);
assert.ok(nextWorkerHireCost(state)<=220_000,'late worker hire must never explode into multi-million exponential pricing');

assert.equal(formatXpGain(3.9000000000000004),'+3.9 XP');
assert.equal(formatXpGain(4),'+4 XP');
assert.equal(formatXpGain(12.049999999999),'+12.1 XP');
assert.equal(formatUiNumber(0.30000000000000004,1),'0.3');

console.log('Owner Review V6 domain acceptance: hire bands + bounded late cost + XP formatting: PASS');
