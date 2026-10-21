import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const css=readFileSync(fileURLToPath(new URL('../src/stage_visual_consistency_v1.css',import.meta.url)),'utf8');
const loader=readFileSync(fileURLToPath(new URL('../src/operator_ui_v3.ts',import.meta.url)),'utf8');

assert.ok(loader.includes("import './stage_visual_consistency_v1.css';"),'B3 art layer must be loaded by the runtime');
for(const selector of ['.stage-garage','.stage-hangar','.stage-yard','.yardBulkField','.yardRecovered','.yardCrewMuster','.yardVehicleApron','.yardRecoveredObjects','.yardCrewGrid']){
  assert.ok(css.includes(selector),`B3 stylesheet must style ${selector}`);
}
assert.ok(css.includes("content:''!important"),'Garage crowding must be shown spatially rather than via the old ambiguous text badge');
assert.ok(css.includes('grid-template-columns:minmax(0,1.3fr) minmax(250px,.95fr)'),'desktop Yard must be a deliberate multi-zone composition');
assert.ok(css.includes('@media(max-width:900px)'),'B3 must define an intentional tablet/mobile composition');
assert.ok(css.includes('@media(max-width:560px)'),'B3 must define a phone composition');
assert.ok(!css.includes('canvas{')&&!css.includes('webgl'),'B3 must remain a lightweight CSS art layer');

console.log('Stage Visual Consistency V1: Garage/Hangar/Yard physical scale + Yard four-zone composition + responsive art layer: PASS');
