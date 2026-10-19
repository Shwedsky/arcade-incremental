import type { MachineId } from './garage.ts';
import type { EquipmentId, ProcessKind } from './early_game.ts';
import type { ResourceKind } from './sim.ts';

export type WorkshopQueueStatus='waiting'|'active'|'blocked'|'completed'|'cancelled';
export type WorkshopQueueKind='build_machine'|'upgrade_machine'|'equipment'|'process_batch'|'industrial_batch';

export interface WorkshopExecution{
  startedAt:number;
  endsAt:number;
}

interface WorkshopQueueBase{
  id:string;
  kind:WorkshopQueueKind;
  label:string;
  status:WorkshopQueueStatus;
  orderKey:number;
  createdAt:number;
  durationMs:number;
  current:WorkshopExecution|null;
  blockedReason:string|null;
}

export interface WorkshopOneShotAction extends WorkshopQueueBase{
  kind:'build_machine'|'upgrade_machine'|'equipment';
  machineId?:MachineId;
  targetLevel?:number;
  equipmentId?:EquipmentId;
  inputsCommitted:boolean;
}

export interface WorkshopBatchAction extends WorkshopQueueBase{
  kind:'process_batch'|'industrial_batch';
  recipeId:string;
  machineId?:MachineId;
  processKind?:ProcessKind;
  inputResource?:ResourceKind;
  inputAmount?:number;
  outputAmount?:number;
  requestedCount:number;
  completedCount:number;
}

export type WorkshopQueueAction=WorkshopOneShotAction|WorkshopBatchAction;

export interface WorkshopSchedulerState{
  actions:WorkshopQueueAction[];
  lastAdvancedAt:number;
}

export type WorkshopSchedulerEventType='started'|'stack_completed'|'action_completed'|'blocked'|'cancelled';
export interface WorkshopSchedulerEvent{
  type:WorkshopSchedulerEventType;
  actionId:string;
  at:number;
  completedCount?:number;
  reason?:string;
}

export interface WorkshopStartCheck{ok:boolean;reason?:string}

/**
 * The adapter owns game-specific inventory/effects. The scheduler owns only
 * deterministic ordering/timing. `commit` is called exactly when a one-shot
 * action or one batch stack actually starts; `complete` is called only when
 * that execution reaches its end timestamp.
 */
export interface WorkshopSchedulerAdapter{
  canStart(action:WorkshopQueueAction):WorkshopStartCheck;
  commit(action:WorkshopQueueAction):void;
  complete(action:WorkshopQueueAction):void;
}

export interface CancelWorkshopResult{
  ok:boolean;
  needsConfirmation:boolean;
  wasActive:boolean;
  completedCount:number;
}

const isBatch=(action:WorkshopQueueAction):action is WorkshopBatchAction=>action.kind==='process_batch'||action.kind==='industrial_batch';
const isTerminal=(action:WorkshopQueueAction)=>action.status==='completed'||action.status==='cancelled';
const safeCount=(value:number)=>Math.max(1,Math.floor(Number.isFinite(value)?value:1));

export function createWorkshopScheduler(now=Date.now()):WorkshopSchedulerState{
  return{actions:[],lastAdvancedAt:now};
}

export function createOneShotAction(input:{
  id:string;kind:'build_machine'|'upgrade_machine'|'equipment';label:string;durationMs:number;createdAt:number;orderKey?:number;
  machineId?:MachineId;targetLevel?:number;equipmentId?:EquipmentId;inputsCommitted?:boolean;
}):WorkshopOneShotAction{
  return{
    id:input.id,kind:input.kind,label:input.label,status:'waiting',orderKey:input.orderKey??0,createdAt:input.createdAt,
    durationMs:Math.max(1,input.durationMs),current:null,blockedReason:null,machineId:input.machineId,targetLevel:input.targetLevel,
    equipmentId:input.equipmentId,inputsCommitted:input.inputsCommitted??false
  };
}

export function createBatchAction(input:{
  id:string;kind?:'process_batch'|'industrial_batch';label:string;recipeId:string;durationMs:number;requestedCount:number;createdAt:number;orderKey?:number;
  machineId?:MachineId;processKind?:ProcessKind;inputResource?:ResourceKind;inputAmount?:number;outputAmount?:number;
}):WorkshopBatchAction{
  return{
    id:input.id,kind:input.kind??'process_batch',label:input.label,status:'waiting',orderKey:input.orderKey??0,createdAt:input.createdAt,
    durationMs:Math.max(1,input.durationMs),current:null,blockedReason:null,recipeId:input.recipeId,machineId:input.machineId,processKind:input.processKind,
    inputResource:input.inputResource,inputAmount:input.inputAmount,outputAmount:input.outputAmount,requestedCount:safeCount(input.requestedCount),completedCount:0
  };
}

function orderedActions(state:WorkshopSchedulerState):WorkshopQueueAction[]{
  return [...state.actions].filter(action=>!isTerminal(action)).sort((a,b)=>a.orderKey-b.orderKey||a.createdAt-b.createdAt||a.id.localeCompare(b.id));
}

export function normalizeWorkshopOrder(state:WorkshopSchedulerState):void{
  orderedActions(state).forEach((action,index)=>{action.orderKey=index});
}

export function enqueueWorkshopAction(state:WorkshopSchedulerState,action:WorkshopQueueAction):boolean{
  if(state.actions.some(existing=>existing.id===action.id))return false;
  const maxOrder=state.actions.reduce((max,item)=>Math.max(max,item.orderKey),-1);
  action.orderKey=Math.max(maxOrder+1,action.orderKey);
  action.status='waiting';action.current=null;action.blockedReason=null;
  state.actions.push(action);normalizeWorkshopOrder(state);return true;
}

export function activeWorkshopActions(state:WorkshopSchedulerState):WorkshopQueueAction[]{
  return orderedActions(state).filter(action=>action.status==='active'&&action.current);
}

export function waitingWorkshopActions(state:WorkshopSchedulerState):WorkshopQueueAction[]{
  return orderedActions(state).filter(action=>action.status==='waiting'||action.status==='blocked');
}

function startAction(action:WorkshopQueueAction,at:number,adapter:WorkshopSchedulerAdapter,events:WorkshopSchedulerEvent[]):boolean{
  const check=adapter.canStart(action);
  if(!check.ok){
    const reason=check.reason??'Недоступно';
    if(action.status!=='blocked'||action.blockedReason!==reason)events.push({type:'blocked',actionId:action.id,at,reason});
    action.status='blocked';action.blockedReason=reason;action.current=null;return false;
  }
  action.status='active';action.blockedReason=null;
  if(!isBatch(action)&&action.inputsCommitted){
    // Migrated legacy active/committed work may use this flag. A waiting action
    // should normally be false and commit here exactly once.
  }else{
    adapter.commit(action);
    if(!isBatch(action))action.inputsCommitted=true;
  }
  action.current={startedAt:at,endsAt:at+Math.max(1,action.durationMs)};
  events.push({type:'started',actionId:action.id,at,completedCount:isBatch(action)?action.completedCount:undefined});
  return true;
}

function completeAt(state:WorkshopSchedulerState,at:number,adapter:WorkshopSchedulerAdapter,events:WorkshopSchedulerEvent[]):void{
  const due=activeWorkshopActions(state).filter(action=>(action.current?.endsAt??Infinity)<=at);
  for(const action of due){
    adapter.complete(action);
    action.current=null;
    if(isBatch(action)){
      action.completedCount=Math.min(action.requestedCount,action.completedCount+1);
      events.push({type:'stack_completed',actionId:action.id,at,completedCount:action.completedCount});
      if(action.completedCount>=action.requestedCount){action.status='completed';events.push({type:'action_completed',actionId:action.id,at,completedCount:action.completedCount})}
      else action.status='waiting';
    }else{
      action.status='completed';events.push({type:'action_completed',actionId:action.id,at});
    }
  }
}

function fillFreeSlots(state:WorkshopSchedulerState,at:number,slotCount:number,adapter:WorkshopSchedulerAdapter,events:WorkshopSchedulerEvent[]):number{
  let active=activeWorkshopActions(state).length,started=0;
  if(active>=slotCount)return 0;
  for(const action of orderedActions(state)){
    if(active>=slotCount)break;
    if(action.status!=='waiting'&&action.status!=='blocked')continue;
    if(action.createdAt>at)continue;
    if(isBatch(action)&&action.completedCount>=action.requestedCount){action.status='completed';continue}
    if(startAction(action,at,adapter,events)){active++;started++}
  }
  return started;
}

function nextCreatedAt(state:WorkshopSchedulerState,after:number):number|undefined{
  let next: number|undefined;
  for(const action of orderedActions(state)){
    if((action.status==='waiting'||action.status==='blocked')&&action.createdAt>after)next=next===undefined?action.createdAt:Math.min(next,action.createdAt);
  }
  return next;
}

/**
 * Advances both live and offline workshop time. It can cross any number of
 * stack/action boundaries in one call and fills newly freed slots at the exact
 * completion timestamp, so offline behavior matches live behavior.
 */
export function advanceWorkshopScheduler(state:WorkshopSchedulerState,targetNow:number,slotCount:number,adapter:WorkshopSchedulerAdapter):WorkshopSchedulerEvent[]{
  const events:WorkshopSchedulerEvent[]=[];
  const slots=Math.max(0,Math.floor(slotCount));
  if(slots<=0){state.lastAdvancedAt=Math.max(state.lastAdvancedAt,targetNow);return events}
  const end=Math.max(state.lastAdvancedAt,targetNow);
  let cursor=Math.min(state.lastAdvancedAt,end),guard=0;

  while(guard++<100_000){
    completeAt(state,cursor,adapter,events);
    const started=fillFreeSlots(state,cursor,slots,adapter,events);
    const active=activeWorkshopActions(state);
    const nextEnd=active.length?Math.min(...active.map(action=>action.current!.endsAt)):undefined;
    const created=active.length<slots?nextCreatedAt(state,cursor):undefined;
    const candidates=[nextEnd,created].filter((value):value is number=>value!==undefined&&value>cursor&&value<=end);
    if(candidates.length){cursor=Math.min(...candidates);continue}
    if(nextEnd!==undefined&&nextEnd<=end){cursor=nextEnd;continue}
    if(started>0)continue;
    break;
  }
  if(guard>=100_000)throw new Error('Workshop scheduler advancement guard exceeded');
  state.lastAdvancedAt=end;
  normalizeWorkshopOrder(state);
  return events;
}

export function setWaitingBatchCount(state:WorkshopSchedulerState,actionId:string,requestedCount:number):boolean{
  const action=state.actions.find(item=>item.id===actionId);
  if(!action||!isBatch(action)||action.status==='active'||isTerminal(action))return false;
  const next=Math.max(action.completedCount,safeCount(requestedCount));
  action.requestedCount=next;
  if(action.completedCount>=action.requestedCount)action.status='completed';
  else if(action.status==='blocked')action.blockedReason=null,action.status='waiting';
  return true;
}

export function reorderWaitingAction(state:WorkshopSchedulerState,actionId:string,targetWaitingIndex:number):boolean{
  const action=state.actions.find(item=>item.id===actionId);
  if(!action||action.status==='active'||isTerminal(action))return false;
  const waiting=waitingWorkshopActions(state);
  const from=waiting.findIndex(item=>item.id===actionId);if(from<0)return false;
  const target=Math.max(0,Math.min(waiting.length-1,Math.floor(targetWaitingIndex)));
  if(from===target)return true;
  waiting.splice(from,1);waiting.splice(target,0,action);
  const active=orderedActions(state).filter(item=>item.status==='active');
  const merged=[...active,...waiting];
  // Preserve active actions as fixed occupants; user order applies only to the
  // waiting list behind them. Active cards therefore never move by drag/drop.
  merged.forEach((item,index)=>{item.orderKey=index});
  return true;
}

export function moveWaitingAction(state:WorkshopSchedulerState,actionId:string,direction:-1|1):boolean{
  const waiting=waitingWorkshopActions(state),index=waiting.findIndex(item=>item.id===actionId);
  return index>=0?reorderWaitingAction(state,actionId,index+direction):false;
}

export function cancelWorkshopAction(state:WorkshopSchedulerState,actionId:string,confirmActive=false,at=Date.now()):CancelWorkshopResult{
  const action=state.actions.find(item=>item.id===actionId);
  if(!action||isTerminal(action))return{ok:false,needsConfirmation:false,wasActive:false,completedCount:isBatch(action as WorkshopQueueAction)?(action as WorkshopBatchAction).completedCount:0};
  const wasActive=action.status==='active'&&!!action.current,completedCount=isBatch(action)?action.completedCount:0;
  if(wasActive&&!confirmActive)return{ok:false,needsConfirmation:true,wasActive:true,completedCount};
  action.current=null;action.status='cancelled';action.blockedReason=null;
  normalizeWorkshopOrder(state);
  return{ok:true,needsConfirmation:false,wasActive,completedCount};
}

export function removeTerminalWorkshopActions(state:WorkshopSchedulerState):void{
  state.actions=state.actions.filter(action=>!isTerminal(action));normalizeWorkshopOrder(state);
}

export function batchRemainingCount(action:WorkshopBatchAction):number{
  const current=action.status==='active'&&action.current?1:0;
  return Math.max(0,action.requestedCount-action.completedCount-current);
}
