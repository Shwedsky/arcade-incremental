import {clearResilientSave,writeResilientSave} from './save_store.ts';

const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const platformApi=()=>((globalThis as any).__SALVAGE_PLATFORM__??null);
const gameApi=()=>((globalThis as any).__SALVAGE_TEST__??null);
const now=()=>Date.now();

const XP_FOR_LEVEL:Record<number,number>={5:3200,8:11000,10:20000,16:41000,30:125000,50:380000};
const RUNTIME_TALENTS=[
  ...Array.from({length:8},(_,i)=>`salvage_${i+1}`),
  ...Array.from({length:8},(_,i)=>`logistics_${i+1}`),
  ...Array.from({length:8},(_,i)=>`workshop_${i+1}`),
  ...Array.from({length:8},(_,i)=>`automation_${i+1}`),
  ...Array.from({length:8},(_,i)=>`trade_${i+1}`)
]; // CORE_DEV_V4

function ensureObject(root:any,key:string){if(!root[key]||typeof root[key]!=='object')root[key]={};return root[key]}
function add(root:any,key:string,amount:number){root[key]=Number(root[key]??0)+amount}

function currentSave(){
  platformApi()?.forceSave?.();
  const raw=localStorage.getItem(SAVE_KEY);
  if(!raw)return null;
  try{return JSON.parse(raw)}catch{return null}
}

function blockUnloadOverwrite(){
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key:string,value:string){
    if(this===localStorage&&(key===SAVE_KEY||key===`${SAVE_KEY}.backup`||key===`${SAVE_KEY}.tmp`))return;
    return original.call(this,key,value);
  };
}

function persistAndReload(save:any){
  save.v=10;
  save.lastSeen=now();
  const result=writeResilientSave(localStorage,SAVE_KEY,JSON.stringify(save));
  if(!result.ok){console.error('DEV save mutation failed',result);return}
  blockUnloadOverwrite();
  location.reload();
}

function mutateSave(mutator:(save:any)=>void){
  const save=currentSave();
  if(!save)return;
  mutator(save);
  persistAndReload(save);
}

function resetReviewSave(){
  clearResilientSave(localStorage,SAVE_KEY);
  blockUnloadOverwrite();
  location.reload();
}

function grantAllResources(save:any){
  save.cash=Number(save.cash??0)+100_000;
  const storage=ensureObject(save,'storage');add(storage,'metal',5000);add(storage,'copper',1200);add(storage,'plastic',1800);
  const components=ensureObject(save,'components');for(const key of ['bearing','motor','hydraulic','electronics'])add(components,key,25);
  const processed=ensureObject(save,'processed');add(processed,'briquette',1200);add(processed,'cleanCopper',600);add(processed,'granulate',800);

  const mid=ensureObject(save,'midgame');
  mid.discoveredComponents=Array.from(new Set([...(mid.discoveredComponents??[]),'bearing','motor','hydraulic','electronics']));
  mid.discoveredMidComponents=Array.from(new Set([...(mid.discoveredMidComponents??[]),'pump','compressor']));
  const midComponents=ensureObject(mid,'midComponents');add(midComponents,'pump',20);add(midComponents,'compressor',20);

  const packB=ensureObject(save,'packB');
  const bMaterials=ensureObject(packB,'materials');add(bMaterials,'aluminiumScrap',1200);add(bMaterials,'steelBlank',500);add(bMaterials,'aluminiumBillet',500);
  const bIndustrial=ensureObject(packB,'industrial');add(bIndustrial,'gearbox',20);add(bIndustrial,'generator',20);
  packB.discoveredIndustrial=Array.from(new Set([...(packB.discoveredIndustrial??[]),'gearbox','generator']));
  const bModules=ensureObject(packB,'modules');add(bModules,'drive',30);add(bModules,'control',30);add(bModules,'structural',30);

  const packC=ensureObject(save,'packC');
  const cMaterials=ensureObject(packC,'materials');add(cMaterials,'alloyScrap',1200);add(cMaterials,'alloyBillet',800);
  const cIndustrial=ensureObject(packC,'industrial');add(cIndustrial,'industrialController',20);add(cIndustrial,'heavyHydraulicCylinder',20);
  packC.discoveredIndustrial=Array.from(new Set([...(packC.discoveredIndustrial??[]),'industrialController','heavyHydraulicCylinder']));
  const cModules=ensureObject(packC,'modules');add(cModules,'hydraulicPower',30);add(cModules,'heavyFrame',30);

  const packD=ensureObject(save,'packD');add(packD,'recoveryAssemblies',8);
  const packE=ensureObject(save,'packE');add(packE,'portPowerAssemblies',3);packE.portPowerDiscovered=true;
}

function ensureWorkersAndInfrastructure(save:any){
  // Presets mutate the shipped Save V10 compatibility fields. Drop the derived
  // V3 snapshot so the next boot performs the same migration as a real old save.
  delete save.workforceV3;
  const mid=ensureObject(save,'midgame');
  mid.van={...(mid.van??{}),owned:true};
  mid.worker={...(mid.worker??{}),hired:true,assignment:mid.worker?.assignment??'z1',lastTick:now()};

  const packB=ensureObject(save,'packB');
  packB.hangarOwned=true;packB.truck={...(packB.truck??{}),owned:true};
  packB.secondWorker={...(packB.secondWorker??{}),hired:true,assignment:packB.secondWorker?.assignment??'z3',lastTick:now()};

  const packC=ensureObject(save,'packC');
  packC.salvageYardOwned=true;
  packC.crew3={...(packC.crew3??{}),hired:true,role:'scavenger',assignment:packC.crew3?.assignment??'z6',lastTick:now()};

  const packD=ensureObject(save,'packD');
  packD.recoveryRig={...(packD.recoveryRig??{}),owned:true};
  packD.industrialWorkshopOwned=true;packD.productionCells=Math.max(Number(packD.productionCells??0),2);
  packD.crew4={...(packD.crew4??{}),hired:true,role:'scavenger',assignment:packD.crew4?.assignment??'z7',operatorCell:null,lastTick:now()};
}

function setMasteryThrough(save:any,zone:string){
  const order=['z1','z2','z3','z4','z5','z6','z7','z8'];
  const idx=Math.max(0,order.indexOf(zone));
  const mid=ensureObject(save,'midgame');const mastery=ensureObject(mid,'mastery');
  for(const id of order)if(typeof mastery[id]!=='number')mastery[id]=0;
  for(let i=0;i<idx;i++)mastery[order[i]]=100;
  mastery[zone]=0;mid.currentZone=zone;
}

function zonePreset(save:any,zone:string){
  grantAllResources(save);
  save.installed=Array.from(new Set([...(save.installed??[]),'workbench','press','wire','plastic']));
  save.machineLevels={...(save.machineLevels??{}),workbench:3,press:3,wire:2,plastic:2};
  save.equipmentLevels={...(save.equipmentLevels??{}),tool:4,cart:4};
  if(zone==='z3'){save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[8]);setMasteryThrough(save,'z3');return}
  ensureWorkersAndInfrastructure(save);
  if(zone==='z5'){save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[10]);setMasteryThrough(save,'z5');return}
  if(zone==='z7'){save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[16]);setMasteryThrough(save,'z7');return}
  save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[16]);setMasteryThrough(save,'z8');
  const packE=ensureObject(save,'packE');packE.portPowerAssemblies=0;packE.portPowerPity=0;packE.portPowerDiscovered=false;packE.processingPlantOwned=false;packE.plantLines=0;packE.production=[];
}

function plantReady(save:any){
  grantAllResources(save);ensureWorkersAndInfrastructure(save);
  save.cash=Math.max(Number(save.cash??0),6_000_000);save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[30]);
  // Plant readiness follows the real gate: a mature generic crew plus an unlocked
  // Operator role. Keep the complete Automation chain through Dispatcher so the
  // review preset demonstrates a legal progression state instead of bypassing it.
  save.talents=Array.from(new Set([...(save.talents??[]),'automation_1','automation_2','automation_3','automation_4','automation_5','automation_6']));
  // DEV_PLANT_READY_V3_CANONICAL: review state must not depend on legacy-slot migration.
  const workforceNow=now();
  save.workforceV3={version:3,nextWorkerSerial:4,nextVehicleSerial:4,nextRouteSerial:1,workers:[
    {id:'worker-1',name:'Рабочий 1',rank:2,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:workforceNow},
    {id:'worker-2',name:'Рабочий 2',rank:2,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:workforceNow},
    {id:'worker-3',name:'Рабочий 3',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:workforceNow}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:null,acquiredAt:workforceNow},
    {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:null,acquiredAt:workforceNow},
    {id:'vehicle-3',type:'recovery_rig',name:'Recovery Rig #1',capacityKg:1800,routeId:null,acquiredAt:workforceNow}
  ],routes:[],lastSimulatedAt:workforceNow};
  save.installed=['workbench','press','wire','plastic'];save.machineLevels={workbench:3,press:3,wire:2,plastic:2};save.equipmentLevels={tool:4,cart:4};
  const mid=ensureObject(save,'midgame');mid.currentZone='z8';mid.mastery={...(mid.mastery??{}),z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100,z8:100};
  const packE=ensureObject(save,'packE');packE.portPowerAssemblies=Math.max(Number(packE.portPowerAssemblies??0),1);packE.portPowerDiscovered=true;packE.processingPlantOwned=false;packE.plantLines=0;packE.production=[];
}

function unlockAll(save:any){
  plantReady(save);save.cash=Math.max(Number(save.cash??0),10_000_000);save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[50]);save.talents=Array.from(new Set([...(save.talents??[]),...RUNTIME_TALENTS]));
  save.machineLevels={workbench:6,press:6,wire:6,plastic:6};save.equipmentLevels={tool:10,cart:10};
  const packE=ensureObject(save,'packE');packE.processingPlantOwned=true;packE.plantLines=2;packE.production=[];
}

function resetCounters(save:any){
  save.totalDestroyed=0;save.contract={index:0,completed:0};
  if(save.midgame?.pity)save.midgame.pity={pump:0,compressor:0};
  if(save.packB?.pity)save.packB.pity={gearbox:0,generator:0};
  if(save.packC?.pity)save.packC.pity={industrialController:0,heavyHydraulicCylinder:0};
  if(save.packD)save.packD.recoveryPity=0;if(save.packE)save.packE.portPowerPity=0;
}

function liveQueueActions(state:any){
  return (state?.scheduler?.actions??[]).filter((action:any)=>action?.status!=='completed'&&action?.status!=='cancelled');
}

function remainingQueueDurationMs(action:any){
  const duration=Math.max(1,Number(action?.durationMs??1));
  if(action?.kind==='process_batch'||action?.kind==='industrial_batch'){
    return duration*Math.max(0,Number(action?.requestedCount??1)-Number(action?.completedCount??0));
  }
  return duration;
}

/**
 * DEV-only deterministic queue completion. Unlike the old +24h control this
 * finishes the actual accepted work and then rebases the scheduler clock back
 * to real wall-clock time, so newly queued work never inherits a future epoch.
 */
function finishWorkshopQueue(){
  const api=gameApi();const state=api?.getState?.();if(!state)return;
  const actions=liveQueueActions(state),scheduler=state.scheduler??{};
  const t=now();
  const timeSignals=actions.flatMap((action:any)=>[
    Number(action?.createdAt??0),
    Number(action?.current?.startedAt??0),
    Number(action?.current?.endsAt??0)
  ]);
  const baseline=Math.max(t,Number(scheduler.lastAdvancedAt??0),...timeSignals);
  const totalMs=actions.reduce((sum:number,action:any)=>sum+remainingQueueDurationMs(action),0);
  if(actions.length&&typeof api.advanceWorkshopTo==='function')api.advanceWorkshopTo(baseline+Math.max(60_000,totalMs+60_000));

  // Persist the real completion effects first (levels, machines, outputs), then
  // repair the scheduler epoch in the serialized save before reload.
  platformApi()?.forceSave?.();
  const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;
  let save:any;try{save=JSON.parse(raw)}catch{return}
  const savedScheduler=ensureObject(save,'scheduler');
  savedScheduler.lastAdvancedAt=t;
  for(const action of savedScheduler.actions??[]){
    if(action?.status==='completed'||action?.status==='cancelled')continue;
    if(Number(action?.createdAt??0)>t)action.createdAt=t;
    // This is only a safety rebase for an unexpected still-live action. Under
    // normal accepted/reserved queue semantics the large deterministic advance
    // above removes every terminal action before this point.
    if(action?.current&&Number(action.current.startedAt)>t){
      const fallbackDuration=Number(action.current.endsAt)-Number(action.current.startedAt);
      const duration=Math.max(1,Number(action?.durationMs??fallbackDuration));
      action.current={startedAt:t,endsAt:t+duration};
    }
  }
  sessionStorage.setItem('__salvage_dev_queue_finish__',JSON.stringify({finished:actions.length,at:t}));
  persistAndReload(save);
}

function augmentPanel(){
  const panel=document.querySelector<HTMLElement>('#hfDevPanel');if(!panel||panel.dataset.devV2==='1')return;
  const grids=panel.querySelectorAll<HTMLElement>('.hfDevGrid');
  grids[0]?.insertAdjacentHTML('beforeend','<button data-dev="level16">Уровень 16</button><button data-dev="level30">Уровень 30</button><button data-dev="level50">Уровень 50</button>');
  grids[1]?.insertAdjacentHTML('beforeend','<button data-zone-dev="z8">К старту Z8</button><button data-dev="plantReady">Plant ready</button>');
  const resourceButton=panel.querySelector<HTMLElement>('[data-dev="resources"]');if(resourceButton)resourceButton.textContent='+100k ₽ + все ресурсы';
  const queueButton=panel.querySelector<HTMLButtonElement>('[data-dev="queue24"]');
  if(queueButton){
    queueButton.dataset.dev='queueFinish';
    queueButton.textContent='✓ Завершить всю очередь';
    queueButton.title='Мгновенно завершает все принятые разработки и производство в Workshop Queue и чинит часы очереди после старого +24ч.';
  }
  const resetQueue=panel.querySelector<HTMLButtonElement>('[data-dev="queueReset"]');if(resetQueue)resetQueue.textContent='Удалить очередь без завершения';
  panel.dataset.devV2='1';
}

function handleDevClick(event:MouseEvent){
  const target=event.target as HTMLElement;const control=target.closest<HTMLElement>('#hfDevPanel [data-dev],#hfDevPanel [data-zone-dev]');if(!control)return;
  const action=control.dataset.dev,zone=control.dataset.zoneDev;
  if(action==='snapshot')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(zone){mutateSave(save=>zonePreset(save,zone));return}
  if(action==='resources'){mutateSave(grantAllResources);return}
  if(action==='level5'||action==='level8'||action==='level10'||action==='level16'||action==='level30'||action==='level50'){
    const level=Number(action.slice(5));mutateSave(save=>save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[level]??0));return;
  }
  if(action==='unlockAll'){mutateSave(unlockAll);return}
  if(action==='plantReady'){mutateSave(plantReady);return}
  if(action==='queueFinish'||action==='queue24'){finishWorkshopQueue();return}
  if(action==='queueReset'){mutateSave(save=>{save.scheduler=save.scheduler??{};save.scheduler.actions=[];save.scheduler.lastAdvancedAt=now()});return}
  if(action==='counters'){mutateSave(resetCounters);return}
  if(action==='reset'&&confirm('Сбросить только локальный review-save?')){resetReviewSave();return}
}

document.addEventListener('click',handleDevClick,true);
new MutationObserver(augmentPanel).observe(document.documentElement,{subtree:true,childList:true});
augmentPanel();

Object.assign(globalThis,{__SALVAGE_DEV_V2__:{grantAllResources,zonePreset,plantReady,unlockAll,finishWorkshopQueue,getState:()=>gameApi()?.getState?.()}});