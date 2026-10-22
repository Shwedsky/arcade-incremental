import './operator_ui_v3.css';
import './contract_ui_v3.ts';
import './talent_impact_ui_v4.ts';
import './production_cells_ui_v1.ts';
import './production_heavy_support_ui_v1.ts';
import './industrial_visual_baseline_v1.ts';
import './industrial_visual_art_v1.css';
import './stage_visual_consistency_v1.css';
import './base_stage_art_v2.ts';
import './production_resource_lock_v1.ts';
import './owner_review_v6.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const pct=(factor:number)=>`${Math.round((1-factor)*100)}% быстрее`;
const time=(sec:number)=>sec<=0?'свободно':sec<60?`${Math.ceil(sec)} сек`:sec<3600?`${Math.ceil(sec/60)} мин`:`${(sec/3600).toFixed(1)} ч`;

function state(){return api()?.getState?.()}
function production(){return api()?.getProductionV3View?.()}

function render(){
  const s=state(),view=production();if(!s?.workforceV3||!view)return;
  const cards=Array.from(document.querySelectorAll<HTMLElement>('.v3WorkerCard'));
  if(!cards.length)return;
  for(const card of cards){
    const workerId=card.dataset.workerCard,worker=s.workforceV3.workers.find((w:any)=>w.id===workerId);if(!worker)continue;
    card.querySelector('.v3OperatorBlock')?.remove();
    if(!view.cells?.length)continue;
    const activeCell=view.cells.find((cell:any)=>cell.operatorId===worker.id);
    const wrapper=document.createElement('div');wrapper.className=`v3OperatorBlock ${activeCell?'active':''}`;
    if(!view.unlocked){wrapper.innerHTML='<small>ОПЕРАТОР</small><p>Откроется талантом «Диспетчер». Роль появится только там, где реально ускоряет производство.</p>';card.append(wrapper);continue}
    const options=view.cells.map((cell:any)=>`<option value="${cell.id}" ${activeCell?.id===cell.id?'selected':''}>${cell.label}</option>`).join('');
    const selected=activeCell??view.cells[0];
    wrapper.innerHTML=`<div class="opHead"><div><small>ОПЕРАТОР</small><b>${activeCell?`Работает: ${activeCell.label}`:'Производственное назначение'}</b></div>${activeCell?`<strong>${pct(activeCell.speedFactor)}</strong>`:''}</div>${activeCell?`<div class="opLive"><span>Участок <b>${activeCell.status}</b></span><span>Осталось <b>${time(activeCell.remainingSec)}</b></span><span>Эффект <b>${pct(activeCell.speedFactor)}</b></span></div>`:'<p>Оператор ускоряет реальный цикл выбранного участка. Назначение снимает рабочего с маршрута.</p>'}<div class="opAssign"><select data-op-cell="${worker.id}">${options}</select><button data-op-assign="${worker.id}">${activeCell?'Сменить участок':'Назначить оператора'}</button></div>`;
    card.append(wrapper);
  }
}

addEventListener('click',event=>{const target=event.target as HTMLElement,button=target.closest<HTMLElement>('[data-op-assign]');if(!button?.dataset.opAssign)return;const workerId=button.dataset.opAssign,select=document.querySelector<HTMLSelectElement>(`[data-op-cell="${workerId}"]`);if(!select?.value)return;api()?.assignGenericProduction?.(workerId,select.value);setTimeout(render,0)},true);
setInterval(render,300);
