import assert from 'node:assert/strict';
import {
  activeWorkshopActions, advanceWorkshopScheduler, batchRemainingCount, cancelWorkshopAction,
  createBatchAction, createOneShotAction, createWorkshopScheduler, enqueueWorkshopAction,
  moveWaitingAction, removeTerminalWorkshopActions, reorderWaitingAction, setWaitingBatchCount,
  waitingWorkshopActions, type WorkshopQueueAction, type WorkshopSchedulerAdapter,
} from '../src/workshop_scheduler.ts';

interface Inventory{metal:number;copper:number;briquette:number;cleanCopper:number;upgradeCompleted:number;otherCompleted:number}
function adapter(inv:Inventory):WorkshopSchedulerAdapter{
  return{
    canStart(action){
      if(action.kind==='process_batch'&&action.inputResource==='metal')return inv.metal>=(action.inputAmount??0)?{ok:true}:{ok:false,reason:'Нет металла'};
      if(action.kind==='process_batch'&&action.inputResource==='copper')return inv.copper>=(action.inputAmount??0)?{ok:true}:{ok:false,reason:'Нет меди'};
      return{ok:true};
    },
    commit(action){
      if(action.kind==='process_batch'&&action.inputResource==='metal')inv.metal-=action.inputAmount??0;
      if(action.kind==='process_batch'&&action.inputResource==='copper')inv.copper-=action.inputAmount??0;
    },
    complete(action){
      if(action.kind==='process_batch'&&action.processKind==='briquette')inv.briquette+=action.outputAmount??0;
      else if(action.kind==='process_batch'&&action.processKind==='cleanCopper')inv.cleanCopper+=action.outputAmount??0;
      else if(action.kind==='equipment')inv.upgradeCompleted++;
      else inv.otherCompleted++;
    }
  };
}

const upgrade=(id:string,createdAt=0,durationMs=100)=>createOneShotAction({id,kind:'equipment',label:'Улучшение инструмента',durationMs,createdAt,equipmentId:'tool'});
const press=(id:string,count=10,createdAt=0)=>createBatchAction({id,label:'Прессование металла',recipeId:'press:metal',machineId:'press',processKind:'briquette',inputResource:'metal',inputAmount:10,outputAmount:10,durationMs:10,requestedCount:count,createdAt});
const copper=(id:string,count=10,createdAt=0)=>createBatchAction({id,label:'Зачистка меди',recipeId:'wire:copper',machineId:'wire',processKind:'cleanCopper',inputResource:'copper',inputAmount:5,outputAmount:5,durationMs:20,requestedCount:count,createdAt});

// 1. Canonical owner scenario: one slot runs upgrade -> press x10 -> copper x10 in strict order, including a single offline catch-up call.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:200,copper:100,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,upgrade('upgrade'));
  enqueueWorkshopAction(state,press('metal10'));
  enqueueWorkshopAction(state,copper('copper10'));
  const events=advanceWorkshopScheduler(state,1_000,1,a);
  const firstStarts=events.filter(e=>e.type==='started').slice(0,3).map(e=>e.actionId);
  assert.deepEqual(firstStarts,['upgrade','metal10','metal10'],'batch must retain its slot/priority stack-by-stack before the next logical action');
  assert.equal(inv.upgradeCompleted,1);assert.equal(inv.briquette,100);assert.equal(inv.cleanCopper,50);
  assert.equal(state.actions.find(x=>x.id==='metal10')?.status,'completed');assert.equal(state.actions.find(x=>x.id==='copper10')?.status,'completed');
}

// 2. Partial batch cancellation: four completed stacks survive; active fifth stack and future remainder are cancelled, then the next action starts.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:200,copper:100,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,press('metal10'));
  enqueueWorkshopAction(state,copper('nextCopper',2));
  advanceWorkshopScheduler(state,40,1,a);
  const batch=state.actions.find(x=>x.id==='metal10');assert.ok(batch&&batch.kind==='process_batch');
  assert.equal(batch.completedCount,4);assert.equal(batch.status,'active');assert.equal(batchRemainingCount(batch),5);
  assert.equal(inv.briquette,40);
  const safe=cancelWorkshopAction(state,'metal10',false,40);assert.equal(safe.needsConfirmation,true);assert.equal(safe.ok,false);assert.equal(batch.status,'active');
  const confirmed=cancelWorkshopAction(state,'metal10',true,40);assert.equal(confirmed.ok,true);assert.equal(confirmed.completedCount,4);assert.equal(inv.briquette,40,'completed output must never roll back');
  advanceWorkshopScheduler(state,40,1,a);assert.equal(state.actions.find(x=>x.id==='nextCopper')?.status,'active','next queued action starts immediately after confirmed cancellation');
}

// 3. Waiting batch count edits and reorder. Active action cannot be moved or edited.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:200,copper:100,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,upgrade('active',0,1000));enqueueWorkshopAction(state,press('metal',10));enqueueWorkshopAction(state,copper('copper',10));
  advanceWorkshopScheduler(state,0,1,a);assert.equal(activeWorkshopActions(state)[0]?.id,'active');
  assert.equal(reorderWaitingAction(state,'active',1),false);assert.equal(setWaitingBatchCount(state,'active',2),false);
  assert.equal(setWaitingBatchCount(state,'copper',6),true);const c=state.actions.find(x=>x.id==='copper');assert.ok(c&&c.kind==='process_batch');assert.equal(c.requestedCount,6);
  assert.equal(moveWaitingAction(state,'copper',-1),true);assert.deepEqual(waitingWorkshopActions(state).map(x=>x.id),['copper','metal']);
  advanceWorkshopScheduler(state,1_000,1,a);assert.equal(activeWorkshopActions(state)[0]?.id,'copper','edited priority must decide the next action after the fixed active item');
}

// 4. Exactly two logical actions run concurrently with two slots; third stays waiting until a slot frees.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:100,copper:50,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,upgrade('one',0,100));enqueueWorkshopAction(state,press('two',2));enqueueWorkshopAction(state,copper('three',2));
  advanceWorkshopScheduler(state,0,2,a);assert.deepEqual(activeWorkshopActions(state).map(x=>x.id),['one','two']);assert.equal(waitingWorkshopActions(state)[0]?.id,'three');
  advanceWorkshopScheduler(state,10,2,a);assert.equal(activeWorkshopActions(state).length,2,'never exceed exactly two active logical actions');
  assert.ok(activeWorkshopActions(state).some(x=>x.id==='three'),'third action may enter only after the short batch frees its slot');
}

// 5. Blocked batch preserves its progress and does not prevent a later eligible action from using the free slot.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:10,copper:20,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,press('needsMetal',3));enqueueWorkshopAction(state,copper('canRun',1));
  advanceWorkshopScheduler(state,100,1,a);
  const blocked=state.actions.find(x=>x.id==='needsMetal');assert.ok(blocked&&blocked.kind==='process_batch');assert.equal(blocked.completedCount,1);assert.equal(blocked.status,'blocked');assert.equal(blocked.blockedReason,'Нет металла');
  assert.equal(inv.briquette,10);assert.equal(inv.cleanCopper,5,'later eligible work must not be starved by a blocked batch');
  inv.metal=20;advanceWorkshopScheduler(state,200,1,a);assert.equal(blocked.status,'completed');assert.equal(blocked.completedCount,3);
}

// 6. Waiting removal is immediate; terminal cleanup never changes already-completed outputs.
{
  const state=createWorkshopScheduler(0),inv:Inventory={metal:50,copper:50,briquette:0,cleanCopper:0,upgradeCompleted:0,otherCompleted:0},a=adapter(inv);
  enqueueWorkshopAction(state,press('removeMe',2));const result=cancelWorkshopAction(state,'removeMe');assert.equal(result.ok,true);assert.equal(result.needsConfirmation,false);removeTerminalWorkshopActions(state);assert.equal(state.actions.length,0);
}

console.log('Workshop scheduler deterministic smoke: PASS');
