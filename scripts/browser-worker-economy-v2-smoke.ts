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
async function canonicalSave(page:Page){await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const raw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical save must exist');return JSON.parse(raw!)}
async function contextWithSave(save:any):Promise<{context:BrowserContext;page:Page;errors:string[]}>{
  const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(save)}]}]}});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${ORIGIN}/?seed=worker-v3-compat-browser`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose');return{context,page,errors};
}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  // Produce canonical state, then downgrade to V8 to prove legacy worker-economy migration.
  const seedContext=await browser.newContext({viewport:{width:1100,height:760}}),seedPage=await seedContext.newPage();await seedPage.goto(`${ORIGIN}/?seed=worker-v3-compat-fixture`);await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);const fixture=JSON.parse(raw!);
  fixture.v=8;fixture.xp=3200;fixture.cash=200_000;fixture.lastSeen=Date.now();fixture.midgame.mastery={...fixture.midgame.mastery,z1:100};fixture.midgame.worker={hired:false,assignment:null,lastTick:Date.now()};fixture.midgame.van={...fixture.midgame.van,owned:false};delete fixture.midgame.economyV2;delete fixture.workforceV3;await seedContext.close();

  let session=await contextWithSave(fixture),context=session.context,page=session.page,errors=session.errors;let s=await state(page);
  assert.equal(s.midgame.van.owned,false);assert.ok(s.midgame.economyV2,'V8 -> V10 must create legacy economy compatibility state');assert.equal(s.midgame.economyV2.medals.z1,false);assert.equal(s.workforceV3.workers.length,0);

  // Generic first hire must preserve old hired flag while making Workforce V3 the real roster.
  const worker=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.hireGenericWorker());assert.ok(worker);s=await state(page);assert.equal(s.workforceV3.workers.length,1);assert.equal(s.midgame.worker.hired,true,'compatibility mirror must remain true for old gates');const workerId=s.workforceV3.workers[0].id;
  const route=await page.evaluate((id)=>(globalThis as any).__SALVAGE_TEST__.assignGenericRoute(id,'z1',null),workerId);assert.equal(route.zone,'z1');s=await state(page);assert.equal(s.workforceV3.routes.length,1);

  // Historical active benchmark data survives canonical Save V10 reload and still feeds route projection.
  const benchmarkSave=await canonicalSave(page);benchmarkSave.midgame.economyV2.benchmarks.z1={durationMs:90000,destroyed:50,resources:{metal:48,copper:6,plastic:8},components:{bearing:1,motor:1,hydraulic:0,electronics:1},valuePerMin:18000,recordedAt:Date.now()};benchmarkSave.lastSeen=Date.now();await context.close();session=await contextWithSave(benchmarkSave);context=session.context;page=session.page;errors=session.errors;s=await state(page);assert.equal(s.midgame.economyV2.benchmarks.z1?.destroyed,50);assert.equal(s.workforceV3.routes[0]?.zone,'z1');const noVehicle=await page.evaluate((id)=>(globalThis as any).__SALVAGE_TEST__.projectGenericRoute(id),s.workforceV3.routes[0].id);assert.ok(noVehicle.kgPerHour>0);

  // Generic dispatch updates both compatibility shift accounting and the actual V3 route shift.
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.dispatchWorkers());s=await state(page);assert.ok(Math.abs(s.midgame.economyV2.shifts.w1.remainingOfflineMs-2*60*60*1000)<2000);assert.ok(s.workforceV3.routes[0].shiftEndsAt>Date.now()+119*60*1000);

  // Van is now an explicit fleet asset. Assigning it to the same worker/zone materially raises throughput.
  const van=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.acquireGenericVehicle('van'));assert.ok(van,'workforce-stage business must be able to buy a Van asset');s=await state(page);assert.equal(s.workforceV3.fleet.filter((v:any)=>v.type==='van').length,1);const withVehicleRoute=await page.evaluate(({workerId,vehicleId})=>(globalThis as any).__SALVAGE_TEST__.assignGenericRoute(workerId,'z1',vehicleId),{workerId,vehicleId:s.workforceV3.fleet[0].id});assert.ok(withVehicleRoute);const withVehicle=await page.evaluate((id)=>(globalThis as any).__SALVAGE_TEST__.projectGenericRoute(id),withVehicleRoute.id);assert.ok(withVehicle.kgPerHour>noVehicle.kgPerHour*1.05,`Van must visibly improve generic route output: ${withVehicle.kgPerHour} vs ${noVehicle.kgPerHour}`);

  // Medal remains durable legacy progression after the runtime architecture replacement.
  const awarded=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.awardCurrentZoneMedal());assert.equal(awarded,true);await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await page.reload();await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);s=await state(page);assert.equal(s.midgame.economyV2.medals.z1,true);assert.equal(s.workforceV3.routes[0]?.vehicleId!=null,true);const offlineAfterReload=page.locator('#offlineScreen');if(await offlineAfterReload.isVisible())await page.click('#offlineClose');await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.openZones());await page.waitForSelector('#zoneScreen:not([hidden])');assert.match(await page.locator('[data-zone="z1"]').innerText(),/полный сбор/i);

  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),SAVE_KEY);assert.equal(persisted.v,10);assert.ok(persisted.workforceV3?.workers?.length===1);assert.deepEqual(errors,[],`Worker V2 -> Workforce V3 compatibility proof must not throw: ${errors.join(' | ')}`);await context.close();
  console.log('Worker Economy V2 save -> Workforce/Fleet V3 runtime compatibility browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
