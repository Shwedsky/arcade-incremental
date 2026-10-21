import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=4176;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',(b)=>serverOutput+=String(b));server.stderr.on('data',(b)=>serverOutput+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(resolve=>setTimeout(resolve,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}

const midgame=(now=Date.now())=>({
  currentZone:'z4',mastery:{z1:100,z2:100,z3:100,z4:100,z5:0,z6:0},discoveredComponents:['bearing','motor','electronics','hydraulic'],discoveredMidComponents:['pump','compressor'],midComponents:{pump:2,compressor:2},pity:{pump:0,compressor:0},
  van:{owned:true,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},
  worker:{hired:true,assignment:'z1',lastTick:now}
});
const packB=(now=Date.now())=>({
  materials:{aluminiumScrap:240,steelBlank:40,aluminiumBillet:20},industrial:{gearbox:4,generator:2},discoveredIndustrial:['gearbox','generator'],pity:{gearbox:0,generator:0},
  modules:{drive:2,control:3,structural:2},hangarOwned:false,
  truck:{owned:false,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0},
  secondWorker:{hired:false,assignment:null,lastTick:now}
});
const baseV4=(overrides:Record<string,unknown>={})=>({
  v:4,xp:120000,storage:{metal:2000,copper:50,plastic:50},components:{bearing:10,motor:10,hydraulic:4,electronics:10},processed:{briquette:800,cleanCopper:200,granulate:20},cash:1_000_000,
  installed:['workbench','press','wire','plastic'],machineLevels:{workbench:1,press:2,wire:1,plastic:1},talents:['salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7'],equipmentLevels:{tool:4,cart:4},jobs:[],contract:{index:0,completed:0},totalDestroyed:2500,lastSeen:Date.now(),midgame:midgame(),...overrides
});
const baseV5=(overrides:Record<string,unknown>={})=>({...baseV4(),v:5,packB:packB(),...overrides});
async function withSave(context:BrowserContext,save:any){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_packb_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_packb_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // 1. Existing V4 saves migrate to Save V10 while preserving empty late-pack defaults.
  const c1=await browser.newContext();await withSave(c1,baseV4({midgame:{...midgame(),currentZone:'z3',mastery:{z1:100,z2:100,z3:100,z4:0,z5:0,z6:0}}}));
  const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=packb-migrate`);await p1.waitForSelector('#garage');
  const s1=await state(p1);assert.equal(s1.saveVersion,10);assert.equal(s1.packB.hangarOwned,false);assert.equal(s1.packB.truck.owned,false);assert.equal(s1.packD.recoveryRig.owned,false);assert.equal(s1.midgame.mastery.z3,100);assert.equal(s1.midgame.mastery.z4,0);await c1.close();

  // 2. Full production path: Z4 -> Hangar milestone reveal -> Truck -> second generic roster worker.
  const c2=await browser.newContext();await withSave(c2,baseV5());const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=packb-main`);await p2.waitForSelector('#garage');
  await p2.click('#garage');await p2.waitForSelector('#garageScreen:not([hidden])');
  await p2.click('#zonesGarage');await p2.waitForSelector('#zoneScreen:not([hidden])');assert.equal(await p2.locator('[data-zone="z4"]').count(),1);assert.equal(await p2.locator('[data-zone="z4"] button').isDisabled(),false);await p2.click('#zoneClose');
  await openBaseSurface(p2,'logistics');const hangar=p2.locator('#acquireHangar');assert.equal(await hangar.isDisabled(),false);await hangar.click();let s2=await state(p2);assert.equal(s2.packB.hangarOwned,true);
  await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.()==='hangar');
  await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.getActiveSurface?.()==='overview');
  await p2.waitForSelector('#hangarMilestoneV1.show');await p2.waitForSelector('#baseStageSceneV2.stage-hangar');await p2.waitForSelector('[data-hangar-ops]');
  assert.match(await p2.locator('#hangarMilestoneV1').innerText(),/Ангар открыт/,'Hangar purchase must announce the business milestone');
  assert.match(await p2.locator('#baseStageSceneV2').innerText(),/Операционный ангар/,'buying Hangar must immediately reveal the new business-scale scene');
  assert.equal(await p2.locator('.hangarZone').count(),4,'purchased Hangar must immediately expose its four operating zones');
  await openBaseSurface(p2,'logistics');const truck=p2.locator('#acquireTruck');assert.equal(await truck.isDisabled(),false);await truck.click();s2=await state(p2);assert.equal(s2.packB.truck.owned,true);assert.ok(s2.workforceV3.fleet.some((v:any)=>v.type==='truck'),'Truck purchase must create explicit generic fleet asset');
  const beforeHire=s2.workforceV3.workers.length;const hired=await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.hireGenericWorker());assert.ok(hired,'Hangar stage must allow another generic worker');s2=await state(p2);assert.equal(s2.workforceV3.workers.length,beforeHire+1);assert.equal(s2.packB.secondWorker.hired,true,'generic second hire must maintain the legacy compatibility mirror');
  const worker2Id=hired.id;
  const route=await p2.evaluate((id)=>(globalThis as any).__SALVAGE_TEST__.assignGenericRoute(id,'z1',null),worker2Id);assert.equal(route.zone,'z1');s2=await state(p2);assert.equal(s2.workforceV3.routes.find((r:any)=>r.workerIds.includes(worker2Id))?.zone,'z1');

  // 3. Talent V4 Wide Swing is a real higher-era unlock after the seven Salvage nodes.
  await p2.click('#talentsGarage');await p2.waitForSelector('#talentScreen:not([hidden])');const wide=p2.locator('[data-talent="salvage_8"]');assert.equal(await wide.count(),1);assert.equal(await wide.isDisabled(),false);await wide.click();s2=await state(p2);assert.equal(s2.talents.includes('salvage_8'),true);await p2.click('#talentsClose');
  await p2.click('#next');await p2.waitForSelector('#garageScreen',{state:'hidden'});await p2.waitForFunction(()=>!document.querySelector<HTMLElement>('#vanHud')?.hidden);assert.equal(await p2.locator('#vanHud').evaluate(el=>el.classList.contains('truckMode')),true);assert.match(await p2.locator('#vanText').innerText(),/1000/);

  // 4. Pack B and generic route state survive normal Save V10 reload.
  await p2.reload();await p2.waitForSelector('#garage');s2=await state(p2);assert.equal(s2.saveVersion,10);assert.equal(s2.packB.hangarOwned,true);assert.equal(s2.packB.truck.owned,true);assert.equal(s2.workforceV3.routes.find((r:any)=>r.workerIds.includes(worker2Id))?.zone,'z1');assert.equal(s2.talents.includes('salvage_8'),true);await c2.close();

  console.log('browser Content Pack B proof / generic roster / automatic Hangar milestone transformation: PASS');
}finally{await browser.close();await stopServer()}
