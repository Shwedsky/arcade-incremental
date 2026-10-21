import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=41991,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedContext=await browser.newContext({viewport:{width:1440,height:1000}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=p4-yard-seed`);await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical Save V10 fixture must exist');
  const save=JSON.parse(raw!);await seedContext.close();

  const now=Date.now();
  save.xp=Math.max(Number(save.xp??0),80_000);
  save.packB.hangarOwned=true;save.packC.salvageYardOwned=true;save.packD.industrialWorkshopOwned=false;save.packE.processingPlantOwned=false;
  save.midgame.mastery={...(save.midgame?.mastery??{}),z1:100,z2:100,z3:100,z4:100};
  save.workforceV3={version:3,nextWorkerSerial:4,nextVehicleSerial:3,nextRouteSerial:3,lastSimulatedAt:now,workers:[
    {id:'worker-1',name:'Илья',rank:2,role:'scavenger',status:'route',routeId:'route-1',productionCellId:null,hiredAt:now-50_000},
    {id:'worker-2',name:'Марина',rank:2,role:'logistician',status:'route',routeId:'route-2',productionCellId:null,hiredAt:now-40_000},
    {id:'worker-3',name:'Олег',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:now-30_000}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:now-45_000},
    {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:'route-2',acquiredAt:now-35_000}
  ],routes:[
    {id:'route-1',zone:'z1',workerIds:['worker-1'],vehicleId:'vehicle-1',startedAt:now,shiftEndsAt:now+8*3_600_000,deliveredKg:75},
    {id:'route-2',zone:'z4',workerIds:['worker-2'],vehicleId:'vehicle-2',startedAt:now,shiftEndsAt:now+2*3_600_000,deliveredKg:120}
  ]};

  const context=await browser.newContext({viewport:{width:1440,height:1000},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(save)}]}]}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=p4-yard-network`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage==='salvage_yard');
  const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose');
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseShellNav');

  await page.click('[data-base-surface="logistics"]');await page.waitForSelector('#fleetNetworkV1Root');
  assert.equal(await page.locator('[data-network-route]').count(),2,'Yard network must show both simultaneous canonical routes');
  const network=await page.locator('#fleetNetworkV1Root').innerText();
  assert.match(network,/Сеть снабжения/);assert.match(network,/Маршруты\s*2/i);assert.match(network,/Илья/);assert.match(network,/Марина/);assert.match(network,/Фургон #1/);assert.match(network,/Грузовик #1/);
  assert.match(network,/Транспорт заполнится раньше конца смены/,'long Van shift should expose the real capacity bottleneck');

  await page.click('[data-base-surface="overview"]');await page.waitForSelector('#baseStageSceneV2.stage-yard');await page.waitForSelector('[data-yard-network-scene]');
  assert.equal(await page.locator('.yardRouteLane').count(),2,'Yard scene must visibly show both active route lanes');
  const yard=await page.locator('[data-yard-network-scene]').innerText();assert.match(yard,/Фургон #1/);assert.match(yard,/Грузовик #1/);

  await page.click('[data-base-surface="crew"]');await page.waitForSelector('[data-v3-unassign="route-1"]');await page.click('[data-v3-unassign="route-1"]');
  await page.waitForFunction(()=>((globalThis as any).__SALVAGE_TEST__.getState().workforceV3.routes??[]).length===1);
  await page.click('[data-base-surface="logistics"]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-network-route]').length===1);
  const after=await page.locator('#fleetNetworkV1Root').innerText();assert.match(after,/Маршруты\s*1/i);assert.doesNotMatch(after,/Илья[\s\S]*Фургон #1[\s\S]*В РАБОТЕ/i);
  await page.click('[data-base-surface="overview"]');await page.waitForFunction(()=>document.querySelectorAll('.yardRouteLane').length===1);

  await context.close();
  console.log('P4 Salvage Yard / Fleet Network V1 two-route live browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
