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
async function ready(page:Page){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);await page.waitForTimeout(650)}
async function forceGarage(page:Page){await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseStageSceneV2');await page.waitForTimeout(500)}
async function saveShot(page:Page,name:string,locator?:string){if(locator)await page.locator(locator).screenshot({path:`${outDir}/${name}.png`,animations:'disabled'});else await page.screenshot({path:`${outDir}/${name}.png`,fullPage:true,animations:'disabled'})}
async function installSave(page:Page,raw:string){await page.evaluate(([key,value])=>localStorage.setItem(key,value),[SAVE_KEY,raw] as const);await page.reload({waitUntil:'load'});await ready(page)}
function stageSave(raw:string,stage:'garage'|'hangar'|'yard'){
  const s=JSON.parse(raw);
  if(s.workforceV3)delete s.workforceV3;
  s.packB=s.packB??{};s.packC=s.packC??{};s.packD=s.packD??{};s.packE=s.packE??{};s.midgame=s.midgame??{};
  s.packB.hangarOwned=stage!=='garage';
  s.packB.truck={...(s.packB.truck??{}),owned:stage!=='garage'};
  s.packC.salvageYardOwned=stage==='yard';
  s.packD.industrialWorkshopOwned=false;
  s.packD.recoveryRig={...(s.packD.recoveryRig??{}),owned:false};
  s.packE.processingPlantOwned=false;
  s.packE.plantLines=0;s.packE.production=[];
  if(stage!=='garage'){
    s.midgame.van={...(s.midgame.van??{}),owned:true};
    s.midgame.worker={...(s.midgame.worker??{}),hired:true,assignment:null,lastTick:Date.now()};
    s.packB.secondWorker={...(s.packB.secondWorker??{}),hired:true,assignment:null,lastTick:Date.now()};
  }
  if(stage==='yard')s.packC.crew3={...(s.packC.crew3??{}),hired:true,role:'scavenger',assignment:null,lastTick:Date.now()};
  return JSON.stringify(s);
}
async function assertStage(page:Page,cls:string){await page.waitForSelector(`#baseStageSceneV2.${cls}`)}
async function openZones(page:Page){
  await page.evaluate(()=>{
    const button=document.getElementById('zonesOpen') as HTMLButtonElement|null;
    if(!button)throw new Error('canonical zonesOpen control missing');
    button.click();
  });
  await page.waitForSelector('#zoneScreen:not([hidden])');
}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context:BrowserContext=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=visual-rebuild-v2-capture`,{waitUntil:'load'});await ready(page);

  // Real gameplay field, not an isolated SVG preview.
  await page.waitForSelector('#game');await page.waitForTimeout(900);await saveShot(page,'01-field-desktop');

  // Real zone selector with V2 illustrated route map.
  await openZones(page);await page.waitForTimeout(350);await saveShot(page,'02-zone-map-desktop','#zoneScreen');await page.click('#zoneClose');

  // Preserve the clean legal save for early/mid business-stage fixtures. Building
  // Hangar/Yard from this avoids impossible late-game leftovers silently promoting
  // the business stage during Save V10 migration.
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__?.forceSave?.());
  const cleanRaw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);if(!cleanRaw)throw new Error('clean visual capture save missing');

  await installSave(page,stageSave(cleanRaw,'garage'));await forceGarage(page);await assertStage(page,'stage-garage');await saveShot(page,'03-garage-stage-desktop','#baseStageSceneV2');
  await installSave(page,stageSave(cleanRaw,'hangar'));await forceGarage(page);await assertStage(page,'stage-hangar');await saveShot(page,'04-hangar-stage-desktop','#baseStageSceneV2');
  await installSave(page,stageSave(cleanRaw,'yard'));await forceGarage(page);await assertStage(page,'stage-yard');await saveShot(page,'05-yard-stage-desktop','#baseStageSceneV2');

  // Use the durable canonical DEV preset only for the mature Industrial fixture.
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="plantReady"]')]);await ready(page);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.mastery?.z8===100);
  const industrialRaw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);if(!industrialRaw)throw new Error('industrial visual capture save missing');
  await forceGarage(page);await assertStage(page,'stage-industrial');await saveShot(page,'06-industrial-stage-desktop','#baseStageSceneV2');await saveShot(page,'07-industrial-menu-desktop');

  // Phone proof from the same canonical Industrial save.
  const mobile=await browser.newContext({viewport:{width:390,height:844},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:industrialRaw}]}]}}),mobilePage=await mobile.newPage();
  await mobilePage.goto(`${ORIGIN}/?seed=visual-rebuild-v2-mobile`,{waitUntil:'load'});await ready(mobilePage);await forceGarage(mobilePage);await assertStage(mobilePage,'stage-industrial');await saveShot(mobilePage,'08-industrial-mobile');
  await openZones(mobilePage);await mobilePage.waitForTimeout(300);await saveShot(mobilePage,'09-zone-map-mobile','#zoneScreen');
  await mobile.close();await context.close();
  console.log(`Visual Rebuild V2 capture: wrote screenshots to ${outDir}`);
}finally{await browser.close();await stopServer()}
