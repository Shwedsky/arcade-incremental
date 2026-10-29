import fs from 'node:fs';
const path='scripts/apply-v3-b-active-field.mjs';
let source=fs.readFileSync(path,'utf8');
for(const label of ["'target hp dps hud'","'pile child xp'","'pile child mastery'"]){
  const labelIndex=source.indexOf(label);
  if(labelIndex<0)continue;
  const start=Math.max(source.lastIndexOf('replaceOnce(',labelIndex),source.lastIndexOf('replaceBlock(',labelIndex));
  const endMarker='\n);\n';
  const end=source.indexOf(endMarker,labelIndex);
  if(start<0||end<0)throw new Error(`cannot isolate patch block ${label}`);
  source=source.slice(0,start)+source.slice(end+endMarker.length);
}
fs.writeFileSync(path,source);
