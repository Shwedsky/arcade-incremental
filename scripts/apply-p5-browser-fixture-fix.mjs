import fs from 'node:fs';

const path='scripts/browser-production-cells-v1-smoke.ts';
let text=fs.readFileSync(path,'utf8');
const oldText="await context.addInitScript(({key,value})=>{localStorage.setItem(key,JSON.stringify(value))},{key:SAVE_KEY,value:save});";
const newText="await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value))},{key:SAVE_KEY,value:save});";
const count=text.split(oldText).length-1;
if(count!==1)throw new Error(`${path}: expected exactly one fixture seed match, got ${count}`);
text=text.replace(oldText,newText);
fs.writeFileSync(path,text);
console.log('P5 browser fixture now seeds localStorage only when save is absent');
