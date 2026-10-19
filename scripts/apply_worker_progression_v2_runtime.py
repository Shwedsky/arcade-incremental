#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
MAIN=ROOT/'src/main.ts'
HF2=ROOT/'src/human_feedback_v2.ts'
text=MAIN.read_text(encoding='utf-8')

def rep(old:str,new:str,count:int=1):
    global text
    actual=text.count(old)
    if actual!=count:
        raise SystemExit(f'expected {count} occurrence(s), found {actual}: {old[:140]!r}')
    text=text.replace(old,new,count)

def sub(pattern:str,repl:str,count:int=1,flags:int=0):
    global text
    text2,n=re.subn(pattern,repl,text,count=count,flags=flags)
    if n!=count:
        raise SystemExit(f'expected regex {count}, got {n}: {pattern[:140]}')
    text=text2

# Imports: zone XP + Worker Economy V2 domain.
rep(
"  transferCartToVan, unloadVanToStorage, vanRemaining, vanWeight, zoneMastered, zoneUnlock,\n  zoneYieldMultiplier, masteryUnitsForTarget,",
"  transferCartToVan, unloadVanToStorage, vanRemaining, vanWeight, zoneMastered, zoneUnlock,\n  zoneYieldMultiplier, zoneXpMultiplier, masteryUnitsForTarget,"
)
rep(
"import { migrateLegacyWorkshopJobs, normalizeWorkshopScheduler } from './workshop_scheduler_migration.ts';",
"import { migrateLegacyWorkshopJobs, normalizeWorkshopScheduler } from './workshop_scheduler_migration.ts';\nimport {\n  awardClearMedal,dispatchWorkerShifts,hasClearMedal,recordActiveBenchmark,setVanWorker,vanAssignedToWorker,\n  type WorkerSlotId\n} from './worker_economy_v2.ts';"
)

# Save V9: add a V9 read branch, migrate V8 and all older saves to V9.
m=re.search(r"    if\(value\?\.v===8\)return .*?;\n",text)
if not m: raise SystemExit('V8 load branch not found')
v8line=m.group(0)
text=text.replace(v8line,v8line.replace('v===8','v===9')+v8line,1)
text=text.replace('SaveStateV8','SaveStateV9')
text=text.replace('v:8','v:9')

# Processed-resource inventory plumbing for revised structure recipes.
rep(
"const currentPackCInventory=():PackCInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,steelBlank:packB.materials.steelBlank,structural:packB.modules.structural,control:packB.modules.control,hydraulic:storedComps.hydraulic,pump:midgame.midComponents.pump});\nfunction applyPackCInventory(inv:PackCInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packB.modules.structural=inv.structural;packB.modules.control=inv.control;storedComps.hydraulic=inv.hydraulic;midgame.midComponents.pump=inv.pump}\nconst currentPackDInventory=():PackDInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,steelBlank:packB.materials.steelBlank,alloyBillet:packC.materials.alloyBillet,drive:packB.modules.drive,control:packB.modules.control,hydraulicPower:packC.modules.hydraulicPower,heavyFrame:packC.modules.heavyFrame,gearbox:packB.industrial.gearbox,generator:packB.industrial.generator,industrialController:packC.industrial.industrialController,heavyHydraulicCylinder:packC.industrial.heavyHydraulicCylinder});\nfunction applyPackDInventory(inv:PackDInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;packB.materials.steelBlank=inv.steelBlank;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packB.industrial.gearbox=inv.gearbox;packB.industrial.generator=inv.generator;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}",
"const currentPackCInventory=():PackCInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,briquette:processed.briquette,steelBlank:packB.materials.steelBlank,aluminiumBillet:packB.materials.aluminiumBillet,structural:packB.modules.structural,control:packB.modules.control,hydraulic:storedComps.hydraulic,pump:midgame.midComponents.pump});\nfunction applyPackCInventory(inv:PackCInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.briquette=inv.briquette;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packB.modules.structural=inv.structural;packB.modules.control=inv.control;storedComps.hydraulic=inv.hydraulic;midgame.midComponents.pump=inv.pump}\nconst currentPackDInventory=():PackDInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,granulate:processed.granulate,steelBlank:packB.materials.steelBlank,aluminiumBillet:packB.materials.aluminiumBillet,alloyBillet:packC.materials.alloyBillet,drive:packB.modules.drive,control:packB.modules.control,hydraulicPower:packC.modules.hydraulicPower,heavyFrame:packC.modules.heavyFrame,gearbox:packB.industrial.gearbox,generator:packB.industrial.generator,industrialController:packC.industrial.industrialController,heavyHydraulicCylinder:packC.industrial.heavyHydraulicCylinder});\nfunction applyPackDInventory(inv:PackDInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.granulate=inv.granulate;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packB.industrial.gearbox=inv.gearbox;packB.industrial.generator=inv.generator;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}"
)

# Worker controls + exclusive Van route helper.
rep(
"const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});",
"const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});\nconst hiredWorkerSlots=():WorkerSlotId[]=>{const slots:WorkerSlotId[]=[];if(midgame.worker.hired)slots.push('w1');if(packB.secondWorker.hired)slots.push('w2');if(packC.crew3.hired)slots.push('w3');if(packD.crew4.hired)slots.push('w4');return slots};\nconst playerVanAvailable=()=>midgame.van.owned&&!vanAssignedToWorker(midgame.economyV2);\nfunction dispatchWorkers(){const slots=hiredWorkerSlots();if(!slots.length)return;dispatchWorkerShifts(midgame.economyV2,slots,Date.now());showToast(`Смена подготовлена: ${slots.length} раб. · до 2 ч offline`);saveGame();renderGarage()}\nfunction toggleWorkerVan(){if(!midgame.van.owned||!midgame.worker.hired)return;setVanWorker(midgame.economyV2,midgame.economyV2.vanWorker==='w1'?null:'w1');showToast(midgame.economyV2.vanWorker==='w1'?'Фургон назначен на маршрут рабочего':'Фургон возвращён игроку');saveGame();renderGarage();hud()}"
)

# Offline settlement uses all four benchmarked routes and consumes 2h shift budgets.
sub(
 r"function applyOffline\(\)\{.*?\n\}\n\nfunction refreshField",
"""function applyWorkerEconomyGain(gain:{resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;weight:number}){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k])}\nfunction applyOffline(){\n  const now=Date.now(),completed=advanceWorkshop(now,false),elapsed=Math.max(0,(now-loadedLastSeen)/3600000),e=effects(),hours=Math.min(elapsed,e.offlineCapHours);\n  let gain={metal:0,copper:0,plastic:0};\n  if(elapsed>=.1667){gain={metal:420*e.offlineEfficiency*hours,copper:27*e.offlineEfficiency*hours,plastic:75*e.offlineEfficiency*hours};storage.metal+=gain.metal;storage.copper+=gain.copper;storage.plastic+=gain.plastic}\n  const packCCompleted=advancePackCProduction(packC,now);\n  const workerGain=simulateWorkerGain(midgame,now,8,true);\n  const worker2Gain=simulateSecondWorker(packB,midgame.economyV2,midgame.discoveredComponents,now,true);\n  const worker3Gain=simulateThirdWorker(packC,midgame.economyV2,midgame.discoveredComponents,now,true);\n  const worker4Gain=simulateFourthWorker(packD,midgame.economyV2,midgame.discoveredComponents,now,true);\n  [workerGain,worker2Gain,worker3Gain,worker4Gain].forEach(applyWorkerEconomyGain);\n  const workerWeight=workerGain.weight+worker2Gain.weight+worker3Gain.weight+worker4Gain.weight;\n  if(completed.length||packCCompleted||elapsed>=.1667||workerWeight>.01){\n    $('offlineLoot').innerHTML=`<p>${hours.toFixed(1)} ч пассивной вылазки · эффективность ${(e.offlineEfficiency*100).toFixed(0)}%</p><div><span>Металл <b>+${gain.metal.toFixed(1)} кг</b></span><span>Медь <b>+${gain.copper.toFixed(1)} кг</b></span><span>Пластик <b>+${gain.plastic.toFixed(1)} кг</b></span></div>${workerWeight>.01?`<h3>Рабочие маршруты</h3><p>+${workerWeight.toFixed(1)} кг · offline смена списывается максимум за 2 ч</p>`:''}${completed.length?`<h3>Мастерская завершила</h3><ul>${completed.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}`;offlineScreen.hidden=false\n  }\n  saveGame()\n}\n\nfunction refreshField""",
 flags=re.S
)

# Medal + online respawn state.
rep(
"let telemetry:Telemetry={start:performance.now(),destroyed:0,pickupVisuals:0,components:0};",
"let telemetry:Telemetry={start:performance.now(),destroyed:0,pickupVisuals:0,components:0};\nlet fieldInitialTargetCount=FIELD_NODE_COUNT,respawnSerial=0,nextRespawnAt=0;"
)
rep(
"function refreshField(){trip++;rng=mulberry32(hashSeed(`${baseSeed}:${midgame.currentZone}:${trip}`));targets=generateField(`${baseSeed}:field:${midgame.currentZone}:${trip}`,FIELD_NODE_COUNT);applyZoneProfile(targets,midgame.currentZone,rng);fieldZone=midgame.currentZone;drops=[];texts=[];sparks=[];decor=makeDecor(mulberry32(hashSeed(`${baseSeed}:decor:${midgame.currentZone}:${trip}`)),WORLD.width,WORLD.height,midgame.currentZone);player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;seedEl.textContent=`seed ${baseSeed} · поле ${trip}`}",
"function refreshField(){trip++;rng=mulberry32(hashSeed(`${baseSeed}:${midgame.currentZone}:${trip}`));targets=generateField(`${baseSeed}:field:${midgame.currentZone}:${trip}`,FIELD_NODE_COUNT);applyZoneProfile(targets,midgame.currentZone,rng);fieldZone=midgame.currentZone;fieldInitialTargetCount=targets.length;respawnSerial=0;nextRespawnAt=0;drops=[];texts=[];sparks=[];decor=makeDecor(mulberry32(hashSeed(`${baseSeed}:decor:${midgame.currentZone}:${trip}`)),WORLD.width,WORLD.height,midgame.currentZone);player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;seedEl.textContent=`seed ${baseSeed} · поле ${trip}`}\nfunction spawnMedalRespawnTarget(){for(let attempt=0;attempt<8;attempt++){const fresh=generateField(`${baseSeed}:respawn:${fieldZone}:${trip}:${respawnSerial++}:${attempt}`,1);applyZoneProfile(fresh,fieldZone,rng);const t=fresh[0];if(targets.some(existing=>existing.alive&&d2(existing,t)<90*90))continue;t.id=targets.reduce((m,x)=>Math.max(m,x.id),0)+1;targets.push(t);return true}return false}\nfunction maybeRespawnMasteredZone(now:number){if(!hasClearMedal(midgame.economyV2,fieldZone)||cart>=capacity()-.01)return;const alive=targets.filter(t=>t.alive).length;if(alive>=fieldInitialTargetCount)return;if(nextRespawnAt<=0)nextRespawnAt=now+2500;if(now<nextRespawnAt)return;if(spawnMedalRespawnTarget())nextRespawnAt=now+2500}\nfunction afterTargetBreak(){const alive=targets.filter(t=>t.alive).length;if(alive===0&&telemetry.destroyed>=fieldInitialTargetCount&&zoneMastered(midgame,fieldZone)&&awardClearMedal(midgame.economyV2,fieldZone)){showToast(`🏅 ${ZONE_DEFS[fieldZone].name}: полный сбор! Теперь лом восстанавливается онлайн.`);saveGame()}if(hasClearMedal(midgame.economyV2,fieldZone))nextRespawnAt=performance.now()+2500}"
)

# Frontier reward visibility and XP curve.
rep("text:`+${r.resources[k].toFixed(r.resources[k]<1?1:0)} ${resourceName[k].toLowerCase()}`","text:`+${r.resources[k].toFixed(r.resources[k]<10?1:0)} ${resourceName[k].toLowerCase()}`")
rep("gainXp(xpForTarget(t.classId),t);","gainXp(xpForTarget(t.classId)*zoneXpMultiplier(midgame.currentZone),t);")
rep(
"  if(midgame.currentZone==='z7'){\n    const alloy=z7AlloyYield(t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);\n    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} тяжёлый сплав`,color:'#e2b477',life:1.5})}\n    if(rollRecoveryAssembly(packD,t.classId,rng)){gainXp(12,t);texts.push({x:t.x,y:t.y-136,text:'◆ Recovery Assembly!',color:'#ffd08a',life:2.8,big:true});rareEl.innerHTML='<small>ТЯЖЁЛОЕ ВОССТАНОВЛЕНИЕ</small><b>◆ Recovery Assembly</b><em>Ключевая сборка для Recovery Rig</em>';rareEl.className='rare show strong industrialRare packD';rareUntil=3.1;spawnSparks(t,'#e4a55e',38,true)}\n  }\n}",
"  if(midgame.currentZone==='z7'){\n    const alloy=z7AlloyYield(t.classId,rng),take=Math.min(Math.max(0,capacity()-cart),alloy);\n    if(take>0){alloyHaul+=take;cart+=take;texts.push({x:t.x+25,y:t.y-96,text:`+${take.toFixed(1)} тяжёлый сплав`,color:'#e2b477',life:1.5})}\n    if(rollRecoveryAssembly(packD,t.classId,rng)){gainXp(12,t);texts.push({x:t.x,y:t.y-136,text:'◆ Recovery Assembly!',color:'#ffd08a',life:2.8,big:true});rareEl.innerHTML='<small>ТЯЖЁЛОЕ ВОССТАНОВЛЕНИЕ</small><b>◆ Recovery Assembly</b><em>Ключевая сборка для Recovery Rig</em>';rareEl.className='rare show strong industrialRare packD';rareUntil=3.1;spawnSparks(t,'#e4a55e',38,true)}\n  }\n  afterTargetBreak();\n}"
)

# Benchmark the complete active excursion before any unload mutates its haul.
rep(
"function garage(){if(mode!=='field')return;mode='garage';platform.setGameplayActive(false,'garage');",
"function garage(){if(mode!=='field')return;const benchmark=recordActiveBenchmark(midgame.economyV2,fieldZone,{durationMs:performance.now()-telemetry.start,destroyed:telemetry.destroyed,resources:{metal:haul.metal+midgame.van.resources.metal+packB.truck.resources.metal+packD.recoveryRig.resources.metal,copper:haul.copper+midgame.van.resources.copper+packB.truck.resources.copper+packD.recoveryRig.resources.copper,plastic:haul.plastic+midgame.van.resources.plastic+packB.truck.resources.plastic+packD.recoveryRig.resources.plastic},components:{bearing:comps.bearing+midgame.van.components.bearing,motor:comps.motor+midgame.van.components.motor,hydraulic:comps.hydraulic+midgame.van.components.hydraulic,electronics:comps.electronics+midgame.van.components.electronics},devGranted:sessionStorage.getItem('__salvage_dev_grant__')==='1'},Date.now());if(benchmark.newBest)showToast(`Новый benchmark: ${ZONE_DEFS[fieldZone].name}`);mode='garage';platform.setGameplayActive(false,'garage');"
)

# Van is physically exclusive while assigned to worker route.
rep("  if(!midgame.van.owned)return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);","  if(!playerVanAvailable())return;const result=transferCartToVan(midgame.van,haul,comps,midHaul);")
text=text.replace("const transportOwned=packD.recoveryRig.owned||packB.truck.owned||midgame.van.owned","const transportOwned=packD.recoveryRig.owned||packB.truck.owned||playerVanAvailable()")
text=text.replace("vanOwned:midgame.van.owned||packB.truck.owned||packD.recoveryRig.owned","vanOwned:playerVanAvailable()||packB.truck.owned||packD.recoveryRig.owned")

# First-worker UI: mastery + cash only, benchmark visibility, shift refresh and Van route toggle.
sub(
 r"  const hireReady=canHireFirstWorker\(midgame,cash\);\n  \$\('workerPanel'\)\.innerHTML=!midgame\.worker\.hired\?.*?;\n  const midEl=",
"""  const hireReady=canHireFirstWorker(midgame,cash),shiftLeft=midgame.economyV2.shifts.w1.remainingOfflineMs/3_600_000,workerBenchmark=midgame.worker.assignment?midgame.economyV2.benchmarks[midgame.worker.assignment]:undefined;\n  $('workerPanel').innerHTML=!midgame.worker.hired?`<div class=\"workerCard\"><h2>👷 Первый рабочий</h2><p>Открывается после полного освоения Z1. Фургон больше не является условием найма.</p><span>Basic Route Kit: ${BASIC_ROUTE_CAPACITY_KG} кг</span><button id=\"hireWorker\" ${hireReady?'':'disabled'}>${!zoneMastered(midgame,'z1')?'Сначала освой Z1':cash<FIRST_WORKER_COST?`Нужно ${money(FIRST_WORKER_COST)}`:`Нанять · ${money(FIRST_WORKER_COST)}`}</button></div>`:`<div class=\"workerCard\"><h2>👷 Рабочий · Scavenger</h2><div class=\"workerStatus\">Маршрут: ${midgame.worker.assignment?ZONE_DEFS[midgame.worker.assignment].name:'не назначен'} · offline смена ${shiftLeft.toFixed(1)} / 2.0 ч</div><p>${workerBenchmark?`Benchmark: ${workerBenchmark.destroyed} целей за ${(workerBenchmark.durationMs/60000).toFixed(1)} мин · ${(workerBenchmark.valuePerMin).toFixed(0)} ₽/мин`:'Benchmark ещё не записан: заверши личную вылазку минимум 20 целей / 45 сек.'}</p><div class=\"workerZones\">${(Object.keys(ZONE_DEFS) as ZoneId[]).map(id=>`<button data-worker-zone=\"${id}\" ${canAssignWorker(midgame,id)?'':'disabled'}>${ZONE_DEFS[id].name} · ${midgame.mastery[id].toFixed(0)}%</button>`).join('')}</div><div class=\"workerActions\"><button id=\"dispatchWorkers\" class=\"secondary\">Отправить бригаду на смену · 2 ч</button><button id=\"toggleWorkerVan\" class=\"secondary\" ${midgame.van.owned?'':'disabled'}>${midgame.economyV2.vanWorker==='w1'?'Вернуть фургон игроку':'Фургон → маршрут рабочего'}</button></div></div>`;\n  const midEl=""",
 flags=re.S
)

# Zone-map medal status.
rep("<span>${mastered?'✓ Освоена':`Освоение ${midgame.mastery[id].toFixed(0)}%`}</span>","<span>${mastered?(hasClearMedal(midgame.economyV2,id)?'🏅 Освоена · полный сбор':'✓ Освоена'):`Освоение ${midgame.mastery[id].toFixed(0)}%`}</span>")

# Revised recipe text is visible in the garage.
rep("${HANGAR_RECIPE.metal} кг metal · ${HANGAR_RECIPE.cleanCopper} clean Cu · ${HANGAR_RECIPE.steelBlank} Steel","${HANGAR_RECIPE.metal} кг metal · ${HANGAR_RECIPE.cleanCopper} clean Cu · ${HANGAR_RECIPE.briquette} Briquette · ${HANGAR_RECIPE.steelBlank} Steel")
rep("${SALVAGE_YARD_RECIPE.metal} metal · ${SALVAGE_YARD_RECIPE.cleanCopper} clean Cu · ${SALVAGE_YARD_RECIPE.steelBlank} Steel · ${SALVAGE_YARD_RECIPE.alloyBillet} Alloy","${SALVAGE_YARD_RECIPE.metal} metal · ${SALVAGE_YARD_RECIPE.cleanCopper} clean Cu · ${SALVAGE_YARD_RECIPE.briquette} Briquette · ${SALVAGE_YARD_RECIPE.steelBlank} Steel · ${SALVAGE_YARD_RECIPE.aluminiumBillet} Al billet · ${SALVAGE_YARD_RECIPE.alloyBillet} Alloy")
text=text.replace("${INDUSTRIAL_WORKSHOP_RECIPE.alloyBillet} Alloy · Heavy Frame ${INDUSTRIAL_WORKSHOP_RECIPE.heavyFrame}","${INDUSTRIAL_WORKSHOP_RECIPE.granulate} Granulate · ${INDUSTRIAL_WORKSHOP_RECIPE.aluminiumBillet} Al billet · ${INDUSTRIAL_WORKSHOP_RECIPE.alloyBillet} Alloy · Heavy Frame ${INDUSTRIAL_WORKSHOP_RECIPE.heavyFrame}")

# Garage click controls.
rep("else if(target.closest('#completeContract'))completeContract();else if(target.closest('#buyVan'))buyVan();else if(target.closest('#hireWorker'))hireWorker();","else if(target.closest('#completeContract'))completeContract();else if(target.closest('#buyVan'))buyVan();else if(target.closest('#hireWorker'))hireWorker();else if(target.closest('#dispatchWorkers'))dispatchWorkers();else if(target.closest('#toggleWorkerVan'))toggleWorkerVan();")

# Online worker tick: benchmark rates for all scavengers, components included.
sub(
 r"setInterval\(\(\)=>\{const now=Date\.now\(\),gain=simulateWorkerGain\(midgame,now,8\),gain2=simulateSecondWorker\(packB,now,10\),gain3=simulateThirdWorker\(packC,now,12\),gain4=simulateFourthWorker\(packD,now,18\);.*?\},5000\);",
"""setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8,false),gain2=simulateSecondWorker(packB,midgame.economyV2,midgame.discoveredComponents,now,false),gain3=simulateThirdWorker(packC,midgame.economyV2,midgame.discoveredComponents,now,false),gain4=simulateFourthWorker(packD,midgame.economyV2,midgame.discoveredComponents,now,false);const gains=[gain,gain2,gain3,gain4];let changed=false;for(const workerGain of gains){if(workerGain.weight>.001)changed=true;applyWorkerEconomyGain(workerGain)}if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);""",
 flags=re.S
)

# Respawn runs in active field loop.
rep("move(dt);combat(dt);updateDrops(dt);","move(dt);combat(dt);maybeRespawnMasteredZone(now);updateDrops(dt);")

# Save/test version and test hooks.
rep("saveVersion:8","saveVersion:9")
rep("doAcquireRecoveryRig,doAcquireIndustrialWorkshop,doHireFourthWorker,doAssignFourthWorker,doAssignFourthOperator}});","doAcquireRecoveryRig,doAcquireIndustrialWorkshop,doHireFourthWorker,doAssignFourthWorker,doAssignFourthOperator,dispatchWorkers,toggleWorkerVan,awardCurrentZoneMedal:()=>awardClearMedal(midgame.economyV2,fieldZone),forceRespawnTick:()=>maybeRespawnMasteredZone(performance.now()+10_000)}});")

MAIN.write_text(text,encoding='utf-8')

# Local DEV mutations invalidate benchmark eligibility for the browser session.
hf=HF2.read_text(encoding='utf-8')
old="function mutateSave(mutator:(save:any)=>void){const save=currentSave();if(!save)return;mutator(save);save.lastSeen=Date.now();writeResilientSave(localStorage,SAVE_KEY,JSON.stringify(save));location.reload()}"
new="function mutateSave(mutator:(save:any)=>void){sessionStorage.setItem('__salvage_dev_grant__','1');const save=currentSave();if(!save)return;mutator(save);save.lastSeen=Date.now();writeResilientSave(localStorage,SAVE_KEY,JSON.stringify(save));location.reload()}"
if hf.count(old)!=1: raise SystemExit('human_feedback_v2 mutateSave target not found')
hf=hf.replace(old,new)
HF2.write_text(hf,encoding='utf-8')

# Old browser proofs should wait for the new runtime save version, while V8 fixtures remain V8 migration inputs.
for path in (ROOT/'scripts').glob('*.ts'):
    s=path.read_text(encoding='utf-8')
    s2=s.replace('saveVersion===8','saveVersion===9').replace('saveVersion === 8','saveVersion === 9')
    if s2!=s:path.write_text(s2,encoding='utf-8')

print('Worker & Progression Economy V2 runtime source transform: OK')
