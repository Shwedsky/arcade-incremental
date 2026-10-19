import './human_feedback_v3.css';

type AnyState=Record<string,any>;

interface FieldKnowledgeSlot{
  index:number;
  label:string;
  icon:string;
  known:(s:AnyState)=>boolean;
}

const FIELD_KNOWLEDGE:FieldKnowledgeSlot[]=[
  {index:4,label:'Насос',icon:'◍',known:s=>s.midgame?.discoveredMidComponents?.includes('pump')||(s.midgame?.midComponents?.pump??0)>0},
  {index:5,label:'Компрессор',icon:'◫',known:s=>s.midgame?.discoveredMidComponents?.includes('compressor')||(s.midgame?.midComponents?.compressor??0)>0},
  {index:6,label:'Алюминий',icon:'⬡',known:s=>(s.packB?.materials?.aluminiumScrap??0)>0||(s.midgame?.mastery?.z4??0)>0||!!s.packB?.hangarOwned||!!s.packB?.truck?.owned},
  {index:7,label:'Коробка передач',icon:'⚙',known:s=>s.packB?.discoveredIndustrial?.includes('gearbox')||(s.packB?.industrial?.gearbox??0)>0},
  {index:8,label:'Генератор',icon:'ϟ',known:s=>s.packB?.discoveredIndustrial?.includes('generator')||(s.packB?.industrial?.generator??0)>0}
];

function state():AnyState|null{
  try{return (globalThis as any).__SALVAGE_TEST__?.getState?.()??null}catch{return null}
}

function currentAmount(slot:HTMLElement):number{
  const raw=slot.querySelector('b')?.textContent?.trim()??'0';
  const value=Number(raw.replace(',','.'));
  return Number.isFinite(value)?value:0;
}

function applyKnownFieldComponents(){
  const s=state(),root=document.querySelector<HTMLElement>('#components');
  if(!s||!root)return;
  const slots=[...root.querySelectorAll<HTMLElement>(':scope > span')];
  for(const def of FIELD_KNOWLEDGE){
    const slot=slots[def.index];if(!slot)continue;
    const known=def.known(s),carrying=currentAmount(slot)>0;
    const existing=slot.querySelector<HTMLElement>(':scope > .hfFieldKnowledgeIcon');
    if(known){
      slot.classList.add('has');
      slot.classList.toggle('hfKnownOnly',!carrying);
      slot.setAttribute('aria-label',def.label);
      slot.title=carrying?def.label:`${def.label} · открыт`;
      if(!carrying){
        if(existing)existing.textContent=def.icon;
        else{
          const icon=document.createElement('i');icon.className='hfFieldKnowledgeIcon';icon.textContent=def.icon;
          slot.insertBefore(icon,slot.firstChild);
        }
      }else existing?.remove();
    }else{
      slot.classList.remove('hfKnownOnly');
      existing?.remove();
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
