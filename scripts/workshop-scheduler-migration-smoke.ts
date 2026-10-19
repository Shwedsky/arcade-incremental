import assert from 'node:assert/strict';
import type { WorkshopJob } from '../src/early_game.ts';
import { advanceWorkshopScheduler, activeWorkshopActions, type WorkshopSchedulerAdapter } from '../src/workshop_scheduler.ts';
import { migrateLegacyWorkshopJobs, normalizeWorkshopScheduler } from '../src/workshop_scheduler_migration.ts';

const jobs:WorkshopJob[]=[
  {id:'upgrade',kind:'equipment',label:'Инструмент → ур. 2',equipmentId:'tool',targetLevel:2,startedAt:1_000,endsAt:11_000},
  {id:'process',kind:'process',label:'Прессование металла',machineId:'press',processKind:'briquette',inputResource:'metal',inputAmount:10,outputAmount:10,startedAt:2_000,endsAt:7_000}
];

const migrated=migrateLegacyWorkshopJobs(jobs,4_000,20_000);
assert.equal(migrated.lastAdvancedAt,4_000);
assert.equal(migrated.actions.length,2);
assert.deepEqual(migrated.actions.map(a=>a.id),['upgrade','process']);
assert.equal(migrated.actions.every(a=>a.status==='active'),true);
const upgrade=migrated.actions[0];assert.equal(upgrade.kind,'equipment');if(upgrade.kind!=='equipment')throw new Error('expected equipment');assert.equal(upgrade.inputsCommitted,true);
const process=migrated.actions[1];assert.equal(process.kind,'process_batch');if(process.kind!=='process_batch')throw new Error('expected process batch');assert.equal(process.requestedCount,1);assert.equal(process.completedCount,0);assert.deepEqual(process.current,{startedAt:2_000,endsAt:7_000});

let commits=0,upgradeDone=0,processDone=0;
const adapter:WorkshopSchedulerAdapter={
  canStart:()=>({ok:true}),
  commit:()=>{commits++},
  complete(action){if(action.kind==='equipment')upgradeDone++;if(action.kind==='process_batch')processDone++}
};
advanceWorkshopScheduler(migrated,20_000,2,adapter);
assert.equal(commits,0,'migrated active V7 jobs already paid their inputs and must never commit again');
assert.equal(upgradeDone,1);assert.equal(processDone,1);
assert.equal(migrated.actions.every(a=>a.status==='completed'),true);

// A legacy job whose timer is still in the future must preserve its absolute timing.
const future=migrateLegacyWorkshopJobs([{...jobs[0],id:'future',startedAt:10_000,endsAt:30_000}],12_000,15_000);
assert.equal(activeWorkshopActions(future)[0]?.current?.endsAt,30_000);
advanceWorkshopScheduler(future,15_000,1,adapter);assert.equal(future.actions[0].status,'active');

// Defensive V8 normalization: duplicate IDs are discarded and malformed active state safely restarts as waiting.
const normalized=normalizeWorkshopScheduler({lastAdvancedAt:1_000,actions:[
  {...future.actions[0],id:'same',status:'active',current:null},
  {...future.actions[0],id:'same'}
]},5_000);
assert.equal(normalized.actions.length,1);assert.equal(normalized.actions[0].status,'waiting');assert.equal(normalized.actions[0].current,null);

console.log('Workshop scheduler V7 migration smoke: PASS');
