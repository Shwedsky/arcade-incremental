import { diagnostics } from './diagnostics.ts';
import { MAX_SAVE_BYTES, toCloudSnapshot, validCloudSnapshot, type CloudSaveSnapshot } from './save_store.ts';

export type PlatformMode='local'|'yandex';
export interface PlatformState{mode:PlatformMode;initialized:boolean;ready:boolean;gameplayActive:boolean;platformPaused:boolean;cloudAvailable:boolean;lastError?:string}

type PlayerLike={getData:(keys?:string[])=>Promise<Record<string,unknown>>;setData:(data:Record<string,unknown>,flush?:boolean)=>Promise<void>};
type YsdkLike={
  features?:{LoadingAPI?:{ready:()=>void};GameplayAPI?:{start:()=>void;stop:()=>void}};
  getPlayer?:()=>Promise<PlayerLike>;
  on?:(event:string,handler:()=>void)=>void;
  off?:(event:string,handler:()=>void)=>void;
};
type YaGamesLike={init:()=>Promise<YsdkLike>};
type HostLike={
  YaGames?:YaGamesLike;
  location?:{hostname?:string;search?:string};
  document?:Document;
  addEventListener?:(type:string,handler:EventListenerOrEventListenerObject)=>void;
  removeEventListener?:(type:string,handler:EventListenerOrEventListenerObject)=>void;
};

const CLOUD_KEY='salvageSave';

function shouldAttemptSdk(host:HostLike):boolean{
  if(host.YaGames)return true;
  const search=host.location?.search??'',hostname=host.location?.hostname??'';
  return /(?:\?|&)platform=yandex(?:&|$)/.test(search)||hostname.includes('yandex.')||hostname.endsWith('yandex.net');
}

async function loadYandexSdk(host:HostLike,timeoutMs=4500):Promise<boolean>{
  if(host.YaGames)return true;
  const doc=host.document;if(!doc||!shouldAttemptSdk(host))return false;
  return new Promise(resolve=>{
    let done=false;
    const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);resolve(ok)};
    const existing=doc.querySelector<HTMLScriptElement>('script[data-salvage-yandex-sdk]');
    if(existing){if(host.YaGames)return finish(true);existing.addEventListener('load',()=>finish(!!host.YaGames),{once:true});existing.addEventListener('error',()=>finish(false),{once:true})}
    else{
      const script=doc.createElement('script');script.src='/sdk.js';script.async=true;script.dataset.salvageYandexSdk='1';
      script.onload=()=>finish(!!host.YaGames);script.onerror=()=>finish(false);doc.head.append(script);
    }
    const timer=setTimeout(()=>finish(!!host.YaGames),timeoutMs);
  });
}

export class PlatformBridge{
  private ysdk:YsdkLike|null=null;
  private player:PlayerLike|null=null;
  private desiredGameplay=false;
  private pauseListener:((paused:boolean)=>void)|null=null;
  private visibilityHandler:()=>void;
  private sdkPauseHandler=()=>this.setPlatformPaused(true,'game_api_pause');
  private sdkResumeHandler=()=>this.setPlatformPaused(false,'game_api_resume');
  private stateValue:PlatformState={mode:'local',initialized:false,ready:false,gameplayActive:false,platformPaused:false,cloudAvailable:false};

  constructor(private readonly host:HostLike=globalThis as unknown as HostLike){
    this.visibilityHandler=()=>{
      const hidden=!!this.host.document?.hidden;
      this.setPlatformPaused(hidden,hidden?'document_hidden':'document_visible');
    };
  }

  get state():PlatformState{return{...this.stateValue}}
  onPauseChange(listener:(paused:boolean)=>void){this.pauseListener=listener}

  async init():Promise<PlatformState>{
    if(this.stateValue.initialized)return this.state;
    try{
      const available=await loadYandexSdk(this.host);
      if(available&&this.host.YaGames){
        this.ysdk=await this.host.YaGames.init();
        this.stateValue.mode='yandex';
        this.stateValue.cloudAvailable=typeof this.ysdk.getPlayer==='function';
        this.ysdk.on?.('game_api_pause',this.sdkPauseHandler);
        this.ysdk.on?.('game_api_resume',this.sdkResumeHandler);
      }
      this.host.document?.addEventListener('visibilitychange',this.visibilityHandler);
      this.stateValue.initialized=true;
      diagnostics.record('platform.initialized','info',this.stateValue.mode,{cloud:this.stateValue.cloudAvailable});
    }catch(error){
      this.stateValue.mode='local';this.stateValue.initialized=true;this.stateValue.cloudAvailable=false;this.setError(error,'platform.init_failed');
    }
    return this.state;
  }

  ready(){
    if(this.stateValue.ready)return;
    try{this.ysdk?.features?.LoadingAPI?.ready();this.stateValue.ready=true;diagnostics.record('platform.ready','info',this.stateValue.mode)}
    catch(error){this.setError(error,'platform.ready_failed')}
  }

  setGameplayActive(active:boolean,reason='app'){
    this.desiredGameplay=active;this.applyGameplayState(reason);
  }

  private applyGameplayState(reason:string){
    const actual=this.desiredGameplay&&!this.stateValue.platformPaused;
    if(actual===this.stateValue.gameplayActive)return;
    try{
      if(actual)this.ysdk?.features?.GameplayAPI?.start();else this.ysdk?.features?.GameplayAPI?.stop();
      this.stateValue.gameplayActive=actual;
      diagnostics.record(actual?'gameplay.start':'gameplay.stop','info',reason);
    }catch(error){this.setError(error,'platform.gameplay_markup_failed')}
  }

  private setPlatformPaused(paused:boolean,reason:string){
    if(this.stateValue.platformPaused===paused)return;
    this.stateValue.platformPaused=paused;this.applyGameplayState(reason);this.pauseListener?.(paused);
    diagnostics.record(paused?'platform.pause':'platform.resume','info',reason);
  }

  async loadCloudSave():Promise<CloudSaveSnapshot|null>{
    if(!this.ysdk?.getPlayer)return null;
    try{
      this.player??=await this.ysdk.getPlayer();
      const data=await this.player.getData([CLOUD_KEY]);
      const snapshot=validCloudSnapshot(data?.[CLOUD_KEY]);
      diagnostics.record('cloud.load',snapshot?'info':'warn',snapshot?'valid':'empty_or_invalid');
      return snapshot;
    }catch(error){this.setError(error,'cloud.load_failed');return null}
  }

  async saveCloudSave(raw:string,flush=false):Promise<boolean>{
    if(new TextEncoder().encode(raw).byteLength>MAX_SAVE_BYTES){diagnostics.record('cloud.save_rejected','warn','payload_too_large');return false}
    const snapshot=toCloudSnapshot(raw);if(!snapshot||!this.ysdk?.getPlayer)return false;
    try{
      this.player??=await this.ysdk.getPlayer();
      await this.player.setData({[CLOUD_KEY]:snapshot},flush);
      diagnostics.record('cloud.save','info',flush?'flush':'queued',{bytes:new TextEncoder().encode(raw).byteLength});
      return true;
    }catch(error){this.setError(error,'cloud.save_failed');return false}
  }

  destroy(){
    this.host.document?.removeEventListener('visibilitychange',this.visibilityHandler);
    this.ysdk?.off?.('game_api_pause',this.sdkPauseHandler);this.ysdk?.off?.('game_api_resume',this.sdkResumeHandler);
  }

  private setError(error:unknown,type:string){const detail=error instanceof Error?error.message:String(error);this.stateValue.lastError=detail;diagnostics.record(type,'error',detail)}
}

export const platform=new PlatformBridge();
