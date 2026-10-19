#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'src/main.ts';s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    c=s.count(old)
    if c!=1: raise SystemExit(f'{label}: expected 1 match, got {c}')
    s=s.replace(old,new,1)

rep("import { GARAGE_GROWTH_LABEL, garageGrowthStage, targetContent } from './zone_content.ts';",
"""import { GARAGE_GROWTH_LABEL, garageGrowthStage, targetContent } from './zone_content.ts';
import { diagnostics, installGlobalDiagnostics } from './diagnostics.ts';
import { platform } from './platform.ts';
import { chooseNewestSave, clearResilientSave, readResilientSave, writeResilientSave } from './save_store.ts';""",'platform imports')
rep("if(!app)throw new Error('Missing #app');","if(!app)throw new Error('Missing #app');\ninstallGlobalDiagnostics();",'diagnostics install')
rep("if(params.get('reset')==='1')localStorage.removeItem(SAVE_KEY);","if(params.get('reset')==='1')clearResilientSave(localStorage,SAVE_KEY);\nconst initialSaveRead=readResilientSave(localStorage,SAVE_KEY);\nif(initialSaveRead.recovered)diagnostics.record('save.recovered','warn',initialSaveRead.reason,{source:initialSaveRead.source});",'resilient reset/read')
rep("const raw=localStorage.getItem(SAVE_KEY),value=raw?JSON.parse(raw):null,base=defaultSave();","const raw=initialSaveRead.raw,value=raw?JSON.parse(raw):null,base=defaultSave();",'resilient load')
rep("let pointer:Vec2|null=null,shake=0,comboCount=0,comboTimer=0,lastGarageRender=0;","let pointer:Vec2|null=null,shake=0,comboCount=0,comboTimer=0,lastGarageRender=0,platformPaused=false;\nplatform.onPauseChange(paused=>{platformPaused=paused});",'platform pause state')
rep("function saveGame(){const state:SaveStateV4={v:4,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame)};localStorage.setItem(SAVE_KEY,JSON.stringify(state))}",
"""function saveGame(){const state:SaveStateV4={v:4,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],equipmentLevels:{...equipmentLevels},jobs:jobs.map(j=>({...j})),contract:{...contractState},totalDestroyed,lastSeen:Date.now(),midgame:normalizeMidgame(midgame)},raw=JSON.stringify(state),result=writeResilientSave(localStorage,SAVE_KEY,raw);if(!result.ok)diagnostics.record('save.write_failed','error',result.reason,{bytes:result.bytes})}""",'resilient save')
rep("function garage(){if(mode!=='field')return;mode='garage';","function garage(){if(mode!=='field')return;mode='garage';platform.setGameplayActive(false,'garage');",'garage gameplay stop')
rep("function leaveGarage(){garageScreen.hidden=true;mode='field';if(fieldZone!==midgame.currentZone||targets.filter(t=>t.alive).length<12)refreshField();resetExcursionMetrics();hud()}","function leaveGarage(){garageScreen.hidden=true;mode='field';if(fieldZone!==midgame.currentZone||targets.filter(t=>t.alive).length<12)refreshField();resetExcursionMetrics();hud();platform.setGameplayActive(true,'leave_garage')}",'garage gameplay start')
rep("function openZoneScreen(){renderZoneScreen();zoneScreen.hidden=false}\nfunction closeZoneScreen(){zoneScreen.hidden=true}","function openZoneScreen(){renderZoneScreen();zoneScreen.hidden=false;platform.setGameplayActive(false,'zone_map')}\nfunction closeZoneScreen(){zoneScreen.hidden=true;if(mode==='field'&&talentScreen.hidden&&offlineScreen.hidden)platform.setGameplayActive(true,'zone_map_close')}",'zone gameplay markup')
rep("function openTalents(){renderTalents();talentScreen.hidden=false}function closeTalents(){talentScreen.hidden=true}","function openTalents(){renderTalents();talentScreen.hidden=false;platform.setGameplayActive(false,'talents')}function closeTalents(){talentScreen.hidden=true;if(mode==='field'&&zoneScreen.hidden&&offlineScreen.hidden)platform.setGameplayActive(true,'talents_close')}",'talent gameplay markup')
rep("$('offlineClose').onclick=()=>offlineScreen.hidden=true;","$('offlineClose').onclick=()=>{offlineScreen.hidden=true;if(mode==='field'&&talentScreen.hidden&&zoneScreen.hidden)platform.setGameplayActive(true,'offline_close')};",'offline gameplay markup')
rep("function frame(now:number){const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;if(mode==='field'&&talentScreen.hidden&&offlineScreen.hidden){","function frame(now:number){const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;diagnostics.frame(dt*1000);if(!platformPaused&&mode==='field'&&talentScreen.hidden&&zoneScreen.hidden&&offlineScreen.hidden){",'frame pause guard')
rep("refreshField();resetExcursionMetrics();applyOffline();hud();requestAnimationFrame(frame);","""refreshField();resetExcursionMetrics();applyOffline();hud();requestAnimationFrame(frame);
void platform.init().then(async()=>{
  platform.ready();
  platform.setGameplayActive(mode==='field'&&talentScreen.hidden&&zoneScreen.hidden&&offlineScreen.hidden,'boot');
  if(platform.state.mode==='yandex'){
    const local=readResilientSave(localStorage,SAVE_KEY),cloud=await platform.loadCloudSave(),choice=chooseNewestSave(local.raw,cloud);
    diagnostics.record('cloud.reconcile','info',choice.winner,{localUpdatedAt:choice.localUpdatedAt,cloudUpdatedAt:choice.cloudUpdatedAt});
    if(choice.winner==='cloud'&&choice.raw&&choice.raw!==local.raw){
      const written=writeResilientSave(localStorage,SAVE_KEY,choice.raw);
      if(written.ok&&sessionStorage.getItem('__salvage_cloud_reload__')!=='1'){sessionStorage.setItem('__salvage_cloud_reload__','1');location.reload();return}
    }else if(choice.winner==='local'&&choice.raw){void platform.saveCloudSave(choice.raw,false)}
  }
});
setInterval(()=>{if(platform.state.mode!=='yandex')return;const local=readResilientSave(localStorage,SAVE_KEY);if(local.raw)void platform.saveCloudSave(local.raw,false)},60_000);""",'platform boot/cloud')
rep("Object.assign(globalThis,{__SALVAGE_TEST__:{","Object.assign(globalThis,{__SALVAGE_PLATFORM__:{getState:()=>platform.state,getDiagnostics:()=>diagnostics.snapshot(),forceSave:saveGame},__SALVAGE_TEST__:{",'platform debug export')

p.write_text(s,encoding='utf-8');print('platform foundation runtime wiring applied')
