import {clearResilientSave,writeResilientSave} from './save_store.ts';

const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const now=()=>Date.now();
type ReviewSurface='overview'|'production'|'development';
type ReviewPreset={name:string,surface:ReviewSurface};

function blockUnloadOverwrite(){
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key:string,value:string){
    if(this===localStorage&&(key===SAVE_KEY||key===`${SAVE_KEY}.backup`||key===`${SAVE_KEY}.tmp`))return;
    return original.call(this,key,value);
  };
}

function persistPreset(save:any,name:string,surface:ReviewSurface='overview'){
  save.v=10;save.lastSeen=now();
  const result=writeResilientSave(localStorage,SAVE_KEY,JSON.stringify(save));
  if(!result.ok){console.error('V3 review preset failed',result);return}
  sessionStorage.setItem('__v3_review_preset__',JSON.stringify({name,surface}));
  blockUnloadOverwrite();location.reload();
}

function garageStart(){
  clearResilientSave(localStorage,SAVE_KEY);
  sessionStorage.setItem('__v3_review_preset__',JSON.stringify({name:'V3-A · Garage start',surface:'overview'}));
  blockUnloadOverwrite();location.reload();
}

function garageDeveloped(){
  persistPreset({
    v:10,xp:11000,cash:85000,installed:['workbench','press','wire','plastic'],machineLevels:{workbench:3,press:3,wire:2,plastic:2},
    talents:['salvage_1','logistics_1','workshop_1'],equipmentLevels:{tool:4,cart:4},
    storage:{metal:650,copper:120,plastic:280},components:{bearing:6,motor:3,hydraulic:2,electronics:3},processed:{briquette:180,cleanCopper:65,granulate:90},
    contract:{index:0,completed:4},totalDestroyed:850,
    midgame:{currentZone:'z3',mastery:{z1:100,z2:100,z3:64,z4:0,z5:0,z6:0,z7:0,z8:0},van:{owned:false},worker:{hired:false,assignment:null,lastTick:now()}},
    packB:{hangarOwned:false},packC:{salvageYardOwned:false},packD:{industrialWorkshopOwned:false},packE:{processingPlantOwned:false}
  },'V3-A · Garage developed','overview');
}

function talentReveal(){
  persistPreset({
    v:10,xp:20000,cash:90000,installed:['workbench','press','wire','plastic'],machineLevels:{workbench:3,press:3,wire:3,plastic:2},
    talents:['salvage_1','salvage_2','logistics_1','workshop_1','automation_1','trade_1'],equipmentLevels:{tool:4,cart:4},
    storage:{metal:500,copper:100,plastic:200},components:{bearing:5,motor:3,hydraulic:2,electronics:2},processed:{briquette:120,cleanCopper:50,granulate:75},
    contract:{index:0,completed:3},totalDestroyed:700,
    midgame:{currentZone:'z3',mastery:{z1:100,z2:100,z3:40,z4:0,z5:0,z6:0,z7:0,z8:0},van:{owned:false},worker:{hired:false,assignment:null,lastTick:now()}},
    packB:{hangarOwned:false},packC:{salvageYardOwned:false},packD:{industrialWorkshopOwned:false},packE:{processingPlantOwned:false}
  },'V3-A · Talent reveal','development');
}

function industrialStaffing(){
  const t=now();
  persistPreset({
    v:10,xp:125000,cash:2_500_000,installed:['workbench','press','wire','plastic'],machineLevels:{workbench:5,press:5,wire:5,plastic:5},
    talents:['automation_1','automation_2','automation_3','automation_4','automation_5','automation_6','workshop_1','workshop_2','workshop_3','workshop_4','workshop_5','workshop_6'],equipmentLevels:{tool:7,cart:7},
    storage:{metal:9000,copper:1600,plastic:2200},components:{bearing:30,motor:30,hydraulic:25,electronics:30},processed:{briquette:2000,cleanCopper:1200,granulate:1400},contract:{index:0,completed:12},totalDestroyed:4500,
    midgame:{currentZone:'z7',mastery:{z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:35,z8:0},van:{owned:true},worker:{hired:true,assignment:null,lastTick:t}},
    packB:{hangarOwned:true,truck:{owned:true},materials:{aluminiumScrap:900,steelBlank:600,aluminiumBillet:500},industrial:{gearbox:20,generator:20},modules:{drive:25,control:25,structural:25},secondWorker:{hired:true,assignment:null,lastTick:t}},
    packC:{salvageYardOwned:true,materials:{alloyScrap:1000,alloyBillet:700},industrial:{industrialController:20,heavyHydraulicCylinder:20},modules:{hydraulicPower:20,heavyFrame:20},crew3:{hired:true,role:'scavenger',assignment:null,lastTick:t}},
    packD:{industrialWorkshopOwned:true,productionCells:3,recoveryRig:{owned:true},crew4:{hired:true,role:'scavenger',assignment:null,operatorCell:null,lastTick:t},recoveryAssemblies:5},
    packE:{processingPlantOwned:false},
    workforceV3:{version:3,nextWorkerSerial:5,nextVehicleSerial:4,nextRouteSerial:1,lastSimulatedAt:t,workers:[
      {id:'worker-1',name:'Антон',rank:3,role:'technician',status:'idle',routeId:null,productionCellId:null,hiredAt:t},
      {id:'worker-2',name:'Марина',rank:2,role:'logistician',status:'idle',routeId:null,productionCellId:null,hiredAt:t},
      {id:'worker-3',name:'Илья',rank:2,role:'operator',status:'idle',routeId:null,productionCellId:null,hiredAt:t},
      {id:'worker-4',name:'Олег',rank:3,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:t}
    ],fleet:[
      {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:null,acquiredAt:t},
      {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:null,acquiredAt:t},
      {id:'vehicle-3',type:'recovery_rig',name:'Recovery Rig #1',capacityKg:1800,routeId:null,acquiredAt:t}
    ],routes:[]},
    productionCellsV1:{version:1,nextJobSerial:1,cells:{
      refining:{id:'refining',selectedPlanId:'reinforced_alloy',job:null,completedCycles:2},
      fabrication:{id:'fabrication',selectedPlanId:'drive_module',job:null,completedCycles:3},
      heavy_assembly:{id:'heavy_assembly',selectedPlanId:'hydraulic_power',job:null,completedCycles:1}
    }}
  },'V3-A · Industrial staffing','production');
}

const PRESETS:Record<string,()=>void>={garageStart,garageDeveloped,talentReveal,industrialStaffing};

function installPresetPanel(){
  const panel=document.querySelector<HTMLElement>('#hfDevPanel');if(!panel||panel.querySelector('[data-v3-review-presets]'))return;
  const section=document.createElement('section');section.className='v3ReviewPresetPanel';section.dataset.v3ReviewPresets='1';
  section.innerHTML=`<div class="v3ReviewPresetHead"><small>FORMAL OWNER INCREMENTS</small><b>V3 REVIEW STAGES</b><span>Пресеты создают проверяемое состояние этапа без ручного гринда.</span></div><div class="v3ReviewPresetGrid"><button data-v3-preset="garageStart">V3-A · Garage start</button><button data-v3-preset="garageDeveloped">V3-A · Garage developed</button><button data-v3-preset="talentReveal">V3-A · Talent reveal</button><button data-v3-preset="industrialStaffing">V3-A · Industrial staffing</button></div>`;
  panel.append(section);
}

addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLElement>('[data-v3-preset]');const id=button?.dataset.v3Preset;if(!id||!PRESETS[id])return;PRESETS[id]()},true);

function badgeFor(preset:ReviewPreset){
  let badge=document.querySelector<HTMLElement>('#v3PresetBadge');
  if(!badge){badge=document.createElement('div');badge.id='v3PresetBadge';badge.className='v3PresetBadge';document.body.append(badge)}
  badge.textContent=preset.name;delete badge.dataset.v3SurfaceStable;return badge;
}

function landingReady(surface:ReviewSurface){
  const garage=document.querySelector<HTMLElement>('#garageScreen');if(!garage||garage.hidden)return false;
  if(surface==='development'){const talents=document.querySelector<HTMLElement>('#talentScreen');return !!talents&&!talents.hidden}
  const pane=document.querySelector<HTMLElement>(`[data-base-pane="${surface}"]`);return !!pane&&!pane.hidden;
}

function enforceLanding(preset:ReviewPreset){
  const runtime=(globalThis as any).__SALVAGE_TEST__,baseShell=(globalThis as any).__SALVAGE_BASE_SHELL__;
  const garage=document.querySelector<HTMLElement>('#garageScreen');if(!runtime?.forceGarage||!baseShell?.open||!garage)return false;
  if(garage.hidden){runtime.forceGarage();garage.hidden=false}
  if(preset.surface==='development'){
    const talents=document.querySelector<HTMLElement>('#talentScreen');if(!talents||talents.hidden)runtime.openTalents?.();
  }else{
    const pane=document.querySelector<HTMLElement>(`[data-base-pane="${preset.surface}"]`);if(!pane||pane.hidden)baseShell.open(preset.surface);
  }
  return landingReady(preset.surface);
}

function ownLandingSession(preset:ReviewPreset){
  const badge=badgeFor(preset),started=performance.now();let stableSince=0;
  const timer=window.setInterval(()=>{
    const ready=enforceLanding(preset),t=performance.now();
    if(!ready){stableSince=0;delete badge.dataset.v3SurfaceStable;return}
    if(!stableSince)stableSince=t;
    if(t-stableSince>=900)badge.dataset.v3SurfaceStable='1';
    // Keep ownership through the late P5/industrial render wave, then release it so manual review can navigate freely.
    if(t-started>=5000&&badge.dataset.v3SurfaceStable==='1')window.clearInterval(timer);
  },50);
}

function restoreReviewSurface(){
  const raw=sessionStorage.getItem('__v3_review_preset__');if(!raw)return;
  let preset:ReviewPreset;try{preset=JSON.parse(raw) as ReviewPreset}catch{sessionStorage.removeItem('__v3_review_preset__');return}
  const runtime=(globalThis as any).__SALVAGE_TEST__,baseShell=(globalThis as any).__SALVAGE_BASE_SHELL__;
  if(!runtime?.forceGarage||!baseShell?.open)return;
  sessionStorage.removeItem('__v3_review_preset__');
  ownLandingSession(preset);
}

setInterval(()=>{installPresetPanel();restoreReviewSurface()},100);
