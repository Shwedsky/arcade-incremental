import './base_storage_v1.css';
import {baseStoragePressureV1,type BaseStoragePressureV1} from './base_storage_v1.ts';
import type {BusinessStageId} from './business_stage.ts';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageRank:Record<BusinessStageId,number>={starter_garage:0,equipped_garage:1,workforce_garage:2,hangar:3,salvage_yard:4,industrial_workshop:5,processing_plant:6};

function state(){try{return api()?.getState?.()}catch{return null}}
function enabled(stage:string):stage is BusinessStageId{return stage in stageRank&&stageRank[stage as BusinessStageId]>=stageRank.salvage_yard}
function networkKgPerHour(s:any){return(s?.workforceV3?.routes??[]).reduce((sum:number,route:any)=>sum+Math.max(0,Number(api()?.projectGenericRoute?.(route.id)?.kgPerHour??0)),0)}
function pressure(s:any){return baseStoragePressureV1(s.businessStage as BusinessStageId,s.storage,networkKgPerHour(s))}
function kg(value:number){return Math.max(0,value).toLocaleString('ru-RU',{maximumFractionDigits:0})}
function status(p:BaseStoragePressureV1){return p.full?'ПРИЁМ ОСТАНОВЛЕН':p.nearFull?'СКЛАД ПОЧТИ ЗАПОЛНЕН':'ПРИЁМ РАБОТАЕТ'}
function detail(p:BaseStoragePressureV1){
  if(p.full)return'Автоматические маршруты ждут свободного места. Переработай или продай сырьё, чтобы возобновить приём.';
  if(p.hoursToFull!==null&&Number.isFinite(p.hoursToFull))return`Свободно ${kg(p.freeKg)} кг · при текущем потоке до заполнения ≈ ${p.hoursToFull<.1?'<0,1':p.hoursToFull.toFixed(1).replace('.',',')} ч`;
  return`Свободно ${kg(p.freeKg)} кг · активных поставок сейчас нет`;
}
function markup(p:BaseStoragePressureV1,compact=false){
  const tone=p.full?'full':p.nearFull?'warn':'ok',percent=Math.max(0,Math.min(100,p.loadRatio*100));
  return`<section class="baseStoragePressureV1 ${tone} ${compact?'compact':''}" data-base-storage-pressure>
    <header><div><small>ПРИЁМНЫЙ СКЛАД</small><b>${status(p)}</b></div><strong data-storage-percent>${percent.toFixed(0)}%</strong></header>
    <div class="baseStorageMeter"><i data-storage-meter style="width:${percent}%"></i></div>
    <div class="baseStorageNumbers"><span><small>Занято</small><b data-storage-used>${kg(p.storedKg)} кг</b></span><span><small>Вместимость</small><b data-storage-capacity>${kg(p.capacityKg)} кг</b></span></div>
    <p data-storage-detail>${detail(p)}</p>
  </section>`;
}
function ensureRoot(pane:HTMLElement,kind:'logistics'|'storage'){
  const selector=`[data-base-storage-root="${kind}"]`;let root=pane.querySelector<HTMLElement>(selector);
  if(!root){root=document.createElement('div');root.dataset.baseStorageRoot=kind;if(kind==='logistics'){const network=pane.querySelector('#fleetNetworkV1Root');network?.after(root);if(!root.parentElement)pane.prepend(root)}else pane.prepend(root)}
  return root;
}
function renderRoot(root:HTMLElement,p:BaseStoragePressureV1,compact=false){const signature=`${p.full}:${p.nearFull}:${Math.floor(p.storedKg)}:${Math.floor(p.capacityKg)}:${p.hoursToFull===null?'n':Math.floor(p.hoursToFull*10)}`;if(root.dataset.signature===signature)return;root.dataset.signature=signature;root.innerHTML=markup(p,compact)}
function patchCrewStorageLabel(p:BaseStoragePressureV1){if(!p.full)return;document.querySelectorAll<HTMLElement>('[data-v3-metric="bottleneck"]').forEach(node=>{if(node.textContent?.trim()==='base_storage'){node.textContent='склад базы заполнен — приём маршрутов остановлен';node.className='warn'}})}
function patchOfflineStorageStop(p:BaseStoragePressureV1){
  if(!p.full)return;const list=document.querySelector<HTMLElement>('.offlineRoutesV3');if(!list)return;
  list.querySelectorAll<HTMLElement>('li span').forEach(span=>{if(span.textContent?.includes('маршрут продолжает работу'))span.textContent=span.textContent.replace('маршрут продолжает работу','остановка: склад базы заполнен')});
  let note=list.parentElement?.querySelector<HTMLElement>('[data-offline-storage-stop]');if(!note&&list.parentElement){note=document.createElement('p');note.dataset.offlineStorageStop='1';note.className='offlineStorageStopV1';list.before(note)}
  if(note)note.textContent=`Приёмный склад: ${kg(p.storedKg)} / ${kg(p.capacityKg)} кг · автоматические маршруты остановлены до освобождения места.`;
}

export function refreshBaseStoragePressureV1(){
  const s=state();if(!s?.storage)return;const stage=String(s.businessStage??'');
  if(!enabled(stage)){document.querySelectorAll('[data-base-storage-root]').forEach(node=>node.remove());return}
  const p=pressure(s),logistics=document.querySelector<HTMLElement>('[data-base-pane="logistics"]'),storage=document.querySelector<HTMLElement>('[data-base-pane="storage"]');
  if(logistics)renderRoot(ensureRoot(logistics,'logistics'),p,false);
  if(storage)renderRoot(ensureRoot(storage,'storage'),p,true);
  patchCrewStorageLabel(p);patchOfflineStorageStop(p);
}

addEventListener('salvage:business-state-changed',()=>setTimeout(refreshBaseStoragePressureV1,0));
setInterval(refreshBaseStoragePressureV1,750);
