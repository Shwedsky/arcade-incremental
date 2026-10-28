import {TALENTS,type BranchId,type TalentId,type TalentMilestone} from './progression.ts';

function runtimeState(){
  try{return (globalThis as any).__SALVAGE_TEST__?.getState?.()??null}catch{return null}
}

function milestoneMet(state:any,milestone:TalentMilestone|undefined):boolean{
  if(!milestone)return true;
  if(milestone==='van')return !!state?.midgame?.van?.owned;
  if(milestone==='first_worker')return !!state?.midgame?.worker?.hired||Number(state?.workforceV3?.workers?.length??0)>0;
  if(milestone==='hangar')return !!state?.packB?.hangarOwned;
  if(milestone==='salvage_yard')return !!state?.packC?.salvageYardOwned;
  return !!state?.packD?.industrialWorkshopOwned;
}

function canonicalAvailable(state:any,talent:any,owned:Set<TalentId>,points:number):boolean{
  if(owned.has(talent.id))return true;
  if(talent.requires&&!owned.has(talent.requires))return false;
  if(Number(state?.level??1)<Number(talent.minLevel??1))return false;
  if(!milestoneMet(state,talent.milestone))return false;
  return points>=Number(talent.pointCost??0);
}

function appendCanonicalFrontier(branch:HTMLElement,talent:any,owned:boolean){
  const spoke=branch.querySelector<HTMLElement>('.v3TalentSpoke');if(!spoke)return null;
  const link=document.createElement('i');link.className='v3TalentLink v3CanonicalFrontierLink';
  const button=document.createElement('button');button.type='button';
  button.className=`talentNode v3TalentNode v3CanonicalFrontier ${owned?'unlocked':'available'}`;
  button.dataset.talent=talent.id;
  button.disabled=owned;
  button.innerHTML=`<span>${owned?'✓':talent.tier}</span><div><b>${talent.name}</b><small>${talent.description}</small><em>${owned?'Изучено':'Можно изучить'}</em></div>`;
  spoke.append(link,button);return button;
}

function reconcileLegacyTalentContract(){
  const root=document.querySelector<HTMLElement>('[data-v3-tree-root]'),state=runtimeState();
  if(!root||!state)return;
  const owned=new Set<TalentId>((state.talents??[]) as TalentId[]),points=Number(state.mastery??0);
  for(const branch of Array.from(root.querySelectorAll<HTMLElement>('.v3TalentBranch[data-v3-branch]'))){
    branch.classList.add('talentBranch');
    const branchId=branch.dataset.v3Branch as BranchId|undefined;
    if(!branchId)continue;
    const talents=TALENTS.filter(t=>t.branch===branchId).sort((a,b)=>a.tier-b.tier);
    const realButtons=new Map<string,HTMLElement>();
    for(const node of Array.from(branch.querySelectorAll<HTMLElement>('.v3TalentNode[data-talent]'))){
      node.classList.add('talentNode');
      const id=node.dataset.talent;if(id)realButtons.set(id,node);
    }
    for(const talent of talents){
      if(realButtons.has(talent.id))continue;
      const placeholder=branch.querySelector<HTMLButtonElement>(`.v3LegacyTalentPlaceholder[data-talent="${talent.id}"]`);
      if(canonicalAvailable(state,talent,owned,points)){
        placeholder?.remove();
        const button=appendCanonicalFrontier(branch,talent,owned.has(talent.id));
        if(button)realButtons.set(talent.id,button);
        continue;
      }
      if(!placeholder){
        const hidden=document.createElement('button');
        hidden.type='button';hidden.hidden=true;hidden.disabled=true;hidden.tabIndex=-1;
        hidden.className='talentNode v3LegacyTalentPlaceholder';hidden.dataset.talent=talent.id;hidden.setAttribute('aria-hidden','true');
        branch.append(hidden);
      }
    }
  }
}

let queued=false;
function queueReconcile(){
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;reconcileLegacyTalentContract()});
}

function installObserver(){
  const host=document.querySelector<HTMLElement>('#talentBranches');
  if(!host){setTimeout(installObserver,50);return}
  const observer=new MutationObserver(queueReconcile);
  observer.observe(host,{subtree:true,childList:true});
  queueReconcile();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installObserver,{once:true});else installObserver();
// Fallback for state-only changes that do not replace talent DOM.
setInterval(reconcileLegacyTalentContract,250);
