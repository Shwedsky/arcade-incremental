type ReviewTarget='overview'|'production'|'development';

const TARGET_BY_LABEL:Record<string,ReviewTarget>={
  'V3-A · Garage start':'overview',
  'V3-A · Garage developed':'overview',
  'V3-A · Talent reveal':'development',
  'V3-A · Industrial staffing':'production'
};

let activeLabel='',startedAt=0,stableSince=0;

function targetIsReady(target:ReviewTarget):boolean{
  const garage=document.querySelector<HTMLElement>('#garageScreen');
  if(!garage||garage.hidden)return false;
  if(target==='development'){
    const talents=document.querySelector<HTMLElement>('#talentScreen');
    return !!talents&&!talents.hidden;
  }
  const pane=document.querySelector<HTMLElement>(`[data-base-pane="${target}"]`);
  return !!pane&&!pane.hidden;
}

function enforceTarget(target:ReviewTarget){
  const runtime=(globalThis as any).__SALVAGE_TEST__,shell=(globalThis as any).__SALVAGE_BASE_SHELL__;
  const garage=document.querySelector<HTMLElement>('#garageScreen');
  if(!runtime?.forceGarage||!shell?.open||!garage)return;
  if(garage.hidden){
    // The legacy forceGarage transition is intentionally a no-op once runtime mode is already "garage".
    // A late UI initializer may still hide the DOM after that transition, so recover visibility for the
    // explicit DEV review session without changing normal gameplay navigation.
    runtime.forceGarage();
    if(garage.hidden)garage.hidden=false;
  }
  if(target==='development')runtime.openTalents?.();
  else shell.open(target);
}

function tick(){
  const badge=document.querySelector<HTMLElement>('#v3PresetBadge');
  const label=badge?.textContent?.trim()??'',target=TARGET_BY_LABEL[label];
  if(!target){activeLabel='';startedAt=0;stableSince=0;return}
  const now=performance.now();
  if(label!==activeLabel){activeLabel=label;startedAt=now;stableSince=0;if(badge)delete badge.dataset.v3SurfaceStable}

  // A review surface can be correct for a moment and then be replaced by a late stage renderer.
  // Never stop supervising it just because an earlier stability window passed: if it regresses,
  // invalidate the marker, restore the promised landing, and require a fresh stable window.
  if(!targetIsReady(target)){
    stableSince=0;
    if(badge)delete badge.dataset.v3SurfaceStable;
    enforceTarget(target);
    return;
  }

  if(badge?.dataset.v3SurfaceStable==='1')return;
  if(!stableSince)stableSince=now;
  // Require the visible base + promised landing surface to survive late UI initialization.
  if(now-stableSince>=900||now-startedAt>=3500){
    if(badge)badge.dataset.v3SurfaceStable='1';
  }
}

setInterval(tick,100);
