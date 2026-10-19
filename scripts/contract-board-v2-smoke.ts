import assert from 'node:assert/strict';
import {
  CONTRACT_BOARD_V2,activeBoardContract,advanceBoardContract,contractBoardPoolStats,contractSignature,
  eligibleBoardContracts,isDiscreteContractNeed,
  type ContractBoardContext
} from '../src/contract_board_v2.ts';
import type { ContractState } from '../src/early_game.ts';

const caps=(...values:string[])=>new Set(values);
const early:ContractBoardContext={level:1,capabilities:caps()};
const e=eligibleBoardContracts(early);
assert.ok(e.length>=2,'early board must have more than one readable contract');
assert.ok(e.every(x=>x.family==='raw'),'level 1 must not expose unavailable advanced content');
assert.equal(contractBoardPoolStats(early).total,CONTRACT_BOARD_V2.length);

const mid:ContractBoardContext={level:7,capabilities:caps(
  'component:bearing','component:motor','component:hydraulic','component:electronics',
  'processed:briquette','processed:cleanCopper','processed:granulate','mid:pump','mid:compressor'
)};
const midEligible=eligibleBoardContracts(mid);
assert.ok(midEligible.some(x=>x.family==='processed'));
assert.ok(midEligible.some(x=>x.id==='pump_service'));
assert.ok(midEligible.some(x=>x.id==='cold_chain'));
assert.ok(!midEligible.some(x=>x.id==='steel_contract'),'industrial order must stay locked without capability');

const late:ContractBoardContext={level:14,capabilities:caps(
  'component:bearing','component:motor','component:hydraulic','component:electronics',
  'processed:briquette','processed:cleanCopper','processed:granulate','mid:pump','mid:compressor',
  'materialB:steelBlank','materialB:aluminiumBillet','moduleB:drive','moduleB:control','industrialB:gearbox','industrialB:generator',
  'materialC:alloyBillet','moduleC:hydraulicPower','moduleC:heavyFrame','industrialC:industrialController','industrialC:heavyHydraulicCylinder'
)};
assert.ok(contractBoardPoolStats(late).eligible>=20,'late board should expose a large staged pool');
assert.equal(contractBoardPoolStats(late).families,4);

const legacy:ContractState={index:0,completed:0};
const seen:string[]=[];
const signatures:string[]=[];
for(let i=0;i<12;i++){
  const current=activeBoardContract(legacy,late);
  seen.push(current.id);signatures.push(contractSignature(current));
  advanceBoardContract(legacy,current);
}
assert.ok(new Set(seen).size>=8,'recent-history protection should create visible variety');
for(let i=1;i<seen.length;i++)assert.notEqual(seen[i],seen[i-1],'no immediate template repeats');
for(let i=1;i<signatures.length;i++)assert.notEqual(signatures[i],signatures[i-1],'no immediate requirement-signature repeats');
assert.equal(legacy.completed,12);
assert.equal(legacy.index,12);

const discrete=CONTRACT_BOARD_V2.flatMap(x=>x.needs).filter(isDiscreteContractNeed);
assert.ok(discrete.length>0);
assert.ok(discrete.every(x=>Number.isInteger(x.amount)),'discrete component/module requirements remain whole units');

console.log(JSON.stringify({templates:CONTRACT_BOARD_V2.length,early:e.length,mid:midEligible.length,late:contractBoardPoolStats(late),uniqueFirst12:new Set(seen).size},null,2));
console.log('Contract Board V2 deterministic smoke: PASS');
