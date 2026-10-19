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

const emptyMid=(now=Date.now())=>({
  currentZone:'z1',mastery:{z1:100,z2:0,z3:0,z4:0,z5:0,z6:0},discoveredComponents:['bearing','motor','electronics'],discoveredMidComponents:[],midComponents:{pump:0,compressor:0},pity:{pump:0,compressor:0},
  van:{owned:false,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},
  worker:{hired:false,assignment:null,lastTick:now}
});
const baseSave=(overrides:Record<string,unknown>={})=>({
  v:4,xp:8000,storage:{metal:120,copper:20,plastic:20},components:{bearing:3,motor:2,hydraulic:1,electronics:2},processed:{briquette:0,cleanCopper:12,granulate:0},cash:120000,
  installed:['workbench','press','wire'],machineLevels:{workbench:1,press:1,wire:1},talents:[],equipmentLevels:{tool:3,cart:3},jobs:[],contract:{index:0,completed:0},totalDestroyed:900,lastSeen:Date.now(),midgame:emptyMid(),...overrides
});
async function withSave(context:BrowserContext,save:any){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_midgame_v9_smoke_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_midgame_v9_smoke_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  const c1=await browser.newContext();
  await withSave(c1,{...baseSave(),v:3,midgame:undefined,totalDestroyed:750});
  const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=mid-v9-migrate`);await p1.waitForSelector('#garage');
  const s1=await state(p1);assert.equal(s1.saveVersion,9);assert.ok(s1.midgame.mastery.z1>=99.9);assert.equal(s1.packB.hangarOwned,false);assert.equal(s1.packC.salvageYardOwned,false);assert.equal(s1.packD.recoveryRig.owned,false);
  await p1.click('#garage');await p1.waitForSelector('#garageScreen:not([hidden])');await p1.click('#zonesGarage');await p1.waitForSelector('#zoneScreen:not([hidden])');
  assert.equal(await p1.locator('[data-zone="z1"] .masteryLine').count(),1);assert.equal(await p1.locator('[data-zone="z2"] button').isDisabled(),false);assert.equal(await p1.locator('[data-zone="z3"] button').isDisabled(),true);
  await c1.close();

  const c2=await browser.newContext();const mid2=emptyMid();mid2.mastery.z2=100;mid2.currentZone='z2';
  await withSave(c2,baseSave({midgame:mid2}));const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=mid-v9-van`);await p2.click('#garage');await p2.waitForSelector('#garageScreen:not([hidden])');
  await p2.click('#zonesGarage');await p2.waitForSelector('#zoneScreen:not([hidden])');const z3=p2.locator('[data-zone="z3"] button');assert.equal(await z3.isDisabled(),false);await z3.click();
  await p2.waitForSelector('#zoneScreen',{state:'hidden'});assert.equal((await state(p2)).midgame.currentZone,'z3');
  const buyVan=p2.locator('#buyVan');assert.equal(await buyVan.isDisabled(),false);await buyVan.click();let s2=await state(p2);assert.equal(s2.midgame.van.owned,true);assert.ok(s2.cash<120000);
  const hire=p2.locator('#hireWorker');assert.equal(await hire.isDisabled(),false);await hire.click();s2=await state(p2);assert.equal(s2.midgame.worker.hired,true);const assign=p2.locator('[data-worker-zone="z1"]');assert.equal(await assign.isDisabled(),false);await assign.click();s2=await state(p2);assert.equal(s2.midgame.worker.assignment,'z1');
  await p2.reload();await p2.waitForSelector('#garage');s2=await state(p2);assert.equal(s2.saveVersion,9);assert.equal(s2.midgame.van.owned,true);assert.equal(s2.midgame.worker.assignment,'z1');await c2.close();

  const now=Date.now(),c3=await browser.newContext();const mid3=emptyMid(now-2*3600000);mid3.van.owned=true;mid3.worker={hired:true,assignment:'z1',lastTick:now-2*3600000};mid3.mastery.z1=100;mid3.discoveredComponents=['bearing'];
  await withSave(c3,baseSave({storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midgame:mid3,lastSeen:now-2*3600000}));
  const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=mid-v9-worker`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState().storage.metal>0);const s3=await state(p3);assert.ok(s3.storage.metal>100);assert.equal(s3.midgame.mastery.z1,100);assert.equal(s3.midgame.mastery.z2,0);await c3.close();

  console.log('browser midgame Save V9 regression: PASS');
}finally{await browser.close();await stopServer()}