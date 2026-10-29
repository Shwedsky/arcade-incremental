import fs from 'node:fs';

const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('// V3_B_ACTIVE_FIELD_LOOP_RUNTIME')){
  console.log('V3-B active field runtime already integrated');
  process.exit(0);
}

function replaceOnce(oldText,newText,label){
  const count=text.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);
  text=text.replace(oldText,newText);
}
function replaceBlock(startMarker,endMarker,replacement,label){
  const start=text.indexOf(startMarker);
  if(start<0)throw new Error(`${label}: start marker missing`);
  const end=text.indexOf(endMarker,start);
  if(end<0)throw new Error(`${label}: end marker missing`);
  text=text.slice(0,start)+replacement+text.slice(end);
}

replaceOnce("import './operator_ui_v3.ts';","import './operator_ui_v3.ts';\nimport './v3_b_active_field_loop.css';",'css import');
replaceOnce(
  "  type ComponentKind, type ResourceKind, type SalvageTarget, type Vec2\n} from './sim.ts';",
  "  type ComponentKind, type DropResult, type ResourceKind, type SalvageTarget, type Vec2\n} from './sim.ts';\nimport {\n  V3B_BASE_CRIT_CHANCE,V3B_BASE_CRIT_MULTIPLIER,V3B_HIT_INTERVAL_SEC,\n  effectiveCombatDps,pileChildBlueprints,rawCargoWeight,resolveCombatHit,splitPileDropBudget,unloadRawCargo\n} from './active_field_v3.ts';",
  'active-field import'
);

replaceOnce(
  '<div id="vanHud" class="panel vanHud" hidden><span>🚐</span><div class="vanMeter"><b>Фургон <span id="vanText">0 / 400 кг</span></b><i><em id="vanFill"></em></i></div><button id="vanUnload" class="secondary">Разгрузить тележку</button></div>',
  '<div id="vanHud" class="panel vanHud" hidden><span>🚐</span><div class="vanMeter"><b>Фургон <span id="vanText">0 / 400 кг</span></b><i><em id="vanFill"></em></i></div><button id="vanUnload" data-mode="field-buffer" class="secondary">Переложить груз</button></div>',
  'field buffer label'
);
replaceOnce(
  '<header><div><small>ГАРАЖ · БАЗА</small><h1>Мастерская</h1><p>Возвращайся когда хочешь. Вылазка сохраняется, добыча разгружается автоматически, работа мастерской продолжается сама.</p></div><div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong><button id="zonesGarage" class="secondary compact mapButton">Карта зон</button><button id="talentsGarage" class="secondary compact">Развитие</button></div></header>\n    <div class="floor">',
  '<header><div><small>ГАРАЖ · БАЗА</small><h1>Мастерская</h1><p>Добыча остаётся в тележке и транспорте, пока ты явно не разгрузишь её на склад. Работа мастерской продолжается сама.</p></div><div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong><button id="zonesGarage" class="secondary compact mapButton">Карта зон</button><button id="talentsGarage" class="secondary compact">Развитие</button></div></header>\n    <div id="baseCargoPanel" class="baseCargoPanel"></div>\n    <div class="floor">',
  'garage cargo panel'
);

replaceOnce(
  '  productionCellsV1?:ProductionCellsV1State;\n}',
  "  productionCellsV1?:ProductionCellsV1State;\n  expedition?:{cart:number;haul:Record<ResourceKind,number>;comps:Record<ComponentKind,number>;midHaul:Record<MidComponentKind,number>;aluminiumHaul:number;industrialHaul:Record<IndustrialComponentKind,number>;alloyHaul:number;packCIndustrialHaul:Record<HeavyIndustrialComponentKind,number>};\n}",
  'save expedition type'
);

replaceOnce(
  "let trip=0,rng=mulberry32(hashSeed(baseSeed)),targets:SalvageTarget[]=[],drops:Pickup[]=[],texts:FloatText[]=[],sparks:Spark[]=[],decor:Decor[]=[],selected:SalvageTarget|null=null,selectedMachine:MachineId='press';\nlet mode:'field'|'garage'='field',last=performance.now(),rareUntil=0,toastUntil=0,cart=0,haul:Record<ResourceKind,number>={metal:0,copper:0,plastic:0},comps:Record<ComponentKind,number>={bearing:0,motor:0,hydraulic:0,electronics:0};\nlet midHaul:Record<MidComponentKind,number>=emptyMidComponentRecord(),fieldZone:ZoneId=midgame.currentZone;\nlet aluminiumHaul=0,industrialHaul:Record<IndustrialComponentKind,number>={gearbox:0,generator:0};\nlet alloyHaul=0,packCIndustrialHaul:Record<HeavyIndustrialComponentKind,number>={industrialController:0,heavyHydraulicCylinder:0};",
  "const loadedExpedition=loaded.expedition;\nlet trip=0,rng=mulberry32(hashSeed(baseSeed)),targets:SalvageTarget[]=[],drops:Pickup[]=[],texts:FloatText[]=[],sparks:Spark[]=[],decor:Decor[]=[],selected:SalvageTarget|null=null,selectedMachine:MachineId='press';\nlet mode:'field'|'garage'='field',last=performance.now(),rareUntil=0,toastUntil=0,cart=loadedExpedition?.cart??0,haul:Record<ResourceKind,number>={metal:0,copper:0,plastic:0,...loadedExpedition?.haul},comps:Record<ComponentKind,number>={bearing:0,motor:0,hydraulic:0,electronics:0,...loadedExpedition?.comps};\nlet midHaul:Record<MidComponentKind,number>={...emptyMidComponentRecord(),...loadedExpedition?.midHaul},fieldZone:ZoneId=midgame.currentZone;\nlet aluminiumHaul=loadedExpedition?.aluminiumHaul??0,industrialHaul:Record<IndustrialComponentKind,number>={gearbox:0,generator:0,...loadedExpedition?.industrialHaul};\nlet alloyHaul=loadedExpedition?.alloyHaul??0,packCIndustrialHaul:Record<HeavyIndustrialComponentKind,number>={industrialController:0,heavyHydraulicCylinder:0,...loadedExpedition?.packCIndustrialHaul};",
  'persistent expedition state'
);
replaceOnce(
  'let fieldInitialTargetCount=FIELD_NODE_COUNT,respawnSerial=0,nextRespawnAt=0;',
  "let fieldInitialTargetCount=FIELD_NODE_COUNT,respawnSerial=0,nextRespawnAt=0;\nconst pileChildRewards=new Map<number,DropResult>(),pileChildren=new Set<number>();\nlet initialPileParents=0,pileRespawnSerial=0,nextPileRespawnAt=0;",
  'pile state'
);
replaceOnce(
  'let pointer:Vec2|null=null,shake=0,comboCount=0,comboTimer=0,lastGarageRender=0,platformPaused=false;',
  'let pointer:Vec2|null=null,shake=0,comboCount=0,comboTimer=0,attackAccumulator=0,lastGarageRender=0,platformPaused=false;',
  'attack accumulator'
);
replaceOnce(
  "const level=()=>levelForXp(xp),effects=()=>deriveEffects(talents),capacity=()=>cartBaseCapacity(equipmentLevels.cart)+effects().capacityBonus,masteryAvailable=()=>earnedMasteryPoints(level())-spentMasteryPoints(talents),activeVanCapacity=()=>VAN_CAPACITY_KG+effects().vanCapacityBonus;",
  "const level=()=>levelForXp(xp),effects=()=>deriveEffects(talents),capacity=()=>cartBaseCapacity(equipmentLevels.cart)+effects().capacityBonus,masteryAvailable=()=>earnedMasteryPoints(level())-spentMasteryPoints(talents),activeVanCapacity=()=>VAN_CAPACITY_KG+effects().vanCapacityBonus;\nfunction rawPlayerDps(){const e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1;return BASE_DPS*e.dpsMultiplier*toolPowerMultiplier(equipmentLevels.tool)*comboMult}\n// V3_B_ACTIVE_FIELD_LOOP_RUNTIME",
  'combat dps helper'
);
replaceOnce(
  'productionCellsV1:normalizeProductionCellsV1(productionCellsV1),workforceV3:normalizeWorkforceFleetV3(workforceV3)},raw=JSON.stringify(state)',
  'productionCellsV1:normalizeProductionCellsV1(productionCellsV1),workforceV3:normalizeWorkforceFleetV3(workforceV3),expedition:{cart,haul:{...haul},comps:{...comps},midHaul:{...midHaul},aluminiumHaul,industrialHaul:{...industrialHaul},alloyHaul,packCIndustrialHaul:{...packCIndustrialHaul}}},raw=JSON.stringify(state)',
  'save expedition payload'
);

replaceBlock(
  'function refreshField(){',
  'function spawnMedalRespawnTarget()',
  `function isPileParent(t:SalvageTarget){return !pileChildren.has(t.id)&&(fieldZone==='z1'||fieldZone==='z2')&&t.classId==='large_appliance'}\nfunction refreshField(){trip++;rng=mulberry32(hashSeed(\`${'${baseSeed}'}:${'${midgame.currentZone}'}:${'${trip}'}\`));targets=generateField(\`${'${baseSeed}'}:field:${'${midgame.currentZone}'}:${'${trip}'}\`,FIELD_NODE_COUNT);applyZoneProfile(targets,midgame.currentZone,rng);fieldZone=midgame.currentZone;fieldInitialTargetCount=targets.length;respawnSerial=0;nextRespawnAt=0;pileChildRewards.clear();pileChildren.clear();pileRespawnSerial=0;nextPileRespawnAt=0;initialPileParents=targets.filter(isPileParent).length;drops=[];texts=[];sparks=[];decor=makeDecor(mulberry32(hashSeed(\`${'${baseSeed}'}:decor:${'${midgame.currentZone}'}:${'${trip}'}\`)),WORLD.width,WORLD.height,midgame.currentZone);player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;seedEl.textContent=\`генерация ${'${baseSeed}'} · поле ${'${trip}'}\`}\n`,
  'refresh field pile reset'
);

replaceOnce(
  "function maybeRespawnMasteredZone(now:number){if(!zoneMastered(midgame,fieldZone)||cart>=capacity()-.01)return;const alive=targets.filter(t=>t.alive).length;if(alive>=fieldInitialTargetCount)return;const delay=masteredRespawnDelay();if(nextRespawnAt<=0)nextRespawnAt=now+delay;if(now<nextRespawnAt)return;const deficit=fieldInitialTargetCount-alive,spawnCount=hasClearMedal(midgame.economyV2,fieldZone)?Math.min(2,deficit):1;let made=0;for(let i=0;i<spawnCount;i++)if(spawnMedalRespawnTarget())made++;nextRespawnAt=now+(made?delay:Math.max(250,delay/2))}",
  `function maybeRespawnMasteredZone(now:number){if(!zoneMastered(midgame,fieldZone)||cart>=capacity()-.01)return;const alive=targets.filter(t=>t.alive).length;if(alive>=fieldInitialTargetCount)return;const delay=masteredRespawnDelay();if(nextRespawnAt<=0)nextRespawnAt=now+delay;if(now<nextRespawnAt)return;const deficit=fieldInitialTargetCount-alive,spawnCount=hasClearMedal(midgame.economyV2,fieldZone)?Math.min(2,deficit):1;let made=0;for(let i=0;i<spawnCount;i++)if(spawnMedalRespawnTarget())made++;nextRespawnAt=now+(made?delay:Math.max(250,delay/2))}\nfunction spawnPileRespawnTarget(){const def=getTargetClass('large_appliance');for(let attempt=0;attempt<12;attempt++){const local=mulberry32(hashSeed(\`${'${baseSeed}'}:pile-respawn:${'${fieldZone}'}:${'${trip}'}:${'${pileRespawnSerial}'}:${'${attempt}'}\`)),x=WORLD.margin+local()*(WORLD.width-WORLD.margin*2),y=WORLD.margin+local()*(WORLD.height-WORLD.margin*2);if(d2({x,y},START_POS)<190*190||targets.some(existing=>existing.alive&&d2(existing,{x,y})<110*110))continue;const target:SalvageTarget={id:targets.reduce((m,item)=>Math.max(m,item.id),0)+1,classId:'large_appliance',x,y,hp:def.breakSeconds*BASE_DPS,maxHp:def.breakSeconds*BASE_DPS,rotation:(local()-.5)*.7,variant:Math.floor(local()*4),alive:true};applyZoneProfile([target],fieldZone,local);targets.push(target);pileRespawnSerial++;return target}return null}\nfunction maybeRespawnPiles(now:number){if((fieldZone!=='z1'&&fieldZone!=='z2')||initialPileParents<=0||cart>=capacity()-.01)return;const live=targets.filter(t=>t.alive&&isPileParent(t)).length;if(live>=initialPileParents){nextPileRespawnAt=0;return}if(nextPileRespawnAt<=0)nextPileRespawnAt=now+6500;if(now<nextPileRespawnAt)return;spawnPileRespawnTarget();nextPileRespawnAt=now+6500}\nfunction forcePileNearPlayerForTest(){const def=getTargetClass('large_appliance'),target:SalvageTarget={id:targets.reduce((m,item)=>Math.max(m,item.id),0)+1,classId:'large_appliance',x:Math.min(WORLD.width-60,player.x+70),y:player.y,hp:def.breakSeconds*BASE_DPS,maxHp:def.breakSeconds*BASE_DPS,rotation:0,variant:1,alive:true};targets.push(target);initialPileParents=Math.max(initialPileParents,1);return target.id}`,
  'pile respawn'
);

replaceOnce(
  "function registerCombo(){const e=effects();if(!e.comboUnlocked)return;comboCount=comboTimer>0?Math.min(e.comboCap,comboCount+1):1;comboTimer=e.comboTimeout}\nfunction breakTarget(t:SalvageTarget){\n  t.alive=false;t.hp=0;telemetry.destroyed++;totalDestroyed++;registerCombo();\n  const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);\n  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>r.resources[k]*=ym);\n  r.component=applyPity(t,r.component);",
  `function registerCombo(){const e=effects();if(!e.comboUnlocked)return;comboCount=comboTimer>0?Math.min(e.comboCap,comboCount+1):1;comboTimer=e.comboTimeout}\nfunction spawnPileChildren(parent:SalvageTarget,reward:DropResult){const blueprints=pileChildBlueprints(parent),budgets=splitPileDropBudget(reward,blueprints.length);let nextId=targets.reduce((m,item)=>Math.max(m,item.id),0)+1;blueprints.forEach((blueprint,index)=>{const hp=Math.max(28,parent.maxHp*blueprint.hpFactor),child:SalvageTarget={id:nextId++,classId:blueprint.classId,x:blueprint.x,y:blueprint.y,hp,maxHp:hp,rotation:blueprint.rotation,variant:blueprint.variant,alive:true};targets.push(child);pileChildren.add(child.id);pileChildRewards.set(child.id,budgets[index])})}\nfunction breakPileParent(t:SalvageTarget){t.alive=false;t.hp=0;telemetry.destroyed++;totalDestroyed++;registerCombo();const reward=rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);(['metal','copper','plastic'] as ResourceKind[]).forEach(k=>reward.resources[k]*=ym);reward.component=applyPity(t,reward.component);spawnPileChildren(t,reward);const mastery=addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));if(mastery.masteredNow)showToast(\`${'${ZONE_DEFS[midgame.currentZone].name}'} освоена! Можно назначать рабочего.\`);gainXp(xpForTarget(t.classId)*zoneXpMultiplier(midgame.currentZone),t);shake=10;spawnSparks(t,'#ffd36d',24,true);texts.push({x:t.x,y:t.y-58,text:'КУЧА РАЗВАЛИЛАСЬ',color:'#ffd36d',life:1.5,big:true});afterTargetBreak()}\nfunction breakTarget(t:SalvageTarget){\n  if(isPileParent(t)){breakPileParent(t);return}\n  const pileChild=pileChildren.delete(t.id),rewardOverride=pileChildRewards.get(t.id);if(rewardOverride)pileChildRewards.delete(t.id);\n  t.alive=false;t.hp=0;telemetry.destroyed++;if(!pileChild)totalDestroyed++;registerCombo();\n  const def=getTargetClass(t.classId),r=rewardOverride??rollDrops(t.classId,rng),ym=zoneYieldMultiplier(midgame.currentZone);\n  if(!rewardOverride)(['metal','copper','plastic'] as ResourceKind[]).forEach(k=>r.resources[k]*=ym);\n  if(!rewardOverride)r.component=applyPity(t,r.component);`,
  'pile break routing'
);
replaceOnce(
  '  const mastery=addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));',
  "  const mastery=pileChild?{before:midgame.mastery[midgame.currentZone],after:midgame.mastery[midgame.currentZone],masteredNow:false}:addActiveMastery(midgame,midgame.currentZone,masteryUnitsForTarget(t.classId));",
  'pile child mastery'
);
replaceOnce(
  '  gainXp(xpForTarget(t.classId)*zoneXpMultiplier(midgame.currentZone),t);',
  '  if(!pileChild)gainXp(xpForTarget(t.classId)*zoneXpMultiplier(midgame.currentZone),t);',
  'pile child xp'
);
replaceOnce(
  '  const mid=rollMidComponent(midgame,midgame.currentZone,t.classId,rng);',
  '  const mid=pileChild?undefined:rollMidComponent(midgame,midgame.currentZone,t.classId,rng);',
  'pile child mid reward'
);

replaceBlock(
  'function combat(dt:number){',
  '\n\nfunction updateDrops',
  `function combat(dt:number){selected=nearest();if(!selected){attackAccumulator=0;return}attackAccumulator+=dt;const rawDps=rawPlayerDps();while(attackAccumulator>=V3B_HIT_INTERVAL_SEC&&selected?.alive){attackAccumulator-=V3B_HIT_INTERVAL_SEC;const primary=selected,hit=resolveCombatHit(rawDps,rng());primary.hp-=hit.damage;texts.push({x:primary.x+(rng()-.5)*20,y:primary.y-58,text:hit.critical?\`КРИТ −${'${Math.round(hit.damage)}'}\`:\`−${'${Math.round(hit.damage)}'}\`,color:hit.critical?'#ffd36d':'#f4e4b7',life:hit.critical?1.05:.72,big:hit.critical});spawnSparks(primary,hit.critical?'#ffd36d':'#f2cf7b',hit.critical?8:3,hit.critical);const extras=secondaryTargets(primary);extras.forEach((target,index)=>{const power=index===0&&effects().wideSwingUnlocked?.55:index===0?.42:index===1?.32:.25,targetHit=resolveCombatHit(rawDps*power,rng());target.hp-=targetHit.damage;if(target.alive&&target.hp<=0)breakTarget(target)});if(primary.hp<=0){breakTarget(primary);selected=null;break}}}\n\nfunction updateDrops`,
  'discrete combat'
);

replaceOnce(
  "  if(selected){targetEl.classList.add('show');const d=getTargetClass(selected.classId),content=targetContent(fieldZone,selected.classId,selected.variant),e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,targetDps=BASE_DPS*e.dpsMultiplier*toolPowerMultiplier(equipmentLevels.tool)*comboMult;targetEl.innerHTML=`<b>${'${content.label}'}</b><span>${'${(selected.hp/targetDps).toFixed(1)}'}с</span>`}else targetEl.classList.remove('show');renderProgress();updateGoal()",
  "  if(selected){targetEl.className='target panel show v3bTarget';const content=targetContent(fieldZone,selected.classId,selected.variant),effectiveDps=effectiveCombatDps(rawPlayerDps()),hp=Math.max(0,selected.hp),ratio=Math.max(0,Math.min(1,hp/selected.maxHp));targetEl.innerHTML=`<div class=\"targetHead\"><b>${'${content.label}'}</b><strong>${'${Math.ceil(hp)}'} / ${'${Math.round(selected.maxHp)}'} HP</strong></div><i class=\"targetHpBar\"><i style=\"width:${'${ratio*100}'}%\"></i></i><div class=\"targetCombatMeta\"><span>DPS <b>${'${effectiveDps.toFixed(0)}'}</b></span><span class=\"v3bCritHint\">Крит <b>${'${Math.round(V3B_BASE_CRIT_CHANCE*100)}'}% ×${'${V3B_BASE_CRIT_MULTIPLIER.toFixed(1)}'}</b></span><span>≈ ${'${(hp/Math.max(1,effectiveDps)).toFixed(1)}'}с</span></div>`}else targetEl.className='target panel';renderProgress();updateGoal()",
  'target hp dps hud'
);

const cargoHelpers=`function expeditionCargoWeight(){return cart+vanWeight(midgame.van)+truckWeight(packB)+recoveryRigWeight(packD)}\nfunction hasLooseCargo(){return cart>.001||Object.values(comps).some(v=>v>0)||Object.values(midHaul).some(v=>v>0)||Object.values(industrialHaul).some(v=>v>0)||Object.values(packCIndustrialHaul).some(v=>v>0)}\nfunction renderBaseCargoPanel(){const panel=$('baseCargoPanel'),vehicleKg=vanWeight(midgame.van)+truckWeight(packB)+recoveryRigWeight(packD),total=expeditionCargoWeight(),hasCargo=hasLooseCargo()||vehicleKg>.001;panel.innerHTML=\`<div class=\"baseCargoHead\"><div><small>ГРУЗ ВЫЛАЗКИ</small><b>${'${hasCargo?\'Ждёт разгрузки\':\'Пусто\'}'}</b></div><strong>${'${total.toFixed(1)}'} кг</strong></div><div class=\"baseCargoRows ${'${hasCargo?\'\':\'cargoEmpty\'}'}\"><span>Тележка <b>${'${cart.toFixed(1)}'} кг</b></span><span>Металл <b>${'${haul.metal.toFixed(1)}'}</b></span><span>Медь <b>${'${haul.copper.toFixed(1)}'}</b></span><span>Пластик <b>${'${haul.plastic.toFixed(1)}'}</b></span>${'${vehicleKg>.001?`<span>Транспорт <b>${vehicleKg.toFixed(1)} кг</b></span>`:\'\'}'}</div><button id=\"baseUnload\" ${'${hasCargo?\'\':\'disabled\'}'}>${'${hasCargo?\'Разгрузить на склад\':\'Груз уже разгружен\'}'}</button>\`}\nfunction unloadAtBase(){if(mode!=='garage')return 0;const before=expeditionCargoWeight(),raw=unloadRawCargo(haul,storage,Number.POSITIVE_INFINITY);storage={...raw.storage};haul={...raw.remaining};for(const k of Object.keys(comps) as ComponentKind[]){storedComps[k]+=comps[k];comps[k]=0}for(const k of Object.keys(midHaul) as MidComponentKind[]){midgame.midComponents[k]+=midHaul[k];midHaul[k]=0}packB.materials.aluminiumScrap+=aluminiumHaul;aluminiumHaul=0;(Object.keys(industrialHaul) as IndustrialComponentKind[]).forEach(k=>{packB.industrial[k]+=industrialHaul[k];industrialHaul[k]=0});packC.materials.alloyScrap+=alloyHaul;alloyHaul=0;(Object.keys(packCIndustrialHaul) as HeavyIndustrialComponentKind[]).forEach(k=>{packC.industrial[k]+=packCIndustrialHaul[k];packCIndustrialHaul[k]=0});unloadVanToStorage(midgame.van,storage,storedComps,midgame.midComponents);unloadTruck(packB,storage);packC.materials.alloyScrap+=unloadPackCTruckAlloy(packC);const rig=unloadRecoveryRig(packD,storage);packB.materials.aluminiumScrap+=rig.aluminiumScrap;packC.materials.alloyScrap+=rig.alloyScrap;cart=rawCargoWeight(haul)+aluminiumHaul+alloyHaul;const moved=Math.max(0,before-expeditionCargoWeight());showToast(moved>.01?\`Разгружено на склад: ${'${moved.toFixed(1)}'} кг\`:'Груз уже разгружен');saveGame();renderGarage();hud();return moved}\nfunction grantV3BCargoForTest(){haul.metal+=18;haul.copper+=4;haul.plastic+=3;cart=rawCargoWeight(haul)+aluminiumHaul+alloyHaul;hud();return cart}\n\n`;
replaceOnce('function renderGarage(){',cargoHelpers+'function renderGarage(){','base cargo helpers');
replaceOnce(
  "function renderGarage(){advanceWorkshop(Date.now(),false);const growth=garageGrowthStage(installed,midgame.van.owned,midgame.worker.hired),garageBox=document.querySelector<HTMLElement>('.garageBox');",
  "function renderGarage(){advanceWorkshop(Date.now(),false);renderBaseCargoPanel();const growth=garageGrowthStage(installed,midgame.van.owned,midgame.worker.hired),garageBox=document.querySelector<HTMLElement>('.garageBox');",
  'render cargo panel'
);

replaceBlock(
  'function garage(){',
  'function leaveGarage(){',
  `function garage(){if(mode!=='field')return;const benchmark=recordActiveBenchmark(midgame.economyV2,fieldZone,{durationMs:performance.now()-telemetry.start,destroyed:telemetry.destroyed,resources:{metal:haul.metal+midgame.van.resources.metal+packB.truck.resources.metal+packD.recoveryRig.resources.metal,copper:haul.copper+midgame.van.resources.copper+packB.truck.resources.copper+packD.recoveryRig.resources.copper,plastic:haul.plastic+midgame.van.resources.plastic+packB.truck.resources.plastic+packD.recoveryRig.resources.plastic},components:{bearing:comps.bearing+midgame.van.components.bearing,motor:comps.motor+midgame.van.components.motor,hydraulic:comps.hydraulic+midgame.van.components.hydraulic,electronics:comps.electronics+midgame.van.components.electronics},devGranted:sessionStorage.getItem('__salvage_dev_grant__')==='1'},Date.now());if(benchmark.newBest)showToast(\`Новый benchmark: ${'${ZONE_DEFS[fieldZone].name}'}\`);mode='garage';platform.setGameplayActive(false,'garage');$('tripSummary').textContent=\`Последняя вылазка: ${'${telemetry.destroyed}'} целей · ${'${fmt((performance.now()-telemetry.start)/1000)}'} · груз ждёт разгрузки\`;garageScreen.hidden=false;renderGarage();saveGame()}\n`,
  'manual garage unload'
);
replaceOnce(
  "else if(target.closest('#refineSteel'))doRefineSteel();",
  "else if(target.closest('#baseUnload'))unloadAtBase();else if(target.closest('#refineSteel'))doRefineSteel();",
  'base unload click'
);
replaceOnce(
  'move(dt);combat(dt);maybeRespawnMasteredZone(now);updateDrops(dt);',
  'move(dt);combat(dt);maybeRespawnMasteredZone(now);maybeRespawnPiles(now);updateDrops(dt);',
  'pile respawn frame'
);
replaceOnce(
  'cart,capacity:capacity(),alive:targets.filter(t=>t.alive).length,haul:{...haul},storage:{...storage}',
  'cart,capacity:capacity(),effectiveDps:effectiveCombatDps(rawPlayerDps()),alive:targets.filter(t=>t.alive).length,pileChildrenAlive:targets.filter(t=>t.alive&&pileChildren.has(t.id)).length,haul:{...haul},storage:{...storage}',
  'test state v3b'
);
replaceOnce(
  'assignWorker,unloadCartToVan,doRefineSteel',
  'assignWorker,unloadCartToVan,unloadAtBase,grantV3BCargoForTest,forcePileNearPlayerForTest,doRefineSteel',
  'test api v3b'
);

fs.writeFileSync(path,text);
console.log('V3-B active field runtime integration applied');
