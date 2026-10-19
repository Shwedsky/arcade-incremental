#!/usr/bin/env python3
from pathlib import Path
import re

p=Path('src/main.ts')
t=p.read_text(encoding='utf-8')

def one(old:str,new:str,label:str):
    global t
    count=t.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly one anchor, got {count}')
    t=t.replace(old,new,1)

one("import './content_pack_d.css';","import './content_pack_d.css';\nimport './workshop_queue.css';",'queue css import')

one(
"  activeWorkshopActions, advanceWorkshopScheduler, createBatchAction, createOneShotAction, createWorkshopScheduler, enqueueWorkshopAction,\n  removeTerminalWorkshopActions, type WorkshopQueueAction, type WorkshopSchedulerAdapter, type WorkshopSchedulerState\n} from './workshop_scheduler.ts';",
"  activeWorkshopActions, advanceWorkshopScheduler, batchRemainingCount, cancelWorkshopAction, createBatchAction, createOneShotAction, createWorkshopScheduler, enqueueWorkshopAction,\n  moveWaitingAction, removeTerminalWorkshopActions, reorderWaitingAction, setWaitingBatchCount, waitingWorkshopActions,\n  type WorkshopBatchAction, type WorkshopQueueAction, type WorkshopSchedulerAdapter, type WorkshopSchedulerState\n} from './workshop_scheduler.ts';",
'scheduler UI imports')

one(
"  <section id=\"offlineScreen\" class=\"offlineScreen\" hidden><div class=\"offlineBox\"><small>ПОКА ТЕБЯ НЕ БЫЛО</small><h2>База продолжала работать</h2><div id=\"offlineLoot\"></div><button id=\"offlineClose\">Забрать</button></div></section>\n</main>`;",
"  <section id=\"offlineScreen\" class=\"offlineScreen\" hidden><div class=\"offlineBox\"><small>ПОКА ТЕБЯ НЕ БЫЛО</small><h2>База продолжала работать</h2><div id=\"offlineLoot\"></div><button id=\"offlineClose\">Забрать</button></div></section>\n  <section id=\"queueCancelModal\" class=\"queueCancelModal\" hidden><div class=\"queueCancelBox\"><small>ПРЕРВАТЬ ТЕКУЩУЮ РАБОТУ</small><h2>Точно остановить действие?</h2><p id=\"queueCancelText\"></p><div class=\"queueCancelButtons\"><button id=\"queueCancelNo\" class=\"secondary\">Нет, оставить</button><button id=\"queueCancelYes\" class=\"danger\">Да, прервать</button></div></div></section>\n</main>`;",
'cancel modal markup')

one(
"const zoneScreen=$<HTMLElement>('zoneScreen'),zoneGridEl=$<HTMLElement>('zoneGrid'),vanHud=$<HTMLElement>('vanHud');",
"const zoneScreen=$<HTMLElement>('zoneScreen'),zoneGridEl=$<HTMLElement>('zoneGrid'),vanHud=$<HTMLElement>('vanHud');\nconst queuePanelEl=$<HTMLElement>('queuePanel'),queueCancelModal=$<HTMLElement>('queueCancelModal'),queueCancelText=$<HTMLElement>('queueCancelText');\nlet pendingQueueCancelId:string|null=null,draggedQueueId:string|null=null;",
'queue DOM refs')

# Lock a machine against parallel execution of another action using the same machine.
one(
"  canStart(action){\n    if(action.kind==='process_batch'){",
"  canStart(action){\n    if(action.machineId&&activeWorkshopActions(workshop).some(other=>other.id!==action.id&&other.machineId===action.machineId))return{ok:false,reason:'Станок занят другим действием'};\n    if(action.kind==='process_batch'){",
'machine execution lock')

# A processing action must not hide the machine controls; build/upgrade still do.
one(
"upgrade=nextUpgrade(def,lvl),queued=jobForMachine(selectedMachine),buildable=",
"upgrade=nextUpgrade(def,lvl),queued=jobForMachine(selectedMachine,'build_machine')??jobForMachine(selectedMachine,'upgrade_machine'),buildable=",
'inspector queue gate')

pattern=re.compile(r"function processingAction\(id:MachineId,lvl:number\)\{.*?\}\n\nfunction renderEquipment",re.S)
replacement="""function clampBatchCount(value:number){return Math.max(1,Math.min(100,Math.floor(Number.isFinite(value)?value:1)))}
function processingAction(id:MachineId,lvl:number){
  if(id==='workbench')return'<div class="installedNote muted">Верстак обслуживает изготовление инструмента, тележки и станков.</div>';
  const spec=processSpec(id,lvl,effects().workshopYieldMultiplier);if(!spec)return'';
  const duration=adjustedDuration(spec.durationSec),affordable=Math.max(0,Math.floor((storage[spec.resource]+1e-9)/spec.input)),enabled=affordable>=1;
  return`<div class="processBlock"><h3>Работа станка</h3><p>1 стек: ${spec.input.toFixed(1)} кг ${resourceName[spec.resource].toLowerCase()} → ${spec.output.toFixed(1)} кг ${processedName[spec.kind].toLowerCase()}.</p><div class="processBatchPicker"><label><span>Сколько стаков поставить</span><b id="processBatchValue">1</b></label><div class="processBatchControls"><input id="processBatchRange" type="range" min="1" max="100" value="1" ${enabled?'':'disabled'}><input id="processBatchNumber" type="number" inputmode="numeric" min="1" max="100" step="1" value="1" ${enabled?'':'disabled'}></div><small id="processBatchPlan" class="processBatchPlan">План: 1 стек · ${fmtLong(duration)}. На складе сейчас хватает на ${affordable}; остальное при нехватке сырья будет ждать.</small></div><button id="processMachine" ${enabled?'':'disabled'}>${enabled?`Добавить в очередь ×1 · ${fmtLong(duration)}`:'Нет сырья даже на 1 стек'}</button>${effects().autoFeed?'<small>Автоподача действует для одиночного запуска. Явный batch выполняет ровно выбранное количество стаков.</small>':''}</div>`
}
function renderEquipment"""
t,n=pattern.subn(replacement,t,count=1)
if n!=1: raise SystemExit(f'processingAction block: expected 1, got {n}')

# Equipment should remain queueable even when execution slots are occupied.
t=t.replace("${freeWorkshopSlots()<1?'Очередь занята':!gates?'Нужен уровень':afford?`Изготовить · ${fmtLong(duration)}`:'Не хватает ресурсов'}","${!gates?'Нужен уровень':afford?`Изготовить · ${fmtLong(duration)}`:'Не хватает ресурсов'}")

queue_pattern=re.compile(r"function renderQueue\(\)\{.*?\}\nfunction contractOwned",re.S)
queue_replacement="""function isQueueBatch(action:WorkshopQueueAction):action is WorkshopBatchAction{return action.kind==='process_batch'||action.kind==='industrial_batch'}
function queueProgress(action:WorkshopQueueAction,now:number){
  const current=action.current,stackProgress=current?clamp((now-current.startedAt)/Math.max(1,current.endsAt-current.startedAt),0,1):0;
  if(isQueueBatch(action))return clamp((action.completedCount+stackProgress)/Math.max(1,action.requestedCount),0,1);
  return stackProgress
}
function queueEtaSec(action:WorkshopQueueAction,now:number){
  const unit=action.durationMs/1000;
  if(isQueueBatch(action)){const current=action.current?Math.max(0,(action.current.endsAt-now)/1000):0,future=Math.max(0,action.requestedCount-action.completedCount-(action.current?1:0));return current+future*unit}
  return action.current?Math.max(0,(action.current.endsAt-now)/1000):unit
}
function queueActionRow(action:WorkshopQueueAction,now:number,waitingIndex=-1,waitingTotal=0){
  const encoded=encodeURIComponent(action.id),batch=isQueueBatch(action),progress=queueProgress(action,now),eta=queueEtaSec(action,now),active=action.status==='active'&&!!action.current,blocked=action.status==='blocked';
  const status=active?'Выполняется':blocked?'Ждёт':'В очереди',batchMeta=batch?`<span data-queue-count="${encoded}">${action.completedCount} / ${action.requestedCount} стаков · осталось ${batchRemainingCount(action)+(active?1:0)}</span>`:'';
  const editor=!active&&batch?`<div class="queueBatchEdit"><label><span>Количество стаков</span><b>${action.requestedCount}</b></label><div class="queueBatchControls"><input type="range" min="${Math.max(1,action.completedCount+1)}" max="100" value="${Math.min(100,action.requestedCount)}" data-queue-batch-range="${encoded}"><input type="number" inputmode="numeric" min="${Math.max(1,action.completedCount+1)}" max="100" step="1" value="${action.requestedCount}" data-queue-batch-number="${encoded}"></div></div>`:'';
  const controls=active?`<div class="queueActions"><button class="danger" data-queue-cancel="${encoded}">Прервать</button></div>`:`<div class="queueActions"><button data-queue-up="${encoded}" ${waitingIndex<=0?'disabled':''}>↑ Выше</button><button data-queue-down="${encoded}" ${waitingIndex<0||waitingIndex>=waitingTotal-1?'disabled':''}>↓ Ниже</button><button class="danger" data-queue-remove="${encoded}">Удалить</button><button class="dragHandle" type="button" aria-label="Перетащить">⠿</button></div>`;
  return`<article class="queueAction ${active?'active':''} ${blocked?'blocked':''}" data-queue-id="${encoded}" ${!active?'data-queue-waiting="1" draggable="true"':''}><div class="queueActionHead"><div><b>${action.label}</b><small>${batch&&action.machineId?`Batch · ${action.machineId}`:action.kind.replaceAll('_',' ')}</small></div><em class="queueStatus">${status}</em></div><i class="queueProgress"><em style="width:${progress*100}%"></em></i><div class="queueActionMeta">${batchMeta}<span>ETA ${fmtLong(eta)}</span></div>${blocked&&action.blockedReason?`<span class="queueBlockedReason">${action.blockedReason}</span>`:''}${editor}${controls}</article>`
}
function renderQueue(){
  const now=Date.now(),slots=workshopSlots(),active=activeWorkshopActions(workshop),waiting=waitingWorkshopActions(workshop);
  const activeRows=active.map(action=>queueActionRow(action,now)).join(''),waitingRows=waiting.map((action,index)=>queueActionRow(action,now,index,waiting.length)).join('');
  queuePanelEl.innerHTML=`<h2>Очередь мастерской</h2><p class="managementLead">Одновременно выполняется до ${slots}. Batch держит свою ячейку до завершения, блокировки или отмены.</p><div class="queueSection"><div class="queueSectionTitle"><span>Выполняется</span><b>${active.length} / ${slots}</b></div>${activeRows||'<div class="emptyState">Сейчас ничего не выполняется.</div>'}</div><div class="queueSection"><div class="queueSectionTitle"><span>В очереди</span><b>${waiting.length}</b></div>${waitingRows||'<div class="emptyState">Ожидающих действий нет.</div>'}</div>${workshopSlots()>1?'<small>Разные станки могут занимать разные ячейки параллельно; один станок не выполняет две операции одновременно.</small>':''}`
}
function contractOwned"""
t,n=queue_pattern.subn(queue_replacement,t,count=1)
if n!=1: raise SystemExit(f'renderQueue block: expected 1, got {n}')

# Insert mutation/cancellation helpers before contracts.
one(
"function completeContract(){",
"""function settleQueueMutation(){removeTerminalWorkshopActions(workshop);advanceWorkshop(Date.now(),false);syncJobsView();saveGame();renderGarage()}
function removeQueuedAction(id:string){const result=cancelWorkshopAction(workshop,id,false);if(result.ok)settleQueueMutation()}
function requestCurrentQueueCancel(id:string){const action=workshop.actions.find(item=>item.id===id);if(!action)return;const result=cancelWorkshopAction(workshop,id,false);if(!result.needsConfirmation){if(result.ok)settleQueueMutation();return}pendingQueueCancelId=id;queueCancelText.textContent=isQueueBatch(action)?`«${action.label}»: готово ${action.completedCount} из ${action.requestedCount}. Готовые стаки останутся, текущий незавершённый стек и остаток batch будут отменены.`:`«${action.label}»: текущий прогресс будет обнулён. Уже списанные при старте ресурсы не возвращаются.`;queueCancelModal.hidden=false}
function confirmCurrentQueueCancel(){if(!pendingQueueCancelId){queueCancelModal.hidden=true;return}const id=pendingQueueCancelId;pendingQueueCancelId=null;queueCancelModal.hidden=true;const result=cancelWorkshopAction(workshop,id,true);if(result.ok)settleQueueMutation()}
function syncProcessBatchPicker(source:HTMLInputElement){const range=$<HTMLInputElement>('processBatchRange'),number=$<HTMLInputElement>('processBatchNumber');if(!range||!number)return;const count=clampBatchCount(Number(source.value));range.value=String(count);number.value=String(count);$('processBatchValue').textContent=String(count);const spec=processSpec(selectedMachine,machineLevels[selectedMachine]??1,effects().workshopYieldMultiplier);if(!spec)return;const duration=adjustedDuration(spec.durationSec),affordable=Math.max(0,Math.floor((storage[spec.resource]+1e-9)/spec.input));$('processBatchPlan').textContent=`План: ${count} × ${spec.input.toFixed(1)} кг → ${(count*spec.output).toFixed(1)} кг · ${fmtLong(duration*count)}. На складе сейчас хватает на ${affordable}; нехватка позже блокирует batch, не удаляя готовое.`;const button=$<HTMLButtonElement>('processMachine');button.textContent=`Добавить в очередь ×${count} · ${fmtLong(duration*count)}`}
function queueInputFor(kind:'range'|'number',encoded:string){return Array.from(queuePanelEl.querySelectorAll<HTMLInputElement>(kind==='range'?'[data-queue-batch-range]':'[data-queue-batch-number]')).find(input=>(kind==='range'?input.dataset.queueBatchRange:input.dataset.queueBatchNumber)===encoded)}
function syncWaitingBatchPicker(source:HTMLInputElement,encoded:string){const range=queueInputFor('range',encoded),number=queueInputFor('number',encoded);if(!range||!number)return;const min=Number(number.min)||1,count=Math.max(min,clampBatchCount(Number(source.value)));range.value=String(Math.min(Number(range.max)||100,count));number.value=String(count);const id=decodeURIComponent(encoded),action=workshop.actions.find(item=>item.id===id);if(action&&isQueueBatch(action)){const label=queuePanelEl.querySelector<HTMLElement>(`[data-queue-count="${encoded}"]`);if(label)label.textContent=`${action.completedCount} / ${count} стаков · осталось ${Math.max(0,count-action.completedCount)}`}}
function commitWaitingBatchPicker(source:HTMLInputElement,encoded:string){const id=decodeURIComponent(encoded),min=Number(source.min)||1,count=Math.max(min,clampBatchCount(Number(source.value)));if(setWaitingBatchCount(workshop,id,count))settleQueueMutation()}

function completeContract(){""",
'queue mutation helpers')

# Queue controls must be handled before ordinary garage/machine clicks.
one(
"garageScreen.addEventListener('click',e=>{const target=e.target as HTMLElement,card=target.closest<HTMLElement>('[data-machine]');",
"garageScreen.addEventListener('click',e=>{const target=e.target as HTMLElement;const cancel=target.closest<HTMLElement>('[data-queue-cancel]');if(cancel?.dataset.queueCancel){requestCurrentQueueCancel(decodeURIComponent(cancel.dataset.queueCancel));return}const remove=target.closest<HTMLElement>('[data-queue-remove]');if(remove?.dataset.queueRemove){removeQueuedAction(decodeURIComponent(remove.dataset.queueRemove));return}const up=target.closest<HTMLElement>('[data-queue-up]');if(up?.dataset.queueUp){if(moveWaitingAction(workshop,decodeURIComponent(up.dataset.queueUp),-1)){saveGame();renderGarage()}return}const down=target.closest<HTMLElement>('[data-queue-down]');if(down?.dataset.queueDown){if(moveWaitingAction(workshop,decodeURIComponent(down.dataset.queueDown),1)){saveGame();renderGarage()}return}const card=target.closest<HTMLElement>('[data-machine]');",
'garage queue click delegation')

one(
"else if(target.closest('#processMachine')){if(enqueueProcess(selectedMachine))renderGarage()}",
"else if(target.closest('#processMachine')){const count=clampBatchCount(Number($<HTMLInputElement>('processBatchNumber')?.value??1));if(enqueueProcess(selectedMachine,Date.now(),false,count))renderGarage()}",
'process batch click')

# Add delegated input/change and DnD handlers before static buttons.
one(
"garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;",
"""garageScreen.addEventListener('input',e=>{const input=e.target as HTMLInputElement;if(input.id==='processBatchRange'||input.id==='processBatchNumber'){syncProcessBatchPicker(input);return}const encoded=input.dataset.queueBatchRange??input.dataset.queueBatchNumber;if(encoded)syncWaitingBatchPicker(input,encoded)});
garageScreen.addEventListener('change',e=>{const input=e.target as HTMLInputElement;const encoded=input.dataset.queueBatchRange??input.dataset.queueBatchNumber;if(encoded)commitWaitingBatchPicker(input,encoded)});
queuePanelEl.addEventListener('dragstart',e=>{const row=(e.target as HTMLElement).closest<HTMLElement>('[data-queue-waiting]');if(!row?.dataset.queueId)return;draggedQueueId=decodeURIComponent(row.dataset.queueId);row.classList.add('dragging');e.dataTransfer?.setData('text/plain',draggedQueueId);if(e.dataTransfer)e.dataTransfer.effectAllowed='move'});
queuePanelEl.addEventListener('dragend',e=>{(e.target as HTMLElement).closest<HTMLElement>('.queueAction')?.classList.remove('dragging');draggedQueueId=null});
queuePanelEl.addEventListener('dragover',e=>{if(draggedQueueId)e.preventDefault()});
queuePanelEl.addEventListener('drop',e=>{if(!draggedQueueId)return;e.preventDefault();const row=(e.target as HTMLElement).closest<HTMLElement>('[data-queue-waiting]'),waiting=waitingWorkshopActions(workshop);if(!row?.dataset.queueId)return;const targetId=decodeURIComponent(row.dataset.queueId),targetIndex=waiting.findIndex(item=>item.id===targetId);if(targetIndex>=0&&reorderWaitingAction(workshop,draggedQueueId,targetIndex)){saveGame();renderGarage()}draggedQueueId=null});
$<HTMLButtonElement>('queueCancelNo').onclick=()=>{pendingQueueCancelId=null;queueCancelModal.hidden=true};
$<HTMLButtonElement>('queueCancelYes').onclick=confirmCurrentQueueCancel;
garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;""",
'queue delegated events')

# Expose scheduler mutation state for dedicated browser acceptance without bypassing UX.
one(
"scheduler:normalizeWorkshopScheduler(workshop),contract:{...contractState}",
"scheduler:normalizeWorkshopScheduler(workshop),contract:{...contractState}",
'test bridge scheduler already exposed')

p.write_text(t,encoding='utf-8')
print('Workshop queue batch/edit/cancel UX integration applied')
