const OFFLINE_REPLACEMENTS:ReadonlyArray<readonly [RegExp,string]>=[
  [/Industrial Workshop/g,'Промышленная мастерская'],
  [/Processing Plant/g,'Перерабатывающий завод'],
  [/Alloy Billet/g,'Усиленный сплав'],
  [/Recovery Rig/g,'Тяжёлая эвакуационная платформа']
];

function localizeOfflineReport(root:HTMLElement){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];
  while(walker.nextNode())nodes.push(walker.currentNode as Text);
  for(const node of nodes){
    const before=node.data;
    const after=OFFLINE_REPLACEMENTS.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),before);
    if(after!==before)node.data=after;
  }
  root.dataset.playerFacingRu='1';
}

function attach(){
  const root=document.querySelector<HTMLElement>('#offlineLoot');
  if(!root)return false;
  localizeOfflineReport(root);
  new MutationObserver(()=>localizeOfflineReport(root)).observe(root,{childList:true,subtree:true,characterData:true});
  return true;
}

function boot(){
  if(attach())return;
  const host=document.querySelector('#app')??document.body;
  const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});
  observer.observe(host,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
