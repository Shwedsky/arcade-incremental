import { MACHINE_DEFS, nextUpgrade, requirementAmount, unmetUnlocks, type MachineId } from './garage.ts';
import { deriveEffects, type TalentId } from './progression.ts';

interface TestState {
  level:number;
  talents:TalentId[];
  installed:MachineId[];
  machineLevels:Partial<Record<MachineId,number>>;
}

declare global {
  // Runtime debug hook is intentionally also used by this tiny presentation adapter.
  // It keeps machine-card requirement text derived from the same state as the inspector.
  var __SALVAGE_TEST__: { getState:()=>TestState } | undefined;
}

const shortRequirement = (req:typeof MACHINE_DEFS.press.requirements[number], multiplier:number) => {
  const amount=requirementAmount(req,multiplier);
  if(req.kind==='cash') return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
  if(req.kind==='resource') return `${req.label} ${amount.toFixed(amount%1?1:0)} кг`;
  return `${req.label} ${Math.ceil(amount)}`;
};

function refreshCardHints(){
  const root=document.querySelector<HTMLElement>('#machineGrid'),api=globalThis.__SALVAGE_TEST__;
  if(!root||!api)return;
  const state=api.getState(),talents=new Set<TalentId>(state.talents),installed=new Set<MachineId>(state.installed),fx=deriveEffects(talents);
  for(const card of root.querySelectorAll<HTMLElement>('[data-machine]')){
    const id=card.dataset.machine as MachineId,def=MACHINE_DEFS[id],gate=card.querySelector<HTMLElement>('.cardGate');
    if(!gate)continue;
    let text:string;
    if(installed.has(id)){
      const lvl=state.machineLevels[id]??1,up=nextUpgrade(def,lvl);
      if(!up) text=`Ур. ${lvl} · максимум текущей версии`;
      else {
        const ctx={level:state.level,talents,installed};
        const missing=unmetUnlocks(up.unlocks,ctx).map(x=>x.label);
        const recipe=up.requirements.map(r=>shortRequirement(r,fx.machineCostMultiplier)).join(' · ');
        text=`Ур. ${lvl} → ${up.toLevel}: ${missing.length?`сначала ${missing.join(' + ')}; `:''}${recipe}`;
      }
    } else {
      const ctx={level:state.level,talents,installed},missing=unmetUnlocks(def.unlocks,ctx).map(x=>x.label),recipe=def.requirements.map(r=>shortRequirement(r,fx.machineCostMultiplier)).join(' · ');
      text=missing.length?`Открыть: ${missing.join(' + ')}. Затем: ${recipe}`:`Собрать: ${recipe}`;
    }
    if(gate.textContent!==text)gate.textContent=text;
  }
}

const observer=new MutationObserver(()=>queueMicrotask(refreshCardHints));
const start=()=>{const root=document.querySelector('#machineGrid');if(root){observer.observe(root,{childList:true,subtree:true});refreshCardHints()}else requestAnimationFrame(start)};
start();
