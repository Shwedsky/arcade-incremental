import assert from 'node:assert/strict';
import {
  PACK_C_ZONE_PROFILES, SALVAGE_YARD_CASH, SALVAGE_YARD_RECIPE,
  acquireSalvageYard, alloyYield, canAcquireSalvageYard, canUnlockPackCZone,
  createDefaultPackC, fabricateHeavyModule, refineAlloy, rollPackCComponent,
  type PackCInventory,
} from '../src/content_pack_c.ts';

const state=createDefaultPackC();
assert.deepEqual(Object.keys(PACK_C_ZONE_PROFILES),['z5','z6']);
assert.ok(PACK_C_ZONE_PROFILES.z6.hpMultiplier>PACK_C_ZONE_PROFILES.z5.hpMultiplier);
assert.ok(PACK_C_ZONE_PROFILES.z6.masteryTarget>PACK_C_ZONE_PROFILES.z5.masteryTarget);

const gateBase={z4Mastered:false,z5Mastered:false,hangarOwned:false,truckOwned:false,controllerDiscovered:false};
assert.equal(canUnlockPackCZone('z5',gateBase).ok,false);
assert.equal(canUnlockPackCZone('z5',{...gateBase,z4Mastered:true,hangarOwned:true,truckOwned:true}).ok,true);
assert.equal(canUnlockPackCZone('z6',{...gateBase,z4Mastered:true,z5Mastered:true,hangarOwned:true,truckOwned:true}).ok,false,'Z6 needs active controller discovery');

let drop:ReturnType<typeof rollPackCComponent>;
for(let i=0;i<12;i++)drop=rollPackCComponent(state,'z5','large_appliance',()=>1);
assert.equal(drop,'industrialController','controller must pity by 12 eligible Z5 targets');
assert.ok(state.discoveredIndustrial.includes('industrialController'));
assert.equal(canUnlockPackCZone('z6',{...gateBase,z4Mastered:true,z5Mastered:true,hangarOwned:true,truckOwned:true,controllerDiscovered:true}).ok,true);

for(let i=0;i<10;i++)drop=rollPackCComponent(state,'z6','large_appliance',()=>1);
assert.equal(drop,'heavyHydraulicCylinder','heavy cylinder must pity by 10 eligible Z6 targets');
assert.ok(state.discoveredIndustrial.includes('heavyHydraulicCylinder'));

const z5Alloy=alloyYield('z5','large_appliance',()=>.5),z6Alloy=alloyYield('z6','large_appliance',()=>.5);
assert.ok(z5Alloy>0);
assert.ok(z6Alloy>z5Alloy,'Z6 should be the stronger alloy source');

state.materials.alloyScrap=50;
assert.equal(refineAlloy(state,2),36);
assert.equal(state.materials.alloyScrap,0);
assert.equal(state.materials.alloyBillet,36);

state.industrial.heavyHydraulicCylinder=3;
state.industrial.industrialController=3;
const inv:PackCInventory={cash:500_000,metal:1000,cleanCopper:100,steelBlank:100,structural:4,control:6,hydraulic:3,pump:3};
assert.equal(fabricateHeavyModule(state,'hydraulicPower',inv),true);
assert.equal(fabricateHeavyModule(state,'heavyFrame',inv),true);
assert.equal(state.modules.hydraulicPower,1);
assert.equal(state.modules.heavyFrame,1);
// Build the second copies required by the Yard recipe.
state.materials.alloyBillet+=20;
assert.equal(fabricateHeavyModule(state,'hydraulicPower',inv),true);
assert.equal(fabricateHeavyModule(state,'heavyFrame',inv),true);

assert.equal(canAcquireSalvageYard(state,inv,false),false,'Yard cannot bypass Z6 mastery');
// Top up only the manufactured bulk inputs consumed by the preceding module proof.
state.materials.alloyBillet=Math.max(state.materials.alloyBillet,SALVAGE_YARD_RECIPE.alloyBillet);
inv.cash=Math.max(inv.cash,SALVAGE_YARD_CASH);
inv.metal=Math.max(inv.metal,SALVAGE_YARD_RECIPE.metal);
inv.cleanCopper=Math.max(inv.cleanCopper,SALVAGE_YARD_RECIPE.cleanCopper);
inv.steelBlank=Math.max(inv.steelBlank,SALVAGE_YARD_RECIPE.steelBlank);
inv.control=Math.max(inv.control,SALVAGE_YARD_RECIPE.control);
assert.equal(canAcquireSalvageYard(state,inv,true),true);
assert.equal(acquireSalvageYard(state,inv,true),true);
assert.equal(state.salvageYardOwned,true);

console.log(JSON.stringify({
  zones:Object.values(PACK_C_ZONE_PROFILES).map(z=>({id:z.id,hp:z.hpMultiplier,yield:z.yieldMultiplier,mastery:z.masteryTarget})),
  controllerPity:12,cylinderPity:10,alloyBatch:'25 -> 18',salvageYard:true
},null,2));
console.log('Content Pack C domain smoke: PASS');
