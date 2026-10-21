import './production_heavy_support_v1.css';

const api=()=> (globalThis as any).__SALVAGE_TEST__;
const rigName=(value?:string|null)=>value?.replace(/Recovery Rig/g,'Тяжёлая эвакуационная платформа')??'Тяжёлая эвакуационная платформа';

function render(){
  const view=api()?.getProductionCellsV1View?.();if(!view?.unlocked)return;
  const heavy=view.cells?.find((cell:any)=>cell.id==='heavy_assembly');if(!heavy)return;
  const card=document.querySelector<HTMLElement>('[data-production-cell="heavy_assembly"]');
  if(card){
    let block=card.querySelector<HTMLElement>('.pcHeavySupport');if(!block){block=document.createElement('div');block.className='pcHeavySupport';const bottleneck=card.querySelector('.pcBottleneck');bottleneck?.insertAdjacentElement('beforebegin',block)}
    const jobSupport=heavy.job?.support,free=view.heavySupport;
    if(jobSupport?.kind==='recovery_rig'){
      block.className='pcHeavySupport active';block.innerHTML=`<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${rigName(jobSupport.vehicleName)} поддержала запуск</b><span>Погрузка и позиционирование тяжёлых узлов: <strong>−${Math.round((1-Number(jobSupport.durationFactor??1))*100)}% к циклу</strong>. Бонус закреплён за текущим циклом.</span>`;
    }else if(free?.kind==='recovery_rig'){
      block.className='pcHeavySupport ready';block.innerHTML=`<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${rigName(free.vehicleName)} свободна</b><span>Следующий цикл тяжёлой сборки получит <strong>−${Math.round((1-Number(free.durationFactor??1))*100)}% к времени</strong> за тяжёлую подачу и позиционирование.</span>`;
    }else{
      block.className='pcHeavySupport unavailable';block.innerHTML='<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>Тяжёлая эвакуационная платформа недоступна</b><span>Машина на маршруте или ещё не в парке. Тяжёлая сборка работает без бонуса подачи.</span>';
    }
  }
  const gate=document.querySelector<HTMLElement>('.industrialHeavyGate');if(gate){const support=heavy.job?.support?.kind==='recovery_rig'?heavy.job.support:view.heavySupport;gate.classList.toggle('active',support?.kind==='recovery_rig');gate.innerHTML=support?.kind==='recovery_rig'?`<b>ТЯЖЁЛЫЙ ШЛЮЗ · ${rigName(support.vehicleName)}</b><span>${heavy.job?'поддержала текущий цикл':'готова к тяжёлой подаче'} · −${Math.round((1-Number(support.durationFactor??1))*100)}%</span>`:'<b>ТЯЖЁЛЫЙ ШЛЮЗ</b><span>Тяжёлая эвакуационная платформа недоступна</span>'}
}

setInterval(render,300);queueMicrotask(render);
