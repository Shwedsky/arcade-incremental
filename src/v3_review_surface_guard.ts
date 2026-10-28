type ReviewTarget='overview'|'production'|'development';

const TARGET_BY_LABEL:Record<string,ReviewTarget>={
  'V3-A · Garage start':'overview',
  'V3-A · Garage developed':'overview',
  'V3-A · Talent reveal':'development',
  'V3-A · Industrial staffing':'production'
};

let activeLabel='',startedAt=0,stableSince=0;

function targetIsReady(target:ReviewTarget):boolean{
  if(target==='development'){
    const talents=document.querySelector<HTMLElement>('#talentScreen');
    return !!talents&&!talents.hidden;
  }
  const shell=(globalThis as any).__SALVAGE_BASE_SHELL__;
  const pane=document.querySelector<HTMLElement>(`[data-base-pane="${target}"]`);
  return shell?.getActiveSurface?.()===target&&!!pane&&!pane.hidden;
}

function enforceTarget(target:ReviewTarget){
  const runtime=(globalThis as any).__SALVAGE_TEST__,shell=(globalThis as any).__SALVAGE_BASE_SHELL__;
  const garage=document.querySelector<HTMLElement>('#garageScreen');
  if(!runtime?.forceGarage||!shell?.open||!garage)return;
  if(garage.hidden)runtime.forceGarage();
  if(target==='development')runtime.openTalents?.();
  else shell.open(target);
}

function tick(){
  const badge=document.querySelector<HTMLElement>('#v3PresetBadge');
  const label=badge?.textContent?.trim()??'',target=TARGET_BY_LABEL[label];
  if(!target){activeLabel='';startedAt=0;stableSince=0;return}
  const now=performance.now();
  if(label!==activeLabel){activeLabel=label;startedAt=now;stableSince=0}
  if(badge?.dataset.v3SurfaceStable==='1')return;

  if(!targetIsReady(target)){
    stableSince=0;
    enforceTarget(target);
    return;
  }

  if(!stableSince)stableSince=now;
  // Require the promised landing surface to survive late base/UI initialization.
  if(now-stableSince>=900||now-startedAt>=3500){
    if(badge)badge.dataset.v3SurfaceStable='1';
  }
}

setInterval(tick,100);
