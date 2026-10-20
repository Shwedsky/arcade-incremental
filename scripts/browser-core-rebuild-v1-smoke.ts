import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41990,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`server did not start\n${output}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}
async function waitGame(page:any){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page)}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:980}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=core-rebuild-v1`);await waitGame(page);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');
  await page.waitForSelector('#baseStageSceneV2.stage-garage');
  const garageMarkup=await page.locator('#baseStageSceneV2').innerHTML();
  assert.match(garageMarkup,/Личный гараж/,'fresh base must visibly be a compact personal Garage');

  // Use the real DEV save mutation/reload path. V4 preset intentionally drops
  // the derived workforce snapshot so boot migration rebuilds it from Save V10.
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="unlockAll"]')]);
  await waitGame(page);
  await page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState();return s.level===50&&s.workforceV3?.workers?.length>=4&&s.workforceV3?.fleet?.length>=3});
  let s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(s.level,50,'DEV open-all must target extended progression');
  assert.equal(s.talents.length,40,'DEV open-all must unlock the real 40-node Talent V4 tree');
  assert.ok(s.workforceV3.workers.length>=4,'legacy workers must migrate into generic roster');
  assert.ok(s.workforceV3.fleet.some((v:any)=>v.type==='van')&&s.workforceV3.fleet.some((v:any)=>v.type==='truck')&&s.workforceV3.fleet.some((v:any)=>v.type==='recovery_rig'));

  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');
  await openBaseSurface(page,'crew');await page.waitForSelector('#workforceV3Root');
  assert.ok(await page.locator('.v3WorkerCard').count()>=4,'Crew page must render one generic roster, not four pack-specific panels');
  await openBaseSurface(page,'logistics');await page.waitForSelector('#fleetV3Root');
  assert.ok(await page.locator('.v3VehicleCard').count()>=3,'Fleet page must expose distinct owned assets');
  const buyVan=page.locator('[data-v3-buy-vehicle="van"]');assert.equal(await buyVan.count(),1,'owned Van must expose additional Van acquisition');
  await buyVan.click();
  await page.waitForFunction(()=>((globalThis as any).__SALVAGE_TEST__.getState().workforceV3.fleet??[]).filter((v:any)=>v.type==='van').length>=2);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const vans=s.workforceV3.fleet.filter((v:any)=>v.type==='van');assert.equal(vans.length,2);assert.ok(vans.some((v:any)=>/#2/.test(v.name)),'second Van must be an explicit fleet asset');

  // Same worker / same mastered zone: vehicle assignment must visibly change throughput.
  const workerId=s.workforceV3.workers[0].id,vanId=vans[0].id;
  await page.evaluate(({workerId,vanId})=>(globalThis as any).__SALVAGE_TEST__.assignGenericRoute(workerId,'z1',vanId),{workerId,vanId});
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());let route=s.workforceV3.routes.find((r:any)=>r.workerIds.includes(workerId));
  const withVan=await page.evaluate((routeId)=>(globalThis as any).__SALVAGE_TEST__.projectGenericRoute(routeId),route.id);
  await page.evaluate((workerId)=>(globalThis as any).__SALVAGE_TEST__.assignGenericRoute(workerId,'z1',null),workerId);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());route=s.workforceV3.routes.find((r:any)=>r.workerIds.includes(workerId));
  const withoutVan=await page.evaluate((routeId)=>(globalThis as any).__SALVAGE_TEST__.projectGenericRoute(routeId),route.id);
  assert.ok(withVan.kgPerHour>withoutVan.kgPerHour*1.2,`Van must materially improve throughput: ${withVan.kgPerHour} vs ${withoutVan.kgPerHour}`);
  await openBaseSurface(page,'crew');await page.waitForSelector(`[data-worker-card="${workerId}"] .v3Metrics`);
  assert.match(await page.locator(`[data-worker-card="${workerId}"]`).innerText(),/кг\/ч/,'assignment effect must be visible on the same worker card');

  // Generic Operator: first measure a Plant cycle without an Operator, finish it,
  // then assign a normal roster worker to the Plant and prove the next real job is faster.
  const operatorWorkerId=s.workforceV3.workers[1].id;
  const productionBefore=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionV3View());
  assert.equal(productionBefore.unlocked,true,'late Talent V4 preset must unlock Operator');
  assert.ok(productionBefore.cells.some((cell:any)=>cell.id==='heavy_cell'));
  assert.ok(productionBefore.cells.some((cell:any)=>cell.id==='plant_lines'));
  assert.equal(productionBefore.cells.find((cell:any)=>cell.id==='plant_lines').speedFactor,1,'unassigned Plant must have no hidden worker speed bonus');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.doStartPlantAlloy());
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const baselineJob=s.packE.production.at(-1);assert.ok(baselineJob,'baseline Plant job must start');
  const baselineDuration=baselineJob.endsAt-baselineJob.startedAt;
  await page.evaluate((at)=>(globalThis as any).__SALVAGE_TEST__.advancePlantTo(at),baselineJob.endsAt+1);
  assert.equal(await page.evaluate((id)=>(globalThis as any).__SALVAGE_TEST__.assignGenericProduction(id,'plant_lines'),operatorWorkerId),true);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const operatorWorker=s.workforceV3.workers.find((w:any)=>w.id===operatorWorkerId);
  assert.equal(operatorWorker.role,'operator');assert.equal(operatorWorker.status,'production');assert.equal(operatorWorker.productionCellId,'plant_lines');
  const productionAssigned=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionV3View());
  const plantCell=productionAssigned.cells.find((cell:any)=>cell.id==='plant_lines');assert.ok(plantCell.speedFactor<.9,'assigned Operator must expose a material speed factor');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.doStartPlantAlloy());
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const operatorJob=s.packE.production.at(-1);assert.ok(operatorJob,'Operator Plant job must start');
  const operatorDuration=operatorJob.endsAt-operatorJob.startedAt;
  assert.ok(operatorDuration<baselineDuration*.9,`Operator must shorten a real Plant cycle: ${operatorDuration} vs ${baselineDuration}`);
  await openBaseSurface(page,'crew');await page.waitForFunction((id)=>document.querySelector(`[data-worker-card="${id}"] .v3OperatorBlock`)?.textContent?.includes('Линии Processing Plant'),operatorWorkerId);
  const operatorText=await page.locator(`[data-worker-card="${operatorWorkerId}"] .v3OperatorBlock`).innerText();assert.match(operatorText,/Работает: Линии Processing Plant/);assert.match(operatorText,/% быстрее/);

  // Standing buyer: partial 10kg delivery persists instead of rotating contract away.
  await openBaseSurface(page,'contracts');await page.waitForSelector('#contractBoardV3Root');
  assert.ok(await page.locator('.standingBuyer').count()>=4,'standing buyers remain permanently visible');
  assert.ok(await page.locator('.specialOrder').count()>=1,'late state must expose high-margin special orders');
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());const beforeMetal=s.storage.metal,beforeCash=s.cash;
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.submitStandingV3('standing_metal',10));
  await page.waitForFunction(()=>Number((globalThis as any).__SALVAGE_TEST__.getState().contract?.standingProgress?.standing_metal)>=9.99);
  s=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(s.storage.metal<=beforeMetal-9.99&&s.cash>beforeCash,'partial standing delivery must consume real inventory and pay real cash');
  await page.waitForFunction(()=>document.querySelector('[data-standing-card="standing_metal"]')?.textContent?.includes('10 / 24'));
  const specialText=(await page.locator('.specialOrder').allInnerTexts()).join('\n');assert.doesNotMatch(specialText,/СПЕЦЗАКАЗ · RAW/,'special orders must not be duplicate bulk raw drains');

  // Persist a pure Hangar state and open it in another tab before the first page
  // can autosave again. This proves a real place change, not only a title.
  await page.evaluate((key)=>{
    for(let i=1;i<2000;i++)clearInterval(i);
    const raw=localStorage.getItem(key);if(!raw)throw new Error('missing save');const save=JSON.parse(raw);
    save.packB={...(save.packB??{}),hangarOwned:true};
    save.packC={...(save.packC??{}),salvageYardOwned:false};
    save.packD={...(save.packD??{}),industrialWorkshopOwned:false};
    save.packE={...(save.packE??{}),processingPlantOwned:false};
    localStorage.setItem(key,JSON.stringify(save));
  },SAVE_KEY);
  const hangarPage=await context.newPage();await hangarPage.goto(`${ORIGIN}/?seed=core-rebuild-hangar`);await waitGame(hangarPage);
  await hangarPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await hangarPage.waitForSelector('#garageScreen:not([hidden])');await hangarPage.waitForSelector('#baseStageSceneV2.stage-hangar');
  const hangarMarkup=await hangarPage.locator('#baseStageSceneV2').innerHTML();assert.match(hangarMarkup,/Операционный ангар/);assert.notEqual(hangarMarkup,garageMarkup,'Hangar must be a materially different base scene');

  // Real offline proof: persist an assigned route one hour in the past, then
  // boot another page. The standard startup simulation must generate the report.
  await hangarPage.evaluate((key)=>{
    for(let i=1;i<2000;i++)clearInterval(i);
    const api=(globalThis as any).__SALVAGE_TEST__,st=api.getState(),worker=st.workforceV3.workers[0],van=st.workforceV3.fleet.find((v:any)=>v.type==='van');
    api.assignGenericRoute(worker.id,'z1',van?.id??null);(globalThis as any).__SALVAGE_PLATFORM__?.forceSave?.();
    const raw=localStorage.getItem(key);if(!raw)throw new Error('missing offline save');const save=JSON.parse(raw),past=Date.now()-3600_000;
    save.lastSeen=past;save.workforceV3.lastSimulatedAt=past;
    for(const route of save.workforceV3.routes){route.startedAt=past;route.shiftEndsAt=past+2*3600_000;route.deliveredKg=0}
    localStorage.setItem(key,JSON.stringify(save));
  },SAVE_KEY);
  const offlinePage=await context.newPage();await offlinePage.goto(`${ORIGIN}/?seed=core-rebuild-offline`);await offlinePage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.workforceV3?.routes?.length>0);
  await offlinePage.waitForSelector('#offlineScreen:not([hidden])');await offlinePage.waitForSelector('.offlineRoutesV3 li');
  const offlineText=await offlinePage.locator('.offlineRoutesV3').innerText();assert.match(offlineText,/кг\/ч/);assert.match(offlineText,/\+\d/,'offline report must show real persisted route gain');

  console.log('Core Rebuild V1 browser proof: Talent V4 + generic roster/fleet + route delta + real Operator production + standing contracts + Hangar scene + real offline report: PASS');
  await context.close();
}finally{await browser.close();await stopServer()}
