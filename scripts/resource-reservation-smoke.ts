import assert from 'node:assert/strict';
import {availableGarageInventory,queuedReservations,reservationForAction,type ReservationContext} from '../src/resource_reservations.ts';
import {createBatchAction,createOneShotAction,createWorkshopScheduler,enqueueWorkshopAction} from '../src/workshop_scheduler.ts';

const ctx:ReservationContext={machineLevels:{workbench:1,press:1,wire:1,plastic:1},equipmentLevels:{tool:1,cart:1},machineCostMultiplier:1};
const raw={resources:{metal:61,copper:20,plastic:10},components:{bearing:3,motor:1,hydraulic:1,electronics:0},cash:3000};

const scheduler=createWorkshopScheduler(1000);
const bench=createOneShotAction({id:'bench-2',kind:'upgrade_machine',label:'Усиленный верстак',machineId:'workbench',targetLevel:2,createdAt:1000,durationMs:10_000});
assert.equal(enqueueWorkshopAction(scheduler,bench),true);
let reserved=queuedReservations(scheduler,ctx),available=availableGarageInventory(raw,reserved);
assert.equal(reserved.resources.metal,40,'waiting workbench upgrade reserves metal immediately');
assert.equal(reserved.cash,1200,'waiting workbench upgrade reserves cash immediately');
assert.equal(available.resources.metal,21,'61 metal - 40 queued = 21 available to contracts/sales/builds');
assert.equal(available.cash,1800);

bench.status='active';bench.inputsCommitted=true;bench.current={startedAt:1000,endsAt:11_000};
reserved=queuedReservations(scheduler,ctx);
assert.equal(reserved.resources.metal,0,'active one-shot is already committed and must not double-reserve');
assert.equal(reserved.cash,0);

const batch=createBatchAction({id:'press-10',label:'Прессование металла',recipeId:'press:briquette',machineId:'press',processKind:'briquette',inputResource:'metal',inputAmount:10,outputAmount:10,durationMs:1000,requestedCount:10,createdAt:2000});
scheduler.actions=[batch];
reserved=queuedReservations(scheduler,ctx);
assert.equal(reserved.resources.metal,100,'waiting batch reserves all future stacks');
assert.equal(availableGarageInventory(raw,reserved).resources.metal,0,'reservation cannot expose negative spendable stock');

batch.status='active';batch.current={startedAt:2000,endsAt:3000};
reserved=queuedReservations(scheduler,ctx);
assert.equal(reserved.resources.metal,90,'current active stack is already committed; only future stacks stay reserved');

batch.status='waiting';batch.current=null;batch.completedCount=4;
reserved=queuedReservations(scheduler,ctx);
assert.equal(reserved.resources.metal,60,'completed stacks are permanent and only unfinished waiting stacks remain reserved');

batch.status='cancelled';
assert.equal(reservationForAction(batch,ctx).resources.metal,0,'cancelled queue action releases reservation immediately');

console.log('queued resource reservation smoke: PASS');
