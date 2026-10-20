import './contract_ui_v3.css';
import {deriveEffects,type TalentId} from './progression.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const drafts=new Map<string,number>();
let observed:HTMLElement|null=null,lastSignature='';
let observer:MutationObserver|null=null;

const money=(value:number)=>`${Math.round(value).toLocaleString('ru-RU')} ₽`;
const qty=(value:number)=>Number(value||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
const safe=(value:string)=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]??ch));

function snapshot(){
  const test=api();if(!test?.getState||!test?.getContractV3View)return null;
  const state=test.getState(),view=test.getContractV3View();
  return{state,view};
}
function progressOf(state:any,id:string){return Math.max(0,Number(state?.contract?.standingProgress?.[id])||0)}
function completedOf(state:any,id:string){return Math.max(0,Math.floor(Number(state?.contract?.standingCompleted?.[id])||0))}
function defaultAmount(owned:number,batch:number,progress:number){
  const remainder=Math.max(.1,batch-progress);return Math.max(0,Math.min(owned,remainder));
}
function render(force=false){
  const panel=document.querySelector<HTMLElement>('#contractPanel'),data=snapshot();if(!panel||!data)return;
  const {state,view}=data,effects=deriveEffects(new Set<TalentId>((state.talents??[]) as TalentId[]));
  const signature=JSON.stringify({level:state.level,cash:state.cash,storage:state.storage,processed:state.processed,contract:state.contract,talents:state.talents,standing:view.standing?.map((x:any)=>[x.buyer.id,x.owned]),specials:view.specials?.map((x:any)=>[x.def.id,x.ready,x.reward,x.needs?.map((n:any)=>n.owned)])});
  if(!force&&panel.dataset.contractV3==='1'&&signature===lastSignature)return;lastSignature=signature;
  const standing=(view.standing??[]).map((entry:any)=>{
    const buyer=entry.buyer,owned=Math.max(0,Number(entry.owned)||0),progress=progressOf(state,buyer.id),done=completedOf(state,buyer.id),suggested=defaultAmount(owned,buyer.batchAmount,progress),draft=Math.max(0,Math.min(owned,drafts.get(buyer.id)??suggested)),remaining=Math.max(0,buyer.batchAmount-progress),price=buyer.unitPrice*effects.saleMultiplier,ready=owned>.001;
    return`<article class="standingBuyer ${ready?'ready':''}" data-standing-buyer="${safe(buyer.id)}"><div class="standingBuyerHead"><div><b>${safe(buyer.name)}</b><small>${safe(buyer.label)} · постоянный канал</small></div><strong>${money(price)} / кг</strong></div><p>${safe(buyer.description)}</p><div class="standingStats"><span>На складе<b>${qty(owned)} кг</b></span><span>До партии<b>${qty(remaining)} / ${qty(buyer.batchAmount)} кг</b></span><span>Закрыто партий<b>${done}</b></span><span>Бонус за партию<b>+${buyer.xpPerBatch} XP</b></span></div><div class="standingProgress"><i style="width:${Math.max(0,Math.min(100,progress/buyer.batchAmount*100))}%"></i></div><div class="standingControls"><input type="number" inputmode="decimal" min="0" max="${owned}" step="0.1" value="${draft.toFixed(1)}" data-standing-amount="${safe(buyer.id)}" ${ready?'':'disabled'}><button type="button" class="secondary" data-standing-max="${safe(buyer.id)}" ${ready?'':'disabled'}>MAX</button><button type="button" data-standing-submit="${safe(buyer.id)}" ${draft>.001?'':'disabled'}>Отгрузить</button></div></article>`
  }).join('');
  const specials=(view.specials??[]).map((entry:any)=>{
    const def=entry.def,needs=(entry.needs??[]).map((need:any)=>`<span class="${Number(need.owned)+1e-9>=Number(need.amount)?'ok':'missing'}">${Number(need.owned)+1e-9>=Number(need.amount)?'✓':'●'} ${safe(need.label)}: <b>${qty(need.owned)} / ${qty(need.amount)}</b></span>`).join('');
    return`<article class="specialOrder ${entry.ready?'ready':''}" data-special-order="${safe(def.id)}"><div class="specialOrderHead"><div><b>${safe(def.name)}</b><small>СПЕЦЗАКАЗ · ${safe(String(def.family??'production').toUpperCase())}</small></div><strong>${money(entry.reward)}</strong></div><p>${safe(def.description??'')}</p><div class="specialNeeds">${needs}</div><button type="button" data-special-submit="${safe(def.id)}" ${entry.ready?'':'disabled'}>${entry.ready?'Сдать спецзаказ':'Не хватает товаров'}</button></article>`
  }).join('');
  panel.dataset.contractV3='1';
  panel.innerHTML=`<div class="contractV3"><div class="contractV3Head"><div><small>КОНТРАКТЫ · V3</small><h2>Продажи и спецзаказы</h2><p>Сырьё сдавай постоянным покупателям частями. Спецзаказы дают повышенную маржу за переработку, компоненты и промышленную продукцию.</p></div><strong>${money(state.cash)}</strong></div><section class="contractSection"><div class="contractSectionHead"><div><small>СТАБИЛЬНЫЙ СБЫТ</small><h3>Постоянные покупатели</h3></div><span>Отгрузка не сбрасывает покупателя.<br>Прогресс партии сохраняется.</span></div><div class="standingGrid">${standing||'<div class="contractV3Empty">Покупатели откроются по мере роста уровня и переработки.</div>'}</div></section><section class="contractSection"><div class="contractSectionHead"><div><small>ПОВЫШЕННАЯ МАРЖА</small><h3>Спецзаказы</h3></div><span>Доступно вариантов: <b>${view.specials?.length??0}</b> · ветка «Торговля» расширяет выбор до 3.</span></div><div class="specialGrid">${specials||'<div class="contractV3Empty">Пока нет подходящих спецзаказов. Развивай переработку и промышленную цепочку.</div>'}</div></section></div>`;
}
function attach(){
  const panel=document.querySelector<HTMLElement>('#contractPanel');if(!panel)return;
  if(observed!==panel){observer?.disconnect();observed=panel;observer=new MutationObserver(()=>render(false));observer.observe(panel,{childList:true,subtree:true,characterData:true});lastSignature=''}
  render(false);
}

document.addEventListener('input',event=>{const input=(event.target as HTMLElement).closest<HTMLInputElement>('[data-standing-amount]');if(!input?.dataset.standingAmount)return;drafts.set(input.dataset.standingAmount,Math.max(0,Number(input.value)||0))},true);
document.addEventListener('click',event=>{
  const target=event.target as HTMLElement;
  const max=target.closest<HTMLElement>('[data-standing-max]');if(max?.dataset.standingMax){const id=max.dataset.standingMax,data=snapshot(),entry=data?.view?.standing?.find((x:any)=>x.buyer.id===id);if(entry){drafts.set(id,Math.max(0,Number(entry.owned)||0));render(true)}return}
  const submit=target.closest<HTMLElement>('[data-standing-submit]');if(submit?.dataset.standingSubmit){const id=submit.dataset.standingSubmit,input=document.querySelector<HTMLInputElement>(`[data-standing-amount="${id}"]`),requested=Math.max(0,Number(input?.value)||drafts.get(id)||0);if(requested>0){api()?.submitStandingV3?.(id,requested);drafts.delete(id);render(true)}return}
  const special=target.closest<HTMLElement>('[data-special-submit]');if(special?.dataset.specialSubmit){api()?.submitSpecialV3?.(special.dataset.specialSubmit);render(true)}
},true);

queueMicrotask(attach);
setInterval(attach,250);
