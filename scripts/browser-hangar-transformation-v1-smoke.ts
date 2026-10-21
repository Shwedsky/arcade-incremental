import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium,type BrowserContext,type Page} from 'playwright';

const PORT=41989,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedContext=await browser.newContext({viewport:{width:1440,height:1000}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=hangar-v1-seed`);
  await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical Save V10 fixture must exist');
  const canonical=JSON.parse(raw!);await seedContext.close();

  const openFixture=async(fixture:any,seed:string,viewport={width:1440,height:1000}):Promise<{context:BrowserContext;page:Page}>=>{
    const context=await browser.newContext({viewport,storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}}),page=await context.newPage();
    await page.goto(`${ORIGIN}/?seed=${seed}`);
    await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
    const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose');
    await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');
    await page.waitForSelector('#baseShellNav');await page.waitForSelector('#baseStageSceneV2');
    await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.refresh?.());
    return{context,page};
  };

  const t=Date.now();
  const garage=structuredClone(canonical);
  garage.xp=Math.max(Number(garage.xp??0),30_000);
  garage.installed=['workbench','press','wire','plastic'];
  garage.machineLevels={workbench:3,press:2,wire:2,plastic:1};
  garage.storage={...(garage.storage??{}),metal:600,copper:180,plastic:250};
  garage.packB.hangarOwned=false;garage.packC.salvageYardOwned=false;garage.packD.industrialWorkshopOwned=false;garage.packE.processingPlantOwned=false;
  garage.midgame.van={...(garage.midgame?.van??{}),owned:true};
  garage.midgame.worker={...(garage.midgame?.worker??{}),hired:true,assignment:'z1',lastTick:t};
  garage.workforceV3={version:3,nextWorkerSerial:3,nextVehicleSerial:2,nextRouteSerial:2,lastSimulatedAt:t,workers:[
    {id:'worker-1',name:'Илья',rank:2,role:'scavenger',status:'route',routeId:'route-1',productionCellId:null,hiredAt:t-10_000},
    {id:'worker-2',name:'Марина',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:t-5_000}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:t-9_000}
  ],routes:[
    {id:'route-1',zone:'z1',workerIds:['worker-1'],vehicleId:'vehicle-1',startedAt:t-1_000,shiftEndsAt:t+7_200_000,deliveredKg:0}
  ]};

  const g=await openFixture(garage,'hangar-v1-garage');
  await g.page.waitForSelector('#baseStageSceneV2.stage-garage');
  assert.equal(await g.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'workforce_garage');
  assert.equal(await g.page.locator('.garageWall.crowded').count(),1,'late Garage should visibly read as crowded before Hangar');
  assert.equal(await g.page.locator('.hangarZone').count(),0,'Garage must not contain Hangar operating zones');
  const garageBox=await g.page.locator('#baseStageSceneV2').boundingBox();assert.ok(garageBox,'Garage scene must have layout bounds');
  const garageShellBg=await g.page.locator('.garageBox').evaluate(el=>getComputedStyle(el).backgroundImage);
  await g.context.close();

  const hangar=structuredClone(garage);hangar.packB.hangarOwned=true;hangar.packB.truck={...(hangar.packB?.truck??{}),owned:true};
  hangar.workforceV3={...hangar.workforceV3,nextWorkerSerial:4,nextVehicleSerial:3,workers:[
    {id:'worker-1',name:'Илья',rank:2,role:'scavenger',status:'route',routeId:'route-1',productionCellId:null,hiredAt:t-10_000},
    {id:'worker-2',name:'Марина',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:t-5_000},
    {id:'worker-3',name:'Олег',rank:2,role:'operator',status:'production',routeId:null,productionCellId:'heavy_cell',hiredAt:t-3_000}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:t-9_000},
    {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:null,acquiredAt:t-2_000}
  ]};

  const h=await openFixture(hangar,'hangar-v1-hangar');
  await h.page.waitForSelector('#baseStageSceneV2.stage-hangar');await h.page.waitForSelector('[data-hangar-ops]');
  assert.equal(await h.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'hangar');
  const hangarBox=await h.page.locator('#baseStageSceneV2').boundingBox();assert.ok(hangarBox,'Hangar scene must have layout bounds');
  assert.ok(hangarBox!.height>garageBox!.height+150,`Hangar scene must be materially larger than Garage (${hangarBox!.height} vs ${garageBox!.height})`);
  const hangarShellBg=await h.page.locator('.garageBox').evaluate(el=>getComputedStyle(el).backgroundImage);assert.notEqual(hangarShellBg,garageShellBg,'Hangar shell must have a distinct visual context');
  assert.equal(await h.page.locator('.hangarZone').count(),4,'Hangar must expose machine, dispatch, storage and vehicle zones');
  assert.equal(await h.page.locator('.hangarMachineSlot').count(),6,'Hangar must visibly expose six machine posts');
  assert.equal(await h.page.locator('.dispatchSeat').count(),5,'Hangar must visibly expose five staffing positions');
  assert.equal(await h.page.locator('.hangarBaysV1 .baseBay').count(),4,'Hangar must visibly expose four vehicle bays');
  const sceneText=await h.page.locator('#baseStageSceneV2').innerText();
  assert.match(sceneText,/ПРОИЗВОДСТВЕННЫЙ ПОЛ/);assert.match(sceneText,/ДИСПЕТЧЕРСКАЯ/);assert.match(sceneText,/СКЛАД \/ СТЕЙДЖИНГ/);assert.match(sceneText,/ТРАНСПОРТНЫЕ БОКСЫ/);
  assert.match(sceneText,/Илья/);assert.match(sceneText,/Марина/);assert.match(sceneText,/Олег/);assert.match(sceneText,/Фургон #1/);assert.match(sceneText,/Грузовик #1/);
  const opsText=await h.page.locator('[data-hangar-ops]').innerText();
  assert.match(opsText,/ПЕРСОНАЛ\s*2\/3/i);assert.match(opsText,/АВТОПАРК\s*1\/2/i);assert.match(opsText,/МАРШРУТЫ\s*1/i);assert.match(opsText,/Есть свободные люди/);

  const assignmentSnapshot=()=>h.page.evaluate(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3;return{workers:s.workers.map((w:any)=>({id:w.id,status:w.status,routeId:w.routeId,productionCellId:w.productionCellId})),fleet:s.fleet.map((v:any)=>({id:v.id,routeId:v.routeId}))}});
  const before=await assignmentSnapshot();
  await h.page.click('[data-base-surface="logistics"]');await h.page.waitForSelector('#fleetV3Root');assert.equal(await h.page.locator('#fleetV3Root').isVisible(),true);assert.equal(await h.page.locator('#baseStageSceneV2').isHidden(),true,'full Hangar scene must not obstruct Logistics management');
  await h.page.click('[data-base-surface="crew"]');await h.page.waitForSelector('#workforceV3Root');assert.equal(await h.page.locator('#workforceV3Root').isVisible(),true);assert.equal(await h.page.locator('#baseStageSceneV2').isHidden(),true,'full Hangar scene must not obstruct Crew management');
  await h.page.click('[data-base-surface="overview"]');await h.page.waitForSelector('[data-hangar-ops]');assert.equal(await h.page.locator('#baseStageSceneV2').isVisible(),true,'Hangar scene must return with Overview');
  const after=await assignmentSnapshot();assert.deepEqual(after,before,'switching Hangar management surfaces must not mutate assignments');

  // Live source-of-truth proof: unassign route through the real Crew UI and require the scene + Ops center to follow without reload.
  await h.page.click('[data-base-surface="crew"]');await h.page.waitForSelector('[data-v3-unassign="route-1"]');await h.page.click('[data-v3-unassign="route-1"]');
  await h.page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3;return s.routes.length===0&&s.workers.find((w:any)=>w.id==='worker-1')?.status==='idle'&&s.fleet.find((v:any)=>v.id==='vehicle-1')?.routeId===null});
  await h.page.click('[data-base-surface="overview"]');
  await h.page.waitForFunction(()=>{const scene=document.querySelector('#baseStageSceneV2')?.textContent??'';const ops=(document.querySelector('[data-hangar-ops]')?.textContent??'').toLocaleLowerCase('ru-RU');return scene.includes('Фургон #1')&&scene.includes('СВОБОДЕН')&&ops.includes('маршруты')&&ops.includes('0')});
  const liveScene=await h.page.locator('#baseStageSceneV2').innerText(),liveOps=await h.page.locator('[data-hangar-ops]').innerText();
  assert.match(liveScene,/Илья[\s\S]*Свободен/i,'dispatch board must show the formerly routed worker as idle');
  assert.match(liveScene,/Фургон #1[\s\S]*СВОБОДЕН/i,'vehicle bay must show the unassigned Van as free');
  assert.match(liveOps,/ПЕРСОНАЛ\s*1\/3/i,'only the production Operator should remain active');
  assert.match(liveOps,/АВТОПАРК\s*0\/2/i,'no vehicles should remain assigned after route removal');
  assert.match(liveOps,/МАРШРУТЫ\s*0/i,'operations center must show zero routes without reload');
  await h.context.close();

  const m=await openFixture(hangar,'hangar-v1-mobile',{width:390,height:844});
  await m.page.waitForSelector('#baseStageSceneV2.stage-hangar');
  assert.equal(await m.page.locator('.hangarZone').count(),4,'mobile Hangar must retain all four operating zones');
  const mobileScene=await m.page.locator('#baseStageSceneV2').boundingBox();assert.ok(mobileScene&&mobileScene.width<=390,'mobile Hangar scene must fit viewport width');
  assert.equal(await m.page.locator('[data-hangar-ops]').isVisible(),true,'Hangar operations overview must remain visible on mobile');
  await m.context.close();

  console.log('Hangar Transformation V1 scene / V3 operations / live assignment reflection browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
