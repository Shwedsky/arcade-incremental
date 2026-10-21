import './hangar_transition_v1.css';

type RuntimeState=Record<string,any>;
type Surface='production'|'crew'|'storage'|'logistics';
const runtime=()=> (globalThis as any).__SALVAGE_TEST__??null;
const shell=()=> (globalThis as any).__SALVAGE_BASE_SHELL__??null;
const visual=()=> (globalThis as any).__SALVAGE_BASE_VISUAL__??null;
let previousHangar:boolean|null=null;
const SURFACE_BY_CLASS:[string,Surface,string][]=[
  ['machineZone','production','Открыть производство'],
  ['dispatchZone','crew','Открыть персонал'],
  ['storageZone','storage','Открыть склад'],
  ['vehicleZone','logistics','Открыть логистику']
];

function requestPresentationRefresh(){
  shell()?.refresh?.();
  visual()?.refresh?.();
  queueMicrotask(enhanceScene);
}

function showMilestone(){
  shell()?.open?.('overview');
  requestPresentationRefresh();
  let toast=document.querySelector<HTMLElement>('#hangarMilestoneV1');
  if(!toast){toast=document.createElement('aside');toast.id='hangarMilestoneV1';toast.className='hangarMilestoneV1';document.body.append(toast)}
  toast.innerHTML='<small>НОВЫЙ МАСШТАБ БИЗНЕСА</small><b>Ангар открыт</b><span>Теперь у тебя 5 мест персонала, 4 транспортных бокса и отдельная операционная база.</span>';
  toast.classList.add('show');
  window.setTimeout(()=>toast?.classList.remove('show'),4200);
}

function enhanceScene(){
  document.querySelectorAll<HTMLElement>('#baseStageSceneV2.stage-hangar .hangarZone').forEach(zone=>{
    const match=SURFACE_BY_CLASS.find(([cls])=>zone.classList.contains(cls));if(!match)return;
    const [,surface,label]=match;zone.dataset.hangarSurface=surface;zone.tabIndex=0;zone.setAttribute('role','button');zone.setAttribute('aria-label',label);
  });
}

function activateZone(target:EventTarget|null){
  const zone=(target as HTMLElement|null)?.closest?.<HTMLElement>('[data-hangar-surface]');if(!zone)return false;
  shell()?.open?.(zone.dataset.hangarSurface);return true;
}

function tick(){
  const state=runtime()?.getState?.() as RuntimeState|undefined;if(!state)return;
  const hangar=!!state.packB?.hangarOwned;
  const later=!!state.packC?.salvageYardOwned||!!state.packD?.industrialWorkshopOwned||!!state.packE?.processingPlantOwned;
  if(previousHangar===false&&hangar&&!later)showMilestone();
  previousHangar=hangar;enhanceScene();
}

function boot(){
  if(!runtime()?.getState||!shell()?.open||!visual()?.refresh){window.setTimeout(boot,80);return}
  document.addEventListener('click',event=>activateZone(event.target));
  document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;if(activateZone(event.target)){event.preventDefault()}});
  window.addEventListener('salvage:business-state-changed',requestPresentationRefresh);
  new MutationObserver(enhanceScene).observe(document.documentElement,{subtree:true,childList:true});
  tick();window.setInterval(tick,250);
}
boot();
