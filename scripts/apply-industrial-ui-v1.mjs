import fs from 'node:fs';
const path='src/main.ts';let text=fs.readFileSync(path,'utf8');
if(text.includes('INDUSTRIAL_UI_V1')){console.log('Industrial UI V1 already integrated');process.exit(0)}
const pairs=[
 ["showToast(`Стальные заготовки: +${made}`)","showToast(`Конструкционный профиль: +${made}`)",'steel toast'],
 ["showToast(`Алюминиевые слитки: +${made}`)","showToast(`Конструкционный профиль из Al: +${made}`)",'al toast'],
 ["<span>Al scrap / billet</span><b>${packB.materials.aluminiumScrap.toFixed(1)} / ${packB.materials.aluminiumBillet}</b>","<span>Алюминиевый лом</span><b>${packB.materials.aluminiumScrap.toFixed(1)} кг</b>",'packb aluminium row'],
 ["<span>Steel Blank</span><b>${packB.materials.steelBlank}</b>","<span>Конструкционный профиль</span><b>${packB.materials.steelBlank}</b>",'packb profile row'],
 ["25 кг брикета → Steel","25 кг брикета → профиль",'steel action'],
 ["12 кг Al → Billet","12 кг Al → профиль",'al action'],
 [" · ${HANGAR_RECIPE.steelBlank} Steel · ${HANGAR_RECIPE.aluminiumBillet} Al billet ·"," · ${HANGAR_RECIPE.steelBlank} конструкц. профиль ·",'hangar requirements'],
 [" · ${TRUCK_RECIPE.steelBlank} Steel · ${TRUCK_RECIPE.aluminiumBillet} Al ·"," · ${TRUCK_RECIPE.steelBlank} конструкц. профиль ·",'truck requirements'],
 ["Alloy scrap / billet <b>${packC.materials.alloyScrap.toFixed(1)} / ${packC.materials.alloyBillet.toFixed(1)}</b>","Сплав-сырьё / усиленный сплав <b>${packC.materials.alloyScrap.toFixed(1)} / ${packC.materials.alloyBillet.toFixed(1)}</b>",'packc stock row'],
 [">Alloy Billet</button>",">Усиленный сплав</button>",'alloy button'],
 [" · ${SALVAGE_YARD_RECIPE.steelBlank} Steel · ${SALVAGE_YARD_RECIPE.aluminiumBillet} Al billet · ${SALVAGE_YARD_RECIPE.alloyBillet} Alloy ·"," · ${SALVAGE_YARD_RECIPE.steelBlank} конструкц. профиль · ${SALVAGE_YARD_RECIPE.alloyBillet} усиленный сплав ·",'yard requirements'],
 [" · ${RECOVERY_RIG_RECIPE.alloyBillet} Alloy ·"," · ${RECOVERY_RIG_RECIPE.alloyBillet} усиленный сплав ·",'rig requirements'],
 [" · ${INDUSTRIAL_WORKSHOP_RECIPE.granulate} Granulate · ${INDUSTRIAL_WORKSHOP_RECIPE.aluminiumBillet} Al billet · ${INDUSTRIAL_WORKSHOP_RECIPE.alloyBillet} Alloy ·"," · ${INDUSTRIAL_WORKSHOP_RECIPE.granulate} гранулят · ${INDUSTRIAL_WORKSHOP_RECIPE.steelBlank} конструкц. профиль · ${INDUSTRIAL_WORKSHOP_RECIPE.alloyBillet} усиленный сплав ·",'workshop requirements'],
 [" · Steel ${PROCESSING_PLANT_RECIPE.steelBlank} · Al ${PROCESSING_PLANT_RECIPE.aluminiumBillet} · Alloy ${PROCESSING_PLANT_RECIPE.alloyBillet} ·"," · Конструкц. профиль ${PROCESSING_PLANT_RECIPE.steelBlank} · Усиленный сплав ${PROCESSING_PLANT_RECIPE.alloyBillet} ·",'plant requirements'],
 ["<span>Alloy Scrap <b>${packC.materials.alloyScrap.toFixed(1)} кг</b></span><span>Alloy Billet <b>${packC.materials.alloyBillet.toFixed(1)} кг</b></span>","<span>Сплав-сырьё <b>${packC.materials.alloyScrap.toFixed(1)} кг</b></span><span>Усиленный сплав <b>${packC.materials.alloyBillet.toFixed(1)} кг</b></span>",'plant stock rows'],
 [" · Alloy Billet</b>"," · Усиленный сплав</b>",'plant line label']
];
for(const [oldText,newText,label] of pairs){const count=text.split(oldText).length-1;if(count!==1)throw new Error(`${label}: expected 1 match, got ${count}`);text=text.replace(oldText,newText)}
text=text.replace('// CORE_RUNTIME_V3_STAGE3','// CORE_RUNTIME_V3_STAGE3\n// INDUSTRIAL_UI_V1');
fs.writeFileSync(path,text);console.log('Industrial UI V1 terminology cleanup applied');
