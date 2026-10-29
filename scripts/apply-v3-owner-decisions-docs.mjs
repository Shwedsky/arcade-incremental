import fs from 'node:fs';

const path='docs/PROGRESSION_REFRAME_V3.md';
let text=fs.readFileSync(path,'utf8');
const replacements=[
  ['## 8. Talent Tree V3 — radial tree, hidden future, ranks and respec','## 8. Talent Tree V3 — directed branches, hidden future, ranks and respec'],
  ['Use a central player/business identity with five branches radiating outward rather than five unrelated vertical columns.','Use a central player/business identity followed by five explicit **directed development tracks**. Each branch must read from known/current progress toward its next choice; it must not use a circular/radial/constellation or PoE-like web. On wide screens the five tracks may sit side by side; on narrow screens they may stack, but branch direction and progression order must stay obvious.'],
  ['- Garage era: the player believes the branch currently contains roughly the visible first ring / first depth;','- Garage era: the player believes the branch currently contains roughly the visible first depth;'],
  ['- Hangar ascension: a second ring appears and the tree is suddenly materially deeper;','- Hangar ascension: a second depth appears and the tree is suddenly materially deeper;'],
  ['- Yard / Workshop / Plant: later rings continue to reveal.','- Yard / Workshop / Plant: later depths continue to reveal.'],
  ['- later rings remain completely absent until the corresponding business ascension.','- later era depths remain completely absent until the corresponding business ascension.'],
  ['After the appropriate ascension / ring unlock:','After the appropriate ascension / depth unlock:'],
  ['- newly revealed talent ring.','- newly revealed talent depth.'],
  ['- next era ring teaser without revealing hidden nodes.','- next era depth teaser without revealing hidden nodes.'],
  ['- talent presentation from fully visible columns into radial fog-of-knowledge tree;','- talent presentation from fully visible columns into five directed fog-of-knowledge development tracks;'],
  ['- era-gated talent rings;','- era-gated talent depths;'],
  ['- radial layout;','- five explicit directed branch tracks; no radial / PoE-like web;'],
  ['- new talent ring.','- new talent depth.']
];
for(const [from,to] of replacements){
  if(text.includes(from)) text=text.replaceAll(from,to);
  else if(!text.includes(to)) throw new Error(`Missing canonical owner-decision anchor: ${from}`);
}
if(!text.includes('directed development tracks')||text.includes('## 8. Talent Tree V3 — radial tree')||text.includes('later rings remain completely absent')) throw new Error('Talent layout owner decision did not apply completely');
fs.writeFileSync(path,text,'utf8');

const uiPath='src/v3_a_clarity.ts';
let ui=fs.readFileSync(uiPath,'utf8');
const oldUi="const era=businessEra(stage),nextRing=depth<8?(era==='garage'?'Следующее кольцо откроется после перехода бизнеса в Ангар':'Следующее кольцо откроется на более крупном этапе бизнеса'):'Открыта текущая максимальная глубина дерева';";
const newUi="const era=businessEra(stage),nextDepth=depth<8?(era==='garage'?'Следующая глубина веток откроется после перехода бизнеса в Ангар':'Следующая глубина веток откроется на более крупном этапе бизнеса'):'Открыта текущая максимальная глубина дерева';";
if(ui.includes(oldUi))ui=ui.replace(oldUi,newUi);else if(!ui.includes(newUi))throw new Error('Missing talent depth UI anchor');
const oldMarkup='${nextRing}</em></div>${branches}</div>`;';
const newMarkup='${nextDepth}</em></div>${branches}</div>`;';
if(ui.includes(oldMarkup))ui=ui.replace(oldMarkup,newMarkup);else if(!ui.includes(newMarkup))throw new Error('Missing talent depth markup anchor');
if(ui.includes('Следующее кольцо'))throw new Error('Residual radial-ring wording remains in player-facing talent UI');
fs.writeFileSync(uiPath,ui,'utf8');

console.log('Progression Reframe V3 and player-facing talent language updated to owner-approved directed layout');
