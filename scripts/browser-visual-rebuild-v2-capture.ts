import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {mkdirSync,rmSync} from 'node:fs';
import {chromium,type BrowserContext,type Page} from 'playwright';

const PORT=41995,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const outDir=fileURLToPath(new URL('../visual-review-v2',import.meta.url));
rmSync(outDir,{recursive:true,force:true});mkdirSync(outDir,{recursive:true});

const server:ChildProcess=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout?.on('data',b=>output+=String(b));server.stderr?.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${output}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function closeOffline(page:Page){const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose')}
async function ready(page:Page){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);await page.waitForTimeout(450)}
async function forceGarage(page:Page){await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseStageSceneV2');await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.refresh?.());await page.waitForTimeout(350)}
async function saveShot(page:Page,name:string,locator?:string){if(locator)await page.locator(locator).screenshot({path:`${outDir}/${name}.png`,animations:'disabled'});else await page.screenshot({path:`${outDir}/${name}.png`,fullPage:true,animations:'disabled'})}
async function assertStage(page:Page,cls:string,stage:string){
  try{
    await page.waitForFunction(([expectedClass,expectedStage])=>{
      const scene=document.querySelector('#baseStageSceneV2');
      const actual=(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.();
      return !!scene?.classList.contains(expectedClass)&&actual===expectedStage;
    },[cls,stage],{timeout:10_000});
  }catch(error){
    const actual=await page.evaluate(()=>({stage:(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.()??null,classes:document.querySelector('#baseStageSceneV2')?.className??null,business:(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage??null}));
    throw new Error(`visual stage mismatch: expected ${stage}/${cls}, got ${JSON.stringify(actual)}`,{cause:error});
  }
}
async function openZones(page:Page){
  await page.evaluate(()=>{
    const button=document.getElementById('zonesOpen') as HTMLButtonElement|null;
    if(!button)throw new Error('canonical zonesOpen control missing');
    button.click();
  });
  await page.waitForSelector('#zoneScreen:not([hidden])');
}

function garageFixture(canonical:any){
  const t=Date.now(),garage=structuredClone(canonical);
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
  ],fleet:[{id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:t-9_000}],routes:[
    {id:'route-1',zone:'z1',workerIds:['worker-1'],vehicleId:'vehicle-1',startedAt:t-1_000,shiftEndsAt:t+7_200_000,deliveredKg:0}
  ]};
  return garage;
}

function hangarFixture(canonical:any){
  const t=Date.now(),hangar=garageFixture(canonical);
  hangar.packB.hangarOwned=true;
  hangar.packB.truck={...(hangar.packB?.truck??{}),owned:true};
  hangar.workforceV3={...hangar.workforceV3,nextWorkerSerial:4,nextVehicleSerial:3,workers:[
    {id:'worker-1',name:'Илья',rank:2,role:'scavenger',status:'route',routeId:'route-1',productionCellId:null,hiredAt:t-10_000},
    {id:'worker-2',name:'Марина',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:t-5_000},
    {id:'worker-3',name:'Олег',rank:2,role:'operator',status:'production',routeId:null,productionCellId:'heavy_cell',hiredAt:t-3_000}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:t-9_000},
    {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:null,acquiredAt:t-2_000}
  ]};
  return hangar;
}

function yardFixture(canonical:any){
  const now=Date.now(),yard=structuredClone(canonical);
  yard.xp=Math.max(Number(yard.xp??0),80_000);
  yard.packB.hangarOwned=true;yard.packC.salvageYardOwned=true;yard.packD.industrialWorkshopOwned=false;yard.packE.processingPlantOwned=false;
  yard.midgame.mastery={...(yard.midgame?.mastery??{}),z1:100,z2:100,z3:100,z4:100};
  yard.workforceV3={version:3,nextWorkerSerial:4,nextVehicleSerial:4,nextRouteSerial:3,lastSimulatedAt:now,workers:[
    {id:'worker-1',name:'Илья',rank:2,role:'scavenger',status:'route',routeId:'route-1',productionCellId:null,hiredAt:now-50_000},
    {id:'worker-2',name:'Марина',rank:2,role:'logistician',status:'route',routeId:'route-2',productionCellId:null,hiredAt:now-40_000},
    {id:'worker-3',name:'Олег',rank:1,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:now-30_000}
  ],fleet:[
    {id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:'route-1',acquiredAt:now-45_000},
    {id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:'route-2',acquiredAt:now-35_000},
    {id:'vehicle-3',type:'recovery_rig',name:'Тяжёлая эвакуационная платформа #1',capacityKg:1800,routeId:null,acquiredAt:now-25_000}
  ],routes:[
    {id:'route-1',zone:'z1',workerIds:['worker-1'],vehicleId:'vehicle-1',startedAt:now,shiftEndsAt:now+8*3_600_000,deliveredKg:75},
    {id:'route-2',zone:'z4',workerIds:['worker-2'],vehicleId:'vehicle-2',startedAt:now,shiftEndsAt:now+2*3_600_000,deliveredKg:120}
  ]};
  return yard;
}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  // Field + route map + canonical Save V10 seed.
  const seedContext:BrowserContext=await browser.newContext({viewport:{width:1440,height:900}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=visual-rebuild-v2-capture`,{waitUntil:'load'});await ready(seedPage);
  await seedPage.waitForSelector('#game');await seedPage.waitForTimeout(700);await saveShot(seedPage,'01-field-desktop');
  await openZones(seedPage);await seedPage.waitForTimeout(250);await saveShot(seedPage,'02-zone-map-desktop','#zoneScreen');await seedPage.click('#zoneClose');
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__?.forceSave?.());
  const cleanRaw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);if(!cleanRaw)throw new Error('clean visual capture save missing');
  const canonical=JSON.parse(cleanRaw);await seedContext.close();

  // Mirror acceptance lifecycle exactly: one fresh BrowserContext per stage.
  const openFixture=async(fixture:any,seed:string,cls:string,stage:string,shot:string,viewport={width:1440,height:900})=>{
    const context=await browser.newContext({viewport,storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}}),page=await context.newPage();
    await page.goto(`${ORIGIN}/?seed=${seed}`,{waitUntil:'load'});await ready(page);await forceGarage(page);await assertStage(page,cls,stage);await saveShot(page,shot,'#baseStageSceneV2');
    return{context,page};
  };

  const garage=await openFixture(garageFixture(canonical),'visual-v2-garage','stage-garage','workforce_garage','03-garage-stage-desktop');await garage.context.close();
  const hangar=await openFixture(hangarFixture(canonical),'visual-v2-hangar','stage-hangar','hangar','04-hangar-stage-desktop');await hangar.context.close();
  const yard=await openFixture(yardFixture(canonical),'visual-v2-yard','stage-yard','salvage_yard','05-yard-stage-desktop');await yard.context.close();

  // Mature Industrial is generated by the same durable DEV transition used for owner testing.
  const industrialContext=await browser.newContext({viewport:{width:1440,height:900}}),industrialPage=await industrialContext.newPage();
  await industrialPage.goto(`${ORIGIN}/?seed=visual-v2-industrial`,{waitUntil:'load'});await ready(industrialPage);
  await industrialPage.click('#hfDevToggle');await industrialPage.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([industrialPage.waitForLoadState('load'),industrialPage.click('[data-dev="plantReady"]')]);await ready(industrialPage);
  await industrialPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.mastery?.z8===100);
  await forceGarage(industrialPage);await assertStage(industrialPage,'stage-industrial','industrial_workshop');
  await saveShot(industrialPage,'06-industrial-stage-desktop','#baseStageSceneV2');await saveShot(industrialPage,'07-industrial-menu-desktop');
  const industrialRaw=await industrialPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);if(!industrialRaw)throw new Error('industrial visual capture save missing');await industrialContext.close();

  // Phone proof from the exact Industrial save captured above.
  const mobile=await browser.newContext({viewport:{width:390,height:844},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:industrialRaw}]}]}}),mobilePage=await mobile.newPage();
  await mobilePage.goto(`${ORIGIN}/?seed=visual-rebuild-v2-mobile`,{waitUntil:'load'});await ready(mobilePage);await forceGarage(mobilePage);await assertStage(mobilePage,'stage-industrial','industrial_workshop');await saveShot(mobilePage,'08-industrial-mobile');
  await openZones(mobilePage);await mobilePage.waitForTimeout(250);await saveShot(mobilePage,'09-zone-map-mobile','#zoneScreen');await mobile.close();

  console.log(`Visual Rebuild V2 capture: wrote screenshots to ${outDir}`);
}finally{await browser.close();await stopServer()}
