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

one(
"} from './content_pack_d.ts';\n\nconst app=document.querySelector<HTMLDivElement>('#app');",
"} from './content_pack_d.ts';\nimport {\n  activeWorkshopActions, advanceWorkshopScheduler, createBatchAction, createOneShotAction, createWorkshopScheduler, enqueueWorkshopAction,\n  removeTerminalWorkshopActions, type WorkshopQueueAction, type WorkshopSchedulerAdapter, type WorkshopSchedulerState\n} from './workshop_scheduler.ts';\nimport { migrateLegacyWorkshopJobs, normalizeWorkshopScheduler } from './workshop_scheduler_migration.ts';\n\nconst app=document.querySelector<HTMLDivElement>('#app');",
'import scheduler')

old_interface="""interface SaveStateV7{\n  v:7;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;\n  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;\n  jobs:WorkshopJob[];contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;\n}\n"""
new_interface="""interface SaveStateV8{\n  v:8;xp:number;storage:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Processed;cash:number;\n  installed:MachineId[];machineLevels:Partial<Record<MachineId,number>>;talents:TalentId[];equipmentLevels:Record<EquipmentId,number>;\n  scheduler:WorkshopSchedulerState;contract:ContractState;totalDestroyed:number;lastSeen:number;midgame:MidgameState;packB:PackBState;packC:PackCState;packD:PackDState;\n}\n"""
one(old_interface,new_interface,'Save V8 interface')

pattern=re.compile(r"const defaultSave=\(\):SaveStateV7=>\(.*?\n}\nconst loaded=loadSave\(\),loadedLastSeen=loaded\.lastSeen;",re.S)
replacement="""const defaultSave=():SaveStateV8=>({v:8,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:STARTING_CASH,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},scheduler:createWorkshopScheduler(),contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),midgame:createDefaultMidgame(),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()});
function loadSave():SaveStateV8{
  try{
    const raw=initialSaveRead.raw,value=raw?JSON.parse(raw):null,base=defaultSave(),now=Date.now();
    const legacyScheduler=()=>migrateLegacyWorkshopJobs(value?.jobs,value?.lastSeen??now,now);
    if(value?.v===8)return {...base,...value,v:8,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:normalizeWorkshopScheduler(value.scheduler,now),contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:normalizePackD(value.packD)};
    if(value?.v===7)return {...base,...value,v:8,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:legacyScheduler(),contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:normalizePackD(value.packD)};
    if(value?.v===6)return {...base,...value,v:8,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:legacyScheduler(),contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:normalizePackC(value.packC),packD:createDefaultPackD()};
    if(value?.v===5)return {...base,...value,v:8,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:legacyScheduler(),contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:normalizePackB(value.packB),packC:createDefaultPackC(),packD:createDefaultPackD()};
    if(value?.v===4)return {...base,...value,v:8,storage:{...base.storage,...value.storage},components:{...base.components,...value.components},processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:legacyScheduler(),contract:{...base.contract,...value.contract},midgame:normalizeMidgame(value.midgame),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};
    if(value?.v===3){const components={...base.components,...value.components};return {...base,...value,v:8,storage:{...base.storage,...value.storage},components,processed:{...base.processed,...value.processed},equipmentLevels:{...base.equipmentLevels,...value.equipmentLevels},scheduler:legacyScheduler(),contract:{...base.contract,...value.contract},midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};}
    if(value?.v===2){const components={...base.components,...value.components};return {...base,...value,v:8,equipmentLevels:{tool:1,cart:1},scheduler:legacyScheduler(),contract:{index:0,completed:0},components,midgame:migrateMidgameFromV3(value.totalDestroyed??0,components),packB:createDefaultPackB(),packC:createDefaultPackC(),packD:createDefaultPackD()};}
  }catch{}
  return defaultSave();
}
const loaded=loadSave(),loadedLastSeen=loaded.lastSeen;"""
t,n=pattern.subn(replacement,t,count=1)
if n!=1: raise SystemExit(f'load save block: expected 1, got {n}')

one(
"let jobs:WorkshopJob[]=loaded.jobs.map(j=>({...j})),contractState:ContractState={...loaded.contract};",
"let workshop:WorkshopSchedulerState=normalizeWorkshopScheduler(loaded.scheduler);\nlet jobs:WorkshopJob[]=[],contractState:ContractState={...loaded.contract};",
'loaded workshop state')

one(
"let packD:PackDState=normalizePackD(loaded.packD);\n\nlet trip=0,",
"let packD:PackDState=normalizePackD(loaded.packD);\n\nfunction syncJobsView(){const now=Date.now();jobs=workshop.actions.filter(a=>a.status!=='completed'&&a.status!=='cancelled').map(a=>({id:a.id,kind:(a.kind==='process_batch'||a.kind==='industrial_batch'?'process':a.kind) as WorkshopJob['kind'],label:a.label,startedAt:a.current?.startedAt??now,endsAt:a.current?.endsAt??now+a.durationMs,machineId:a.machineId,targetLevel:a.targetLevel,equipmentId:a.kind==='equipment'?a.equipmentId:undefined,processKind:(a.kind==='process_batch'||a.kind==='industrial_batch')?a.processKind:undefined,inputResource:(a.kind==='process_batch'||a.kind==='industrial_batch')?a.inputResource:undefined,inputAmount:(a.kind==='process_batch'||a.kind==='industrial_batch')?a.inputAmount:undefined,outputAmount:(a.kind==='process_batch'||a.kind==='industrial_batch')?a.outputAmount:undefined}))}\nsyncJobsView();\n\nlet trip=0,",
'legacy jobs view')

one(
"const workshopSlots=()=>effects().workshopSlots+(packD.industrialWorkshopOwned?1:0);\nconst freeWorkshopSlots=()=>Math.max(0,workshopSlots()-jobs.length);\nconst jobForMachine=(id:MachineId,kind?:WorkshopJob['kind'])=>jobs.find(j=>j.machineId===id&&(!kind||j.kind===kind));",
"const workshopSlots=()=>effects().workshopSlots+(packD.industrialWorkshopOwned?1:0);\nconst freeWorkshopSlots=()=>Math.max(0,workshopSlots()-activeWorkshopActions(workshop).length);\nconst jobForMachine=(id:MachineId,kind?:WorkshopJob['kind'])=>jobs.find(j=>j.machineId===id&&(!kind||j.kind===kind));",
'workshop slots')

pattern=re.compile(r"function saveGame\(\)\{const state:SaveStateV7=.*?\}\nsetInterval\(saveGame,10000\);",re.S)
replacement="""function saveGame(){const state:SaveStateV8={v:8,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},scheduler:normalizeWorkshopScheduler(workshop),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame),packB:normalizePackB(packB),packC:normalizePackC(packC),packD:normalizePackD(packD)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}
setInterval(saveGame,10000);"""
t,n=pattern.subn(replacement,t,count=1)
if n!=1: raise SystemExit(f'saveGame block: expected 1, got {n}')

pattern=re.compile(r"function enqueueBuild\(id:MachineId\)\{.*?\nfunction advanceWorkshop\(now=Date\.now\(\),notify=false\)\{.*?\}\n\nfunction applyOffline\(\)\{",re.S)
replacement="""function oneShotRequirements(action:WorkshopQueueAction):{requirements:MachineRequirement[];multiplier:number}|null{
  if(action.kind==='build_machine'&&action.machineId)return{requirements:MACHINE_DEFS[action.machineId].requirements,multiplier:effects().machineCostMultiplier};
  if(action.kind==='upgrade_machine'&&action.machineId&&action.targetLevel){const up=MACHINE_DEFS[action.machineId].upgrades.find(x=>x.toLevel===action.targetLevel);return up?{requirements:up.requirements,multiplier:effects().machineCostMultiplier}:null}
  if(action.kind==='equipment'&&action.equipmentId&&action.targetLevel){const up=EQUIPMENT_DEFS[action.equipmentId].upgrades.find(x=>x.toLevel===action.targetLevel);return up?{requirements:up.requirements,multiplier:1}:null}
  return null
}
function workshopAdapter(completed:string[]):WorkshopSchedulerAdapter{return{
  canStart(action){
    if(action.kind==='process_batch'){const amount=action.inputAmount??0,kind=action.inputResource;if(!kind||amount<=0)return{ok:false,reason:'Некорректный рецепт'};return storage[kind]+1e-9>=amount?{ok:true}:{ok:false,reason:`Не хватает: ${resourceName[kind]}`}}
    if(action.kind==='industrial_batch')return{ok:false,reason:'Промышленная batch-очередь ещё не подключена'};
    const recipe=oneShotRequirements(action);if(!recipe)return{ok:false,reason:'Рецепт больше недоступен'};return canAfford(recipe.requirements,inventory(),recipe.multiplier)?{ok:true}:{ok:false,reason:'Не хватает ресурсов'}
  },
  commit(action){if(action.kind==='process_batch'&&action.inputResource)storage[action.inputResource]-=action.inputAmount??0;else{const recipe=oneShotRequirements(action);if(recipe)consume(recipe.requirements,recipe.multiplier)}},
  complete(action){
    if(action.kind==='build_machine'&&action.machineId){installed.add(action.machineId);machineLevels[action.machineId]=1;completed.push(`✓ ${MACHINE_DEFS[action.machineId].name} установлен`)}
    else if(action.kind==='upgrade_machine'&&action.machineId&&action.targetLevel){machineLevels[action.machineId]=action.targetLevel;completed.push(`✓ ${MACHINE_DEFS[action.machineId].name}: ур. ${action.targetLevel}`)}
    else if(action.kind==='equipment'&&action.equipmentId&&action.targetLevel){equipmentLevels[action.equipmentId]=action.targetLevel;completed.push(`✓ ${EQUIPMENT_DEFS[action.equipmentId].name}: ур. ${action.targetLevel}`)}
    else if(action.kind==='process_batch'&&action.processKind){processed[action.processKind]+=action.outputAmount??0;completed.push(`✓ ${processedName[action.processKind]} +${(action.outputAmount??0).toFixed(1)} кг`);if(effects().autoFeed&&action.requestedCount===1&&action.machineId&&action.current)enqueueProcess(action.machineId,action.current.endsAt,true,1,false)}
  }
}}
function queueAndKick(action:WorkshopQueueAction,toast:string){if(!enqueueWorkshopAction(workshop,action))return false;advanceWorkshop(Date.now(),false);showToast(toast);saveGame();renderGarage();return true}
function enqueueBuild(id:MachineId){const def=MACHINE_DEFS[id];if(installed.has(id)||jobForMachine(id,'build_machine')||!machineUnlocked(def,context())||!canAfford(def.requirements,inventory(),effects().machineCostMultiplier))return;const now=Date.now(),duration=adjustedDuration(buildDurationSec(id));queueAndKick(createOneShotAction({id:jobId('build'),kind:'build_machine',label:`Сборка: ${def.name}`,machineId:id,targetLevel:1,createdAt:now,durationMs:duration*1000}),`${def.name} поставлен в очередь · ${fmtLong(duration)}`)}
function enqueueMachineUpgrade(id:MachineId){const def=MACHINE_DEFS[id],current=machineLevels[id]??1,up=nextUpgrade(def,current);if(!up||jobForMachine(id,'upgrade_machine')||unmetUnlocks(up.unlocks,context()).length||!canAfford(up.requirements,inventory(),effects().machineCostMultiplier))return;const now=Date.now(),duration=adjustedDuration(upgradeDurationSec(id,up.toLevel));queueAndKick(createOneShotAction({id:jobId('upgrade'),kind:'upgrade_machine',label:`${def.name} → ур. ${up.toLevel}`,machineId:id,targetLevel:up.toLevel,createdAt:now,durationMs:duration*1000}),`Прокачка поставлена в очередь · ${fmtLong(duration)}`)}
function enqueueEquipment(id:EquipmentId){const current=equipmentLevels[id],up=nextEquipmentUpgrade(id,current);if(!up||jobs.some(j=>j.kind==='equipment'&&j.equipmentId===id)||level()<up.minPlayerLevel||!canAfford(up.requirements,inventory(),1))return;const now=Date.now(),duration=adjustedDuration(up.durationSec);queueAndKick(createOneShotAction({id:jobId('equipment'),kind:'equipment',label:`${EQUIPMENT_DEFS[id].name}: ${up.name}`,equipmentId:id,targetLevel:up.toLevel,createdAt:now,durationMs:duration*1000}),`${up.name} поставлен в очередь · ${fmtLong(duration)}`)}
function enqueueProcess(id:MachineId,startAt=Date.now(),auto=false,requestedCount=1,kick=true){if(!installed.has(id)||id==='workbench')return false;const spec=processSpec(id,machineLevels[id]??1,effects().workshopYieldMultiplier);if(!spec||storage[spec.resource]+1e-9<spec.input)return false;const duration=adjustedDuration(spec.durationSec),action=createBatchAction({id:jobId(auto?'auto':'process'),label:spec.label,recipeId:`${id}:${spec.kind}`,machineId:id,processKind:spec.kind,inputResource:spec.resource,inputAmount:spec.input,outputAmount:spec.input*effects().workshopYieldMultiplier,durationMs:duration*1000,requestedCount,createdAt:startAt});if(!enqueueWorkshopAction(workshop,action))return false;if(kick){advanceWorkshop(Date.now(),false);if(!auto)showToast(`${spec.label} в очереди · ${requestedCount}×`);saveGame();renderGarage()}else syncJobsView();return true}
function advanceWorkshop(now=Date.now(),notify=false){const completed:string[]=[];advanceWorkshopScheduler(workshop,now,workshopSlots(),workshopAdapter(completed));removeTerminalWorkshopActions(workshop);syncJobsView();if(completed.length){saveGame();if(notify)showToast(completed.at(-1)!)}return completed}

function applyOffline(){"""
t,n=pattern.subn(replacement,t,count=1)
if n!=1: raise SystemExit(f'workshop runtime block: expected 1, got {n}')

# UI may now enqueue behind occupied slots; existing derived jobs keep old cards/browser contracts stable.
t=t.replace("buildable=unlocked&&canAfford(def.requirements,inv,effects().machineCostMultiplier)&&freeWorkshopSlots()>0","buildable=unlocked&&canAfford(def.requirements,inv,effects().machineCostMultiplier)")
t=t.replace("gatesOk&&afford&&freeWorkshopSlots()>0","gatesOk&&afford")
t=t.replace("gates&&afford&&freeWorkshopSlots()>0","gates&&afford")
t=t.replace("take>.01&&freeWorkshopSlots()>0","take+1e-9>=spec.input")
t=t.replace("freeWorkshopSlots()<1?'Очередь занята':buildable?","buildable?")
t=t.replace("freeWorkshopSlots()<1?'Очередь занята':afford?","afford?")
t=t.replace("freeWorkshopSlots()<1?'Очередь занята':take>.01?","take+1e-9>=spec.input?")

# Queue summary must distinguish execution capacity from waiting logical actions.
queue_pattern=re.compile(r"function renderQueue\(\)\{.*?\}\nfunction contractOwned",re.S)
queue_replacement="""function renderQueue(){const now=Date.now(),slots=workshopSlots(),active=activeWorkshopActions(workshop),waiting=workshop.actions.filter(a=>a.status==='waiting'||a.status==='blocked'),rows=jobs.slice().sort((a,b)=>a.endsAt-b.endsAt).map(job=>`<article class=\"queueJob\"><div><b>${job.label}</b><span>${fmtLong(jobRemainingSec(job,now))}</span></div><i><em style=\"width:${jobProgress(job,now)*100}%\"></em></i></article>`).join('');$('queuePanel').innerHTML=`<h2>Очередь мастерской</h2><p class=\"managementLead\">Занято ${active.length} / ${slots} · В очереди ${waiting.length}. Работа продолжается на свалке и offline.</p>${rows||'<div class=\"emptyState\">Свободно. Можно поставить изготовление или переработку.</div>'}${workshopSlots()>1?'<small>Параллельные слоты складываются из талантов и Industrial Workshop.</small>':''}`}
function contractOwned"""
t,n=queue_pattern.subn(queue_replacement,t,count=1)
if n!=1: raise SystemExit(f'renderQueue block: expected 1, got {n}')

# Test bridge keeps old jobs projection for existing regressions while exposing the real scheduler.
t=t.replace("saveVersion:7,","saveVersion:8,")
t=t.replace("jobs:jobs.map(j=>({...j})),contract:","jobs:jobs.map(j=>({...j})),scheduler:normalizeWorkshopScheduler(workshop),contract:")

if 'SaveStateV7' in t: raise SystemExit('stale SaveStateV7 remains')
if 'v:7,xp' in t: raise SystemExit('stale V7 writer remains')

p.write_text(t,encoding='utf-8')
print('Workshop Save V8 runtime integration applied')
