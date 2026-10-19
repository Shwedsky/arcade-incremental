import type { WorkshopJob } from './early_game.ts';
import type {
  WorkshopBatchAction, WorkshopOneShotAction, WorkshopQueueAction, WorkshopSchedulerState,
} from './workshop_scheduler.ts';

/**
 * Save V7 stored only already-running WorkshopJob entries. Their inputs were
 * consumed before the save was written. Migration therefore preserves them as
 * ACTIVE executions and must never call the new scheduler commit hook again.
 */
export function migrateLegacyWorkshopJobs(jobs:WorkshopJob[]|undefined,lastSeen:number,now=Date.now()):WorkshopSchedulerState{
  const source=Array.isArray(jobs)?jobs:[];
  const ordered=[...source].sort((a,b)=>a.startedAt-b.startedAt||a.endsAt-b.endsAt||a.id.localeCompare(b.id));
  const actions:WorkshopQueueAction[]=ordered.map((job,index)=>legacyJobToAction(job,index));
  const safestLastAdvanced=Number.isFinite(lastSeen)?Math.min(lastSeen,now):now;
  return{actions,lastAdvancedAt:safestLastAdvanced};
}

function legacyJobToAction(job:WorkshopJob,orderKey:number):WorkshopQueueAction{
  const startedAt=finiteTimestamp(job.startedAt,Date.now());
  const endsAt=Math.max(startedAt+1,finiteTimestamp(job.endsAt,startedAt+1));
  const durationMs=Math.max(1,endsAt-startedAt);
  if(job.kind==='process'){
    const action:WorkshopBatchAction={
      id:job.id,kind:'process_batch',label:job.label,status:'active',orderKey,createdAt:startedAt,durationMs,
      current:{startedAt,endsAt},blockedReason:null,
      recipeId:`legacy:${job.machineId??'unknown'}:${job.processKind??'unknown'}`,
      machineId:job.machineId,processKind:job.processKind,inputResource:job.inputResource,inputAmount:job.inputAmount,
      outputAmount:job.outputAmount,requestedCount:1,completedCount:0
    };
    return action;
  }
  const action:WorkshopOneShotAction={
    id:job.id,kind:job.kind,label:job.label,status:'active',orderKey,createdAt:startedAt,durationMs,
    current:{startedAt,endsAt},blockedReason:null,machineId:job.machineId,targetLevel:job.targetLevel,equipmentId:job.equipmentId,
    // Critical migration marker: legacy runtime already consumed the recipe.
    inputsCommitted:true
  };
  return action;
}

function finiteTimestamp(value:number,fallback:number):number{
  return Number.isFinite(value)?value:fallback;
}

/**
 * Defensive normalization for persisted V8 scheduler data. Invalid terminal
 * fragments are retained only when structurally safe; active actions without a
 * current execution are downgraded to waiting so they can restart normally.
 */
export function normalizeWorkshopScheduler(value:Partial<WorkshopSchedulerState>|undefined,now=Date.now()):WorkshopSchedulerState{
  if(!value||!Array.isArray(value.actions))return{actions:[],lastAdvancedAt:now};
  const seen=new Set<string>();
  const actions:WorkshopQueueAction[]=[];
  for(const raw of value.actions as WorkshopQueueAction[]){
    if(!raw||typeof raw.id!=='string'||!raw.id||seen.has(raw.id))continue;
    if(!['build_machine','upgrade_machine','equipment','process_batch','industrial_batch'].includes(raw.kind))continue;
    seen.add(raw.id);
    const action=structuredClone(raw) as WorkshopQueueAction;
    action.orderKey=Number.isFinite(action.orderKey)?action.orderKey:actions.length;
    action.createdAt=Number.isFinite(action.createdAt)?action.createdAt:now;
    action.durationMs=Math.max(1,Number.isFinite(action.durationMs)?action.durationMs:1);
    action.blockedReason=typeof action.blockedReason==='string'?action.blockedReason:null;
    if(action.status==='active'&&(!action.current||!Number.isFinite(action.current.startedAt)||!Number.isFinite(action.current.endsAt))){
      action.status='waiting';action.current=null;
    }
    if(action.current){
      action.current.startedAt=Number.isFinite(action.current.startedAt)?action.current.startedAt:now;
      action.current.endsAt=Math.max(action.current.startedAt+1,Number.isFinite(action.current.endsAt)?action.current.endsAt:action.current.startedAt+action.durationMs);
    }
    if(action.kind==='process_batch'||action.kind==='industrial_batch'){
      action.requestedCount=Math.max(1,Math.floor(Number.isFinite(action.requestedCount)?action.requestedCount:1));
      action.completedCount=Math.max(0,Math.min(action.requestedCount,Math.floor(Number.isFinite(action.completedCount)?action.completedCount:0)));
      if(action.completedCount>=action.requestedCount&&!action.current)action.status='completed';
    }else{
      const oneShot=action as WorkshopOneShotAction;
      oneShot.inputsCommitted=Boolean(oneShot.inputsCommitted);
    }
    actions.push(action);
  }
  actions.sort((a,b)=>a.orderKey-b.orderKey||a.createdAt-b.createdAt||a.id.localeCompare(b.id)).forEach((action,index)=>{action.orderKey=index});
  return{actions,lastAdvancedAt:Number.isFinite(value.lastAdvancedAt)?Math.min(value.lastAdvancedAt!,now):now};
}
