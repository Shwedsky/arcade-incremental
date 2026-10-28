const ZONES=['z1','z2','z3','z4','z5','z6','z7','z8'] as const;

function reconcileLegacyZoneContract(){
  const screen=document.querySelector<HTMLElement>('#zoneScreen');
  const root=document.querySelector<HTMLElement>('#zoneGrid');
  if(!screen||screen.hidden||!root?.classList.contains('v3ZoneFog'))return;
  const present=new Set(Array.from(root.querySelectorAll<HTMLElement>('[data-zone]')).map(node=>node.dataset.zone).filter(Boolean));
  for(const zone of ZONES){
    if(present.has(zone))continue;
    const placeholder=document.createElement('div');
    placeholder.hidden=true;
    placeholder.className='v3LegacyZonePlaceholder';
    placeholder.dataset.zone=zone;
    placeholder.setAttribute('aria-hidden','true');
    placeholder.innerHTML='<button type="button" disabled tabindex="-1"></button>';
    root.append(placeholder);
  }
}

setInterval(reconcileLegacyZoneContract,150);
