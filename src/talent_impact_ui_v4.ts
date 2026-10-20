import './talent_impact_ui_v4.css';
import {deriveEffects,type TalentId} from './progression.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
let lastSignature='';

const mult=(value:number)=>`×${value.toFixed(2)}`;
const percent=(value:number)=>`${Math.round(value*100)}%`;
const bonus=(value:number)=>value?`+${Math.round(value*100)}%`:'—';
const discount=(value:number)=>`${Math.round((1-value)*100)}%`;

function render(force=false){
  const screen=document.querySelector<HTMLElement>('#talentScreen'),branches=document.querySelector<HTMLElement>('#talentBranches'),state=api()?.getState?.();
  if(!screen||!branches||!state)return;
  let panel=document.querySelector<HTMLElement>('#talentImpactV4');
  if(!panel){panel=document.createElement('section');panel.id='talentImpactV4';panel.className='talentImpactV4';branches.parentElement?.insertBefore(panel,branches)}
  if(screen.hidden&&!force)return;
  const talents=new Set<TalentId>((state.talents??[]) as TalentId[]),e=deriveEffects(talents),workshopSlots=e.workshopSlots+(state.packD?.industrialWorkshopOwned?1:0),vanCapacity=400+e.vanCapacityBonus;
  const signature=JSON.stringify({talents:state.talents,capacity:state.capacity,van:state.midgame?.van?.owned,packD:state.packD?.industrialWorkshopOwned,e});
  if(!force&&signature===lastSignature)return;lastSignature=signature;
  const combo=e.comboUnlocked?`ON · cap ${e.comboCap}`:'закрыто',operator=e.operatorUnlocked?'доступен':'закрыт';
  panel.innerHTML=`<div class="talentImpactHead"><div><small>ЭФФЕКТЫ ТАЛАНТОВ · LIVE</small><h3>Что уже изменилось в игре</h3><p>Здесь показаны итоговые значения, которые прямо сейчас использует runtime. После покупки таланта цифры меняются сразу.</p></div><strong>${talents.size} изучено</strong></div><div class="talentStateLegend" aria-label="Легенда состояний талантов"><span><i class="legendOwned"></i><b>Зелёный</b> — изучено</span><span><i class="legendReady"></i><b>Золотой</b> — можно купить сейчас</span><span><i class="legendLocked"></i><b>Серый</b> — ещё закрыто</span><span class="tierLegend"><b>Tier I / II / III</b> — этап развития, а не состояние таланта</span></div><div class="talentImpactGrid"><article class="talentImpactCard" data-impact-branch="salvage"><div><span>⚒</span><b>Разбор</b></div><dl><div><dt>Мощность</dt><dd>${mult(e.dpsMultiplier)}</dd></div><div><dt>Combo</dt><dd class="${e.comboUnlocked?'impactOn':'impactLocked'}">${combo}</dd></div><div><dt>Редкие узлы</dt><dd>${bonus(e.componentChanceBonus)}</dd></div><div><dt>Широкий удар</dt><dd class="${e.wideSwingUnlocked?'impactOn':'impactLocked'}">${e.wideSwingUnlocked?'ON':'закрыт'}</dd></div></dl></article><article class="talentImpactCard" data-impact-branch="logistics"><div><span>🛒</span><b>Логистика</b></div><dl><div><dt>Тележка</dt><dd>${Math.round(state.capacity)} кг</dd></div><div><dt>Скорость</dt><dd>${mult(e.moveMultiplier)}</dd></div><div><dt>Магнит</dt><dd>${Math.round(e.magnetRadius)}</dd></div><div><dt>Фургон</dt><dd>${state.midgame?.van?.owned?`${vanCapacity} кг`:`${e.vanCapacityBonus?`+${e.vanCapacityBonus} кг`:'400 кг база'}`}</dd></div></dl></article><article class="talentImpactCard" data-impact-branch="workshop"><div><span>▥</span><b>Мастерская</b></div><dl><div><dt>Слоты очереди</dt><dd>${workshopSlots}</dd></div><div><dt>Скорость</dt><dd>${mult(e.workshopSpeedMultiplier)}</dd></div><div><dt>Выход</dt><dd>${mult(e.workshopYieldMultiplier)}</dd></div><div><dt>Тяжёлый цикл</dt><dd>${e.industrialProductionMultiplier<1?`${discount(e.industrialProductionMultiplier)} быстрее`:'база'}</dd></div></dl></article><article class="talentImpactCard" data-impact-branch="automation"><div><span>⏱</span><b>Автоматизация</b></div><dl><div><dt>Offline</dt><dd>${percent(e.offlineEfficiency)}</dd></div><div><dt>Лимит</dt><dd>${e.offlineCapHours} ч</dd></div><div><dt>Рабочие</dt><dd>${mult(e.workerOutputMultiplier)}</dd></div><div><dt>Operator</dt><dd class="${e.operatorUnlocked?'impactOn':'impactLocked'}">${operator}</dd></div></dl></article><article class="talentImpactCard" data-impact-branch="trade"><div><span>₽</span><b>Торговля</b></div><dl><div><dt>Продажа</dt><dd>${mult(e.saleMultiplier)}</dd></div><div><dt>Медь</dt><dd>${mult(e.copperSaleMultiplier)}</dd></div><div><dt>Покупки</dt><dd>−${discount(e.shopPriceMultiplier)}</dd></div><div><dt>Спецзаказы</dt><dd>${e.contractChoices}</dd></div></dl></article></div>`;
}

queueMicrotask(()=>render(true));
setInterval(()=>render(false),180);
