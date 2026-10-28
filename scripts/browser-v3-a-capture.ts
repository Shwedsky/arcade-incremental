import {mkdir} from 'node:fs/promises';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=42003,ORIGIN=`http://127.0.0.1:${PORT}`,OUT=fileURLToPath(new URL('../visual-review-v3-a',import.meta.url));
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}
async function applyPreset(page:any,id:string){
  await page.goto(`${ORIGIN}/?seed=v3a-capture-${id}`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');await page.waitForSelector(`[data-v3-preset="${id}"]`);
  await Promise.all([page.waitForLoadState('load'),page.click(`[data-v3-preset="${id}"]`)]);await page.waitForSelector('#v3PresetBadge');await closeOffline(page);
}

await mkdir(OUT,{recursive:true});const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  // Overview + map from the same developed Garage fixture.
  let context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();await applyPreset(page,'garageDeveloped');
  await page.waitForSelector('#v3AOverview');await page.locator('#v3AOverview').screenshot({path:`${OUT}/01-overview-garage.png`});
  await page.click('#zonesGarage');await page.waitForSelector('#zoneScreen:not([hidden])');await page.waitForSelector('[data-v3-unknown]');await page.locator('#zoneGrid').screenshot({path:`${OUT}/03-map-garage-fog.png`});await context.close();

  // Talent reveal fixture.
  context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();await applyPreset(page,'talentReveal');await page.waitForSelector('#talentScreen:not([hidden])');await page.waitForSelector('[data-v3-tree-root]');await page.locator('#talentBranches').screenshot({path:`${OUT}/02-talent-tree-fog.png`});await context.close();

  // Industrial specialist clarity fixture.
  context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();await applyPreset(page,'industrialStaffing');await page.waitForSelector('[data-production-cell="fabrication"]');
  await page.waitForFunction(()=>{const timing=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');const worker=document.querySelector<HTMLSelectElement>('[data-pc-worker="fabrication"]');return !worker?.value&&timing?.dataset.adjustedSec===timing?.dataset.baseSec&&timing?.textContent?.includes('Без специалиста')});
  await page.selectOption('[data-pc-worker="fabrication"]','worker-1');await page.selectOption('[data-pc-role="fabrication"]','technician');await page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');return Number(el?.dataset.adjustedSec)>0&&Number(el?.dataset.adjustedSec)<Number(el?.dataset.baseSec)});
  await page.locator('#productionCellsV1Root').screenshot({path:`${OUT}/04-industrial-staffing-eta.png`});await context.close();

  console.log('V3-A formal review screenshots captured: 4');
}finally{await browser.close();await stop(proc)}
