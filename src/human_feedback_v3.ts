import './human_feedback_v3.css';

type AnyState=Record<string,any>;

interface FieldKnowledgeSlot{
  index:number;
  label:string;
  known:(s:AnyState)=>boolean;
}

const FIELD_KNOWLEDGE:FieldKnowledgeSlot[]=[
  {index:4,label:'Насос',known:s=>s.midgame?.discoveredMidComponents?.includes('pump')||(s.midgame?.midComponents?.pump??0)>0},
  {index:5,label:'Компрессор',known:s=>s.midgame?.discoveredMidComponents?.includes('compressor')||(s.midgame?.midComponents?.compressor??0)>0},
  {index:6,label:'Алюминий',known:s=>(s.packB?.materials?.aluminiumScrap??0)>0||(s.midgame?.mastery?.z4??0)>0||!!s.packB?.hangarOwned||!!s.packB?.truck?.owned},
  {index:7,label:'Коробка передач',known:s=>s.packB?.discoveredIndustrial?.includes('gearbox')||(s.packB?.industrial?.gearbox??0)>0},
  {index:8,label:'Генератор',known:s=>s.packB?.discoveredIndustrial?.includes('generator')||(s.packB?.industrial?.generator??0)>0}
];

function state():AnyState|null{
  try{return (globalThis as any).__SALVAGE_TEST__?.getState?.()??null}catch{return null}
}

function applyKnownFieldComponents(){
  const s=state(),root=document.querySelector<HTMLElement>('#components');
  if(!s||!root)return;
  const slots=[...root.querySelectorAll<HTMLElement>(':scope > span')];
  for(const def of FIELD_KNOWLEDGE){
    const slot=slots[def.index];if(!slot)continue;
    const known=def.known(s),carrying=slot.classList.contains('has');
    if(known){
      slot.classList.add('has');
      slot.classList.toggle('hfKnownOnly',!carrying);
      slot.setAttribute('aria-label',def.label);
      slot.title=carrying?def.label:`${def.label} · открыт`;
    }else{
      slot.classList.remove('hfKnownOnly');
    }
  }
}

let scheduled=false;
function schedule(){
  if(scheduled)return;scheduled=true;
  queueMicrotask(()=>{scheduled=false;applyKnownFieldComponents()});
}
function boot(){
  const root=document.querySelector<HTMLElement>('#components');
  if(!root){setTimeout(boot,40);return}
  new MutationObserver(schedule).observe(root,{childList:true});
  schedule();
}
boot();
