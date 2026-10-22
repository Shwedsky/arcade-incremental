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
function stageSave(raw:string,stage:'garage'|'hangar'|'yard'|'industrial'){
  const s=JSON.parse(raw);
  s.packB.hangarOwned=stage!=='garage';
  if(s.packB?.truck)s.packB.truck.owned=stage!=='garage';
  s.packC.salvageYardOwned=stage==='yard'||stage==='industrial';
  s.packD.industrialWorkshopOwned=stage==='industrial';
  if(s.packD?.recoveryRig)s.packD.recoveryRig.owned=stage==='industrial';
  s.packE.processingPlantOwned=false;
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

  // Use the existing durable DEV preset to obtain a fully populated canonical roster/fleet/inventory.
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="plantReady"]')]);await ready(page);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.mastery?.z8===100);
  const matureRaw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);if(!matureRaw)throw new Error('visual capture fixture save missing');

  await installSave(page,stageSave(matureRaw,'garage'));await forceGarage(page);await assertStage(page,'stage-garage');await saveShot(page,'03-garage-stage-desktop','#baseStageSceneV2');
  await installSave(page,stageSave(matureRaw,'hangar'));await forceGarage(page);await assertStage(page,'stage-hangar');await saveShot(page,'04-hangar-stage-desktop','#baseStageSceneV2');
  await installSave(page,stageSave(matureRaw,'yard'));await forceGarage(page);await assertStage(page,'stage-yard');await saveShot(page,'05-yard-stage-desktop','#baseStageSceneV2');
  await installSave(page,stageSave(matureRaw,'industrial'));await forceGarage(page);await assertStage(page,'stage-industrial');await saveShot(page,'06-industrial-stage-desktop','#baseStageSceneV2');await saveShot(page,'07-industrial-menu-desktop');

  // Phone proof from the same canonical Industrial save.
  const industrialRaw=stageSave(matureRaw,'industrial');
  const mobile=await browser.newContext({viewport:{width:390,height:844},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:industrialRaw}]}]}}),mobilePage=await mobile.newPage();
  await mobilePage.goto(`${ORIGIN}/?seed=visual-rebuild-v2-mobile`,{waitUntil:'load'});await ready(mobilePage);await forceGarage(mobilePage);await assertStage(mobilePage,'stage-industrial');await saveShot(mobilePage,'08-industrial-mobile');
  await openZones(mobilePage);await mobilePage.waitForTimeout(300);await saveShot(mobilePage,'09-zone-map-mobile','#zoneScreen');
  await mobile.close();await context.close();
  console.log(`Visual Rebuild V2 capture: wrote screenshots to ${outDir}`);
}finally{await browser.close();await stopServer()}
