export type DiagnosticLevel='info'|'warn'|'error';
export interface DiagnosticEvent{ts:number;level:DiagnosticLevel;type:string;detail?:string;data?:Record<string,unknown>}
export interface RuntimeHealth{frames:number;avgFrameMs:number;slowFrames:number;maxFrameMs:number}

export class RuntimeDiagnostics{
  private events:DiagnosticEvent[]=[];
  private frameCount=0;
  private frameTotal=0;
  private slowFrames=0;
  private maxFrame=0;
  constructor(private readonly maxEvents=160){}
  record(type:string,level:DiagnosticLevel='info',detail?:string,data?:Record<string,unknown>){
    this.events.push({ts:Date.now(),level,type,detail,data});
    if(this.events.length>this.maxEvents)this.events.splice(0,this.events.length-this.maxEvents);
  }
  frame(ms:number){if(!Number.isFinite(ms)||ms<0)return;this.frameCount++;this.frameTotal+=ms;if(ms>33.4)this.slowFrames++;if(ms>this.maxFrame)this.maxFrame=ms}
  health():RuntimeHealth{return{frames:this.frameCount,avgFrameMs:this.frameCount?this.frameTotal/this.frameCount:0,slowFrames:this.slowFrames,maxFrameMs:this.maxFrame}}
  snapshot(){return{events:this.events.map(e=>({...e,data:e.data?{...e.data}:undefined})),health:this.health()}}
  clear(){this.events=[];this.frameCount=0;this.frameTotal=0;this.slowFrames=0;this.maxFrame=0}
}

export const diagnostics=new RuntimeDiagnostics();
let installed=false;
export function installGlobalDiagnostics(host:Window|undefined=typeof window==='undefined'?undefined:window){
  if(installed||!host)return;installed=true;
  host.addEventListener('error',event=>diagnostics.record('runtime.error','error',event.message,{file:event.filename,line:event.lineno,column:event.colno}));
  host.addEventListener('unhandledrejection',event=>diagnostics.record('runtime.unhandledrejection','error',String(event.reason instanceof Error?event.reason.message:event.reason)));
  diagnostics.record('diagnostics.installed');
}
