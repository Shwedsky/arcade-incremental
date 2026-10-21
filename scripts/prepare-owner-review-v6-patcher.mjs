import fs from 'node:fs';
const path='scripts/apply-owner-review-v6.mjs';
let s=fs.readFileSync(path,'utf8');
for(const bad of [
  "['Benchmark','Эталонный темп'],",
  "['Scavenger','Сборщик'],",
  "['Operator','Оператор'],"
])s=s.replace(bad,'');
fs.writeFileSync(path,s);
console.log('Owner Review V6 patcher sanitized: identifier-sensitive blanket replacements absent.');
