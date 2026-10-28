import {PRODUCTION_PLANS_V1,type ProductionCellIdV1,type ProductionPlanIdV1} from './production_cells_v1.ts';

function fmtDuration(sec:number):string{
  const safe=Math.max(0,Math.round(Number(sec)||0));
  const h=Math.floor(safe/3600),m=Math.floor((safe%3600)/60),s=safe%60;
  if(h>0)return`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return`${m}:${String(s).padStart(2,'0')}`;
}

function correctEmptyWorkerPreview(root:ParentNode=document){
  for(const card of Array.from(root.querySelectorAll<HTMLElement>('[data-production-cell]'))){
    const cellId=card.dataset.productionCell as ProductionCellIdV1;
    const timing=card.querySelector<HTMLElement>('.pcTiming[data-v3a-eta="preview"]');
    const worker=card.querySelector<HTMLSelectElement>(`[data-pc-worker="${cellId}"]`);
    const plan=card.querySelector<HTMLSelectElement>(`[data-pc-plan="${cellId}"]`);
    if(!timing||!worker||worker.value)return;
    const planId=(plan?.value??'') as ProductionPlanIdV1,def=PRODUCTION_PLANS_V1[planId];if(!def)return;
    timing.dataset.baseSec=String(def.baseDurationSec);timing.dataset.adjustedSec=String(def.baseDurationSec);
    const expected=`<small>Цикл</small><b>${fmtDuration(def.baseDurationSec)}</b><span>Без специалиста · базовое время</span>`;
    if(timing.innerHTML!==expected)timing.innerHTML=expected;
  }
}

let queued=false;
function queueCorrection(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;correctEmptyWorkerPreview()})}

const observer=new MutationObserver(queueCorrection);
function install(){
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-v3a-eta','data-adjusted-sec','data-base-sec']});
  correctEmptyWorkerPreview();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
addEventListener('change',event=>{if((event.target as HTMLElement).matches('[data-pc-worker],[data-pc-plan],[data-pc-role]'))queueCorrection()},true);
