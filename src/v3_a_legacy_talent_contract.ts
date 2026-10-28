import {TALENTS,type BranchId} from './progression.ts';

function reconcileLegacyTalentContract(){
  const root=document.querySelector<HTMLElement>('[data-v3-tree-root]');
  if(!root)return;
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
      let placeholder=branch.querySelector<HTMLButtonElement>(`.v3LegacyTalentPlaceholder[data-talent="${talent.id}"]`);
      if(!placeholder){
        placeholder=document.createElement('button');
        placeholder.type='button';
        placeholder.hidden=true;
        placeholder.disabled=true;
        placeholder.tabIndex=-1;
        placeholder.className='talentNode v3LegacyTalentPlaceholder';
        placeholder.dataset.talent=talent.id;
        placeholder.setAttribute('aria-hidden','true');
        branch.append(placeholder);
      }
    }
  }
}

setInterval(reconcileLegacyTalentContract,150);
