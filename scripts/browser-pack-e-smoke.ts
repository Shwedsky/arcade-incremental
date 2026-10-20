import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium,type BrowserContext,type Page} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41982,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',b=>serverOutput+=String(b));server.stderr.on('data',b=>serverOutput+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function withSave(context:BrowserContext,save:any){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_packe_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_packe_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}

const now=()=>Date.now();
const mastery=(z8=0)=>({z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100,z8});
const midgame=(z8=0,currentZone='z7')=>({
  currentZone,mastery:mastery(z8),discoveredComponents:['bearing','motor','hydraulic','electronics'],discoveredMidComponents:['pump','compressor'],midComponents:{pump:20,compressor:20},pity:{pump:0,compressor:0},
  van:{owned:true,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},worker:{hired:true,assignment:'z1',lastTick:now()}
});
const packB=()=>({
  materials:{aluminiumScrap:1000,steelBlank:400,aluminiumBillet:240},industrial:{gearbox:20,generator:20},discoveredIndustrial:['gearbox','generator'],pity:{gearbox:0,generator:0},modules:{drive:20,control:20,structural:20},hangarOwned:true,
  truck:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0},secondWorker:{hired:true,assignment:'z3',lastTick:now()}
});
const packC=()=>({
  materials:{alloyScrap:600,alloyBillet:700},industrial:{industrialController:20,heavyHydraulicCylinder:20},discoveredIndustrial:['industrialController','heavyHydraulicCylinder'],pity:{industrialController:0,heavyHydraulicCylinder:0},modules:{hydraulicPower:20,heavyFrame:20},salvageYardOwned:true,production:null,
  crew3:{hired:true,role:'scavenger',assignment:'z6',lastTick:now()}
});
const packD=()=>({
  recoveryAssemblies:0,recoveryPity:0,recoveryRig:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0,alloyScrap:0},industrialWorkshopOwned:true,productionCells:2,
  crew4:{hired:true,role:'scavenger',assignment:'z7',operatorCell:null,lastTick:now()}
});
const packE=(overrides:Record<string,unknown>={})=>({portPowerAssemblies:0,portPowerPity:0,portPowerDiscovered:false,processingPlantOwned:false,plantLines:0,production:[],...overrides});
const richSave=(overrides:Record<string,unknown>={})=>({
  v:10,xp:120000,storage:{metal:10000,copper:1000,plastic:1000},components:{bearing:50,motor:50,hydraulic:50,electronics:50},processed:{briquette:3000,cleanCopper:1500,granulate:1200},cash:6_000_000,
  installed:['workbench','press','wire','plastic'],machineLevels:{workbench:1,press:2,wire:2,plastic:1},talents:['automation_8','trade_4'],equipmentLevels:{tool:4,cart:4},contract:{index:0,completed:0},totalDestroyed:15000,lastSeen:now(),
  midgame:midgame(),packB:packB(),packC:packC(),packD:packD(),packE:packE(),...overrides
});

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // 1. A real V9-era save migrates to V10 with Pack E empty and no reset of late infrastructure.
  const legacy=richSave({v:9,midgame:{...midgame(),mastery:{z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100}}});delete (legacy as any).packE;
  const c1=await browser.newContext({viewport:{width:1280,height:800}});await withSave(c1,legacy);const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=packe-v9-migrate`);await p1.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  let s=await state(p1);assert.equal(s.saveVersion,10);assert.equal(s.packD.industrialWorkshopOwned,true);assert.equal(s.midgame.mastery.z7,100);assert.equal(s.midgame.mastery.z8,0);assert.equal(s.packE.processingPlantOwned,false);assert.equal(s.packE.portPowerDiscovered,false);await c1.close();

  // 2. Z8 is a real selectable frontier, but workers cannot enter it before personal mastery.
  const c2=await browser.newContext({viewport:{width:1360,height:860}});await withSave(c2,richSave());const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=packe-z8`);await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p2.locator('#offlineScreen').isVisible())await p2.click('#offlineClose');await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await p2.waitForSelector('#garageScreen:not([hidden])');
  await p2.click('#zonesGarage');await p2.waitForSelector('#zoneScreen:not([hidden])');const z8=p2.locator('[data-zone="z8"]');assert.match((await z8.innerText()),/Портовый терминал/);const z8Select=z8.locator('button');assert.equal(await z8Select.isDisabled(),false);await z8Select.click();s=await state(p2);assert.equal(s.midgame.currentZone,'z8');
  await openBaseSurface(p2,'crew');const workerZ8=p2.locator('[data-worker4-zone="z8"]');assert.equal(await workerZ8.isDisabled(),true,'worker #4 must stay out until Z8 is personally mastered');
  await c2.close();

  // 3. A personally mastered/signature-complete Z8 unlocks Plant, which consumes the mixed recipe and keeps discovery history.
  const mature=richSave({midgame:midgame(100,'z8'),packE:packE({portPowerAssemblies:1,portPowerDiscovered:true})});
  const c3=await browser.newContext({viewport:{width:1440,height:900}});await withSave(c3,mature);const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=packe-plant`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p3.locator('#offlineScreen').isVisible())await p3.click('#offlineClose');await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await p3.waitForSelector('#garageScreen:not([hidden])');
  await openBaseSurface(p3,'crew');const workerZ8Ready=p3.locator('[data-worker4-zone="z8"]');assert.equal(await workerZ8Ready.isDisabled(),false,'mastered Z8 may be automated after the player finishes it');
  await openBaseSurface(p3,'logistics');const plantButton=p3.locator('#acquireProcessingPlant');assert.equal(await plantButton.isDisabled(),false);await plantButton.click();s=await state(p3);assert.equal(s.packE.processingPlantOwned,true);assert.equal(s.packE.plantLines,2);assert.equal(s.packE.portPowerAssemblies,0);assert.equal(s.packE.portPowerDiscovered,true,'consuming the signature must never erase discovery history');
  await openBaseSurface(p3,'logistics');assert.match((await p3.locator('#transportPanel').innerText()),/150.?000 кг/);await openBaseSurface(p3,'contracts');assert.match((await p3.locator('#contractPanel').innerText()),/26 доступно/,'Plant ownership must expose the three late contract hooks');

  // 4. Plant owns exactly two concurrent lines; third start blocks and 300s produces 80 Alloy Billet total.
  const beforeStart=await state(p3),billetAfterPlant=beforeStart.packC.materials.alloyBillet,scrapBefore=beforeStart.packC.materials.alloyScrap;
  await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.doStartPlantAlloy());
  await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.doStartPlantAlloy());
  s=await state(p3);assert.equal(s.packE.production.length,2);assert.equal(s.packC.materials.alloyScrap,scrapBefore-100);
  await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.doStartPlantAlloy());s=await state(p3);assert.equal(s.packE.production.length,2,'third line must remain blocked');
  const finish=Math.max(...s.packE.production.map((job:any)=>job.endsAt))+1;const completed=await p3.evaluate((at:number)=>(globalThis as any).__SALVAGE_TEST__.advancePlantTo(at),finish);assert.equal(completed,80);s=await state(p3);assert.equal(s.packE.production.length,0);assert.equal(s.packC.materials.alloyBillet,billetAfterPlant+80);

  // 5. Save V10 persists the Plant and both the consumed-signature history and line outputs.
  await p3.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await p3.reload();await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);s=await state(p3);assert.equal(s.packE.processingPlantOwned,true);assert.equal(s.packE.portPowerDiscovered,true);assert.equal(s.packE.portPowerAssemblies,0);assert.equal(s.packC.materials.alloyBillet,billetAfterPlant+80);await c3.close();

  console.log('Content Pack E Z8 + Processing Plant Chromium acceptance: PASS');
}finally{await browser.close();await stopServer()}
