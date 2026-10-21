import './production_heavy_support_v1.css';

const api=()=> (globalThis as any).__SALVAGE_TEST__;

function render(){
  const view=api()?.getProductionCellsV1View?.();if(!view?.unlocked)return;
  const heavy=view.cells?.find((cell:any)=>cell.id==='heavy_assembly');if(!heavy)return;
  const card=document.querySelector<HTMLElement>('[data-production-cell="heavy_assembly"]');
  if(card){
    let block=card.querySelector<HTMLElement>('.pcHeavySupport');if(!block){block=document.createElement('div');block.className='pcHeavySupport';const bottleneck=card.querySelector('.pcBottleneck');bottleneck?.insertAdjacentElement('beforebegin',block)}
    const jobSupport=heavy.job?.support,free=view.heavySupport;
    if(jobSupport?.kind==='recovery_rig'){
      block.className='pcHeavySupport active';block.innerHTML=`<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${jobSupport.vehicleName??'Recovery Rig'} поддержал запуск</b><span>Погрузка и позиционирование тяжёлых узлов: <strong>−${Math.round((1-Number(jobSupport.durationFactor??1))*100)}% к циклу</strong>. Бонус зафиксирован в этом job.</span>`;
    }else if(free?.kind==='recovery_rig'){
      block.className='pcHeavySupport ready';block.innerHTML=`<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>${free.vehicleName??'Recovery Rig'} свободен</b><span>Следующий Heavy Assembly получит <strong>−${Math.round((1-Number(free.durationFactor??1))*100)}% к времени</strong> за тяжёлую подачу и позиционирование.</span>`;
    }else{
      block.className='pcHeavySupport unavailable';block.innerHTML='<small>ТЯЖЁЛАЯ ЛОГИСТИКА</small><b>Recovery Rig недоступен</b><span>Машина на маршруте или ещё не в парке. Heavy Assembly работает без бонуса тяжёлой подачи.</span>';
    }
  }
  const gate=document.querySelector<HTMLElement>('.industrialHeavyGate');if(gate){const support=heavy.job?.support?.kind==='recovery_rig'?heavy.job.support:view.heavySupport;gate.classList.toggle('active',support?.kind==='recovery_rig');gate.innerHTML=support?.kind==='recovery_rig'?`<b>HEAVY GATE · ${support.vehicleName??'Recovery Rig'}</b><span>${heavy.job?'поддержал текущий цикл':'готов к тяжёлой подаче'} · −${Math.round((1-Number(support.durationFactor??1))*100)}%</span>`:'<b>HEAVY GATE</b><span>Recovery Rig недоступен</span>'}
}

setInterval(render,300);queueMicrotask(render);
