const LABEL='⟲ Сбросить ВЕСЬ прогресс';
const TITLE='Удалить весь локальный прогресс этой review-сборки и начать прохождение заново';

function patchReset(){
  const button=document.querySelector<HTMLButtonElement>('#hfDevPanel [data-dev="reset"]');
  if(!button)return false;
  if(button.textContent!==LABEL)button.textContent=LABEL;
  button.title=TITLE;
  button.classList.add('danger');
  return true;
}

queueMicrotask(patchReset);
new MutationObserver(patchReset).observe(document.documentElement,{subtree:true,childList:true});
