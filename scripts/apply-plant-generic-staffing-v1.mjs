import fs from 'node:fs';
const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
const replacements=[
  [
    "const processingPlantContext=()=>({z8Mastered:zoneMastered(midgame,'z8'),industrialWorkshopOwned:packD.industrialWorkshopOwned,recoveryRigOwned:packD.recoveryRig.owned,worker4Hired:packD.crew4.hired});",
    "const processingPlantContext=()=>({z8Mastered:zoneMastered(midgame,'z8'),industrialWorkshopOwned:packD.industrialWorkshopOwned,recoveryRigOwned:packD.recoveryRig.owned,staffingReady:workforceV3.workers.length>=3&&effects().operatorUnlocked});",
    'Plant context'
  ],
  [
    "<span>Worker #4 <b>${packD.crew4.hired?'готов':'нужен для Plant'}</b></span>",
    "<span>Команда <b>${ctx.staffingReady?'готова':'нужно 3+ сотрудника и «Начальник смены»'}</b></span>",
    'Plant staffing UI'
  ],
  [
    "${!ctx.z8Mastered?'Сначала освой Z8':!ctx.worker4Hired?'Нужен Worker #4':ready?'Развернуть Processing Plant':'Не хватает производственных ресурсов'}",
    "${!ctx.z8Mastered?'Сначала освой Z8':!ctx.staffingReady?'Нужна зрелая команда':ready?'Развернуть Processing Plant':'Не хватает производственных ресурсов'}",
    'Plant button reason'
  ]
];
for(const [oldText,newText,label] of replacements){
  if(text.includes(newText)){console.log(`${label}: already applied`);continue}
  const count=text.split(oldText).length-1;
  if(count!==1)throw new Error(`${label}: expected 1 legacy match, got ${count}`);
  text=text.replace(oldText,newText);
}
fs.writeFileSync(path,text);
console.log('Plant generic staffing V1 applied');
