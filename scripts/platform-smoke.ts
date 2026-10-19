import assert from 'node:assert/strict';
import { PlatformBridge } from '../src/platform.ts';
import { toCloudSnapshot } from '../src/save_store.ts';

const local=new PlatformBridge({location:{hostname:'localhost',search:''}} as any);
let state=await local.init();assert.equal(state.mode,'local');assert.equal(state.initialized,true);assert.equal(state.cloudAvailable,false);
local.ready();local.setGameplayActive(true,'test');state=local.state;assert.equal(state.ready,true);assert.equal(state.gameplayActive,true);assert.equal(await local.loadCloudSave(),null);assert.equal(await local.saveCloudSave(JSON.stringify({v:4,lastSeen:1})),false);local.destroy();

const calls:string[]=[];const handlers=new Map<string,()=>void>();let cloud:any={salvageSave:toCloudSnapshot(JSON.stringify({v:4,lastSeen:900,xp:7}))};
const host:any={
  YaGames:{init:async()=>({
    features:{LoadingAPI:{ready:()=>calls.push('ready')},GameplayAPI:{start:()=>calls.push('start'),stop:()=>calls.push('stop')}},
    on:(event:string,handler:()=>void)=>handlers.set(event,handler),off:(event:string)=>handlers.delete(event),
    getPlayer:async()=>({getData:async()=>cloud,setData:async(data:any,flush=false)=>{calls.push(flush?'cloud-flush':'cloud-queued');cloud={...cloud,...data}}})
  })},location:{hostname:'games.yandex.test',search:''}
};
const yandex=new PlatformBridge(host);let paused=false;yandex.onPauseChange(v=>paused=v);state=await yandex.init();assert.equal(state.mode,'yandex');assert.equal(state.cloudAvailable,true);
yandex.ready();assert.ok(calls.includes('ready'));
yandex.setGameplayActive(true,'field');assert.equal(calls.at(-1),'start');
handlers.get('game_api_pause')?.();assert.equal(paused,true);assert.equal(calls.at(-1),'stop');assert.equal(yandex.state.gameplayActive,false);
handlers.get('game_api_resume')?.();assert.equal(paused,false);assert.equal(calls.at(-1),'start');
const loaded=await yandex.loadCloudSave();assert.equal(loaded?.updatedAt,900);
assert.equal(await yandex.saveCloudSave(JSON.stringify({v:4,lastSeen:1200,xp:8}),true),true);assert.equal(calls.at(-1),'cloud-flush');
assert.equal((cloud.salvageSave as any).updatedAt,1200);
yandex.destroy();

console.log(JSON.stringify({localMode:'PASS',yandexMode:'PASS',calls,cloudUpdatedAt:cloud.salvageSave.updatedAt},null,2));
console.log('platform adapter smoke: PASS');
