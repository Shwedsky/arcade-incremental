import './hangar_transition_v1.css';

type RuntimeState=Record<string,any>;
const runtime=()=> (globalThis as any).__SALVAGE_TEST__??null;
const shell=()=> (globalThis as any).__SALVAGE_BASE_SHELL__??null;
let previousHangar:boolean|null=null;

function showMilestone(){
  shell()?.open?.('overview');
  shell()?.refresh?.();
  let toast=document.querySelector<HTMLElement>('#hangarMilestoneV1');
  if(!toast){toast=document.createElement('aside');toast.id='hangarMilestoneV1';toast.className='hangarMilestoneV1';document.body.append(toast)}
  toast.innerHTML='<small>НОВЫЙ МАСШТАБ БИЗНЕСА</small><b>Ангар открыт</b><span>Теперь у тебя 5 мест персонала, 4 транспортных бокса и отдельная операционная база.</span>';
  toast.classList.add('show');
  window.setTimeout(()=>toast?.classList.remove('show'),4200);
}

function tick(){
  const state=runtime()?.getState?.() as RuntimeState|undefined;if(!state)return;
  const hangar=!!state.packB?.hangarOwned;
  const later=!!state.packC?.salvageYardOwned||!!state.packD?.industrialWorkshopOwned||!!state.packE?.processingPlantOwned;
  if(previousHangar===false&&hangar&&!later)showMilestone();
  previousHangar=hangar;
}

function boot(){
  if(!runtime()?.getState||!shell()?.open){window.setTimeout(boot,80);return}
  tick();window.setInterval(tick,250);
}
boot();
