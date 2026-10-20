import './base_stage_visual_v2.css';

type RuntimeState=any;
type Stage='garage'|'hangar'|'yard'|'industrial'|'plant';
const api=()=> (globalThis as any).__SALVAGE_TEST__;
const stageOf=(s:RuntimeState):Stage=>s?.packE?.processingPlantOwned?'plant':s?.packD?.industrialWorkshopOwned?'industrial':s?.packC?.salvageYardOwned?'yard':s?.packB?.hangarOwned?'hangar':'garage';
const workerCount=(s:RuntimeState)=>[s?.midgame?.worker?.hired,s?.packB?.secondWorker?.hired,s?.packC?.crew3?.hired,s?.packD?.crew4?.hired].filter(Boolean).length;
const vehicleCount=(s:RuntimeState)=>[s?.midgame?.van?.owned,s?.packB?.truck?.owned,s?.packD?.recoveryRig?.owned].filter(Boolean).length;
const machineCount=(s:RuntimeState)=>Math.max(1,s?.installed?.length??1);

function workers(n:number){return Array.from({length:Math.min(8,n)},(_,i)=>`<i class="basePerson p${i+1}" title="Рабочий"></i>`).join('')}
function bays(n:number,label:string){return Array.from({length:n},(_,i)=>`<div class="baseBay ${i<vehicleCount(lastState)?'occupied':''}"><span>${i<vehicleCount(lastState)?['🚐','🚚','🚛'][i]??'🚐':'—'}</span><small>${label} ${i+1}</small></div>`).join('')}
let lastState:RuntimeState=null;
function sceneMarkup(stage:Stage,s:RuntimeState){
  const wc=workerCount(s),mc=machineCount(s);
  if(stage==='garage')return`<div class="baseSceneLabel"><b>Личный гараж</b><span>${mc} станк. · ${wc} раб.</span></div><div class="garageWall"><div class="garageDoor"></div><div class="garageBench">🛠</div><div class="garageShelves"><i></i><i></i><i></i></div><div class="garageMachines">${Array.from({length:Math.min(4,mc)},()=>'<i>⚙</i>').join('')}</div>${workers(wc)}</div>`;
  if(stage==='hangar')return`<div class="baseSceneLabel"><b>Операционный ангар</b><span>${mc} станк. · ${wc} раб. · ${vehicleCount(s)} транспорт</span></div><div class="hangarRoof"><i></i><i></i><i></i></div><div class="hangarFloor"><div class="hangarMachines">${Array.from({length:Math.min(6,mc)},(_,i)=>`<i><span>⚙</span><small>Пост ${i+1}</small></i>`).join('')}</div><div class="hangarBays">${bays(3,'Бокс')}</div><div class="pallets"><i></i><i></i><i></i></div>${workers(Math.max(2,wc))}</div>`;
  if(stage==='yard')return`<div class="baseSceneLabel"><b>Salvage Yard</b><span>Сеть снабжения · ${wc} раб. · ${vehicleCount(s)} транспорт</span></div><div class="yardSky"><div class="yardCrane">┐<i></i></div></div><div class="yardGround"><div class="scrapPile a"></div><div class="scrapPile b"></div><div class="yardBays">${bays(5,'Стоянка')}</div><div class="yardStaging">ТЯЖЁЛЫЙ ЛОМ</div>${workers(Math.max(3,wc))}</div>`;
  if(stage==='industrial')return`<div class="baseSceneLabel"><b>Industrial Workshop</b><span>Производственные ячейки · ${wc} раб.</span></div><div class="industrialHall"><div class="overheadCrane"></div><div class="productionCells">${Array.from({length:4},(_,i)=>`<div><b>ЯЧЕЙКА ${i+1}</b><span>${i<2?'⚙ ACTIVE':'READY'}</span><i></i></div>`).join('')}</div><div class="industrialBays">${bays(4,'Ворота')}</div>${workers(Math.max(4,wc))}</div>`;
  return`<div class="baseSceneLabel"><b>Processing Plant</b><span>Завод · линии + склад + входящая логистика</span></div><div class="plantScene"><div class="plantStacks"><i></i><i></i><i></i></div><div class="plantWarehouse">СКЛАД<br><strong>150 000 кг</strong></div><div class="plantLines"><div>ЛИНИЯ 1<i></i></div><div>ЛИНИЯ 2<i></i></div></div><div class="plantDock">${bays(5,'Док')}</div>${workers(Math.max(5,wc))}</div>`;
}

function render(){
  const runtime=api();if(!runtime?.getState)return;const s=runtime.getState();lastState=s;
  const box=document.querySelector<HTMLElement>('.garageBox');if(!box)return;
  const stage=stageOf(s);box.dataset.visualStage=stage;
  let scene=box.querySelector<HTMLElement>('#baseStageSceneV2');
  if(!scene){scene=document.createElement('section');scene.id='baseStageSceneV2';scene.className='baseStageSceneV2';const header=box.querySelector(':scope > header');header?.insertAdjacentElement('afterend',scene)}
  const signature=`${stage}:${workerCount(s)}:${vehicleCount(s)}:${machineCount(s)}:${s?.packE?.production?.length??0}`;
  if(scene.dataset.signature===signature)return;scene.dataset.signature=signature;scene.className=`baseStageSceneV2 stage-${stage}`;scene.innerHTML=sceneMarkup(stage,s);
}

const observer=new MutationObserver(()=>queueMicrotask(render));
function boot(){const garage=document.querySelector('#garageScreen');if(!garage){setTimeout(boot,100);return}observer.observe(garage,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});render();setInterval(render,1000)}
boot();
