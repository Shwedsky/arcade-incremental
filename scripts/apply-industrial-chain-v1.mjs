import fs from 'node:fs';

function patch(path,replacements){let text=fs.readFileSync(path,'utf8');for(const [oldText,newText,label] of replacements){const count=text.split(oldText).length-1;if(count!==1)throw new Error(`${path} / ${label}: expected 1 match, got ${count}`);text=text.replace(oldText,newText)}fs.writeFileSync(path,text)}

patch('src/content_pack_c.ts',[
 [`export const SALVAGE_YARD_RECIPE={metal:280,cleanCopper:36,briquette:40,steelBlank:32,aluminiumBillet:12,alloyBillet:42,hydraulicPower:2,heavyFrame:2,control:2} as const;`,`export const SALVAGE_YARD_RECIPE={metal:280,cleanCopper:36,briquette:40,steelBlank:44,aluminiumBillet:0,alloyBillet:42,hydraulicPower:2,heavyFrame:2,control:2} as const;`,'yard recipe'],
 [`inv.cleanCopper>=SALVAGE_YARD_RECIPE.cleanCopper&&inv.briquette>=SALVAGE_YARD_RECIPE.briquette&&inv.steelBlank>=SALVAGE_YARD_RECIPE.steelBlank&&inv.aluminiumBillet>=SALVAGE_YARD_RECIPE.aluminiumBillet&&`,`inv.cleanCopper>=SALVAGE_YARD_RECIPE.cleanCopper&&inv.briquette>=SALVAGE_YARD_RECIPE.briquette&&inv.steelBlank>=SALVAGE_YARD_RECIPE.steelBlank&&`,'yard gate'],
 [`inv.cash-=SALVAGE_YARD_CASH;inv.metal-=SALVAGE_YARD_RECIPE.metal;inv.cleanCopper-=SALVAGE_YARD_RECIPE.cleanCopper;inv.briquette-=SALVAGE_YARD_RECIPE.briquette;inv.steelBlank-=SALVAGE_YARD_RECIPE.steelBlank;inv.aluminiumBillet-=SALVAGE_YARD_RECIPE.aluminiumBillet;`,`inv.cash-=SALVAGE_YARD_CASH;inv.metal-=SALVAGE_YARD_RECIPE.metal;inv.cleanCopper-=SALVAGE_YARD_RECIPE.cleanCopper;inv.briquette-=SALVAGE_YARD_RECIPE.briquette;inv.steelBlank-=SALVAGE_YARD_RECIPE.steelBlank;`,'yard consume']
]);

patch('src/content_pack_d.ts',[
 [`metal:360,cleanCopper:70,granulate:60,steelBlank:90,aluminiumBillet:36,alloyBillet:150,drive:3,control:4,hydraulicPower:4,heavyFrame:5,`,`metal:360,cleanCopper:70,granulate:60,steelBlank:126,aluminiumBillet:0,alloyBillet:150,drive:3,control:4,hydraulicPower:4,heavyFrame:5,`,'workshop recipe'],
 [`inv.cleanCopper>=r.cleanCopper&&inv.granulate>=r.granulate&&inv.steelBlank>=r.steelBlank&&inv.aluminiumBillet>=r.aluminiumBillet&&inv.alloyBillet>=r.alloyBillet&&`,`inv.cleanCopper>=r.cleanCopper&&inv.granulate>=r.granulate&&inv.steelBlank>=r.steelBlank&&inv.alloyBillet>=r.alloyBillet&&`,'workshop gate'],
 [`inv.cash-=INDUSTRIAL_WORKSHOP_CASH;inv.metal-=r.metal;inv.cleanCopper-=r.cleanCopper;inv.granulate-=r.granulate;inv.steelBlank-=r.steelBlank;inv.aluminiumBillet-=r.aluminiumBillet;inv.alloyBillet-=r.alloyBillet;`,`inv.cash-=INDUSTRIAL_WORKSHOP_CASH;inv.metal-=r.metal;inv.cleanCopper-=r.cleanCopper;inv.granulate-=r.granulate;inv.steelBlank-=r.steelBlank;inv.alloyBillet-=r.alloyBillet;`,'workshop consume']
]);

patch('src/content_pack_e.ts',[
 [`steelBlank:160,\n  aluminiumBillet:72,\n  alloyBillet:260,`,`steelBlank:232,\n  aluminiumBillet:0,\n  alloyBillet:260,`,'plant recipe'],
 [`inv.steelBlank>=r.steelBlank&&inv.aluminiumBillet>=r.aluminiumBillet&&inv.alloyBillet>=r.alloyBillet&&`,`inv.steelBlank>=r.steelBlank&&inv.alloyBillet>=r.alloyBillet&&`,'plant gate'],
 [`inv.steelBlank-=r.steelBlank;inv.aluminiumBillet-=r.aluminiumBillet;inv.alloyBillet-=r.alloyBillet;`,`inv.steelBlank-=r.steelBlank;inv.alloyBillet-=r.alloyBillet;`,'plant consume']
]);

patch('src/contract_board_v2.ts',[
 [`{id:'aluminium_contract',family:'industrial',name:'Лёгкие рамы',description:'Алюминиевые слитки для транспортных рам.',needs:[materialB('aluminiumBillet',3,'Алюминиевые слитки')],cashReward:6100,xpReward:78,minLevel:8,requires:['materialB:aluminiumBillet']},`,`{id:'structural_sections',family:'industrial',name:'Монтажные секции',description:'Готовые конструкционные секции для монтажной бригады.',needs:[moduleB('structural',1,'Конструкционная секция')],cashReward:6800,xpReward:82,minLevel:8,requires:['moduleB:structural']},`,'replace aluminium order'],
 [`needs:[materialC('alloyBillet',8,'Слитки сплава')],`,`needs:[materialC('alloyBillet',8,'Усиленный сплав')],`,'alloy order label'],
 [`needs:[materialC('alloyBillet',28,'Слитки сплава')],`,`needs:[materialC('alloyBillet',28,'Усиленный сплав')],`,'plant alloy label']
]);

console.log('Industrial Chain V1 simplification applied');
