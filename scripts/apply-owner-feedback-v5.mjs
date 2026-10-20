import fs from 'node:fs';

function replaceExact(path,from,to){
  const text=fs.readFileSync(path,'utf8');
  if(!text.includes(from))throw new Error(`Missing guarded pattern in ${path}: ${from.slice(0,120)}`);
  const next=text.replace(from,to);
  if(next===text)throw new Error(`No change in ${path}`);
  fs.writeFileSync(path,next);
}

// Main runtime: fleet resale and mastered-zone active-play reward.
replaceExact('src/main.ts',
"} from './workforce_fleet_v3.ts';\n\nconst app=",
"} from './workforce_fleet_v3.ts';\nimport {sellVehicleV3} from './fleet_market_v1.ts';\n\nconst app=");

replaceExact('src/main.ts',
"function acquireGenericVehicle(type:VehicleTypeV3){const stage=currentBusinessStage();if(workforceV3.fleet.length>=fleetCapacityForStage(stage))return null;const costs={van:90_000,truck:260_000,recovery_rig:480_000} as const,cost=costs[type];if(cash<cost)return null;const vehicle=acquireVehicleV3(workforceV3,stage,type,Date.now());if(!vehicle)return null;cash-=cost;saveGame();renderGarage();return vehicle}\nfunction assignGenericRoute",
"function acquireGenericVehicle(type:VehicleTypeV3){const stage=currentBusinessStage();if(workforceV3.fleet.length>=fleetCapacityForStage(stage))return null;const costs={van:90_000,truck:260_000,recovery_rig:480_000} as const,cost=costs[type];if(cash<cost)return null;const vehicle=acquireVehicleV3(workforceV3,stage,type,Date.now());if(!vehicle)return null;cash-=cost;saveGame();renderGarage();return vehicle}\nfunction sellGenericVehicle(vehicleId:string){const sale=sellVehicleV3(workforceV3,vehicleId);if(!sale)return null;cash+=sale.refund;showToast(`${sale.vehicle.name} продан · +${money(sale.refund)}`);saveGame();renderGarage();return sale}\nfunction assignGenericRoute");

replaceExact('src/main.ts',
"function nearest(){if(cart>=capacity()-.01)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}\nfunction secondaryTarget(primary:SalvageTarget){if(!effects().wideSwingUnlocked)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive||t===primary)continue;const max=118+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}",
"function masteredFieldBonus(){const mastered=zoneMastered(midgame,fieldZone),medal=mastered&&hasClearMedal(midgame.economyV2,fieldZone);return{mastered,medal,radius:mastered?(medal?80:50):0,extra:mastered?(medal?2:1):0}}\nfunction nearest(){if(cart>=capacity()-.01)return null;const bonus=masteredFieldBonus();let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+bonus.radius+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}\nfunction secondaryTargets(primary:SalvageTarget){const e=effects(),bonus=masteredFieldBonus(),count=(e.wideSwingUnlocked?1:0)+bonus.extra;if(count<=0)return[];const candidates=targets.filter(t=>t.alive&&t!==primary).map(t=>({t,dd:d2(player,t),max:118+bonus.radius+getTargetClass(t.classId).radius})).filter(x=>x.dd<x.max*x.max).sort((a,b)=>a.dd-b.dd);return candidates.slice(0,count).map(x=>x.t)}");

replaceExact('src/main.ts',
"function maybeRespawnMasteredZone(now:number){if(!hasClearMedal(midgame.economyV2,fieldZone)||cart>=capacity()-.01)return;const alive=targets.filter(t=>t.alive).length;if(alive>=fieldInitialTargetCount)return;if(nextRespawnAt<=0)nextRespawnAt=now+2500;if(now<nextRespawnAt)return;if(spawnMedalRespawnTarget())nextRespawnAt=now+2500}\nfunction afterTargetBreak(){const alive=targets.filter(t=>t.alive).length;if(alive===0&&telemetry.destroyed>=fieldInitialTargetCount&&zoneMastered(midgame,fieldZone)&&awardClearMedal(midgame.economyV2,fieldZone)){showToast(`🏅 ${ZONE_DEFS[fieldZone].name}: полный сбор! Теперь лом восстанавливается онлайн.`);saveGame()}if(hasClearMedal(midgame.economyV2,fieldZone))nextRespawnAt=performance.now()+2500}",
"function masteredRespawnDelay(){return hasClearMedal(midgame.economyV2,fieldZone)?550:900}\nfunction maybeRespawnMasteredZone(now:number){if(!zoneMastered(midgame,fieldZone)||cart>=capacity()-.01)return;const alive=targets.filter(t=>t.alive).length;if(alive>=fieldInitialTargetCount)return;const delay=masteredRespawnDelay();if(nextRespawnAt<=0)nextRespawnAt=now+delay;if(now<nextRespawnAt)return;const deficit=fieldInitialTargetCount-alive,spawnCount=hasClearMedal(midgame.economyV2,fieldZone)?Math.min(2,deficit):1;let made=0;for(let i=0;i<spawnCount;i++)if(spawnMedalRespawnTarget())made++;nextRespawnAt=now+(made?delay:Math.max(250,delay/2))}\nfunction afterTargetBreak(){const alive=targets.filter(t=>t.alive).length;if(alive===0&&telemetry.destroyed>=fieldInitialTargetCount&&zoneMastered(midgame,fieldZone)&&awardClearMedal(midgame.economyV2,fieldZone)){showToast(`🏅 ${ZONE_DEFS[fieldZone].name}: полный сбор! Радиус шире, лом возвращается быстрее.`);saveGame()}if(zoneMastered(midgame,fieldZone))nextRespawnAt=performance.now()+masteredRespawnDelay()}");

replaceExact('src/main.ts',
"function combat(dt:number){selected=nearest();if(!selected)return;const before=selected.hp,e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,tool=toolPowerMultiplier(equipmentLevels.tool),dps=BASE_DPS*e.dpsMultiplier*tool*comboMult;const second=secondaryTarget(selected);selected.hp-=dps*dt;if(second)second.hp-=dps*.55*dt;if(Math.floor(before/30)!==Math.floor(selected.hp/30))spawnSparks(selected,'#f2cf7b',2);if(second&&second.hp<=0)breakTarget(second);if(selected.hp<=0){breakTarget(selected);selected=null}}",
"function combat(dt:number){selected=nearest();if(!selected)return;const before=selected.hp,e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1,tool=toolPowerMultiplier(equipmentLevels.tool),dps=BASE_DPS*e.dpsMultiplier*tool*comboMult,extras=secondaryTargets(selected);selected.hp-=dps*dt;extras.forEach((target,index)=>{const power=index===0&&e.wideSwingUnlocked ? .55 : index===0 ? .42 : index===1 ? .32 : .25;target.hp-=dps*power*dt});if(Math.floor(before/30)!==Math.floor(selected.hp/30))spawnSparks(selected,'#f2cf7b',2);for(const target of extras)if(target.alive&&target.hp<=0)breakTarget(target);if(selected.hp<=0){breakTarget(selected);selected=null}}\n");

replaceExact('src/main.ts',
"hireGenericWorker,acquireGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole",
"hireGenericWorker,acquireGenericVehicle,sellGenericVehicle,assignGenericRoute,unassignGenericRoute,trainGenericWorker,setGenericWorkerRole");

// DEV review: guarantee a visible full progression reset control.
replaceExact('src/manual_review_dev_v2.ts',
"  grids[0]?.insertAdjacentHTML('beforeend','<button data-dev=\"level16\">Уровень 16</button><button data-dev=\"level30\">Уровень 30</button><button data-dev=\"level50\">Уровень 50</button>');",
"  grids[0]?.insertAdjacentHTML('beforeend','<button data-dev=\"level16\">Уровень 16</button><button data-dev=\"level30\">Уровень 30</button><button data-dev=\"level50\">Уровень 50</button>');\n  if(!panel.querySelector('[data-dev=\"reset\"]'))grids[0]?.insertAdjacentHTML('beforeend','<button data-dev=\"reset\" class=\"danger\" title=\"Удалить локальный review-save и начать прохождение заново\">⟲ Сбросить ВЕСЬ прогресс</button>');");
replaceExact('src/manual_review_dev_v2.ts',
"if(action==='reset'&&confirm('Сбросить только локальный review-save?')){resetReviewSave();return}",
"if(action==='reset'&&confirm('Начать review с нуля? Весь локальный прогресс этой сборки будет удалён.')){resetReviewSave();return}");

// Owner pacing verdict: keep Z8 hardest, remove the late-game slog spike.
replaceExact('src/content_pack_e.ts','  hpMultiplier:3.85,\n  yieldMultiplier:2.90,\n  masteryTarget:14_200,','  hpMultiplier:3.45,\n  yieldMultiplier:2.90,\n  masteryTarget:12_000,');
replaceExact('scripts/content-pack-e-smoke.ts','assert.equal(PACK_E_ZONE_PROFILE.hpMultiplier,3.85);','assert.equal(PACK_E_ZONE_PROFILE.hpMultiplier,3.45);');
replaceExact('scripts/content-pack-e-smoke.ts','assert.equal(PACK_E_ZONE_PROFILE.masteryTarget,14_200);','assert.equal(PACK_E_ZONE_PROFILE.masteryTarget,12_000);');
replaceExact('models/content_pack_e_v1.py','Z8 = {"hp": 3.85, "yield": 2.90, "mastery": 14_200, "large_share": .60, "target_hours": 5.0}','Z8 = {"hp": 3.45, "yield": 2.90, "mastery": 12_000, "large_share": .60, "target_hours": 4.6}');
replaceExact('models/content_pack_e_v1.py','    assert 1.10 <= Z8["hp"] / Z7["hp"] <= 1.25','    assert 1.05 <= Z8["hp"] / Z7["hp"] <= 1.15');
replaceExact('models/content_pack_e_v1.py','    assert Z8["target_hours"] == 5.0','    assert Z8["target_hours"] == 4.6');
replaceExact('models/mid_late_mechanics_sim_v1.py','    ("Z8","Port Terminal",1905.0,0.90,180,5.0),','    ("Z8","Port Terminal",1905.0,0.96,180,4.6),');
replaceExact('models/mid_late_mechanics_sim_v1.py','    assert [r["mastery_target_active_h"] for r in ar] == [1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0]','    assert [r["mastery_target_active_h"] for r in ar] == [1.5,2.0,2.5,3.0,3.5,4.0,4.5,4.6]');

console.log('owner feedback v5 runtime patch applied');
