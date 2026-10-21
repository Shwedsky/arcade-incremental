import fs from 'node:fs';
const path='scripts/apply-owner-review-v6.mjs';
let s=fs.readFileSync(path,'utf8');
for(const bad of [
  "['Benchmark','Эталонный темп'],",
  "['Scavenger','Сборщик'],",
  "['Operator','Оператор'],"
])s=s.replace(bad,'');
const badDiagnostic="notify(\\`Спецзаказ пока нельзя сдать: \\${missing.map((row:any)=>\\`${row.need.label} \\${qty(row.owned)} / \\${qty(row.need.amount)}\\`).join(', ')||'свободные товары изменились'}\\`);render(true);return";
const safeDiagnostic="notify('Спецзаказ пока нельзя сдать: '+(missing.map((row:any)=>row.need.label+' '+qty(row.owned)+' / '+qty(row.need.amount)).join(', ')||'свободные товары изменились'));render(true);return";
s=s.replace(badDiagnostic,safeDiagnostic);
fs.writeFileSync(path,s);
console.log('Owner Review V6 patcher sanitized: identifier and diagnostic templates are safe.');
