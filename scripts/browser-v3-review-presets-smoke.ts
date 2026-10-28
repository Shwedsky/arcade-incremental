import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=42002,ORIGIN=`http://127.0.0.1:${PORT}`,TIMEOUT=10_000;
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}
async function snapshotLanding(page:any,surface:string){return page.evaluate((surface:string)=>{const garage=document.querySelector<HTMLElement>('#garageScreen'),pane=document.querySelector<HTMLElement>(`[data-base-pane="${surface}"]`),talents=document.querySelector<HTMLElement>('#talentScreen'),badge=document.querySelector<HTMLElement>('#v3PresetBadge'),shell=(globalThis as any).__SALVAGE_BASE_SHELL__;return{garageExists:!!garage,garageHidden:garage?.hidden??null,paneExists:!!pane,paneHidden:pane?.hidden??null,paneAvailable:pane?.dataset.available??null,talentHidden:talents?.hidden??null,badge:badge?.textContent?.trim()??null,stable:badge?.dataset.v3SurfaceStable??null,shellStage:shell?.getStage?.()??null,shellSurface:shell?.getActiveSurface?.()??null}},surface)}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const cases=[
    {id:'garageStart',label:'V3-A · Garage start',stage:'starter_garage',surface:'overview'},
    {id:'garageDeveloped',label:'V3-A · Garage developed',stage:'equipped_garage',surface:'overview'},
    {id:'talentReveal',label:'V3-A · Talent reveal',stage:'equipped_garage',surface:'development'},
    {id:'industrialStaffing',label:'V3-A · Industrial staffing',stage:'industrial_workshop',surface:'production'}
  ] as const;

  for(const item of cases){
    console.log(`[V3-A DEV] ${item.id}: seed`);
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
    page.setDefaultTimeout(TIMEOUT);page.setDefaultNavigationTimeout(TIMEOUT);
    await page.goto(`${ORIGIN}/?seed=v3-preset-${item.id}`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);
    await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');await page.waitForSelector(`[data-v3-preset="${item.id}"]`);
    console.log(`[V3-A DEV] ${item.id}: apply preset + reload`);
    const navigation=page.waitForNavigation({waitUntil:'domcontentloaded'});
    await page.click(`[data-v3-preset="${item.id}"]`,{noWaitAfter:true});
    await navigation;
    await page.waitForFunction(({label,stage})=>{
      const runtime=(globalThis as any).__SALVAGE_TEST__,badge=document.querySelector<HTMLElement>('#v3PresetBadge');
      return runtime?.getState?.()?.saveVersion===10&&runtime.getState().businessStage===stage&&badge?.textContent?.trim()===label;
    },{label:item.label,stage:item.stage});
    const state=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());assert.equal(state.businessStage,item.stage,`${item.label} must load canonical expected business stage`);
    console.log(`[V3-A DEV] ${item.id}: verify visible landing`,await snapshotLanding(page,item.surface));
    try{
      await page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('#garageScreen');return !!el&&!el.hidden});
      console.log(`[V3-A DEV] ${item.id}: garage visible`,await snapshotLanding(page,item.surface));
      if(item.surface==='development')await page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('#talentScreen');return !!el&&!el.hidden});
      else await page.waitForFunction((surface:string)=>{const pane=document.querySelector<HTMLElement>(`[data-base-pane="${surface}"]`);return !!pane&&!pane.hidden},item.surface);
      console.log(`[V3-A DEV] ${item.id}: target surface visible`,await snapshotLanding(page,item.surface));
      await page.waitForFunction(()=>document.querySelector<HTMLElement>('#v3PresetBadge')?.dataset.v3SurfaceStable==='1');
    }catch(error){console.error(`[V3-A DEV] ${item.id}: landing failure`,await snapshotLanding(page,item.surface));throw error}
    if(item.id==='garageDeveloped'){assert.equal(state.midgame.currentZone,'z3');assert.equal(state.midgame.mastery.z1,100);assert.equal(state.midgame.mastery.z2,100);assert.ok(state.midgame.mastery.z3>0&&state.midgame.mastery.z3<100)}
    if(item.id==='industrialStaffing'){assert.equal(state.workforceV3.workers.length,4);assert.equal(state.packD.industrialWorkshopOwned,true);assert.ok(state.workforceV3.workers.some((w:any)=>w.role==='technician'&&w.rank===3));assert.ok(state.workforceV3.workers.some((w:any)=>w.role==='operator'))}
    console.log(`[V3-A DEV] ${item.id}: PASS`);
    await context.close();
  }

  console.log('V3 formal owner-review DEV presets: all four presets survive reload and restore expected visible stage/surface: PASS');
}finally{await browser.close();await stop(proc)}