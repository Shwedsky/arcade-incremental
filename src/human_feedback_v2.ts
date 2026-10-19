import './human_feedback_v2.css';
import {activeContract,EQUIPMENT_DEFS,nextEquipmentUpgrade,processSpec,type ContractNeed,type EquipmentId,type ProcessKind} from './early_game.ts';
import {MACHINE_DEFS,requirementAmount,type GarageInventory,type MachineId,type MachineRequirement} from './garage.ts';
import {deriveEffects,type TalentId} from './progression.ts';
import {availableGarageInventory,queuedReservations,reservationForAction,type ReservationContext,type ReservationLedger} from './resource_reservations.ts';
import {clearResilientSave,writeResilientSave} from './save_store.ts';
import type {ComponentKind,ResourceKind} from './sim.ts';
import type {WorkshopQueueAction} from './workshop_scheduler.ts';

const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const RESOURCE_KEYS:ResourceKind[]=['metal','copper','plastic'];
const COMPONENT_KEYS:ComponentKind[]=['bearing','motor','hydraulic','electronics'];
const resourceName:Record<ResourceKind,string>={metal:'Металл',copper:'Медь',plastic:'Пластик'};
const componentName:Record<ComponentKind,string>={bearing:'Подшипник',motor:'Электромотор',hydraulic:'Гидравлика',electronics:'Электронный модуль'};
const processDraft=new Map<MachineId,number>();
let scheduled=false;

type RuntimeState=any;
const api=()=>((globalThis as any).__SALVAGE_TEST__??null);
const platformApi=()=>((globalThis as any).__SALVAGE_PLATFORM__??null);
function state():RuntimeState|null{try{return api()?.getState?.()??null}catch{return null}}
function effectsFor(s:RuntimeState){return deriveEffects(new Set<TalentId>((s?.talents??[]) as TalentId[]))}
function reservationContext(s:RuntimeState):ReservationContext{return{machineLevels:s.machineLevels??{},equipmentLevels:s.equipmentLevels??{},machineCostMultiplier:effectsFor(s).machineCostMultiplier}}
function rawInventory(s:RuntimeState):GarageInventory{return{resources:{metal:s.storage?.metal??0,copper:s.storage?.copper??0,plastic:s.storage?.plastic??0},components:{bearing:s.components?.bearing??0,motor:s.components?.motor??0,hydraulic:s.components?.hydraulic??0,electronics:s.components?.electronics??0},cash:s.cash??0}}
function reservationState(s:RuntimeState){const ctx=reservationContext(s),reserved=queuedReservations(s.scheduler,ctx),raw=rawInventory(s),available=availableGarageInventory(raw,reserved);return{ctx,reserved,raw,available}}
function money(value:number){return`${Math.max(0,value).toLocaleString('ru-RU',{maximumFractionDigits:0})} ₽`}
function clampCount(value:number){return Math.max(1,Math.min(100,Math.floor(Number.isFinite(value)?value:1)))}
function localReviewHost(){return location.hostname==='127.0.0.1'||location.hostname==='localhost'}
function ensureAfter(el:Element,selector:string,html:string){let node=el.parentElement?.querySelector<HTMLElement>(selector);if(!node){el.insertAdjacentHTML('afterend',html);node=el.parentElement?.querySelector<HTMLElement>(selector)??null}return node}

function patchBaseButton(){const button=document.querySelector<HTMLButtonElement>('#garage');if(!button)return;if(!button.dataset.hfV2Base){button.dataset.hfV2Base='1';button.innerHTML='На базу <small>G</small>'}}

function patchInventoryReservations(s:RuntimeState,reserved:ReservationLedger,available:GarageInventory){
  for(const key of RESOURCE_KEYS){
    const slot=document.querySelector<HTMLElement>(`#storage [data-hf-slot="${key}"]`);if(!slot)continue;
    const strong=slot.querySelector<HTMLElement>('strong');if(strong)strong.textContent=`${available.resources[key].toFixed(1)} кг`;
    slot.querySelector('.hfReservationLine')?.remove();
    if(reserved.resources[key]>.001)slot.insertAdjacentHTML('beforeend',`<small class="hfReservationLine">В очереди: ${reserved.resources[key].toFixed(1)} кг · всего ${rawInventory(s).resources[key].toFixed(1)}</small>`);
  }
  for(const key of COMPONENT_KEYS){
    const slot=document.querySelector<HTMLElement>(`#storageComponents [data-hf-slot="${key}"]`);if(!slot)continue;
    const strong=slot.querySelector<HTMLElement>('strong');if(strong)strong.textContent=String(Math.floor(available.components[key]+1e-9));
    slot.querySelector('.hfReservationLine')?.remove();
    if(reserved.components[key]>.001)slot.insertAdjacentHTML('beforeend',`<small class="hfReservationLine">В очереди: ${Math.ceil(reserved.components[key])} · всего ${Math.floor(rawInventory(s).components[key])}</small>`);
  }
  const cashEl=document.querySelector<HTMLElement>('#cash');if(cashEl){cashEl.textContent=money(available.cash);const note=ensureAfter(cashEl,'.hfReservedCash','<small class="hfReservedCash"></small>');if(note){note.textContent=reserved.cash>.5?`В очереди зарезервировано ${money(reserved.cash)} · всего ${money(s.cash??0)}`:'';note.hidden=reserved.cash<=.5}}
}

function reservationText(part:ReservationLedger){const chunks:string[]=[];for(const key of RESOURCE_KEYS)if(part.resources[key]>.001)chunks.push(`${resourceName[key]} ${part.resources[key].toFixed(1)} кг`);for(const key of COMPONENT_KEYS)if(part.components[key]>.001)chunks.push(`${componentName[key]} ${Math.ceil(part.components[key])}`);if(part.cash>.5)chunks.push(money(part.cash));return chunks.join(' · ')}
function patchQueueReservations(s:RuntimeState,ctx:ReservationContext){
  document.querySelectorAll<HTMLElement>('.queueAction[data-queue-id]').forEach(row=>{
    row.querySelector('.hfQueueReservation')?.remove();const encoded=row.dataset.queueId;if(!encoded)return;const id=decodeURIComponent(encoded),action=(s.scheduler?.actions??[]).find((item:WorkshopQueueAction)=>item.id===id);if(!action)return;const text=reservationText(reservationForAction(action,ctx));if(text)row.insertAdjacentHTML('beforeend',`<div class="hfQueueReservation">Зарезервировано: ${text}</div>`)
  })
}

function ownedForNeed(s:RuntimeState,available:GarageInventory,need:ContractNeed){if(need.kind==='resource')return available.resources[need.key as ResourceKind];if(need.kind==='component')return available.components[need.key as ComponentKind];return s.processed?.[need.key as ProcessKind]??0}
function contractAvailability(s:RuntimeState,available:GarageInventory){
  const urgent=effectsFor(s).urgentContracts,def=activeContract(s.contract),needMult=1+Math.min(.25,(s.contract?.completed??0)*.025)+(urgent?.08:0),needs=def.needs.map(need=>({...need,amount:need.amount*needMult}));
  return{needs,ready:needs.every(need=>ownedForNeed(s,available,need)+1e-9>=need.amount)}
}
function patchContract(s:RuntimeState,available:GarageInventory,reserved:ReservationLedger){
  const panel=document.querySelector<HTMLElement>('#contractPanel');if(!panel)return;const data=contractAvailability(s,available),rows=Array.from(panel.querySelectorAll<HTMLElement>('.contractNeeds span'));
  data.needs.forEach((need,index)=>{const row=rows[index];if(!row)return;const own=ownedForNeed(s,available,need),digits=need.kind==='component'?0:1,ok=own+1e-9>=need.amount;row.classList.toggle('ok',ok);row.classList.toggle('missing',!ok);row.innerHTML=`${ok?'✓':'●'} ${need.label}: <b>${own.toFixed(digits)} / ${need.amount.toFixed(digits)}</b>`});
  const button=panel.querySelector<HTMLButtonElement>('#completeContract');if(button){button.disabled=!data.ready;button.textContent=data.ready?'Сдать заказ':(reserved.resources.metal+reserved.resources.copper+reserved.resources.plastic+reserved.cash>0?'Часть ресурсов занята очередью':'Собери заказ')}
}

function selectedMachine():MachineId|null{return document.querySelector<HTMLElement>('.machine.selected[data-machine]')?.dataset.machine as MachineId??null}
function enough(requirements:MachineRequirement[],available:GarageInventory,multiplier:number){return requirements.every(req=>{const need=requirementAmount(req,multiplier);if(req.kind==='cash')return available.cash+1e-9>=need;if(req.kind==='resource')return available.resources[req.key as ResourceKind]+1e-9>=need;return available.components[req.key as ComponentKind]+1e-9>=need})}
function patchSpendButtons(s:RuntimeState,available:GarageInventory){
  const eff=effectsFor(s),machineId=selectedMachine();
  if(machineId){
    const def=MACHINE_DEFS[machineId],build=document.querySelector<HTMLButtonElement>('#buildMachine');if(build&&!enough(def.requirements,available,eff.machineCostMultiplier)){build.disabled=true;build.title='Часть нужных ресурсов уже зарезервирована очередью';build.classList.add('hfReservationBlocked')}
    const upgrade=document.querySelector<HTMLButtonElement>('#upgradeMachine'),up=def.upgrades.find(item=>item.toLevel===(s.machineLevels?.[machineId]??1)+1);if(upgrade&&up&&!enough(up.requirements,available,eff.machineCostMultiplier)){upgrade.disabled=true;upgrade.title='Часть нужных ресурсов уже зарезервирована очередью';upgrade.classList.add('hfReservationBlocked')}
    const buy=document.querySelector<HTMLButtonElement>('#buyMachine'),price=(def.buyPrice??Infinity)*eff.shopPriceMultiplier;if(buy&&available.cash+1e-9<price){buy.disabled=true;buy.title='Деньги зарезервированы очередью';buy.classList.add('hfReservationBlocked')}
  }
  document.querySelectorAll<HTMLButtonElement>('[data-equipment-upgrade]').forEach(button=>{const id=button.dataset.equipmentUpgrade as EquipmentId,up=nextEquipmentUpgrade(id,s.equipmentLevels?.[id]??1);if(up&&!enough(up.requirements,available,1)){button.disabled=true;button.title='Часть ресурсов зарезервирована очередью';button.classList.add('hfReservationBlocked')}})
}

function applyProcessDraft(s:RuntimeState,available:GarageInventory,reserved:ReservationLedger){
  const machine=selectedMachine(),range=document.querySelector<HTMLInputElement>('#processBatchRange'),number=document.querySelector<HTMLInputElement>('#processBatchNumber');if(!machine||!range||!number||machine==='workbench')return;const eff=effectsFor(s),spec=processSpec(machine,s.machineLevels?.[machine]??1,eff.workshopYieldMultiplier);if(!spec)return;const count=processDraft.get(machine)??clampCount(Number(number.value)||1);processDraft.set(machine,count);range.value=String(count);number.value=String(count);range.classList.add('hfProcessDraftSticky');number.classList.add('hfProcessDraftSticky');const value=document.querySelector<HTMLElement>('#processBatchValue');if(value)value.textContent=String(count);const duration=Math.max(5,spec.durationSec/eff.workshopSpeedMultiplier),affordable=Math.max(0,Math.floor((available.resources[spec.resource]+1e-9)/spec.input)),plan=document.querySelector<HTMLElement>('#processBatchPlan');if(plan)plan.textContent=`План: ${count} × ${spec.input.toFixed(1)} кг → ${(count*spec.output).toFixed(1)} кг · ~${Math.ceil(duration*count)}с. Свободно на ${affordable} стаков${reserved.resources[spec.resource]>.001?`; ещё ${reserved.resources[spec.resource].toFixed(1)} кг уже в очереди`:''}.`;const button=document.querySelector<HTMLButtonElement>('#processMachine');if(button){button.textContent=available.resources[spec.resource]+1e-9>=spec.input?`Добавить в очередь ×${count} · ~${Math.ceil(duration*count)}с`:'Свободное сырьё уже занято очередью';if(available.resources[spec.resource]+1e-9<spec.input)button.disabled=true}}

function patchRawSale(s:RuntimeState,available:GarageInventory,reserved:ReservationLedger){
  const modal=document.querySelector<HTMLElement>('#saleModal');if(!modal||modal.hidden||!document.querySelector('#saleTitle')?.textContent?.toLowerCase().includes('сыр'))return;const rows=Array.from(modal.querySelectorAll<HTMLElement>('.saleRow'));
  RESOURCE_KEYS.forEach((key,index)=>{const row=rows[index];if(!row)return;const max=Math.max(0,available.resources[key]),range=row.querySelector<HTMLInputElement>('[data-sale-range]'),number=row.querySelector<HTMLInputElement>('[data-sale-number]');for(const input of [range,number])if(input){input.max=String(max);if(Number(input.value)>max)input.value=String(Math.round(max*10)/10);input.disabled=max<=.001}const small=row.querySelector<HTMLElement>('.saleRowTop small');if(small)small.innerHTML=`Свободно ${max.toFixed(1)} кг${reserved.resources[key]>.001?` · <span class="hfAvailableNote">в очереди ${reserved.resources[key].toFixed(1)} кг</span>`:''}`})
}

function applyReservations(){const s=state();if(!s)return;const {ctx,reserved,available}=reservationState(s);patchInventoryReservations(s,reserved,available);patchQueueReservations(s,ctx);patchContract(s,available,reserved);patchSpendButtons(s,available);applyProcessDraft(s,available,reserved);patchRawSale(s,available,reserved)}

function captureSpend(event:Event){const target=event.target as HTMLElement,s=state();if(!s)return;const {available,reserved}=reservationState(s),eff=effectsFor(s);
  if(target.closest('#completeContract')&&!contractAvailability(s,available).ready){event.preventDefault();event.stopImmediatePropagation();return}
  const machine=selectedMachine();if(machine&&target.closest('#buildMachine')&&!enough(MACHINE_DEFS[machine].requirements,available,eff.machineCostMultiplier)){event.preventDefault();event.stopImmediatePropagation();return}
  if(machine&&target.closest('#upgradeMachine')){const up=MACHINE_DEFS[machine].upgrades.find(item=>item.toLevel===(s.machineLevels?.[machine]??1)+1);if(up&&!enough(up.requirements,available,eff.machineCostMultiplier)){event.preventDefault();event.stopImmediatePropagation();return}}
  const equip=target.closest<HTMLElement>('[data-equipment-upgrade]');if(equip){const id=equip.dataset.equipmentUpgrade as EquipmentId,up=nextEquipmentUpgrade(id,s.equipmentLevels?.[id]??1);if(up&&!enough(up.requirements,available,1)){event.preventDefault();event.stopImmediatePropagation();return}}
  if(machine&&target.closest('#processMachine')){const spec=processSpec(machine,s.machineLevels?.[machine]??1,eff.workshopYieldMultiplier);if(spec&&available.resources[spec.resource]+1e-9<spec.input){event.preventDefault();event.stopImmediatePropagation();return}}
  const maxBtn=target.closest<HTMLElement>('[data-sale-max]');if(maxBtn&&document.querySelector('#saleTitle')?.textContent?.toLowerCase().includes('сыр')){const key=maxBtn.dataset.saleMax as ResourceKind;if(RESOURCE_KEYS.includes(key)){event.preventDefault();event.stopImmediatePropagation();const qty=Math.round(available.resources[key]*10)/10,range=document.querySelector<HTMLInputElement>(`[data-sale-range="${key}"]`),number=document.querySelector<HTMLInputElement>(`[data-sale-number="${key}"]`);if(range)range.value=String(qty);if(number){number.value=String(qty);number.dispatchEvent(new Event('input',{bubbles:true}))}return}}
  if(target.closest('#saleAll')&&document.querySelector('#saleTitle')?.textContent?.toLowerCase().includes('сыр')&&RESOURCE_KEYS.some(key=>reserved.resources[key]>.001)){event.preventDefault();event.stopImmediatePropagation();for(const key of RESOURCE_KEYS){const qty=Math.round(available.resources[key]*10)/10,number=document.querySelector<HTMLInputElement>(`[data-sale-number="${key}"]`);if(number){number.value=String(qty);number.dispatchEvent(new Event('input',{bubbles:true}))}}document.querySelector<HTMLButtonElement>('#saleConfirm')?.click()}
}

function rememberBatchInput(event:Event){const input=event.target as HTMLInputElement;if(input.id!=='processBatchRange'&&input.id!=='processBatchNumber')return;const machine=selectedMachine();if(!machine)return;processDraft.set(machine,clampCount(Number(input.value)));schedule()}

function currentSave(){platformApi()?.forceSave?.();const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function mutateSave(mutator:(save:any)=>void){sessionStorage.setItem('__salvage_dev_grant__','1');const save=currentSave();if(!save)return;mutator(save);save.lastSeen=Date.now();writeResilientSave(localStorage,SAVE_KEY,JSON.stringify(save));location.reload()}
function ensureRecord(root:any,key:string,base:any){if(!root[key]||typeof root[key]!=='object')root[key]=structuredClone(base);return root[key]}
const XP_PRESET:Record<number,number>={2:120,3:420,4:1800,5:3200,6:5200,7:7800,8:11000,9:15000,10:20000,12:42000,14:70000};
function grantResources(save:any){save.cash=(save.cash??0)+100_000;save.storage={metal:(save.storage?.metal??0)+500,copper:(save.storage?.copper??0)+150,plastic:(save.storage?.plastic??0)+250};save.components={bearing:(save.components?.bearing??0)+10,motor:(save.components?.motor??0)+10,hydraulic:(save.components?.hydraulic??0)+10,electronics:(save.components?.electronics??0)+10};save.processed={briquette:(save.processed?.briquette??0)+200,cleanCopper:(save.processed?.cleanCopper??0)+80,granulate:(save.processed?.granulate??0)+100}}
function unlockAll(save:any){grantResources(save);save.xp=Math.max(save.xp??0,XP_PRESET[14]);save.installed=['workbench','press','wire','plastic'];save.machineLevels={workbench:3,press:3,wire:2,plastic:2};save.equipmentLevels={tool:4,cart:4};const mid=ensureRecord(save,'midgame',{});mid.currentZone='z7';mid.mastery={z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100};mid.discoveredComponents=['bearing','motor','hydraulic','electronics'];mid.discoveredMidComponents=['pump','compressor'];mid.midComponents={pump:10,compressor:10};mid.van=mid.van??{};mid.van.owned=true;const pb=ensureRecord(save,'packB',{});pb.hangarOwned=true;pb.truck=pb.truck??{};pb.truck.owned=true;pb.materials={...(pb.materials??{}),aluminiumScrap:300,steelBlank:100,aluminiumBillet:100};pb.modules={...(pb.modules??{}),drive:10,control:10,structural:10};pb.industrial={...(pb.industrial??{}),gearbox:10,generator:10};pb.discoveredIndustrial=['gearbox','generator'];const pc=ensureRecord(save,'packC',{});pc.salvageYardOwned=true;pc.materials={...(pc.materials??{}),alloyScrap:300,alloyBillet:100};pc.industrial={...(pc.industrial??{}),industrialController:10,heavyHydraulicCylinder:10};pc.discoveredIndustrial=['industrialController','heavyHydraulicCylinder'];const pd=ensureRecord(save,'packD',{});pd.recoveryRig=pd.recoveryRig??{};pd.recoveryRig.owned=true;pd.industrialWorkshopOwned=true;pd.recoveryAssemblies=Math.max(pd.recoveryAssemblies??0,5)}
function unlockToZone(save:any,zone:string){const order=['z1','z2','z3','z4','z5','z6','z7'],idx=Math.max(0,order.indexOf(zone));save.xp=Math.max(save.xp??0,XP_PRESET[Math.min(14,Math.max(4,idx*2+4))]??20_000);save.installed=Array.from(new Set([...(save.installed??[]),'workbench',...(idx>=1?['press']:[]),...(idx>=2?['wire']:[])]));const mid=ensureRecord(save,'midgame',{});mid.mastery={z1:0,z2:0,z3:0,z4:0,z5:0,z6:0,z7:0,...(mid.mastery??{})};for(let i=0;i<idx;i++)mid.mastery[order[i]]=100;mid.currentZone=zone;if(idx>=3){mid.van=mid.van??{};mid.van.owned=true}if(idx>=4){const pb=ensureRecord(save,'packB',{});pb.hangarOwned=true;pb.truck=pb.truck??{};pb.truck.owned=true}if(idx>=4){const pc=ensureRecord(save,'packC',{});pc.discoveredIndustrial=Array.from(new Set([...(pc.discoveredIndustrial??[]),'industrialController']))}if(idx>=6){const pc=ensureRecord(save,'packC',{});pc.salvageYardOwned=true}}

function snapshot(){const s=state();if(!s)return{};const {reserved,available}=reservationState(s);return{level:s.level,xp:s.xp,cash:s.cash,availableCash:available.cash,storage:s.storage,available:available.resources,reserved:reserved.resources,zone:s.midgame?.currentZone,mastery:s.midgame?.mastery,queue:(s.scheduler?.actions??[]).map((a:any)=>({id:a.id,label:a.label,status:a.status,count:a.requestedCount,done:a.completedCount}))}}
function ensureDevPanel(){if(!localReviewHost()||document.querySelector('#hfDevPanel'))return;document.body.insertAdjacentHTML('beforeend',`<button id="hfDevToggle" class="hfDevToggle">DEV</button><aside id="hfDevPanel" class="hfDevPanel" hidden><header><div><h2>Панель тестирования</h2><small>Только localhost / manual review. В проде не появляется.</small></div><button id="hfDevClose" class="hfDevClose">×</button></header><section><h3>Ресурсы / уровень</h3><div class="hfDevGrid"><button data-dev="resources">+ ресурсы и 100k ₽</button><button data-dev="level5">Уровень 5</button><button data-dev="level8">Уровень 8</button><button data-dev="level10">Уровень 10</button></div></section><section><h3>Карты</h3><div class="hfDevGrid"><button data-zone-dev="z3">К старту Z3</button><button data-zone-dev="z5">К старту Z5</button><button data-zone-dev="z7">К старту Z7</button><button data-dev="unlockAll">Открыть всё</button></div></section><section><h3>Очереди / счётчики</h3><div class="hfDevGrid"><button data-dev="queue24">Очередь +24ч</button><button data-dev="queueReset">Очистить очередь</button><button data-dev="counters">Сбросить счётчики</button><button data-dev="snapshot">Обновить snapshot</button></div><pre id="hfDevSnapshot" class="hfDevSnapshot"></pre></section><section><button class="hfDevWide danger" data-dev="reset">Сбросить текущий review-save</button></section></aside>`);const panel=document.querySelector<HTMLElement>('#hfDevPanel')!,toggle=document.querySelector<HTMLButtonElement>('#hfDevToggle')!;toggle.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)document.querySelector('#hfDevSnapshot')!.textContent=JSON.stringify(snapshot(),null,2)};document.querySelector<HTMLButtonElement>('#hfDevClose')!.onclick=()=>panel.hidden=true;panel.addEventListener('click',e=>{const target=e.target as HTMLElement,zone=target.closest<HTMLElement>('[data-zone-dev]')?.dataset.zoneDev,action=target.closest<HTMLElement>('[data-dev]')?.dataset.dev;if(zone){mutateSave(save=>unlockToZone(save,zone));return}if(!action)return;if(action==='resources')mutateSave(grantResources);else if(action==='level5')mutateSave(save=>save.xp=Math.max(save.xp??0,XP_PRESET[5]));else if(action==='level8')mutateSave(save=>save.xp=Math.max(save.xp??0,XP_PRESET[8]));else if(action==='level10')mutateSave(save=>save.xp=Math.max(save.xp??0,XP_PRESET[10]));else if(action==='unlockAll')mutateSave(unlockAll);else if(action==='queue24'){api()?.advanceWorkshopTo?.(Date.now()+24*3600_000);platformApi()?.forceSave?.();schedule()}else if(action==='queueReset')mutateSave(save=>{save.scheduler=save.scheduler??{};save.scheduler.actions=[];save.scheduler.lastAdvancedAt=Date.now()});else if(action==='counters')mutateSave(save=>{save.totalDestroyed=0;save.contract={index:0,completed:0};if(save.midgame?.pity)save.midgame.pity={pump:0,compressor:0}});else if(action==='snapshot')document.querySelector('#hfDevSnapshot')!.textContent=JSON.stringify(snapshot(),null,2);else if(action==='reset'&&confirm('Сбросить только локальный review-save?')){clearResilientSave(localStorage,SAVE_KEY);location.reload()}})}

function enhance(){scheduled=false;patchBaseButton();applyReservations();ensureDevPanel()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
function boot(){if(!document.querySelector('#garageScreen')||!api()?.getState){setTimeout(boot,50);return}document.addEventListener('click',captureSpend,true);document.addEventListener('input',rememberBatchInput,true);new MutationObserver(schedule).observe(document.querySelector('.shell')!,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});setInterval(schedule,300);schedule()}
boot();
