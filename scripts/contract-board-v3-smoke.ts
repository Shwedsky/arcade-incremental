import assert from 'node:assert/strict';
import {
  deliverStandingV3,specialOrdersV3,standingBuyersForContext,standingCompleted,standingProgress,advanceSpecialOrderV3
} from '../src/contract_board_v3.ts';
import type {ContractState} from '../src/early_game.ts';

const state:ContractState={index:0,completed:0};
const ctx={level:16,capabilities:new Set<string>([
  'processed:briquette','processed:cleanCopper','processed:granulate','component:bearing','component:motor','component:hydraulic','component:electronics',
  'mid:pump','mid:compressor','materialB:steelBlank','materialB:aluminiumBillet','moduleB:drive','moduleB:control','moduleB:structural','industrialB:gearbox','industrialB:generator',
  'materialC:alloyBillet','moduleC:hydraulicPower','moduleC:heavyFrame','industrialC:industrialController','industrialC:heavyHydraulicCylinder','base:processingPlant'
])};
const buyers=standingBuyersForContext(ctx);
assert.ok(buyers.length>=6,'late game keeps all permanent buyers visible');
const metal=buyers.find(buyer=>buyer.id==='standing_metal')!;
let delivery=deliverStandingV3(state,metal.id,10,10,1)!;
assert.equal(delivery.consumed,10);assert.equal(delivery.batchesCompleted,0);assert.equal(standingProgress(state,metal.id),10);
delivery=deliverStandingV3(state,metal.id,20,20,1)!;
assert.equal(delivery.consumed,20);assert.equal(delivery.batchesCompleted,1,'partial deliveries roll through a standing batch instead of disappearing');
assert.equal(standingProgress(state,metal.id),6);assert.equal(standingCompleted(state,metal.id),1);
assert.ok(delivery.cash>0);

const offers=specialOrdersV3(state,ctx,3);
assert.equal(offers.length,3);
assert.ok(offers.every(offer=>offer.family!=='raw'),'special orders must not be another bulk raw-material drain');
assert.equal(new Set(offers.map(offer=>offer.id)).size,3);
const before=offers[0].id;advanceSpecialOrderV3(state,offers[0]);
const after=specialOrdersV3(state,ctx,3);
assert.equal(after.length,3);assert.ok(!after.slice(0,1).some(offer=>offer.id===before),'completed special order rotates while standing buyers remain');

console.log('Contract Board V3 standing partial buyers + non-raw special orders: PASS');
