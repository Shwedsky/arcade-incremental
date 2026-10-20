import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41984,ORIGIN=`http://127.0.0.1:${PORT}`;
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${output}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=manual-dev-v2`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  assert.equal(await page.locator('[data-zone-dev="z8"]').count(),1,'DEV panel must expose Z8 preset');
  assert.equal(await page.locator('[data-dev="plantReady"]').count(),1,'DEV panel must expose Plant-ready preset');
  assert.equal(await page.locator('[data-dev="queueFinish"]').count(),1,'DEV panel must replace +24h with deterministic finish-queue control');
  assert.match(await page.locator('[data-dev="queueFinish"]').innerText(),/Завершить всю очередь/);

  const before=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="resources"]')]);
  await page.waitForFunction((cash:number)=>(globalThis as any).__SALVAGE_TEST__?.getState()?.cash>=cash+100000,before.cash);
  let s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(s.storage.metal>=before.storage.metal+5000,'resource grant must survive reload');
  assert.ok(s.storage.copper>=before.storage.copper+1200,'copper grant must survive reload');
  assert.ok(s.storage.plastic>=before.storage.plastic+1800,'plastic grant must survive reload');
  assert.ok(s.packB.materials.aluminiumScrap>=1200,'late Pack B materials must be granted');
  assert.ok(s.packC.materials.alloyBillet>=800,'late Pack C materials must be granted');
  assert.ok(s.packE.portPowerAssemblies>=3,'Pack E signature material must be granted');

  // Reproduce the owner's broken review session: the legacy +24h action moves
  // the in-memory scheduler cursor into tomorrow. A new upgrade then receives
  // a future current.endsAt even though getState() defensively masks the raw
  // future lastAdvancedAt value.
  await closeOffline(page);await page.click('#hfDevToggle');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="level5"]')]);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.level>=5);await closeOffline(page);
  await page.evaluate(()=>{
    (globalThis as any).__SALVAGE_TEST__.advanceWorkshopTo(Date.now()+24*3600_000);
    (globalThis as any).__SALVAGE_PLATFORM__.forceSave();
    (globalThis as any).__SALVAGE_TEST__.forceGarage();
  });
  await page.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(page,'production');
  const toolBefore=(await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState().equipmentLevels.tool)) as number;
  await page.click('[data-equipment-upgrade="tool"]');
  await page.waitForFunction(()=>{
    const state=(globalThis as any).__SALVAGE_TEST__.getState();
    return state.scheduler.actions.some((action:any)=>action.status==='active'&&action.current?.endsAt>Date.now()+23*3600_000);
  });
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const poisoned=s.scheduler.actions.find((action:any)=>action.status==='active');
  assert.ok(poisoned?.current?.endsAt>Date.now()+23*3600_000,'fixture must prove a newly queued upgrade is future-dated after legacy +24h');
  assert.equal(s.equipmentLevels.tool,toolBefore,'future-dated upgrade must still be unfinished before DEV repair');

  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="queueFinish"]')]);
  await page.waitForFunction((level:number)=>(globalThis as any).__SALVAGE_TEST__?.getState()?.equipmentLevels?.tool===level+1,toolBefore);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(s.scheduler.actions.filter((action:any)=>action.status!=='completed'&&action.status!=='cancelled').length,0,'finish queue must consume every accepted workshop action');
  assert.ok(s.scheduler.lastAdvancedAt<=Date.now()+5000,'finish queue reload must restore scheduler clock to real time');

  await closeOffline(page);await page.click('#hfDevToggle');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-zone-dev="z8"]')]);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.currentZone==='z8');
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(s.midgame.mastery.z7,100,'Z8 preset must master previous frontier');
  assert.equal(s.midgame.mastery.z8,0,'Z8 preset must leave Z8 for human play');
  assert.equal(s.packD.industrialWorkshopOwned,true);assert.equal(s.packD.recoveryRig.owned,true);

  await closeOffline(page);await page.click('#hfDevToggle');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="plantReady"]')]);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.mastery?.z8===100);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(s.packD.crew4.hired,true,'Plant-ready must include worker #4');
  assert.equal(s.packE.portPowerDiscovered,true);assert.ok(s.packE.portPowerAssemblies>=1);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(page,'logistics');
  assert.equal(await page.locator('#acquireProcessingPlant').isDisabled(),false,'Plant-ready must actually make Plant purchasable');

  console.log('Manual Review DEV V2 durable grants + queue instant-finish/clock repair + Z8 + Plant-ready: PASS');
  await context.close();
}finally{await browser.close();await stopServer()}
