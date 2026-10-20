import fs from 'node:fs';
const path='src/manual_review_dev_v2.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('CORE_DEV_V4')){console.log('Core DEV V4 already integrated');process.exit(0)}
const replaceOne=(a,b,label)=>{const count=text.split(a).length-1;if(count!==1)throw new Error(`${label}: expected exactly 1 match, got ${count}`);text=text.replace(a,b)};
replaceOne(
`const XP_FOR_LEVEL:Record<number,number>={5:3200,8:11000,10:20000,16:41000,30:125000};
const RUNTIME_TALENTS=[
  'salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7','salvage_8',
  'logistics_1','logistics_2','logistics_3','logistics_4','logistics_8',
  'workshop_1','workshop_2','workshop_3','workshop_4','workshop_8',
  'automation_1','automation_2','automation_3','automation_4','automation_8',
  'trade_1','trade_2','trade_3','trade_4','trade_8'
];`,
`const XP_FOR_LEVEL:Record<number,number>={5:3200,8:11000,10:20000,16:41000,30:125000,50:380000};
const RUNTIME_TALENTS=[
  ...Array.from({length:8},(_,i)=>\`salvage_\${i+1}\`),
  ...Array.from({length:8},(_,i)=>\`logistics_\${i+1}\`),
  ...Array.from({length:8},(_,i)=>\`workshop_\${i+1}\`),
  ...Array.from({length:8},(_,i)=>\`automation_\${i+1}\`),
  ...Array.from({length:8},(_,i)=>\`trade_\${i+1}\`)
]; // CORE_DEV_V4`,
'level/talents');
replaceOne(
`function ensureWorkersAndInfrastructure(save:any){
  const mid=ensureObject(save,'midgame');`,
`function ensureWorkersAndInfrastructure(save:any){
  // Presets mutate the shipped Save V10 compatibility fields. Drop the derived
  // V3 snapshot so the next boot performs the same migration as a real old save.
  delete save.workforceV3;
  const mid=ensureObject(save,'midgame');`,
'workforce migration');
replaceOne(
`function unlockAll(save:any){
  plantReady(save);save.cash=Math.max(Number(save.cash??0),10_000_000);save.talents=Array.from(new Set([...(save.talents??[]),...RUNTIME_TALENTS]));
  const packE=ensureObject(save,'packE');packE.processingPlantOwned=true;packE.plantLines=2;packE.production=[];
}`,
`function unlockAll(save:any){
  plantReady(save);save.cash=Math.max(Number(save.cash??0),10_000_000);save.xp=Math.max(Number(save.xp??0),XP_FOR_LEVEL[50]);save.talents=Array.from(new Set([...(save.talents??[]),...RUNTIME_TALENTS]));
  save.machineLevels={workbench:6,press:6,wire:6,plastic:6};save.equipmentLevels={tool:10,cart:10};delete save.workforceV3;
  const packE=ensureObject(save,'packE');packE.processingPlantOwned=true;packE.plantLines=2;packE.production=[];
}`,
'unlock all');
replaceOne(
`grids[0]?.insertAdjacentHTML('beforeend','<button data-dev="level16">Уровень 16</button><button data-dev="level30">Уровень 30</button>');`,
`grids[0]?.insertAdjacentHTML('beforeend','<button data-dev="level16">Уровень 16</button><button data-dev="level30">Уровень 30</button><button data-dev="level50">Уровень 50</button>');`,
'level 50 button');
replaceOne(
`if(action==='level5'||action==='level8'||action==='level10'||action==='level16'||action==='level30'){`,
`if(action==='level5'||action==='level8'||action==='level10'||action==='level16'||action==='level30'||action==='level50'){`,
'level click');
fs.writeFileSync(path,text);
console.log('Core DEV V4 preset migration patch applied');
