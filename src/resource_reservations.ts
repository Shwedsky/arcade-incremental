import {EQUIPMENT_DEFS,type EquipmentId} from './early_game.ts';
import {MACHINE_DEFS,requirementAmount,type GarageInventory,type MachineRequirement} from './garage.ts';
import type {ComponentKind,ResourceKind} from './sim.ts';
import type {WorkshopBatchAction,WorkshopOneShotAction,WorkshopQueueAction,WorkshopSchedulerState} from './workshop_scheduler.ts';

export interface ReservationLedger{
  resources:Record<ResourceKind,number>;
  components:Record<ComponentKind,number>;
  cash:number;
}

export interface ReservationContext{
  machineLevels:Partial<Record<keyof typeof MACHINE_DEFS,number>>;
  equipmentLevels:Partial<Record<EquipmentId,number>>;
  machineCostMultiplier:number;
}

const blankResources=():Record<ResourceKind,number>=>({metal:0,copper:0,plastic:0});
const blankComponents=():Record<ComponentKind,number>=>({bearing:0,motor:0,hydraulic:0,electronics:0});
export const emptyReservationLedger=():ReservationLedger=>({resources:blankResources(),components:blankComponents(),cash:0});

function addRequirement(ledger:ReservationLedger,req:MachineRequirement,multiplier:number){
  const amount=requirementAmount(req,multiplier);
  if(req.kind==='cash'){ledger.cash+=amount;return}
  if(req.kind==='resource'){ledger.resources[req.key as ResourceKind]+=amount;return}
  ledger.components[req.key as ComponentKind]+=amount;
}

function oneShotRequirements(action:WorkshopOneShotAction,ctx:ReservationContext):{requirements:MachineRequirement[];multiplier:number}|null{
  if(action.kind==='build_machine'&&action.machineId){
    return{requirements:MACHINE_DEFS[action.machineId].requirements,multiplier:ctx.machineCostMultiplier};
  }
  if(action.kind==='upgrade_machine'&&action.machineId&&action.targetLevel){
    const upgrade=MACHINE_DEFS[action.machineId].upgrades.find(item=>item.toLevel===action.targetLevel);
    return upgrade?{requirements:upgrade.requirements,multiplier:ctx.machineCostMultiplier}:null;
  }
  if(action.kind==='equipment'&&action.equipmentId&&action.targetLevel){
    const upgrade=EQUIPMENT_DEFS[action.equipmentId].upgrades.find(item=>item.toLevel===action.targetLevel);
    return upgrade?{requirements:upgrade.requirements,multiplier:1}:null;
  }
  return null;
}

function batchFutureStacks(action:WorkshopBatchAction):number{
  const current=action.status==='active'&&!!action.current?1:0;
  return Math.max(0,action.requestedCount-action.completedCount-current);
}

export function reservationForAction(action:WorkshopQueueAction,ctx:ReservationContext):ReservationLedger{
  const ledger=emptyReservationLedger();
  if(action.status==='completed'||action.status==='cancelled')return ledger;
  if(action.kind==='process_batch'){
    const stacks=batchFutureStacks(action),kind=action.inputResource,amount=action.inputAmount??0;
    if(kind&&amount>0&&stacks>0)ledger.resources[kind]+=amount*stacks;
    return ledger;
  }
  if(action.kind==='industrial_batch')return ledger;
  const oneShot=action as WorkshopOneShotAction;
  // A one-shot commits its inputs exactly when it becomes active. Only waiting /
  // blocked one-shots therefore need an escrow reservation in the player-facing
  // available balance.
  if(oneShot.status==='active'||oneShot.inputsCommitted)return ledger;
  const recipe=oneShotRequirements(oneShot,ctx);if(!recipe)return ledger;
  for(const req of recipe.requirements)addRequirement(ledger,req,recipe.multiplier);
  return ledger;
}

export function queuedReservations(state:WorkshopSchedulerState,ctx:ReservationContext):ReservationLedger{
  const total=emptyReservationLedger();
  for(const action of state.actions){
    const part=reservationForAction(action,ctx);
    total.cash+=part.cash;
    (Object.keys(total.resources) as ResourceKind[]).forEach(key=>total.resources[key]+=part.resources[key]);
    (Object.keys(total.components) as ComponentKind[]).forEach(key=>total.components[key]+=part.components[key]);
  }
  return total;
}

export function availableGarageInventory(raw:GarageInventory,reserved:ReservationLedger):GarageInventory{
  const resources=blankResources(),components=blankComponents();
  (Object.keys(resources) as ResourceKind[]).forEach(key=>resources[key]=Math.max(0,raw.resources[key]-reserved.resources[key]));
  (Object.keys(components) as ComponentKind[]).forEach(key=>components[key]=Math.max(0,raw.components[key]-reserved.components[key]));
  return{resources,components,cash:Math.max(0,raw.cash-reserved.cash)};
}

export function reservationShortfall(raw:GarageInventory,reserved:ReservationLedger):ReservationLedger{
  const shortage=emptyReservationLedger();
  shortage.cash=Math.max(0,reserved.cash-raw.cash);
  (Object.keys(shortage.resources) as ResourceKind[]).forEach(key=>shortage.resources[key]=Math.max(0,reserved.resources[key]-raw.resources[key]));
  (Object.keys(shortage.components) as ComponentKind[]).forEach(key=>shortage.components[key]=Math.max(0,reserved.components[key]-raw.components[key]));
  return shortage;
}
