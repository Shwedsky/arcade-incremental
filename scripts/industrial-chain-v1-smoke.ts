import assert from 'node:assert/strict';
import {createDefaultPackB,normalizePackB,refineAluminium,HANGAR_RECIPE,TRUCK_RECIPE} from '../src/content_pack_b.ts';
import {SALVAGE_YARD_RECIPE} from '../src/content_pack_c.ts';
import {INDUSTRIAL_WORKSHOP_RECIPE} from '../src/content_pack_d.ts';
import {PROCESSING_PLANT_RECIPE} from '../src/content_pack_e.ts';
import {CONTRACT_BOARD_V2} from '../src/contract_board_v2.ts';

const old=createDefaultPackB(1);
old.materials.steelBlank=5;
old.materials.aluminiumBillet=7;
old.materials.aluminiumScrap=24;
const migrated=normalizePackB(old,2);
assert.equal(migrated.materials.steelBlank,12,'legacy steel + aluminium billets must preserve value as one structural profile stock');
assert.equal(migrated.materials.aluminiumBillet,0,'deprecated aluminium billet must disappear after normalization');
assert.equal(migrated.materials.aluminiumScrap,24);
const made=refineAluminium(migrated,2);
assert.equal(made,2);
assert.equal(migrated.materials.aluminiumScrap,0);
assert.equal(migrated.materials.steelBlank,14,'aluminium scrap now feeds the same structural profile layer');
assert.equal(migrated.materials.aluminiumBillet,0);

for(const [name,recipe] of Object.entries({hangar:HANGAR_RECIPE,truck:TRUCK_RECIPE,yard:SALVAGE_YARD_RECIPE,workshop:INDUSTRIAL_WORKSHOP_RECIPE,plant:PROCESSING_PLANT_RECIPE})){
  assert.equal(recipe.aluminiumBillet,0,`${name} must not require deprecated aluminium billet`);
  assert.ok(recipe.steelBlank>0,`${name} must have a readable structural-profile sink`);
}
const serialized=JSON.stringify(CONTRACT_BOARD_V2);
assert.ok(!serialized.includes('materialB:aluminiumBillet'),'no special order may revive deprecated aluminium billet');
assert.ok(CONTRACT_BOARD_V2.some(def=>def.id==='structural_sections'),'structural module must have a high-margin order sink');
assert.ok(CONTRACT_BOARD_V2.filter(def=>JSON.stringify(def.needs).includes('alloyBillet')).length>=2,'reinforced alloy stays because it has repeated meaningful sinks');

console.log('Industrial Chain V1: legacy migration + structural profile consolidation + reinforced alloy sinks: PASS');
