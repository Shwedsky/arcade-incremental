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
  await context.addInitScript(({key,value})=>{localStorage.setItem(key,JSON.stringify(value))},{key:SAVE_KEY,value:save});
  const page=await context.newPage();await page.goto(`${ORIGIN}/?seed=p5-production-cells`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage==='industrial_workshop');
  const offline=page.locator('#offlineScreen');if(await offline.isVisible())await page.click('#offlineClose');
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseShellNav');

  await openBaseSurface(page,'production');await page.waitForSelector('#productionCellsV1Root:not([hidden])');
  assert.equal(await page.locator('[data-production-cell]').count(),3,'Industrial Workshop must expose exactly the three P5 production cells');
  const surface=await page.locator('#productionCellsV1Root').innerText();assert.match(surface,/Производственный диспетчер/);assert.match(surface,/Refining Cell/);assert.match(surface,/Fabrication Cell/);assert.match(surface,/Heavy Assembly Cell/);assert.match(surface,/Запуск сразу фиксирует входы/);
  assert.equal(await page.locator('[data-pc-plan="fabrication"] option').count(),3,'Fabrication must expose the three purposeful module plans');
  assert.equal(await page.locator('[data-pc-plan="heavy_assembly"] option').count(),2,'Heavy Assembly must expose two late industrial outputs');

  const initial=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  const workers=initial.workforceV3.workers;assert.ok(workers.length>=3,'migrated Workforce V3 roster must supply P5 staffing');
  const refWorker=workers[0],fabWorker=workers[1];
  const before=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(before.cells.find((cell:any)=>cell.id==='refining').status,'ready');assert.equal(before.cells.find((cell:any)=>cell.id==='fabrication').status,'ready');

  // Assign through the player-facing P5 surface. Assignment must detach canonical route work rather than creating a second worker state.
  await page.selectOption('[data-pc-worker="refining"]',refWorker.id);await page.selectOption('[data-pc-role="refining"]','logistician');await page.click('[data-pc-assign="refining"]');
  await page.waitForFunction((id)=>{const worker=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3.workers.find((w:any)=>w.id===id);return worker?.status==='production'&&worker?.productionCellId==='refining'&&worker?.role==='logistician'},refWorker.id);
  await page.selectOption('[data-pc-worker="fabrication"]',fabWorker.id);await page.selectOption('[data-pc-role="fabrication"]','operator');await page.click('[data-pc-assign="fabrication"]');
  await page.waitForFunction((id)=>{const worker=(globalThis as any).__SALVAGE_TEST__.getState().workforceV3.workers.find((w:any)=>w.id===id);return worker?.status==='production'&&worker?.productionCellId==='fabrication'&&worker?.role==='operator'},fabWorker.id);

  const assigned=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(assigned.cells.find((cell:any)=>cell.id==='refining').assignedWorker.role,'logistician');
  assert.equal(assigned.cells.find((cell:any)=>cell.id==='fabrication').assignedWorker.role,'operator');

  // Start two independent cells through the UI and prove real live stock is committed immediately.
  const preStock=assigned.stock;
  await page.click('[data-pc-start="refining"]');await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().productionCellsV1.cells.refining.job!==null);
  await page.click('[data-pc-start="fabrication"]');await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().productionCellsV1.cells.fabrication.job!==null);
  const running=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());
  assert.equal(running.cells.filter((cell:any)=>cell.status==='running').length,2,'two industrial activities must run in parallel');
  assert.equal(running.stock.alloyScrap,preStock.alloyScrap-25,'Refining must consume real Pack C alloy scrap at start');
  assert.equal(running.stock.structuralProfile,preStock.structuralProfile-2,'Fabrication must consume real structural profile at start');
  assert.equal(running.stock.cleanCopper,preStock.cleanCopper-6,'Fabrication must consume real clean copper at start');
  const refJob=running.cells.find((cell:any)=>cell.id==='refining').job,fabJob=running.cells.find((cell:any)=>cell.id==='fabrication').job;
  assert.ok(refJob.endsAt-refJob.startedAt<240_000,'Logistician must measurably shorten Refining cycle');assert.ok(fabJob.endsAt-fabJob.startedAt<360_000,'Operator must measurably shorten Fabrication cycle');

  await page.waitForFunction(()=>document.querySelectorAll('.productionCellCard.status-running').length===2);
  const runningSurface=await page.locator('#productionCellsV1Root').innerText();assert.match(runningSurface,/Входы уже списаны и закреплены за этим циклом/);

  // Overview is no longer a generic four-box mock; it mirrors the same live three-cell state.
  await openBaseSurface(page,'overview');await page.waitForSelector('#baseStageSceneV2.stage-industrial');await page.waitForSelector('[data-industrial-workshop-live]');
  assert.equal(await page.locator('[data-industrial-scene-cell]').count(),3);assert.equal(await page.locator('[data-industrial-scene-cell].running').count(),2);
  const scene=await page.locator('[data-industrial-workshop-live]').innerText();assert.match(scene,/Refining Cell/);assert.match(scene,/Fabrication Cell/);assert.match(scene,/Heavy Assembly Cell/);assert.match(scene,/Recovery Rig/);

  // Exactly-once completion through the runtime bridge and Save V10 persistence.
  const finishAt=Math.max(refJob.endsAt,fabJob.endsAt)+1;const firstComplete=await page.evaluate((t)=>(globalThis as any).__SALVAGE_TEST__.advanceProductionCellsV1To(t),finishAt);assert.equal(firstComplete.length,2);
  const completed=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(completed.stock.reinforcedAlloy,preStock.reinforcedAlloy+18);assert.equal(completed.stock.drive,preStock.drive+1);
  const secondComplete=await page.evaluate((t)=>(globalThis as any).__SALVAGE_TEST__.advanceProductionCellsV1To(t),finishAt+60_000);assert.equal(secondComplete.length,0,'same completed jobs must not pay twice');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await page.reload();await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.productionCellsV1?.cells?.refining?.completedCycles===1);
  const persisted=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(persisted.stock.reinforcedAlloy,preStock.reinforcedAlloy+18);assert.equal(persisted.stock.drive,preStock.drive+1);

  // Phone-sized management keeps a single readable column and live scene identity.
  if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose');await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.setViewportSize({width:390,height:844});await openBaseSurface(page,'production');await page.waitForSelector('#productionCellsV1Root:not([hidden])');
  const rootBox=await page.locator('#productionCellsV1Root').boundingBox();assert.ok(rootBox&&rootBox.width<=390,'Production Cells surface must fit phone viewport');assert.equal(await page.locator('[data-production-cell]').count(),3);

  await context.close();console.log('P5-A/B Production Cells V1 browser acceptance: live stock + staffing + parallel cycles + industrial scene + persistence + mobile PASS');
}finally{await browser.close();await stop(proc)}
