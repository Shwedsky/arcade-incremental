import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium,type BrowserContext,type Page} from 'playwright';

const PORT=41975,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState()) as Promise<any>}
async function canonicalSave(page:Page){
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical save must exist');return JSON.parse(raw!);
}
async function contextWithSave(save:any):Promise<{context:BrowserContext;page:Page;errors:string[]}>{
  const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(save)}]}]}});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${ORIGIN}/?seed=worker-v2-browser`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  const offline=page.locator('#offlineScreen');
  if(await offline.isVisible())await page.click('#offlineClose');
  return{context,page,errors};
}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  // Produce a canonical save, then explicitly downgrade the fixture to V8 to prove migration.
  const seedContext=await browser.newContext({viewport:{width:1100,height:760}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=worker-v2-fixture`);
  await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);
  const fixture=JSON.parse(raw!);
  fixture.v=8;fixture.xp=3200;fixture.cash=40_000;fixture.lastSeen=Date.now();
  fixture.midgame.mastery={...fixture.midgame.mastery,z1:100};
  fixture.midgame.worker={hired:false,assignment:null,lastTick:Date.now()};
  fixture.midgame.van={...fixture.midgame.van,owned:false};
  delete fixture.midgame.economyV2;
  await seedContext.close();

  let session=await contextWithSave(fixture),context=session.context,page=session.page,errors=session.errors;
  let s=await state(page);
  assert.equal(s.midgame.van.owned,false,'V8 fixture must stay without Van');
  assert.ok(s.midgame.economyV2,'V8 -> V10 must create Worker Economy V2 state');
  assert.equal(s.midgame.economyV2.medals.z1,false,'migration must not grant a free full-clear medal');

  // First worker: mastered Z1 + 35k is enough; Van is explicitly not a gate anymore.
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');
  await page.waitForSelector('#hireWorker');
  assert.equal(await page.locator('#hireWorker').isDisabled(),false,'first worker must be hireable without Van');
  assert.doesNotMatch(await page.locator('#workerPanel').innerText(),/Сначала нужен фургон/);
  await page.click('#hireWorker');
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().midgame.worker.hired===true);
  await page.click('[data-worker-zone="z1"]');
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().midgame.worker.assignment==='z1');

  // Take the canonical runtime save, mutate the fixture outside the live page, and start a fresh context.
  // Direct localStorage mutation followed by reload is intentionally avoided because the normal unload
  // save would overwrite the synthetic fixture with the page's old in-memory state.
  const benchmarkSave=await canonicalSave(page);
  benchmarkSave.midgame.economyV2.shifts.w1.remainingOfflineMs=15*60*1000;
  benchmarkSave.midgame.economyV2.shifts.w1.lastAccountedAt=Date.now();
  benchmarkSave.midgame.economyV2.benchmarks.z1={durationMs:90000,destroyed:50,resources:{metal:48,copper:6,plastic:8},components:{bearing:1,motor:1,hydraulic:0,electronics:1},valuePerMin:18000,recordedAt:Date.now()};
  benchmarkSave.lastSeen=Date.now();
  await context.close();
  session=await contextWithSave(benchmarkSave);context=session.context;page=session.page;errors=session.errors;

  s=await state(page);
  assert.equal(s.midgame.worker.assignment,'z1','worker assignment must survive canonical Save V10 load');
  assert.equal(s.midgame.economyV2.benchmarks.z1?.destroyed,50,'benchmark must survive canonical Save V10 load');
  assert.ok(Number.isFinite(s.midgame.economyV2.shifts.w1.remainingOfflineMs));
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');
  await page.waitForFunction(()=>document.querySelector('#workerPanel')?.textContent?.includes('Benchmark: 50 целей'));
  assert.match(await page.locator('#workerPanel').innerText(),/Benchmark: 50 целей за 1\.5 мин/);
  await page.click('#dispatchWorkers');
  s=await state(page);
  assert.ok(Math.abs(s.midgame.economyV2.shifts.w1.remainingOfflineMs-2*60*60*1000)<1500,'dispatch must refresh a two-hour offline shift');

  // Van is an optional, exclusive route booster rather than a hiring prerequisite.
  const vanSave=await canonicalSave(page);vanSave.midgame.van.owned=true;vanSave.midgame.economyV2.vanWorker=null;vanSave.lastSeen=Date.now();
  await context.close();
  session=await contextWithSave(vanSave);context=session.context;page=session.page;errors=session.errors;
  await page.waitForFunction(()=>!(document.querySelector('#vanHud') as HTMLElement).hidden);
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');
  await page.click('#toggleWorkerVan');
  s=await state(page);assert.equal(s.midgame.economyV2.vanWorker,'w1');
  await page.click('#next');await page.waitForSelector('#garageScreen',{state:'hidden'});
  await page.waitForFunction(()=>(document.querySelector('#vanHud') as HTMLElement).hidden===true);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.toggleWorkerVan());
  s=await state(page);assert.equal(s.midgame.economyV2.vanWorker,null);
  await page.waitForFunction(()=>(document.querySelector('#vanHud') as HTMLElement).hidden===false);

  // Medal is durable progression and visibly marks the mastered zone after reload.
  const awarded=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.awardCurrentZoneMedal());
  assert.equal(awarded,true);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  await page.reload();await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  s=await state(page);assert.equal(s.midgame.economyV2.medals.z1,true,'full-clear medal must survive Save V10 reload');
  const offlineAfterReload=page.locator('#offlineScreen');if(await offlineAfterReload.isVisible())await page.click('#offlineClose');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.openZones());
  await page.waitForSelector('#zoneScreen:not([hidden])');
  assert.match(await page.locator('[data-zone="z1"]').innerText(),/полный сбор/i);

  // Save emitted after migration must be V10, not merely a V10 test facade.
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const persistedVersion=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).v,SAVE_KEY);
  assert.equal(persistedVersion,10);
  assert.deepEqual(errors,[],`Worker Economy V2 browser proof must not throw: ${errors.join(' | ')}`);
  await context.close();
  console.log('Worker & Progression Economy V2 browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
