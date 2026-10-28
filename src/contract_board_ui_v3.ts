import './contract_board_ui_v3.css';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const money=(v:number)=>`${Math.round(v).toLocaleString('ru-RU')} ₽`;
const num=(v:number)=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:1});

function state(){return api()?.getState?.()}
function progressFor(s:any,id:string){return Math.max(0,Number(s.contract?.standingProgress?.[id])||0)}
function completedFor(s:any,id:string){return Math.max(0,Number(s.contract?.standingCompleted?.[id])||0)}
function canonicalContractUiActive(){const panel=document.querySelector<HTMLElement>('#contractPanel');return !!panel&&(panel.dataset.contractV3==='1'||!!panel.querySelector('.contractV3'))}

function standingCard(s:any,item:any){
  const b=item.buyer,owned=Number(item.owned)||0,progress=progressFor(s,b.id),remaining=Math.max(0,b.batchAmount-progress),can=owned>1e-9;
  return `<article class="standingBuyer" data-standing-card="${b.id}"><header><div><small>ПОСТОЯННЫЙ ПОКУПАТЕЛЬ</small><h3>${b.name}</h3></div><strong>${money(b.unitPrice)} / кг</strong></header><p>${b.description}</p><div class="standingProgress"><span>Текущая партия: <b>${num(progress)} / ${num(b.batchAmount)} кг</b></span><i><em style="width:${Math.min(100,progress/b.batchAmount*100)}%"></em></i><small>На складе: ${num(owned)} кг · закрыто партий: ${completedFor(s,b.id)}</small></div><div class="standingActions"><button data-standing-send="${b.id}" data-standing-mode="needed" ${can?'':'disabled'}>Доложить ${num(Math.min(owned,remaining||b.batchAmount))} кг</button><button data-standing-send="${b.id}" data-standing-mode="batch" ${owned>=Math.min(b.batchAmount,remaining||b.batchAmount)?'':'disabled'}>Партия</button><button data-standing-send="${b.id}" data-standing-mode="max" ${can?'':'disabled'}>MAX</button></div></article>`;
}

function specialCard(item:any){
  const d=item.def;
  return `<article class="specialOrder ${item.ready?'ready':''}" data-special-card="${d.id}"><header><div><small>СПЕЦЗАКАЗ · ${d.family.toUpperCase()}</small><h3>${d.name}</h3></div><strong>${money(item.reward)}</strong></header><p>${d.description}</p><div class="specialNeeds">${item.needs.map((n:any)=>`<span class="${n.owned+1e-9>=n.amount?'ok':'missing'}">${n.label}<b>${num(n.owned)} / ${num(n.amount)}</b></span>`).join('')}</div><button data-special-submit="${d.id}" ${item.ready?'':'disabled'}>${item.ready?'Выполнить спецзаказ':'Не хватает продукции'}</button></article>`;
}

let signature='';
function render(){
  const s=state(),panel=document.querySelector<HTMLElement>('#contractPanel');if(!s||!panel)return;
  // Compatibility fallback only. contract_ui_v3.ts is the canonical owner of
  // the V3 contract surface and its reservation-aware click handlers. Once it
  // has mounted, this older renderer must not replace its DOM or submit the same
  // order a second time from another capture listener.
  if(canonicalContractUiActive())return;
  const garage=document.querySelector<HTMLElement>('#garageScreen');if(!garage||garage.hidden)return;
  const view=api()?.getContractV3View?.();if(!view)return;
  const sig=JSON.stringify({cash:Math.floor(s.cash),level:s.level,contract:s.contract,storage:s.storage,processed:s.processed,components:s.components,special:view.specials.map((x:any)=>[x.def.id,x.ready,Math.floor(x.reward)])});
  if(sig===signature&&panel.querySelector('#contractBoardV3Root'))return;signature=sig;
  panel.innerHTML=`<section id="contractBoardV3Root" class="contractBoardV3"><div class="contractV3Head"><div><small>КАНАЛЫ СБЫТА V3</small><h2>Постоянные покупатели</h2><p>Они не исчезают. Отгружай понемногу, когда есть избыток — развитие не должно останавливаться ради случайного заказа.</p></div></div><div class="standingGrid">${view.standing.map((item:any)=>standingCard(s,item)).join('')}</div><div class="specialHeader"><div><small>ВЫСОКАЯ МАРЖА</small><h2>Специальные заказы</h2><p>Редкие заказы на переработку, компоненты и промышленные изделия. Сырой металл здесь не является базовым налогом.</p></div><b>${view.specials.length} предлож.</b></div><div class="specialGrid">${view.specials.length?view.specials.map(specialCard).join(''):'<div class="contractEmpty">Открой переработку или найди компоненты — после этого появятся спецзаказы.</div>'}</div></section>`;
}

addEventListener('click',event=>{
  // The canonical contract UI uses the same data attributes. Do not let this
  // legacy compatibility listener double-submit a standing/special order.
  if(canonicalContractUiActive())return;
  const target=event.target as HTMLElement;
  const standing=target.closest<HTMLElement>('[data-standing-send]');
  if(standing?.dataset.standingSend){const s=state(),view=api()?.getContractV3View?.(),item=view?.standing?.find((x:any)=>x.buyer.id===standing.dataset.standingSend);if(!item)return;const b=item.buyer,owned=Number(item.owned)||0,progress=progressFor(s,b.id),remaining=Math.max(.01,b.batchAmount-progress);const mode=standing.dataset.standingMode;const amount=mode==='max'?owned:mode==='batch'?Math.min(owned,remaining):Math.min(owned,remaining);api()?.submitStandingV3?.(b.id,amount);signature='';setTimeout(render,0);return}
  const special=target.closest<HTMLElement>('[data-special-submit]');if(special?.dataset.specialSubmit){api()?.submitSpecialV3?.(special.dataset.specialSubmit);signature='';setTimeout(render,0)}
},true);
setInterval(render,250);