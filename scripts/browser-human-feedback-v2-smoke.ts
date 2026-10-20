import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41973,ORIGIN=`http://127.0.0.1:${PORT}`,PRODISH=`http://0.0.0.0:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','0.0.0.0','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedContext=await browser.newContext({viewport:{width:1000,height:700}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=hf-v2-fixture`);await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate((key)=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical fixture save must exist');const fixture=JSON.parse(raw!);
  fixture.xp=3200;fixture.cash=10_000;fixture.storage={metal:90,copper:20,plastic:20};fixture.components={bearing:5,motor:2,hydraulic:2,electronics:2};fixture.installed=['workbench','press'];fixture.machineLevels={workbench:1,press:1,wire:1,plastic:1};fixture.equipmentLevels={tool:1,cart:1};fixture.contract={index:0,completed:0};fixture.scheduler={actions:[],lastAdvancedAt:Date.now()};fixture.lastSeen=Date.now();await seedContext.close();

  const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=hf-v2-smoke`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.xp===3200);
  assert.match((await page.locator('#garage').innerText()).trim(),/^На базу/,'field return button must be renamed to На базу');assert.equal(await page.locator('#hfDevToggle').count(),1,'local manual review must expose DEV panel');
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(page,'production');

  // Occupy the only workshop slot, then reserve a workbench upgrade behind it.
  await page.click('[data-equipment-upgrade="tool"]');await page.click('[data-machine="workbench"]');await page.click('#upgradeMachine');
  await page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState();return s.scheduler.actions.some((a:any)=>a.kind==='equipment'&&a.status==='active')&&s.scheduler.actions.some((a:any)=>a.kind==='upgrade_machine'&&a.status==='waiting')});
  await openBaseSurface(page,'storage');await page.waitForFunction(()=>document.querySelector('#storage [data-hf-slot="metal"] .hfReservationLine')?.textContent?.includes('40.0'));
  assert.match(await page.locator('#storage [data-hf-slot="metal"] strong').innerText(),/^25\.0 кг$/,'90 - active tool 25 - waiting bench reservation 40 = 25 available metal');assert.match(await page.locator('#storage [data-hf-slot="metal"] .hfReservationLine').innerText(),/В очереди: 40\.0 кг/);

  // Contract V3 must use exactly the same reservation ledger. Raw storage is 65 kg,
  // but only 25 kg is sellable while the waiting upgrade owns the other 40 kg.
  await openBaseSurface(page,'contracts');await page.waitForSelector('[data-standing-buyer="standing_metal"]');
  const metalBuyer=page.locator('[data-standing-buyer="standing_metal"]');await page.waitForFunction(()=>document.querySelector('[data-standing-buyer="standing_metal"]')?.textContent?.includes('В очереди 40'));
  assert.match(await metalBuyer.innerText(),/Свободно\s*25 кг/,'standing buyer must expose only unreserved metal');assert.match(await metalBuyer.innerText(),/В очереди 40 кг/,'standing buyer must explain protected queue inventory');
  const standingAmount=metalBuyer.locator('[data-standing-amount="standing_metal"]');assert.equal(Number(await standingAmount.getAttribute('max')),25,'Contract V3 input max must equal the free balance');await metalBuyer.locator('[data-standing-max="standing_metal"]').click();assert.equal(Number(await standingAmount.inputValue()),25,'MAX must never include queued reservations');

  // Picker value must survive the garage's 1-second rerender and enqueue the requested count.
  await openBaseSurface(page,'production');await page.click('[data-machine="press"]');await page.waitForSelector('#processBatchNumber');await page.locator('#processBatchNumber').fill('7');await page.locator('#processBatchNumber').dispatchEvent('input');await page.waitForTimeout(1400);
  assert.equal(await page.locator('#processBatchNumber').inputValue(),'7','numeric batch picker must not snap back to 1 after garage rerender');assert.equal(await page.locator('#processBatchRange').inputValue(),'7','slider and numeric batch picker stay synchronized');assert.match(await page.locator('#processMachine').innerText(),/×7/);await page.click('#processMachine');await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().scheduler.actions.some((a:any)=>a.kind==='process_batch'&&a.requestedCount===7));
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.hfQueueReservation')).some(el=>el.textContent?.includes('Зарезервировано')));

  await context.close();const prodContext=await browser.newContext({viewport:{width:1200,height:800}}),prodPage=await prodContext.newPage();await prodPage.goto(`${PRODISH}/?seed=hf-v2-prod-host`);await prodPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);assert.equal(await prodPage.locator('#hfDevToggle').count(),0,'DEV panel must not appear on non-localhost production-like hostname');await prodContext.close();
  console.log('Human Feedback V2 reservations + Contract V3 protection + sticky batch + local DEV browser smoke: PASS');
}finally{await browser.close();await stop(proc)}
