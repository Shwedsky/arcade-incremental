import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function must(p,a,b,label=a.slice(0,50)){const s=read(p);if(!s.includes(a))throw new Error(`missing ${p}: ${label}`);write(p,s.replace(a,b));}
function rex(p,r,b,label){const s=read(p);if(!r.test(s))throw new Error(`missing ${p}: ${label}`);write(p,s.replace(r,b));}
function all(p,a,b){const s=read(p);if(!s.includes(a)){console.log(`optional absent ${p}: ${a}`);return}write(p,s.split(a).join(b));}

must('src/workforce_fleet_v3.ts',
"export function nextWorkerHireCost(state:WorkforceFleetV3State):number{return Math.round(35_000*Math.pow(1.42,state.workers.length))}",
`export const WORKER_HIRE_COST_BANDS=[
  {min:0,max:2,cost:35_000,label:'Гараж',nextAt:3},
  {min:3,max:4,cost:55_000,label:'Ангар',nextAt:5},
  {min:5,max:7,cost:90_000,label:'Площадка разборки',nextAt:8},
  {min:8,max:11,cost:140_000,label:'Промышленная мастерская',nextAt:12},
  {min:12,max:Number.POSITIVE_INFINITY,cost:220_000,label:'Перерабатывающий завод',nextAt:null}
] as const;
export function workerHireBandForCount(workerCount:number){
  const count=Math.max(0,Math.floor(Number(workerCount)||0));
  return WORKER_HIRE_COST_BANDS.find(band=>count>=band.min&&count<=band.max)??WORKER_HIRE_COST_BANDS.at(-1)!;
}
export function nextWorkerHireCost(state:WorkforceFleetV3State):number{return workerHireBandForCount(state.workers.length).cost}`,'worker hire pricing');

must('src/main.ts',"import {sellVehicleV3} from './fleet_market_v1.ts';","import {sellVehicleV3} from './fleet_market_v1.ts';\nimport {formatXpGain} from './ui_format.ts';",'ui format import');
rex('src/main.ts',/function hireGenericWorker\(\)\{[^\n]*\}/,`function hireGenericWorker(){
  const stage=currentBusinessStage(),before=workforceV3.workers.length,cost=nextWorkerHireCost(workforceV3);
  if(before===0&&!zoneMastered(midgame,'z1')){showToast('Сначала полностью освой Зону 1');return null}
  const limit=workerCapacityForStage(stage);if(before>=limit){showToast(\`На текущей базе нет свободных мест для персонала: \${before}/\${limit}\`);return null}
  if(cash<cost){showToast(\`На найм нужно \${money(cost)} · не хватает \${money(cost-cash)}\`);return null}
  const worker=hireWorkerV3(workforceV3,stage,Date.now());if(!worker)return null;cash-=cost;
  if(before===0){midgame.worker.hired=true;midgame.worker.lastTick=Date.now()}
  else if(before===1){packB.secondWorker.hired=true;packB.secondWorker.lastTick=Date.now()}
  else if(before===2){packC.crew3.hired=true;packC.crew3.role='scavenger';packC.crew3.lastTick=Date.now()}
  else if(before===3){packD.crew4.hired=true;packD.crew4.role='scavenger';packD.crew4.lastTick=Date.now()}
  showToast(\`\${worker.name} нанят · \${money(cost)}\`);saveGame();renderGarage();return worker
}`,'hireGenericWorker');
rex('src/main.ts',/function trainGenericWorker\(workerId:string\)\{[^\n]*\}/,`function trainGenericWorker(workerId:string){
  const worker=workforceV3.workers.find(w=>w.id===workerId);if(!worker)return false;
  if(worker.rank>=5){showToast(\`\${worker.name}: максимальный ранг\`);return false}
  const cost=15_000*worker.rank;if(cash<cost){showToast(\`Обучение стоит \${money(cost)} · не хватает \${money(cost-cash)}\`);return false}
  cash-=cost;if(!trainWorkerV3(workforceV3,workerId)){cash+=cost;return false}
  showToast(\`\${worker.name}: ранг \${worker.rank} · обучение \${money(cost)}\`);saveGame();renderGarage();return true
}`,'trainGenericWorker');
rex('src/main.ts',/function gainXp\(amount:number,pos\?:Vec2\)\{[^\n]*\}/,`function gainXp(amount:number,pos?:Vec2){const before=level();xp+=amount;const after=level();if(pos)texts.push({x:pos.x,y:pos.y-48,text:formatXpGain(amount),color:'#9ce7ff',life:1.2});if(after>before)showToast(\`Уровень \${after}! +1 очко мастерства\`);renderProgress()}`,'gainXp');
for(const [a,b] of [
['COMBO ×','СЕРИЯ ×'],['MIDGAME PROOF','ТЕКУЩАЯ ЦЕЛЬ'],['Basic Route Kit','Базовый маршрутный комплект'],
['Recovery Rig','Тяжёлая эвакуационная платформа'],['Recovery Assembly','Тяжёлая восстановленная сборка'],
['Processing Plant','Перерабатывающий завод'],['Industrial Workshop','Промышленная мастерская'],['Salvage Yard','Площадка разборки'],
['Plant-линии','Заводские линии'],['Workshop Queue','Очередь мастерской'],['Hydraulic Power','Гидравлический силовой модуль'],
['Heavy Frame','Тяжёлая рама'],['Drive Module','Приводной модуль'],['Control Module','Модуль управления'],['Structural Frame','Конструкционная секция'],
['Truck conversion','Переоборудование грузовика'],['Tier III','Этап III'],['Tier II','Этап II'],['Tier I','Этап I']
])all('src/main.ts',a,b);
all('src/main.ts','seed ${baseSeed} · поле ${trip}','генерация ${baseSeed} · поле ${trip}');

must('src/workforce_fleet_ui_v3.ts',
"import {FLEET_CAPACITY_BY_STAGE,VEHICLE_SPECS,WORKER_CAPACITY_BY_STAGE,nextWorkerHireCost,type VehicleTypeV3,type WorkforceFleetV3State} from './workforce_fleet_v3.ts';",
"import {FLEET_CAPACITY_BY_STAGE,VEHICLE_SPECS,WORKER_CAPACITY_BY_STAGE,nextWorkerHireCost,workerHireBandForCount,type VehicleTypeV3,type WorkforceFleetV3State} from './workforce_fleet_v3.ts';",'workforce import');
all('src/workforce_fleet_ui_v3.ts',"const bottleneckLabel=(value:string)=>({none:'поток сбалансирован',no_worker:'нет рабочего',no_vehicle:'нет транспорта — малая партия',capacity:'транспорт заполнится раньше конца смены',shift:'закончится смена'} as Record<string,string>)[value]??value;","const bottleneckLabel=(value:string)=>({none:'поток сбалансирован',no_worker:'нет рабочего',no_vehicle:'нет транспорта — малая партия',capacity:'транспорт заполнится раньше конца смены',shift:'закончится смена',base_storage:'склад базы заполнен — освободи место или расширь базу'} as Record<string,string>)[value]??value;");
must('src/workforce_fleet_ui_v3.ts',"function notifyBusinessChange(){window.dispatchEvent(new CustomEvent('salvage:business-state-changed'))}","function notifyBusinessChange(){window.dispatchEvent(new CustomEvent('salvage:business-state-changed'))}\nfunction uiNotice(text:string,tone:'ok'|'warn'='warn'){window.dispatchEvent(new CustomEvent('salvage:ui-notice',{detail:{text,tone}}))}",'uiNotice');
all('src/workforce_fleet_ui_v3.ts',"worker.role==='operator'?'Operator':'Сборщик'","worker.role==='operator'?'Оператор':worker.role==='technician'?'Техник':'Сборщик'");
rex('src/workforce_fleet_ui_v3.ts',/function renderCrew\(s:any\)\{[\s\S]*?\n\}\n\nfunction renderFleet/,`function renderCrew(s:any){
  const legacy=document.querySelector<HTMLElement>('#workerPanel');if(!legacy||!s.workforceV3)return;
  legacy.classList.add('v3LegacyWorkerPanelHidden');
  const root=siblingRoot(legacy,'workforceV3Root','workforceV3');
  const wf=workforce(s),stage=s.businessStage as BusinessStageId,capacity=WORKER_CAPACITY_BY_STAGE[stage],hireCost=nextWorkerHireCost(wf),band=workerHireBandForCount(wf.workers.length);
  const mastered=(s.midgame?.mastery?.z1??0)>=99.999,space=wf.workers.length<capacity,entryReady=mastered||wf.workers.length>0,cashReady=s.cash>=hireCost,canPress=space&&entryReady;
  const missingCash=Math.max(0,hireCost-s.cash),hireLabel=!space?'Нет свободных мест':!entryReady?'Сначала освой Z1':cashReady?\`Нанять · \${money(hireCost)}\`:\`Нанять · \${money(hireCost)} · не хватает \${money(missingCash)}\`;
  const bandHint=band.nextAt==null?\`Текущий тариф: \${band.label}. Дальше цена найма не растёт.\`:\`Текущий тариф: \${band.label}. Цена изменится только после \${band.nextAt}-го сотрудника.\`;
  root.innerHTML=\`<div class="v3SectionHead"><div><small>ПЕРСОНАЛ</small><h2>Команда \${wf.workers.length} / \${capacity}</h2><p>Назначение меняется здесь и не прыгает при обновлении производства. Живые показатели маршрута обновляются отдельно, без пересборки карточек.</p><p class="v3ActionHint">\${bandHint}</p></div><button data-v3-hire class="\${cashReady?'':'needsCash'}" \${canPress?'':'disabled'}>\${hireLabel}</button></div><div class="v3Workers">\${wf.workers.length?wf.workers.map(worker=>workerCard(s,worker)).join(''):'<div class="v3Empty">Освой Z1 полностью — после этого можно нанять первого сборщика.</div>'}</div>\`;
}

function renderFleet`,'renderCrew');
must('src/workforce_fleet_ui_v3.ts',"if(target.closest('[data-v3-hire]')){api()?.hireGenericWorker?.();afterAction();return}",`if(target.closest('[data-v3-hire]')){
    const s=state(),wf=workforce(s),stage=s.businessStage as BusinessStageId,cost=nextWorkerHireCost(wf),limit=WORKER_CAPACITY_BY_STAGE[stage];
    if(wf.workers.length>=limit){uiNotice(\`На текущей базе нет свободных мест: \${wf.workers.length}/\${limit}.\`);return}
    if(wf.workers.length===0&&(s.midgame?.mastery?.z1??0)<99.999){uiNotice('Сначала полностью освой Z1.');return}
    if(s.cash<cost){uiNotice(\`На найм нужно \${money(cost)}. Не хватает \${money(cost-s.cash)}.\`);return}
    const hired=api()?.hireGenericWorker?.();if(hired)uiNotice(\`\${hired.name} нанят за \${money(cost)}.\`,'ok');else uiNotice('Найм не выполнен: проверь условия текущей базы.');
    afterAction();return
  }`,'hire click');
must('src/workforce_fleet_ui_v3.ts',"const train=target.closest<HTMLElement>('[data-v3-train]');if(train?.dataset.v3Train){api()?.trainGenericWorker?.(train.dataset.v3Train);afterAction();return}",`const train=target.closest<HTMLElement>('[data-v3-train]');if(train?.dataset.v3Train){
    const s=state(),worker=s?.workforceV3?.workers?.find((w:any)=>w.id===train.dataset.v3Train);if(!worker)return;
    if(worker.rank>=5){uiNotice(\`\${worker.name}: максимальный ранг.\`);return}
    const cost=15_000*worker.rank;if(s.cash<cost){uiNotice(\`Не хватает \${money(cost-s.cash)} на обучение \${worker.name}. Обучение стоит \${money(cost)}.\`);return}
    const ok=api()?.trainGenericWorker?.(worker.id);if(ok)uiNotice(\`\${worker.name} обучен: ранг \${worker.rank+1}.\`,'ok');else uiNotice('Обучение не выполнено: состояние изменилось.');
    afterAction();return
  }`,'train click');

must('src/contract_ui_v3.ts',
`const safe=(value:string)=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]??ch));`,
`const safe=(value:string)=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]??ch));
const notify=(text:string,tone:'ok'|'warn'='warn')=>window.dispatchEvent(new CustomEvent('salvage:ui-notice',{detail:{text,tone}}));`,'contract notice');
rex('src/contract_ui_v3.ts',/document\.addEventListener\('click',event=>\{[\s\S]*?\n\},true\);/,`document.addEventListener('click',event=>{
  const target=event.target as HTMLElement;
  const max=target.closest<HTMLElement>('[data-standing-max]');
  if(max?.dataset.standingMax){event.preventDefault();event.stopImmediatePropagation();const id=max.dataset.standingMax,data=snapshot(),entry=data?.view?.standing?.find((x:any)=>x.buyer.id===id);if(entry&&data){drafts.set(id,freeStandingOwned(entry,data));render(true)}return}
  const submit=target.closest<HTMLButtonElement>('[data-standing-submit]');
  if(submit?.dataset.standingSubmit){
    event.preventDefault();event.stopImmediatePropagation();
    const id=submit.dataset.standingSubmit,data=snapshot(),entry=data?.view?.standing?.find((x:any)=>x.buyer.id===id);if(!entry||!data){notify('Отгрузка не выполнена: данные заказа обновляются.');return}
    const free=freeStandingOwned(entry,data),input=document.querySelector<HTMLInputElement>(\`[data-standing-amount="\${id}"]\`),requested=Math.max(0,Math.min(free,Number(input?.value)||drafts.get(id)||0));
    if(requested<=0){notify('Укажи количество для отгрузки.');return}
    submit.disabled=true;submit.textContent='Отгружаем…';const result=api()?.submitStandingV3?.(id,requested);
    if(result?.consumed>0){drafts.delete(id);notify(\`Отгружено \${qty(result.consumed)} кг · получено \${money(result.cash)}.\`,'ok')}else notify('Отгрузка не выполнена: свободного товара уже не хватает.');
    render(true);requestAnimationFrame(()=>render(true));return
  }
  const special=target.closest<HTMLButtonElement>('[data-special-submit]');
  if(special?.dataset.specialSubmit){
    event.preventDefault();event.stopImmediatePropagation();
    const data=snapshot(),entry=data?.view?.specials?.find((x:any)=>x.def.id===special.dataset.specialSubmit);
    if(!entry||!data){notify('Спецзаказ не найден: список заказов обновился.');render(true);return}
    if(!specialReady(entry,data)){
      const missing=(entry.needs??[]).map((need:any)=>({need,owned:effectiveNeedOwned(need,data)})).filter((row:any)=>row.owned+1e-9<Number(row.need.amount));
      notify(\`Спецзаказ пока нельзя сдать: \${missing.map((row:any)=>\`${row.need.label} \${qty(row.owned)} / \${qty(row.need.amount)}\`).join(', ')||'свободные товары изменились'}\`);render(true);return
    }
    special.disabled=true;special.textContent='Сдаём…';const ok=api()?.submitSpecialV3?.(special.dataset.specialSubmit);
    if(ok)notify(\`Спецзаказ «\${entry.def.name}» сдан. Награда начислена.\`,'ok');else notify('Спецзаказ не сдан: состояние товаров изменилось.');
    render(true);requestAnimationFrame(()=>render(true));return
  }
},true);`,'contract click');

must('src/operator_ui_v3.ts',"import './production_heavy_support_ui_v1.ts';","import './production_heavy_support_ui_v1.ts';\nimport './owner_review_v6.ts';",'owner V6 import');

for(const [p,a,b] of [
['src/talent_impact_ui_v4.ts','ЭФФЕКТЫ ТАЛАНТОВ · LIVE','ЭФФЕКТЫ ТАЛАНТОВ · СЕЙЧАС'],['src/talent_impact_ui_v4.ts','runtime','игра'],
['src/talent_impact_ui_v4.ts','Tier I / II / III','Этап I / II / III'],['src/talent_impact_ui_v4.ts','Combo','Серия'],
['src/talent_impact_ui_v4.ts','Offline','Автономно'],['src/talent_impact_ui_v4.ts','Operator','Оператор'],
['src/business_stage.ts',"shortTitle:'Salvage Yard'","shortTitle:'Площадка разборки'"],
['src/business_stage.ts',"shortTitle:'Industrial Workshop'","shortTitle:'Пром. мастерская'"],
['src/business_stage.ts',"shortTitle:'Processing Plant'","shortTitle:'Завод'"],
['src/business_stage.ts',"nextMilestone:'Развернуть Salvage Yard'","nextMilestone:'Развернуть площадку разборки'"],
['src/business_stage.ts',"nextMilestone:'Processing Plant'","nextMilestone:'Перерабатывающий завод'"],
['src/business_stage.ts',"pressure:'Людям, машинам, складу и станкам становится тесно. Следующая потребность должна ощущаться как новый масштаб базы.'","pressure:'Гараж упёрся во вместимость людей, транспорта и склада. Следующий шаг — ангар: больше мест для команды и техники.'"],
['src/base_stage_visual_v2.ts','Salvage Yard · Сеть','Площадка разборки · сеть'],['src/base_stage_visual_v2.ts','BULK SCRAP FIELD','ПОЛЕ МАССОВОГО ЛОМА'],
['src/base_stage_visual_v2.ts','RECOVERED OBJECTS','ИЗВЛЕЧЁННЫЕ ОБЪЕКТЫ'],['src/base_stage_visual_v2.ts','CREW MUSTER','СБОР БРИГАДЫ'],
['src/base_stage_visual_v2.ts','FLEET APRON','СТОЯНКА ТЕХНИКИ'],['src/base_stage_visual_v2.ts','Industrial Workshop','Промышленная мастерская'],
['src/base_stage_visual_v2.ts','Processing Plant','Перерабатывающий завод'],['src/base_stage_visual_v2.ts','ACTIVE','РАБОТАЕТ'],['src/base_stage_visual_v2.ts','READY','ГОТОВО'],
['src/base_shell_v1.ts','Workshop Queue','Очередь мастерской'],['src/base_shell_v1.ts','линии Plant','заводские линии'],
['src/production_cells_ui_v1.ts',"title:'Refining Cell'","title:'Участок подготовки сырья'"],
['src/production_cells_ui_v1.ts',"title:'Fabrication Cell'","title:'Сборочный участок'"],
['src/production_cells_ui_v1.ts',"title:'Heavy Assembly Cell'","title:'Участок тяжёлой сборки'"],
['src/production_cells_ui_v1.ts','INDUSTRIAL WORKSHOP · PRODUCTION CELLS V1','ПРОМЫШЛЕННАЯ МАСТЕРСКАЯ · 3 ПРОИЗВОДСТВЕННЫХ УЧАСТКА'],
['src/production_cells_ui_v1.ts','Workshop Queue','очередь мастерской'],['src/production_cells_ui_v1.ts','Production Cells','производственные участки'],
['src/production_cells_ui_v1.ts','Industrial Workshop','Промышленная мастерская'],['src/production_cells_ui_v1.ts','HEAVY BAY','ЗОНА ТЯЖЁЛОЙ СБОРКИ'],
['src/field_view.ts',"ctx.fillText('SALVAGE',16,4)","ctx.fillText('ЛОМ',16,4)"],
['scripts/browser-owner-feedback-v5-smoke.ts','assert.match(legend,/Tier I \\/ II \\/ III.*этап развития/s);','assert.match(legend,/Этап I \\/ II \\/ III.*этап развития/s);']
])all(p,a,b);

must('package.json','    "smoke:browser:owner-feedback-v5": "tsx scripts/browser-owner-feedback-v5-smoke.ts",','    "smoke:browser:owner-feedback-v5": "tsx scripts/browser-owner-feedback-v5-smoke.ts",\n    "smoke:owner-review-v6": "tsx scripts/owner-review-v6-smoke.ts",\n    "smoke:browser:owner-review-v6": "tsx scripts/browser-owner-review-v6-smoke.ts",','package scripts');
must('.github/workflows/ci.yml','      - name: Owner Feedback V5 browser acceptance\n        run: npm run smoke:browser:owner-feedback-v5','      - name: Owner Feedback V5 browser acceptance\n        run: npm run smoke:browser:owner-feedback-v5\n      - name: Owner Review V6 domain acceptance\n        run: npm run smoke:owner-review-v6\n      - name: Owner Review V6 browser acceptance\n        run: npm run smoke:browser:owner-review-v6','CI V6');

console.log('Owner Review V6 corrective patch applied.');
