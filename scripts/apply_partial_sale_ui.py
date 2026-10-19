#!/usr/bin/env python3
from pathlib import Path
import re

p=Path('src/main.ts')
t=p.read_text(encoding='utf-8')

def one(old:str,new:str,label:str):
    global t
    count=t.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly one anchor, got {count}')
    t=t.replace(old,new,1)

one("import './workshop_queue.css';","import './workshop_queue.css';\nimport './sale_controls.css';",'sale css import')

one(
"  <section id=\"queueCancelModal\" class=\"queueCancelModal\" hidden><div class=\"queueCancelBox\"><small>ПРЕРВАТЬ ТЕКУЩУЮ РАБОТУ</small><h2>Точно остановить действие?</h2><p id=\"queueCancelText\"></p><div class=\"queueCancelButtons\"><button id=\"queueCancelNo\" class=\"secondary\">Нет, оставить</button><button id=\"queueCancelYes\" class=\"danger\">Да, прервать</button></div></div></section>\n</main>`;",
"  <section id=\"queueCancelModal\" class=\"queueCancelModal\" hidden><div class=\"queueCancelBox\"><small>ПРЕРВАТЬ ТЕКУЩУЮ РАБОТУ</small><h2>Точно остановить действие?</h2><p id=\"queueCancelText\"></p><div class=\"queueCancelButtons\"><button id=\"queueCancelNo\" class=\"secondary\">Нет, оставить</button><button id=\"queueCancelYes\" class=\"danger\">Да, прервать</button></div></div></section>\n  <section id=\"saleModal\" class=\"saleModal\" hidden><div class=\"saleBox\"><div class=\"saleHead\"><div><small>ПУНКТ ПРИЁМА</small><h2 id=\"saleTitle\">Продажа</h2><p id=\"saleLead\">Выбери, сколько именно продать. Остаток останется на складе.</p></div><button id=\"saleClose\" class=\"secondary\">Закрыть</button></div><div id=\"saleRows\" class=\"saleRows\"></div><div class=\"saleFooter\"><div class=\"saleTotal\"><span>Получишь</span><b id=\"saleTotal\">0 ₽</b></div><button id=\"saleAll\" class=\"secondary\">Продать всё</button><button id=\"saleConfirm\" disabled>Продать выбранное</button></div></div></section>\n</main>`;",
'sale modal markup')

one(
"const queuePanelEl=$<HTMLElement>('queuePanel'),queueCancelModal=$<HTMLElement>('queueCancelModal'),queueCancelText=$<HTMLElement>('queueCancelText');\nlet pendingQueueCancelId:string|null=null,draggedQueueId:string|null=null;",
"const queuePanelEl=$<HTMLElement>('queuePanel'),queueCancelModal=$<HTMLElement>('queueCancelModal'),queueCancelText=$<HTMLElement>('queueCancelText');\nconst saleModal=$<HTMLElement>('saleModal'),saleRowsEl=$<HTMLElement>('saleRows'),saleTitleEl=$<HTMLElement>('saleTitle'),saleTotalEl=$<HTMLElement>('saleTotal');\nlet pendingQueueCancelId:string|null=null,draggedQueueId:string|null=null,saleMode:'raw'|'processed'|null=null;",
'sale DOM refs')

# Make the store CTA clear that it opens a quantity picker, while preserving the max-value hint.
t=t.replace("textContent=`Продать сырьё · ${money(rawValue)}`","textContent=`Продать сырьё · до ${money(rawValue)}`")
t=t.replace("textContent=`Продать переработанное · ${money(processedValue)}`","textContent=`Продать переработанное · до ${money(processedValue)}`")

# Insert partial-sale controller ahead of legacy sell-all helpers.
one(
"function sellRaw(){const value=",
"""function saleKeys(mode:'raw'|'processed'){return mode==='raw'?(['metal','copper','plastic'] as ResourceKind[]):(Object.keys(processed) as ProcessKind[])}
function saleOwned(mode:'raw'|'processed',key:string){return mode==='raw'?storage[key as ResourceKind]:processed[key as ProcessKind]}
function saleLabel(mode:'raw'|'processed',key:string){return mode==='raw'?resourceName[key as ResourceKind]:processedName[key as ProcessKind]}
function saleBasePrice(mode:'raw'|'processed',key:string){return mode==='raw'?BASE_SALE[key as ResourceKind]:PROCESSED_SALE[key as ProcessKind]}
function saleInput(kind:'range'|'number',key:string){return Array.from(saleRowsEl.querySelectorAll<HTMLInputElement>(kind==='range'?'[data-sale-range]':'[data-sale-number]')).find(input=>(kind==='range'?input.dataset.saleRange:input.dataset.saleNumber)===key)}
function renderSaleTotal(){if(!saleMode)return;let total=0;for(const key of saleKeys(saleMode)){const input=saleInput('number',key),owned=saleOwned(saleMode,key),qty=Math.max(0,Math.min(owned,Number(input?.value)||0));total+=qty*saleBasePrice(saleMode,key)*effects().saleMultiplier;const row=saleRowsEl.querySelector<HTMLElement>(`[data-sale-payout="${key}"]`);if(row)row.textContent=money(qty*saleBasePrice(saleMode,key)*effects().saleMultiplier)}saleTotalEl.textContent=money(total);$<HTMLButtonElement>('saleConfirm').disabled=total<1}
function openSaleModal(mode:'raw'|'processed'){saleMode=mode;saleTitleEl.textContent=mode==='raw'?'Продать сырьё':'Продать переработанное';$('saleLead').textContent='Выбери количество по каждому ресурсу. Ничего не продаётся автоматически; MAX заполняет только выбранную строку.';saleRowsEl.innerHTML=saleKeys(mode).map(key=>{const owned=saleOwned(mode,key),price=saleBasePrice(mode,key)*effects().saleMultiplier;return`<article class="saleRow"><div class="saleRowTop"><div><b>${saleLabel(mode,key)}</b><small>На складе ${owned.toFixed(1)} кг · ${money(price)} / кг</small></div><div class="saleRowValue"><strong data-sale-payout="${key}">0 ₽</strong><em>за выбранное</em></div></div><div class="saleControls"><input type="range" min="0" max="${Math.max(0,owned)}" step="0.1" value="0" data-sale-range="${key}" ${owned>.001?'':'disabled'}><input type="number" inputmode="decimal" min="0" max="${Math.max(0,owned)}" step="0.1" value="0" data-sale-number="${key}" ${owned>.001?'':'disabled'}><button type="button" data-sale-max="${key}" ${owned>.001?'':'disabled'}>MAX</button></div></article>`}).join('');saleModal.hidden=false;renderSaleTotal()}
function syncSalePicker(source:HTMLInputElement,key:string){if(!saleMode)return;const owned=saleOwned(saleMode,key),qty=Math.round(Math.max(0,Math.min(owned,Number(source.value)||0))*10)/10,range=saleInput('range',key),number=saleInput('number',key);if(range)range.value=String(qty);if(number)number.value=String(qty);renderSaleTotal()}
function setSaleMax(key:string){if(!saleMode)return;const number=saleInput('number',key);if(!number)return;number.value=String(Math.round(saleOwned(saleMode,key)*10)/10);syncSalePicker(number,key)}
function commitPartialSale(){if(!saleMode)return;let value=0,sold=0;for(const key of saleKeys(saleMode)){const owned=saleOwned(saleMode,key),qty=Math.round(Math.max(0,Math.min(owned,Number(saleInput('number',key)?.value)||0))*10)/10;if(qty<=0)continue;value+=qty*saleBasePrice(saleMode,key)*effects().saleMultiplier;sold+=qty;if(saleMode==='raw')storage[key as ResourceKind]=Math.max(0,storage[key as ResourceKind]-qty);else processed[key as ProcessKind]=Math.max(0,processed[key as ProcessKind]-qty)}if(value<1)return;cash+=value;const label=saleMode==='raw'?'сырья':'переработанного';saleModal.hidden=true;saleMode=null;showToast(`Продано ${sold.toFixed(1)} кг ${label} на ${money(value)}`);saveGame();renderGarage()}
function sellAllFromModal(){if(!saleMode)return;const mode=saleMode;saleModal.hidden=true;saleMode=null;if(mode==='raw')sellRaw();else sellProcessed()}
function sellRaw(){const value=""",
'partial sale controller')

# Replace static sell-all bindings with modal openers and wire the modal itself.
one(
"garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;",
"""saleModal.addEventListener('input',e=>{const input=e.target as HTMLInputElement,key=input.dataset.saleRange??input.dataset.saleNumber;if(key)syncSalePicker(input,key)});
saleModal.addEventListener('click',e=>{const target=e.target as HTMLElement,max=target.closest<HTMLElement>('[data-sale-max]');if(max?.dataset.saleMax){setSaleMax(max.dataset.saleMax);return}});
$<HTMLButtonElement>('saleClose').onclick=()=>{saleMode=null;saleModal.hidden=true};
$<HTMLButtonElement>('saleConfirm').onclick=commitPartialSale;
$<HTMLButtonElement>('saleAll').onclick=sellAllFromModal;
garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=()=>openSaleModal('raw');$<HTMLButtonElement>('sellProcessed').onclick=()=>openSaleModal('processed');""",
'sale modal events')

p.write_text(t,encoding='utf-8')
print('Partial sale UX integration applied')
