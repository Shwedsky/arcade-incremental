import './base_stage_art_v2.css';

function attach(){
  const scene=document.querySelector<HTMLElement>('#baseStageSceneV2');
  if(!scene)return;
  let art=scene.querySelector<HTMLElement>(':scope > .stageIllustrationV2');
  if(!art){
    art=document.createElement('div');
    art.className='stageIllustrationV2';
    art.setAttribute('aria-hidden','true');
    scene.prepend(art);
  }
}

const observer=new MutationObserver(()=>queueMicrotask(attach));
function boot(){
  const garage=document.querySelector('#garageScreen');
  if(!garage){setTimeout(boot,100);return}
  observer.observe(garage,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
  attach();
  setInterval(attach,1000);
}
boot();
