from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding='utf-8')


def once(text: str, old: str, new: str, label: str) -> str:
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected one match, got {count}')
    return text.replace(old,new,1)

# ---------- Pack E domain: explicit frontier mastery protection ----------
p='src/content_pack_e.ts'; t=read(p)
marker="export function z8AdvancedMetalYield(classId:TargetClassId,rng:()=>number):{aluminiumScrap:number;alloyScrap:number}{"
insert="""export function capZ8MasteryUntilSignature(value:number,portPowerDiscovered:boolean):number{
  const normalized=Math.max(0,Math.min(100,value));
  return portPowerDiscovered?normalized:Math.min(99.9,normalized);
}

export function z8AdvancedMetalYield(classId:TargetClassId,rng:()=>number):{aluminiumScrap:number;alloyScrap:number}{"""
t=once(t,marker,insert,'pack e mastery cap')
write(p,t)

# ---------- Main runtime gameplay ----------
p='src/main.ts'; t=read(p)
t=once(t,"import './progression_expansion_v2.css';","import './progression_expansion_v2.css';\nimport './content_pack_e.css';",'pack e css import')
old_import="""import {
  canUnlockZ8,createDefaultPackE,normalizePackE,
  type PackEState
} from './content_pack_e.ts';"""
new_import="""import {
  PLANT_ALLOY_INPUT,PLANT_ALLOY_OUTPUT,PLANT_ALLOY_SECONDS,PROCESSING_PLANT_CASH,PROCESSING_PLANT_RECIPE,PROCESSING_PLANT_STORAGE_KG,
  acquireProcessingPlant,advancePlantProduction,canAcquireProcessingPlant,canStartPlantAlloy,canUnlockZ8,capZ8MasteryUntilSignature,
  createDefaultPackE,normalizePackE,plantProductionProgress,rollPortPowerAssembly,rollZ8IndustrialComponent,startPlantAlloy,z8AdvancedMetalYield,
  type PackEInventory,type PackEState
} from './content_pack_e.ts';"""
t=once(t,old_import,new_import,'pack e runtime imports')

# Processing Plant is a contract capability, not a new inventory/currency kind.
t=once(t,"  packC.discoveredIndustrial.forEach(k=>capabilities.add(`industrialC:${k}`));\n  return{level:level(),capabilities};",
"  packC.discoveredIndustrial.forEach(k=>capabilities.add(`industrialC:${k}`));\n  if(packE.processingPlantOwned)capabilities.add('base:processingPlant');\n  return{level:level(),capabilities};",'plant contract capability')

# Pack E inventory bridge + line advancement.
bridge_marker="function applyPackDInventory(inv:PackDInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.granulate=inv.granulate;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packB.industrial.gearbox=inv.gearbox;packB.industrial.generator=inv.generator;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}\n"
bridge=bridge_marker+"""const currentPackEInventory=():PackEInventory=>({cash,metal:storage.metal,cleanCopper:processed.cleanCopper,granulate:processed.granulate,steelBlank:packB.materials.steelBlank,aluminiumBillet:packB.materials.aluminiumBillet,alloyScrap:packC.materials.alloyScrap,alloyBillet:packC.materials.alloyBillet,drive:packB.modules.drive,control:packB.modules.control,hydraulicPower:packC.modules.hydraulicPower,heavyFrame:packC.modules.heavyFrame,industrialController:packC.industrial.industrialController,heavyHydraulicCylinder:packC.industrial.heavyHydraulicCylinder});
function applyPackEInventory(inv:PackEInventory){cash=inv.cash;storage.metal=inv.metal;processed.cleanCopper=inv.cleanCopper;processed.granulate=inv.granulate;packB.materials.steelBlank=inv.steelBlank;packB.materials.aluminiumBillet=inv.aluminiumBillet;packC.materials.alloyScrap=inv.alloyScrap;packC.materials.alloyBillet=inv.alloyBillet;packB.modules.drive=inv.drive;packB.modules.control=inv.control;packC.modules.hydraulicPower=inv.hydraulicPower;packC.modules.heavyFrame=inv.heavyFrame;packC.industrial.industrialController=inv.industrialController;packC.industrial.heavyHydraulicCylinder=inv.heavyHydraulicCylinder}
const processingPlantContext=()=>({z8Mastered:zoneMastered(midgame,'z8'),industrialWorkshopOwned:packD.industrialWorkshopOwned,recoveryRigOwned:packD.recoveryRig.owned,worker4Hired:packD.crew4.hired});
function advancePlant(now=Date.now()){const output={value:packC.materials.alloyBillet},completed=advancePlantProduction(packE,output,now);packC.materials.alloyBillet=output.value;return completed}
"""
t=once(t,bridge_marker,bridge,'pack e inventory bridge')

# Signature rolls BEFORE mastery bookkeeping so the pity target may also complete the zone.
old_break="""  const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);
  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>r.resources[k]*=ym);
  r.component=applyPity(t,r.component);
  const mastery=addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));
  if(mastery.masteredNow)showToast(`${ZONE_DEFS[midgame.currentZone].name} освоена! Можно назначать рабочего.`);"""
new_break="""  const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);
  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>r.resources[k]*=ym);
  r.component=applyPity(t,r.component);
  const portSignature=midgame.currentZone==='z8'&&rollPortPowerAssembly(packE,t.classId,rng);
  const mastery=addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));
  if(midgame.currentZone==='z8'){
    const capped=capZ8MasteryUntilSignature(mastery.after,packE.portPowerDiscovered);
    if(capped<mastery.after){midgame.mastery.z8=capped;mastery.after=capped;mastery.masteredNow=false}
  }
  if(mastery.masteredNow)showToast(`${ZONE_DEFS[midgame.currentZone].name} освоена! Можно назначать рабочего.`);"""
t=once(t,old_break,new_break,'z8 signature before mastery')

# Actual Z8 loot/signature loop.
z8_block="""  if(midgame.currentZone==='z8'){
    const advanced=z8AdvancedMetalYield(t.classId,rng);
    const takeAl=Math.min(Math.max(0,capacity()-cart),advanced.aluminiumScrap);
    if(takeAl>0){aluminiumHaul+=takeAl;cart+=takeAl;texts.push({x:t.x+24,y:t.y-96,text:`+${takeAl.toFixed(1)} портовый Al`,color:'#b8e2e6',life:1.5})}
    const takeAlloy=Math.min(Math.max(0,capacity()-cart),advanced.alloyScrap);
    if(takeAlloy>0){alloyHaul+=takeAlloy;cart+=takeAlloy;texts.push({x:t.x+28,y:t.y-114,text:`+${takeAlloy.toFixed(1)} портовый сплав`,color:'#79dce5',life:1.6})}
    const industrial=rollZ8IndustrialComponent(packC.discoveredIndustrial,t.classId,rng);
    if(industrial){packCIndustrialHaul[industrial]++;gainXp(10,t);texts.push({x:t.x,y:t.y-138,text:`◆ ${packCComponentName(industrial)}!`,color:'#8ee8f0',life:2.3,big:true})}
    if(portSignature){gainXp(15,t);texts.push({x:t.x,y:t.y-158,text:'◆ Port Power Assembly!',color:'#9ef4ff',life:3,big:true});rareEl.innerHTML='<small>ПОРТОВАЯ СИЛОВАЯ СБОРКА</small><b>◆ Port Power Assembly</b><em>Личная находка: ключ к Processing Plant</em>';rareEl.className='rare show strong industrialRare packE';rareUntil=3.3;spawnSparks(t,'#71e5ef',42,true)}
  }
"""
t=once(t,"  afterTargetBreak();",z8_block+"  afterTargetBreak();",'z8 break loop')

# HUD shows the weightless signature key.
old_hud="<span class=\"${industrialHaul.generator?'has':''}\">GEN <b>${industrialHaul.generator}</b></span>`;"
new_hud="<span class=\"${industrialHaul.generator?'has':''}\">GEN <b>${industrialHaul.generator}</b></span><span class=\"${packE.portPowerAssemblies?'has':''}\">PP <b>${packE.portPowerAssemblies}</b></span>`;"
t=once(t,old_hud,new_hud,'pack e hud signature')

# Mature workers may use mastered Z8, but assignments remain mastery-gated by existing domain functions.
t=once(t,"(['z1','z2','z3','z4','z5','z6'] as ZoneId[]).map(id=>`<button data-worker3-zone=\"${id}\"","(['z1','z2','z3','z4','z5','z6','z7','z8'] as ZoneId[]).map(id=>`<button data-worker3-zone=\"${id}\"",'worker3 z8 ui')
t=once(t,"(['z1','z2','z3','z4','z5','z6','z7'] as ZoneId[]).map(id=>`<button data-worker4-zone=\"${id}\"","(['z1','z2','z3','z4','z5','z6','z7','z8'] as ZoneId[]).map(id=>`<button data-worker4-zone=\"${id}\"",'worker4 z8 ui')

# Plant actions + panel. Insert immediately before renderGarage.
panel_marker='function renderGarage(){'
panel="""function doAcquireProcessingPlant(){const inv=currentPackEInventory();if(acquireProcessingPlant(packE,inv,processingPlantContext())){applyPackEInventory(inv);showToast('Processing Plant открыт: 2 промышленные линии');saveGame();renderGarage()}}
function doStartPlantAlloy(){const scrap={value:packC.materials.alloyScrap};if(startPlantAlloy(packE,scrap,Date.now())){packC.materials.alloyScrap=scrap.value;showToast(`Processing Plant: линия сплава запущена · ${fmtLong(PLANT_ALLOY_SECONDS)}`);saveGame();renderGarage()}}
function renderPackEPanels(){
  if(!packD.industrialWorkshopOwned)return;
  const inv=currentPackEInventory(),ctx=processingPlantContext(),ready=canAcquireProcessingPlant(packE,inv,ctx),z8Gate=zoneGate('z8');
  const signature=packE.portPowerDiscovered?'найдена':'не найдена';
  if(!packE.processingPlantOwned){
    $('transportPanel').innerHTML+=`<div class="milestoneCard packECard"><span class="packETag">PACK E</span><h3>⚓ Z8 · Портовый терминал</h3><div class="packEGrid"><span>Доступ <b>${z8Gate.ok?'открыт':z8Gate.reason}</b></span><span>Освоение <b>${midgame.mastery.z8.toFixed(1)}%</b></span><span class="portSignature">Port Power Assembly <b>${packE.portPowerAssemblies} · ${signature}</b></span><span>Worker #4 <b>${packD.crew4.hired?'готов':'нужен для Plant'}</b></span></div><h3>🏭 Processing Plant</h3><p>Кульминация текущей производственной цепочки: ${money(PROCESSING_PLANT_CASH)} · Metal ${PROCESSING_PLANT_RECIPE.metal} · Clean Cu ${PROCESSING_PLANT_RECIPE.cleanCopper} · Granulate ${PROCESSING_PLANT_RECIPE.granulate} · Steel ${PROCESSING_PLANT_RECIPE.steelBlank} · Al ${PROCESSING_PLANT_RECIPE.aluminiumBillet} · Alloy ${PROCESSING_PLANT_RECIPE.alloyBillet} · Drive ${PROCESSING_PLANT_RECIPE.drive} · Control ${PROCESSING_PLANT_RECIPE.control} · Hydraulic ${PROCESSING_PLANT_RECIPE.hydraulicPower} · Heavy Frame ${PROCESSING_PLANT_RECIPE.heavyFrame} · Controller ${PROCESSING_PLANT_RECIPE.industrialController} · Cylinder ${PROCESSING_PLANT_RECIPE.heavyHydraulicCylinder} · Port Power ${PROCESSING_PLANT_RECIPE.portPowerAssemblies}.</p><button id="acquireProcessingPlant" ${ready?'':'disabled'}>${!ctx.z8Mastered?'Сначала освой Z8':!ctx.worker4Hired?'Нужен Worker #4':ready?'Развернуть Processing Plant':'Не хватает производственных ресурсов'}</button></div>`;
    return;
  }
  const now=Date.now(),jobs=packE.production,canStart=canStartPlantAlloy(packE,packC.materials.alloyScrap);
  $('transportPanel').innerHTML+=`<div class="milestoneCard packECard done"><span class="packETag">PACK E · PLANT ONLINE</span><h3>🏭 Processing Plant</h3><div class="packEGrid"><span>Structural storage <b>${PROCESSING_PLANT_STORAGE_KG.toLocaleString('ru-RU')} кг</b></span><span>Линии <b>${jobs.length} / ${packE.plantLines}</b></span><span>Alloy Scrap <b>${packC.materials.alloyScrap.toFixed(1)} кг</b></span><span>Alloy Billet <b>${packC.materials.alloyBillet.toFixed(1)} кг</b></span></div><div class="plantLines">${Array.from({length:packE.plantLines},(_,i)=>{const job=jobs[i];return job?`<div class="plantLine"><b>Линия ${i+1} · Alloy Billet</b><span>${fmtLong(Math.max(0,(job.endsAt-now)/1000))}</span><i><em style="width:${plantProductionProgress(job,now)*100}%"></em></i><small>${PLANT_ALLOY_INPUT} scrap → ${PLANT_ALLOY_OUTPUT} billet</small></div>`:`<div class="plantLine empty"><b>Линия ${i+1}</b><span>Свободна</span><small>Готова к следующей партии</small></div>`}).join('')}</div><button id="startPlantAlloy" ${canStart?'':'disabled'}>${canStart?`Запустить Alloy · ${PLANT_ALLOY_INPUT} → ${PLANT_ALLOY_OUTPUT} · ${fmtLong(PLANT_ALLOY_SECONDS)}`:jobs.length>=packE.plantLines?'Все линии заняты':`Нужно ${PLANT_ALLOY_INPUT} Alloy Scrap`}</button><small>Plant-линии отдельны от гаражной очереди и Industrial Workshop: это крупный параллельный слой, а не замена старых станков.</small></div>`;
}

"""
t=once(t,panel_marker,panel+panel_marker,'pack e panel')

# Render Plant state with the rest of the base.
t=once(t,'renderPackCPanels();renderPackDPanels();const rawValue=','renderPackCPanels();renderPackDPanels();renderPackEPanels();const rawValue=','render pack e')

# Offline Plant completion.
t=once(t,'  const packCCompleted=advancePackCProduction(packC,now);','  const packCCompleted=advancePackCProduction(packC,now);\n  const plantCompleted=advancePlant(now);','offline plant advance')
t=once(t,'if(completed.length||packCCompleted||elapsed>=.1667||workerWeight>.01){','if(completed.length||packCCompleted||plantCompleted||elapsed>=.1667||workerWeight>.01){','offline plant condition')
t=once(t,"${completed.length?`<h3>Мастерская завершила", "${plantCompleted?`<h3>Processing Plant</h3><p>+${plantCompleted} Alloy Billet</p>`:''}${completed.length?`<h3>Мастерская завершила",'offline plant report')

# UI actions.
t=once(t,"else if(target.closest('#hireWorker4'))doHireFourthWorker();else if(target.closest('#assignOperator4'))doAssignFourthOperator();",
"else if(target.closest('#hireWorker4'))doHireFourthWorker();else if(target.closest('#assignOperator4'))doAssignFourthOperator();else if(target.closest('#acquireProcessingPlant'))doAcquireProcessingPlant();else if(target.closest('#startPlantAlloy'))doStartPlantAlloy();",'plant click actions')

# Live plant timer runs next to workshop/industrial-cell timers.
old_timer="setInterval(()=>{const now=Date.now(),completed=advanceWorkshop(now,mode==='garage'),packDone=advancePackCProduction(packC,now);if(packDone){showToast(`Промышленная ячейка завершила: ${packDone}`);saveGame()}if(mode==='garage'&&(completed.length||packDone||performance.now()-lastGarageRender>1000))renderGarage()},1000);"
new_timer="setInterval(()=>{const now=Date.now(),completed=advanceWorkshop(now,mode==='garage'),packDone=advancePackCProduction(packC,now),plantDone=advancePlant(now);if(packDone){showToast(`Промышленная ячейка завершила: ${packDone}`);saveGame()}if(plantDone){showToast(`Processing Plant: +${plantDone} Alloy Billet`);saveGame()}if(mode==='garage'&&(completed.length||packDone||plantDone||performance.now()-lastGarageRender>1000))renderGarage()},1000);"
t=once(t,old_timer,new_timer,'plant live timer')

# Test API for deterministic browser acceptance.
t=once(t,'doAcquireIndustrialWorkshop,doHireFourthWorker,doAssignFourthWorker,doAssignFourthOperator,dispatchWorkers',
'doAcquireIndustrialWorkshop,doHireFourthWorker,doAssignFourthWorker,doAssignFourthOperator,doAcquireProcessingPlant,doStartPlantAlloy,advancePlantTo:(now:number)=>{const done=advancePlant(now);if(mode===\'garage\')renderGarage();return done},dispatchWorkers','plant test api')
write(p,t)

# ---------- Late Contract Board hooks ----------
p='src/contract_board_v2.ts'; t=read(p)
last="""  {id:'industrial_controls',family:'industrial',name:'Промышленная автоматика',description:'Контроллер и гидроцилиндр для модернизации линии.',needs:[industrialC('industrialController',1,'Промышленный контроллер'),industrialC('heavyHydraulicCylinder',1,'Тяжёлый гидроцилиндр')],cashReward:36000,xpReward:190,minLevel:10,requires:['industrialC:industrialController','industrialC:heavyHydraulicCylinder']}
];"""
late="""  {id:'industrial_controls',family:'industrial',name:'Промышленная автоматика',description:'Контроллер и гидроцилиндр для модернизации линии.',needs:[industrialC('industrialController',1,'Промышленный контроллер'),industrialC('heavyHydraulicCylinder',1,'Тяжёлый гидроцилиндр')],cashReward:36000,xpReward:190,minLevel:10,requires:['industrialC:industrialController','industrialC:heavyHydraulicCylinder']},
  {id:'plant_alloy_shipment',family:'industrial',name:'Портовая партия сплава',description:'Processing Plant собирает крупную отгрузку Alloy Billet.',needs:[materialC('alloyBillet',28,'Слитки сплава')],cashReward:75000,xpReward:260,minLevel:16,requires:['materialC:alloyBillet','base:processingPlant']},
  {id:'plant_module_bundle',family:'industrial',name:'Комплект тяжёлой линии',description:'Пакет модулей для модернизации промышленного заказчика.',needs:[moduleC('heavyFrame',2,'Тяжёлые рамы'),moduleC('hydraulicPower',2,'Гидравлические силовые модули'),moduleB('control',2,'Модули управления')],cashReward:125000,xpReward:320,minLevel:16,requires:['moduleC:heavyFrame','moduleC:hydraulicPower','moduleB:control','base:processingPlant']},
  {id:'plant_controls_lot',family:'industrial',name:'Партия промышленной автоматики',description:'Крупный Plant-scale заказ на контроллеры и тяжёлую гидравлику.',needs:[industrialC('industrialController',2,'Промышленные контроллеры'),industrialC('heavyHydraulicCylinder',2,'Тяжёлые гидроцилиндры')],cashReward:150000,xpReward:360,minLevel:16,requires:['industrialC:industrialController','industrialC:heavyHydraulicCylinder','base:processingPlant']}
];"""
t=once(t,last,late,'plant contract templates')
write(p,t)

# ---------- Domain acceptance updates ----------
p='scripts/content-pack-e-smoke.ts'; t=read(p)
t=once(t,'  acquireProcessingPlant,advancePlantProduction,canAcquireProcessingPlant,canStartPlantAlloy,canUnlockZ8,createDefaultPackE,normalizePackE,',
'  acquireProcessingPlant,advancePlantProduction,canAcquireProcessingPlant,canStartPlantAlloy,canUnlockZ8,capZ8MasteryUntilSignature,createDefaultPackE,normalizePackE,','pack e smoke cap import')
t=once(t,'assert.equal(pity.portPowerAssemblies,1);assert.equal(pity.portPowerPity,0);',
"assert.equal(pity.portPowerAssemblies,1);assert.equal(pity.portPowerPity,0);assert.equal(pity.portPowerDiscovered,true);\nassert.equal(capZ8MasteryUntilSignature(100,false),99.9,'Z8 must not complete before first active signature discovery');\nassert.equal(capZ8MasteryUntilSignature(100,true),100,'signature discovery releases the final mastery fraction');",'pack e smoke discovery')
t=once(t,"assert.equal(normalized.plantLines,PROCESSING_PLANT_LINES);assert.equal(normalized.portPowerAssemblies,0);assert.equal(normalized.portPowerPity,PORT_POWER_ASSEMBLY_PITY-1);",
"assert.equal(normalized.plantLines,PROCESSING_PLANT_LINES);assert.equal(normalized.portPowerAssemblies,0);assert.equal(normalized.portPowerPity,PORT_POWER_ASSEMBLY_PITY-1);assert.equal(normalized.portPowerDiscovered,true,'an owned Plant proves historical signature discovery');",'pack e normalize discovery')
write(p,t)

# Contract smoke now understands the level-30 progression era and Plant-only offers.
p='scripts/contract-board-v2-smoke.ts'; t=read(p)
t=once(t,"assert.ok(CONTRACT_BOARD_V2.every(x=>x.minLevel<=10),'all contract level gates must be reachable under the current level cap');",
"assert.ok(CONTRACT_BOARD_V2.every(x=>x.minLevel<=30),'all contract level gates must be reachable under Progression V2 level cap');",'contract cap')
insert_after="""assert.equal(contractBoardPoolStats(late).families,4);
"""
plant_ctx="""assert.equal(contractBoardPoolStats(late).families,4);
const plant:ContractBoardContext={level:16,capabilities:caps(...late.capabilities,'base:processingPlant')};
const plantEligible=eligibleBoardContracts(plant);
assert.ok(plantEligible.some(x=>x.id==='plant_alloy_shipment'));
assert.ok(plantEligible.some(x=>x.id==='plant_module_bundle'));
assert.ok(plantEligible.some(x=>x.id==='plant_controls_lot'));
assert.ok(!eligibleBoardContracts({...plant,capabilities:caps(...late.capabilities)}).some(x=>x.id.startsWith('plant_')),'Plant-scale offers must require actual Processing Plant ownership');
"""
t=once(t,insert_after,plant_ctx,'contract plant context')
write(p,t)

print('Pack E gameplay closure patch prepared')
