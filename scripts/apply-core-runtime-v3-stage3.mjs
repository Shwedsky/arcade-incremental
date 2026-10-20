import fs from 'node:fs';
const path='src/main.ts';
let text=fs.readFileSync(path,'utf8');
if(text.includes('CORE_RUNTIME_V3_STAGE3')){console.log('Core runtime V3 stage3 already integrated');process.exit(0)}
const oldText=`function ensureLegacyWorkerV3(index:number){let worker=workforceV3.workers[index];if(worker)return worker;worker=hireWorkerV3(workforceV3,currentBusinessStage(),Date.now());if(worker)worker.name=\`Рабочий \${index+1}\`;return worker}`;
const newText=`function ensureLegacyWorkerV3(index:number){const existing=workforceV3.workers[index];if(existing)return existing;const worker=hireWorkerV3(workforceV3,currentBusinessStage(),Date.now());if(worker)worker.name=\`Рабочий \${index+1}\`;return worker}`;
const count=text.split(oldText).length-1;
if(count!==1)throw new Error(`ensureLegacyWorkerV3: expected exactly 1 match, got ${count}`);
text=text.replace(oldText,newText).replace('// CORE_RUNTIME_V3_STAGE2','// CORE_RUNTIME_V3_STAGE2\n// CORE_RUNTIME_V3_STAGE3');
fs.writeFileSync(path,text);
console.log('Core runtime V3 stage3 type-safety patch applied');
