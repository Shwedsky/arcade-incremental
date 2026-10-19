import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';

const PORT=4178;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',(b)=>serverOutput+=String(b));server.stderr.on('data',(b)=>serverOutput+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(resolve=>setTimeout(resolve,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}

const midgame=(mastery={z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:0},currentZone='z6',now=Date.now())=>({
  currentZone,mastery,discoveredComponents:['bearing','motor','electronics','hydraulic'],discoveredMidComponents:['pump','compressor'],midComponents:{pump:8,compressor:5},pity:{pump:0,compressor:0},
  van:{owned:true,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},worker:{hired:true,assignment:'z1',lastTick:now}
});
const packB=(now=Date.now())=>({
  materials:{aluminiumScrap:600,steelBlank:300,aluminiumBillet:120},industrial:{gearbox:10,generator:10},discoveredIndustrial:['gearbox','generator'],pity:{gearbox:0,generator:0},modules:{drive:12,control:16,structural:10},hangarOwned:true,
  truck:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0},secondWorker:{hired:true,assignment:'z2',lastTick:now}
});
const packC=(overrides:Record<string,unknown>={})=>({
  materials:{alloyScrap:500,alloyBillet:500},industrial:{industrialController:12,heavyHydraulicCylinder:12},discoveredIndustrial:['industrialController','heavyHydraulicCylinder'],pity:{industrialController:0,heavyHydraulicCylinder:0},modules:{hydraulicPower:12,heavyFrame:12},salvageYardOwned:true,production:null,
  crew3:{hired:true,role:'scavenger',assignment:'z5',lastTick:Date.now()},...overrides
});
const packD=(overrides:Record<string,unknown>={})=>({
  recoveryAssemblies:1,recoveryPity:0,recoveryRig:{owned:false,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0,alloyScrap:0},industrialWorkshopOwned:false,productionCells:1,
  crew4:{hired:false,role:'scavenger',assignment:null,operatorCell:null,lastTick:Date.now()},...overrides
});
const baseV6=(overrides:Record<string,unknown>={})=>({
  v:6,xp:40000,storage:{metal:6000,copper:300,plastic:200},components:{bearing:20,motor:20,hydraulic:20,electronics:20},processed:{briquette:1500,cleanCopper:700,granulate:80},cash:3_000_000,
  installed:['workbench','press','wire','plastic'],machineLevels:{workbench:1,press:2,wire:2,plastic:1},talents:['automation_8'],equipmentLevels:{tool:4,cart:4},jobs:[],contract:{index:0,completed:0},totalDestroyed:9000,lastSeen:Date.now(),midgame:midgame(),packB:packB(),packC:packC(),...overrides
});
const baseV7=(overrides:Record<string,unknown>={})=>({...baseV6(),v:7,packD:packD(),...overrides});
async function withSave(context:BrowserContext,save:any){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_packd_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_packd_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // 1. Accepted Pack C Save V6 migrates forward without losing Truck/Yard and starts Pack D empty.
  const c1=await browser.newContext();await withSave(c1,baseV6());const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=packd-migrate`);await p1.waitForSelector('#garage');
  const s1=await state(p1);assert.equal(s1.saveVersion,9);assert.equal(s1.packB.truck.owned,true);assert.equal(s1.packC.salvageYardOwned,true);assert.equal(s1.packD.recoveryRig.owned,false);assert.equal(s1.packD.industrialWorkshopOwned,false);assert.equal(s1.midgame.mastery.z7,0);await c1.close();

  // 2. Z7 is a real map frontier after mastered Z6 + Yard + Truck. Rig still requires the active signature assembly.
  const c2=await browser.newContext();await withSave(c2,baseV7({packD:packD({recoveryAssemblies:0})}));const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=packd-z7`);await p2.click('#garage');await p2.waitForSelector('#garageScreen:not([hidden])');
  await p2.click('#zonesGarage');await p2.waitForSelector('#zoneScreen:not([hidden])');const z7=p2.locator('[data-zone="z7"] button');assert.equal(await z7.count(),1);assert.equal(await z7.isDisabled(),false);await z7.click();let s2=await state(p2);assert.equal(s2.midgame.currentZone,'z7');const rigBlocked=p2.locator('#acquireRecoveryRig');assert.equal(await rigBlocked.isDisabled(),true);await c2.close();

  // 3. Full Pack D bridge: signature assembly -> Rig -> mastered Z7 -> Workshop -> worker #4 -> Operator -> persistence.
  const mastered={z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100};
  const c3=await browser.newContext();await withSave(c3,baseV7({midgame:midgame(mastered,'z7'),packD:packD()}));const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=packd-main`);await p3.click('#garage');await p3.waitForSelector('#garageScreen:not([hidden])');
  const rig=p3.locator('#acquireRecoveryRig');assert.equal(await rig.isDisabled(),false);await rig.click();let s3=await state(p3);assert.equal(s3.packD.recoveryRig.owned,true);assert.equal(s3.packD.recoveryAssemblies,0);assert.match(await p3.locator('#vanText').innerText(),/1800/,'Recovery Rig must become the active 1800 kg field depot');
  const workshop=p3.locator('#acquireIndustrialWorkshop');assert.equal(await workshop.isDisabled(),false);await workshop.click();s3=await state(p3);assert.equal(s3.packD.industrialWorkshopOwned,true);assert.equal(s3.packD.productionCells,2);assert.match((await p3.locator('#queuePanel').textContent())??'',/0 \/ 2/,'Industrial Workshop must add one real generic workshop slot');
  const hire4=p3.locator('#hireWorker4');assert.equal(await hire4.isDisabled(),false);await hire4.click();const z7worker=p3.locator('[data-worker4-zone="z7"]');assert.equal(await z7worker.isDisabled(),false);await z7worker.click();s3=await state(p3);assert.equal(s3.packD.crew4.role,'scavenger');assert.equal(s3.packD.crew4.assignment,'z7');
  const op4=p3.locator('#assignOperator4');assert.equal(await op4.isDisabled(),false);await op4.click();s3=await state(p3);assert.equal(s3.packD.crew4.role,'operator');assert.equal(s3.packD.crew4.assignment,null);
  const alloy=p3.locator('#packCAlloy');assert.equal(await alloy.isDisabled(),false);await alloy.click();s3=await state(p3);assert.equal(s3.packC.production.kind,'alloyBillet');assert.equal(s3.packC.production.endsAt-s3.packC.production.startedAt,204000,'Worker #4 Operator must apply its real ×0.85 industrial-cell effect');
  await p3.reload();await p3.waitForSelector('#garage');s3=await state(p3);assert.equal(s3.saveVersion,9);assert.equal(s3.packD.recoveryRig.owned,true);assert.equal(s3.packD.industrialWorkshopOwned,true);assert.equal(s3.packD.productionCells,2);assert.equal(s3.packD.crew4.hired,true);assert.equal(s3.packD.crew4.role,'operator');assert.equal(s3.packC.production.kind,'alloyBillet');await c3.close();

  console.log('browser Content Pack D proof: PASS');
}finally{await browser.close();await stopServer()}