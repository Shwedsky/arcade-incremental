import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41992,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function startProductionCell(page:any,id:'refining'|'fabrication'|'heavy_assembly'){
  await page.evaluate((cellId:string)=>{
    const button=document.querySelector<HTMLButtonElement>(`[data-pc-start="${cellId}"]`);
    if(!button)throw new Error(`missing production start control: ${cellId}`);
    if(button.disabled)throw new Error(`production start control is disabled before click: ${cellId}`);
    button.click();
  },id);
  await page.waitForFunction((cellId:string)=>(globalThis as any).__SALVAGE_TEST__.getState().productionCellsV1.cells[cellId].job!==null,id);
}

const now=Date.now();
const save={
  v:7,xp:100_000,storage:{metal:9000,copper:500,plastic:400},components:{bearing:20,motor:20,hydraulic:20,electronics:20},processed:{briquette:1500,cleanCopper:700,granulate:120},cash:5_000_000,
  installed:['workbench','press','wire','plastic'],machineLevels:{workbench:2,press:3,wire:3,plastic:2},talents:['automation_1','automation_2','automation_3','automation_4','automation_5','automation_6','automation_7','automation_8'],equipmentLevels:{tool:7,cart:7},jobs:[],contract:{index:0,completed:0},totalDestroyed:12000,lastSeen:now,
  midgame:{currentZone:'z7',mastery:{z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100},discoveredComponents:['bearing','motor','electronics','hydraulic'],discoveredMidComponents:['pump','compressor'],midComponents:{pump:8,compressor:5},pity:{pump:0,compressor:0},van:{owned:true,resources:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},midComponents:{pump:0,compressor:0}},worker:{hired:true,assignment:'z1',lastTick:now}},
  packB:{materials:{aluminiumScrap:0,steelBlank:300,aluminiumBillet:0},industrial:{gearbox:10,generator:10},discoveredIndustrial:['gearbox','generator'],pity:{gearbox:0,generator:0},modules:{drive:12,control:16,structural:10},hangarOwned:true,truck:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0},secondWorker:{hired:true,assignment:'z2',lastTick:now}},
  packC:{materials:{alloyScrap:500,alloyBillet:500},industrial:{industrialController:12,heavyHydraulicCylinder:12},discoveredIndustrial:['industrialController','heavyHydraulicCylinder'],pity:{industrialController:0,heavyHydraulicCylinder:0},modules:{hydraulicPower:12,heavyFrame:12},salvageYardOwned:true,production:null,crew3:{hired:true,role:'scavenger',assignment:'z5',lastTick:now}},
  packD:{recoveryAssemblies:0,recoveryPity:0,recoveryRig:{owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0,alloyScrap:0},industrialWorkshopOwned:true,productionCells:2,crew4:{hired:false,role:'scavenger',assignment:null,operatorCell:null,lastTick:now}}
};

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value))},{key:SAVE_KEY,value:save});
  const page=await context.newPage();await page.goto(`${ORIGIN}/?seed=p5-production-cells`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage==='industrial_workshop');
  const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose');
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseShellNav');

  await openBaseSurface(page,'production');await page.waitForSelector('#productionCellsV1Root:not([hidden])');
  assert.equal(await page.locator('[data-production-cell]').count(),3,'Industrial Workshop must expose exactly the three P5 production cells');
  const surface=await page.locator('#productionCellsV1Root').innerText();assert.match(surface,/Производственный диспетчер/);assert.match(surface,/Участок подготовки сырья/);assert.match(surface,/Сборочный участок/);assert.match(surface,/Участок тяжёлой сборки/);assert.match(surface,/Запуск сразу фиксирует входы/);
  assert.equal(await page.locator('[data-pc-plan="fabrication"] option').count(),3,'Fabrication must expose the three purposeful module plans');
  assert.equal(await page.locator('[data-pc-plan="heavy_assembly"] option').count(),2,'Heavy Assembly must expose two late industrial outputs');

  const initial=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const workers=initial.workforceV3.workers;assert.ok(workers.length>=3,'migrated Workforce V3 roster must supply P5 staffing');
  const refWorker=workers[0],fabWorker=workers[1],heavyWorker=workers[2];
  const before=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(before.cells.find((cell:any)=>cell.id==='refining').status,'ready');assert.equal(before.cells.find((cell:any)=>cell.id==='fabrication').status,'ready');assert.equal(before.cells.find((cell:any)=>cell.id==='heavy_assembly').status,'ready');
  assert.equal(before.heavySupport.kind,'recovery_rig','free canonical Recovery Rig must be visible to Heavy Assembly');assert.ok(before.heavySupport.vehicleId);
  await page.waitForFunction(()=>document.querySelector('[data-production-cell="heavy_assembly"] .pcHeavySupport')?.textContent?.includes('−15%'));

  // Assign all three production roles through the player-facing surface. Canonical Workforce V3 remains the only worker state.
  await page.selectOption('[data-pc-worker="refining"]',refWorker.id);await page.selectOption('[data-pc-role="refining"]','logistician');await page.click('[data-pc-assign="refining"]');
  await page.waitForFunction((id)=>{const worker=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3.workers.find((w:any)=>w.id===id);return worker?.status==='production'&&worker?.productionCellId==='refining'&&worker?.role==='logistician'},refWorker.id);
  await page.selectOption('[data-pc-worker="fabrication"]',fabWorker.id);await page.selectOption('[data-pc-role="fabrication"]','operator');await page.click('[data-pc-assign="fabrication"]');
  await page.waitForFunction((id)=>{const worker=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3.workers.find((w:any)=>w.id===id);return worker?.status==='production'&&worker?.productionCellId==='fabrication'&&worker?.role==='operator'},fabWorker.id);
  await page.selectOption('[data-pc-worker="heavy_assembly"]',heavyWorker.id);await page.selectOption('[data-pc-role="heavy_assembly"]','technician');await page.click('[data-pc-assign="heavy_assembly"]');
  await page.waitForFunction((id)=>{const worker=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3.workers.find((w:any)=>w.id===id);return worker?.status==='production'&&worker?.productionCellId==='heavy_assembly'&&worker?.role==='technician'},heavyWorker.id);

  const assigned=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(assigned.cells.find((cell:any)=>cell.id==='refining').assignedWorker.role,'logistician');assert.equal(assigned.cells.find((cell:any)=>cell.id==='fabrication').assignedWorker.role,'operator');assert.equal(assigned.cells.find((cell:any)=>cell.id==='heavy_assembly').assignedWorker.role,'technician');

  // Trigger the real player-facing controls from the DOM, then assert domain state.
  // Using HTMLElement.click() avoids Playwright retrying a locator that is intentionally
  // destroyed and recreated immediately after the successful start action.
  const preStock=assigned.stock;
  await startProductionCell(page,'refining');
  await startProductionCell(page,'fabrication');
  await startProductionCell(page,'heavy_assembly');
  const running=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(running.cells.filter((cell:any)=>cell.status==='running').length,3,'all three industrial activities must be able to run in parallel');
  assert.equal(running.stock.alloyScrap,preStock.alloyScrap-25,'Refining must consume real Pack C alloy scrap at start');assert.equal(running.stock.reinforcedAlloy,preStock.reinforcedAlloy-8,'Heavy Assembly must consume real reinforced alloy at start');
  assert.equal(running.stock.structuralProfile,preStock.structuralProfile-12,'Fabrication + Heavy Assembly must share and commit the same structural profile stock');assert.equal(running.stock.cleanCopper,preStock.cleanCopper-6,'Fabrication must consume real clean copper at start');
  const refJob=running.cells.find((cell:any)=>cell.id==='refining').job,fabJob=running.cells.find((cell:any)=>cell.id==='fabrication').job,heavyJob=running.cells.find((cell:any)=>cell.id==='heavy_assembly').job;
  assert.ok(refJob.endsAt-refJob.startedAt<240_000,'Logistician must measurably shorten Refining cycle');assert.ok(fabJob.endsAt-fabJob.startedAt<360_000,'Operator must measurably shorten Fabrication cycle');assert.ok(heavyJob.endsAt-heavyJob.startedAt<480_000*.9,'Technician + Recovery Rig must materially shorten Heavy Assembly');
  assert.equal(heavyJob.support.kind,'recovery_rig');assert.equal(heavyJob.support.vehicleId,before.heavySupport.vehicleId);assert.equal(heavyJob.support.durationFactor,.85);

  await page.waitForFunction(()=>document.querySelectorAll('.productionCellCard.status-running').length===3);await page.waitForFunction(()=>document.querySelector('[data-production-cell="heavy_assembly"] .pcHeavySupport.active')?.textContent?.includes('поддержала запуск'));
  const runningSurface=await page.locator('#productionCellsV1Root').innerText();assert.match(runningSurface,/Входы уже списаны и закреплены за этим циклом/);assert.match(runningSurface,/Тяжёлая эвакуационная платформа/);assert.match(runningSurface,/−15%/);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const offlineRaw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(offlineRaw,'running P5 Save V10 fixture must exist');const offlineFixture=JSON.parse(offlineRaw!);const offlineBaseline={reinforcedAlloy:running.stock.reinforcedAlloy,drive:running.stock.drive,hydraulicPower:running.stock.hydraulicPower};

  // Overview is no longer a generic four-box mock; it mirrors the same live three-cell state.
  await openBaseSurface(page,'overview');await page.waitForSelector('#baseStageSceneV2.stage-industrial');await page.waitForSelector('[data-industrial-workshop-live]');await page.waitForFunction(()=>document.querySelector('.industrialHeavyGate')?.textContent?.includes('−15%'));
  assert.equal(await page.locator('[data-industrial-scene-cell]').count(),3);assert.equal(await page.locator('[data-industrial-scene-cell].running').count(),3);
  const scene=await page.locator('[data-industrial-workshop-live]').innerText();assert.match(scene,/Участок подготовки сырья/);assert.match(scene,/Сборочный участок/);assert.match(scene,/Участок тяжёлой сборки/);assert.match(scene,/Тяжёлая эвакуационная платформа/);assert.match(scene,/−15%/);

  // Exactly-once completion through the runtime bridge and Save V10 persistence.
  const finishAt=Math.max(refJob.endsAt,fabJob.endsAt,heavyJob.endsAt)+1;const firstComplete=await page.evaluate((t)=>(globalThis as any).__SALVAGE_TEST__.advanceProductionCellsV1To(t),finishAt);assert.equal(firstComplete.length,3);
  const completed=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(completed.stock.reinforcedAlloy,preStock.reinforcedAlloy+10,'Refining +18 and Heavy -8 must reconcile in the shared stock');assert.equal(completed.stock.drive,preStock.drive+1);assert.equal(completed.stock.hydraulicPower,preStock.hydraulicPower+1);
  const secondComplete=await page.evaluate((t)=>(globalThis as any).__SALVAGE_TEST__.advanceProductionCellsV1To(t),finishAt+60_000);assert.equal(secondComplete.length,0,'same completed jobs must not pay twice');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await page.reload();await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.productionCellsV1?.cells?.heavy_assembly?.completedCycles===1);
  const persisted=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(persisted.stock.reinforcedAlloy,preStock.reinforcedAlloy+10);assert.equal(persisted.stock.drive,preStock.drive+1);assert.equal(persisted.stock.hydraulicPower,preStock.hydraulicPower+1);

  // Phone-sized management keeps a single readable column and the same three canonical cells.
  if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose');await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.setViewportSize({width:390,height:844});await openBaseSurface(page,'production');await page.waitForSelector('#productionCellsV1Root:not([hidden])');
  const rootBox=await page.locator('#productionCellsV1Root').boundingBox();assert.ok(rootBox&&rootBox.width<=390,'Production Cells surface must fit phone viewport');assert.equal(await page.locator('[data-production-cell]').count(),3);
  await context.close();

  // P5-D: prove the normal startup offline pipeline completes the same persisted jobs exactly once.
  const past=Date.now()-3_600_000;offlineFixture.lastSeen=past;if(offlineFixture.workforceV3)offlineFixture.workforceV3.lastSimulatedAt=Date.now();
  for(const cell of Object.values(offlineFixture.productionCellsV1.cells) as any[]){if(!cell.job)continue;cell.job.startedAt=past-600_000;cell.job.endsAt=past+60_000}
  const offlineContext=await browser.newContext({viewport:{width:1440,height:1000},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(offlineFixture)}]}]}}),offlinePage=await offlineContext.newPage();
  await offlinePage.goto(ORIGIN+'/?seed=p5-production-offline');await offlinePage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage==='industrial_workshop');await offlinePage.waitForSelector('#offlineScreen:not([hidden])');await offlinePage.waitForSelector('.offlineProductionCellsV1 li');
  const offlineText=await offlinePage.locator('#offlineLoot').innerText();assert.match(offlineText,/Промышленная мастерская/);assert.match(offlineText,/Усиленный сплав/);assert.match(offlineText,/Приводной модуль/);assert.match(offlineText,/Гидравлический силовой модуль/);
  const offlineView=await offlinePage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(offlineView.cells.every((cell:any)=>cell.job===null),true,'startup offline must clear completed jobs');assert.equal(offlineView.cells.every((cell:any)=>cell.status!=='running'),true);assert.equal(offlineView.stock.reinforcedAlloy,offlineBaseline.reinforcedAlloy+18);assert.equal(offlineView.stock.drive,offlineBaseline.drive+1);assert.equal(offlineView.stock.hydraulicPower,offlineBaseline.hydraulicPower+1);
  const completedCycles=await offlinePage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState().productionCellsV1.cells);assert.equal(completedCycles.refining.completedCycles,1);assert.equal(completedCycles.fabrication.completedCycles,1);assert.equal(completedCycles.heavy_assembly.completedCycles,1);
  await offlinePage.click('#offlineClose');const once=JSON.stringify({stock:offlineView.stock,cycles:Object.fromEntries(Object.entries(completedCycles).map(([id,cell]:any)=>[id,cell.completedCycles]))});await offlinePage.reload();await offlinePage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.productionCellsV1);const twice=await offlinePage.evaluate(()=>{const api=(globalThis as any).__SALVAGE_TEST__,view=api.getProductionCellsV1View(),cells=api.getState().productionCellsV1.cells;return JSON.stringify({stock:view.stock,cycles:Object.fromEntries(Object.entries(cells).map(([id,cell]:any)=>[id,cell.completedCycles]))})});assert.equal(twice,once,'second startup must not duplicate already-completed P5 jobs');await offlineContext.close();

  console.log('P5-A-D Production Cells V1 browser acceptance: live stock + Logistician/Operator/Technician + 3 parallel cells + Recovery Rig + scene + Save V10 startup-offline exactly-once + mobile PASS');
}finally{await browser.close();await stop(proc)}