import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=41974,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedContext=await browser.newContext({viewport:{width:1440,height:900}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=base-shell-seed`);
  await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical Save V10 fixture must exist');
  const canonical=JSON.parse(raw!);await seedContext.close();

  const openFixture=async(fixture:any,seed:string)=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}}),page=await context.newPage();
    await page.goto(`${ORIGIN}/?seed=${seed}`);
    await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
    await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');
    await page.waitForSelector('#baseShellNav');
    await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.refresh?.());
    await page.waitForFunction(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.()!=null);
    return{context,page};
  };

  const starter=structuredClone(canonical);starter.xp=0;starter.installed=['workbench'];starter.machineLevels={workbench:1};starter.midgame.van={...starter.midgame.van,owned:false};starter.midgame.worker={...starter.midgame.worker,hired:false,assignment:null};starter.packB.hangarOwned=false;starter.packC.salvageYardOwned=false;starter.packD.industrialWorkshopOwned=false;starter.packE.processingPlantOwned=false;
  const a=await openFixture(starter,'base-shell-starter');
  assert.equal(await a.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'starter_garage');
  assert.match(await a.page.locator('#baseStageTitle').innerText(),/Стартовый гараж/);
  assert.equal(await a.page.locator('[data-base-surface="crew"]').isHidden(),true);
  assert.equal(await a.page.locator('[data-base-surface="logistics"]').isHidden(),true);
  await a.page.click('[data-base-surface="production"]');assert.equal(await a.page.locator('[data-base-pane="production"]').isVisible(),true);assert.equal(await a.page.locator('#machineGrid').isVisible(),true);
  await a.page.click('[data-base-surface="storage"]');assert.equal(await a.page.locator('#storage').isVisible(),true);
  await a.page.click('[data-base-surface="contracts"]');assert.equal(await a.page.locator('#contractPanel').isVisible(),true);
  await a.page.click('[data-base-surface="development"]');await a.page.waitForSelector('#talentScreen:not([hidden])');await a.page.click('#talentsClose');
  await a.context.close();

  const equipped=structuredClone(starter);equipped.installed=['workbench','press'];equipped.machineLevels={workbench:1,press:1};
  const b=await openFixture(equipped,'base-shell-equipped');assert.equal(await b.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'equipped_garage');assert.match(await b.page.locator('#baseStageTitle').innerText(),/Рабочий гараж/);assert.equal(await b.page.locator('[data-base-surface="logistics"]').isVisible(),true,'Logistics must be reachable before first Van purchase');assert.equal(await b.page.locator('[data-base-surface="crew"]').isVisible(),true,'Crew must be reachable before first worker hire');await b.page.click('[data-base-surface="logistics"]');assert.equal(await b.page.locator('#transportPanel').isVisible(),true);await b.page.click('[data-base-surface="crew"]');assert.equal(await b.page.locator('#workerPanel').isVisible(),true);await b.context.close();

  const workforce=structuredClone(equipped);workforce.midgame.van={...workforce.midgame.van,owned:true};workforce.midgame.worker={...workforce.midgame.worker,hired:true,assignment:'z1',lastTick:Date.now()};
  const c=await openFixture(workforce,'base-shell-workforce');assert.equal(await c.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'workforce_garage');assert.equal(await c.page.locator('[data-base-surface="crew"]').isVisible(),true);assert.equal(await c.page.locator('[data-base-surface="logistics"]').isVisible(),true);await c.page.click('[data-base-surface="crew"]');assert.equal(await c.page.locator('#workerPanel').isVisible(),true);await c.page.click('[data-base-surface="logistics"]');assert.equal(await c.page.locator('#transportPanel').isVisible(),true);await c.context.close();

  const hangar=structuredClone(workforce);hangar.packB.hangarOwned=true;
  const d=await openFixture(hangar,'base-shell-hangar');assert.equal(await d.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'hangar');assert.match(await d.page.locator('.garageBox > header h1').innerText(),/^Ангар$/);await d.context.close();

  const plant=structuredClone(hangar);plant.packC.salvageYardOwned=true;plant.packD.industrialWorkshopOwned=true;plant.packE.processingPlantOwned=true;plant.packE.plantLines=2;plant.packE.production=[];
  const e=await openFixture(plant,'base-shell-plant');assert.equal(await e.page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.getStage()),'processing_plant');assert.match(await e.page.locator('#baseStageTitle').innerText(),/Перерабатывающий завод/);assert.match(await e.page.locator('[data-base-pane="overview"]').innerText(),/Текущая вершина бизнес-лестницы/);await e.context.close();

  console.log('Base Shell V1 stage-aware navigation browser smoke: PASS');
}finally{await browser.close();await stop(proc)}
