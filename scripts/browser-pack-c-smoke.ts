import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';

const PORT=4177;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',(b)=>serverOutput+=String(b));server.stderr.on('data',(b)=>serverOutput+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(resolve=>setTimeout(resolve,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}

const midgame=(mastery={z1:100,z2:100,z3:100,z4:100,z5:0,z6:0},currentZone='z4',now=Date.now())=>({
  currentZone,mastery,discoveredComponents:['bearing','motor','electronics','hydraulic'],discoveredMidComponents:['pump','compressor'],midComponents:{pump:5,compressor:3},pity:{pump:0,compressor:0},
  van:{owned:true,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},worker:{hired:true,assignment:'z1',lastTick:now}
});
const packB=(now=Date.now())=>({
  materials:{aluminiumScrap:300,steelBlank:120,aluminiumBillet:60},industrial:{gearbox:5,generator:5},discoveredIndustrial:['gearbox','generator'],pity:{gearbox:0,generator:0},modules:{drive:5,control:8,structural:6},hangarOwned:true,
  truck:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0},secondWorker:{hired:true,assignment:'z2',lastTick:now}
});
const packC=(overrides:Record<string,unknown>={})=>({
  materials:{alloyScrap:75,alloyBillet:80},industrial:{industrialController:5,heavyHydraulicCylinder:5},discoveredIndustrial:['industrialController','heavyHydraulicCylinder'],pity:{industrialController:0,heavyHydraulicCylinder:0},modules:{hydraulicPower:3,heavyFrame:3},salvageYardOwned:false,production:null,
  crew3:{hired:false,role:'scavenger',assignment:null,lastTick:Date.now()},...overrides
});
const PACK_C_TALENTS=['salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7','salvage_8','workshop_1','workshop_2','workshop_3','workshop_4','workshop_8','automation_1','automation_2','automation_3','automation_8'];
const baseV5=(overrides:Record<string,unknown>={})=>({
  v:5,xp:26000,storage:{metal:3000,copper:80,plastic:80},components:{bearing:12,motor:12,hydraulic:8,electronics:12},processed:{briquette:1000,cleanCopper:300,granulate:40},cash:1_500_000,
  installed:['workbench','press','wire','plastic'],machineLevels:{workbench:1,press:2,wire:2,plastic:1},talents:PACK_C_TALENTS,equipmentLevels:{tool:4,cart:4},jobs:[],contract:{index:0,completed:0},totalDestroyed:5000,lastSeen:Date.now(),midgame:midgame(),packB:packB(),...overrides
});
const baseV6=(overrides:Record<string,unknown>={})=>({...baseV5(),v:6,packC:packC(),...overrides});
async function withSave(context:BrowserContext,save:any){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_packc_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_packc_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // 1. V5 -> current V7 migration adds Pack C/Pack D defaults without wiping accepted Pack B progress.
  const c1=await browser.newContext();await withSave(c1,baseV5());const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=packc-migrate`);await p1.waitForSelector('#garage');
  const s1=await state(p1);assert.equal(s1.saveVersion,9);assert.equal(s1.packB.hangarOwned,true);assert.equal(s1.packB.truck.owned,true);assert.equal(s1.packC.salvageYardOwned,false);assert.equal(s1.packC.materials.alloyScrap,0);assert.equal(s1.packD.recoveryRig.owned,false);await c1.close();

  // 2. Z5 is available after mastered Z4 + Hangar + Truck; Z6 stays locked until active Controller discovery and Z5 mastery.
  const c2=await browser.newContext();await withSave(c2,baseV6({packC:packC({discoveredIndustrial:[],industrial:{industrialController:0,heavyHydraulicCylinder:0}})}));const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=packc-zones`);await p2.click('#garage');await p2.waitForSelector('#garageScreen:not([hidden])');
  await p2.click('#zonesGarage');await p2.waitForSelector('#zoneScreen:not([hidden])');assert.equal(await p2.locator('[data-zone="z5"] button').isDisabled(),false);assert.equal(await p2.locator('[data-zone="z6"] button').isDisabled(),true);await c2.close();

  // 3. Full Pack C bridge: Z6 -> Yard -> third worker -> Operator -> accelerated production -> persistence.
  const c3=await browser.newContext();const mastered={z1:100,z2:100,z3:100,z4:100,z5:100,z6:100};await withSave(c3,baseV6({midgame:midgame(mastered,'z5'),packC:packC()}));const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=packc-main`);await p3.click('#garage');await p3.waitForSelector('#garageScreen:not([hidden])');
  await p3.click('#zonesGarage');await p3.waitForSelector('#zoneScreen:not([hidden])');const z6=p3.locator('[data-zone="z6"] button');assert.equal(await z6.isDisabled(),false);await z6.click();let s3=await state(p3);assert.equal(s3.midgame.currentZone,'z6');
  const yard=p3.locator('#acquireSalvageYard');assert.equal(await yard.isDisabled(),false);await yard.click();s3=await state(p3);assert.equal(s3.packC.salvageYardOwned,true);
  const hire3=p3.locator('#hireWorker3');assert.equal(await hire3.isDisabled(),false);await hire3.click();s3=await state(p3);assert.equal(s3.packC.crew3.hired,true);
  const operator=p3.locator('#assignOperator');assert.equal(await operator.isDisabled(),false);await operator.click();s3=await state(p3);assert.equal(s3.packC.crew3.role,'operator');assert.equal(s3.packC.crew3.assignment,null);
  const alloy=p3.locator('#packCAlloy');assert.equal(await alloy.isDisabled(),false);await alloy.click();s3=await state(p3);assert.equal(s3.packC.production.kind,'alloyBillet');const duration=s3.packC.production.endsAt-s3.packC.production.startedAt;assert.equal(duration,162000,'Workshop ×0.90 and Operator ×0.75 must combine on Pack C cell');
  await p3.reload();await p3.waitForSelector('#garage');s3=await state(p3);assert.equal(s3.saveVersion,9);assert.equal(s3.packC.salvageYardOwned,true);assert.equal(s3.packC.crew3.hired,true);assert.equal(s3.packC.crew3.role,'operator');assert.equal(s3.packC.production.kind,'alloyBillet');assert.ok(s3.talents.includes('workshop_8'));assert.ok(s3.talents.includes('automation_8'));assert.equal(s3.packD.recoveryRig.owned,false);await c3.close();

  console.log('browser Content Pack C proof: PASS');
}finally{await browser.close();await stopServer()}