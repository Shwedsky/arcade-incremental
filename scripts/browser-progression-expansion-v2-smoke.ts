import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=41983,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=():ChildProcess=>spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']});
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(p:ChildProcess){if(p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([once(p,'exit'),new Promise(r=>setTimeout(r,1200))]);if(p.exitCode===null)p.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedCtx=await browser.newContext({viewport:{width:1200,height:800}}),seed=await seedCtx.newPage();
  await seed.goto(`${ORIGIN}/?seed=progression-v2-fixture`);await seed.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===9);
  await seed.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seed.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);const base=JSON.parse(raw!);await seedCtx.close();

  // Existing Save V9 keeps old unlocked node IDs and now resolves naturally to L14.
  const legacy=structuredClone(base);legacy.xp=33_000;legacy.talents=['workshop_8','automation_8'];legacy.lastSeen=Date.now();
  const legacyCtx=await browser.newContext({viewport:{width:1280,height:850},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(legacy)}]}]}}),legacyPage=await legacyCtx.newPage();
  await legacyPage.goto(`${ORIGIN}/?seed=progression-v2-legacy`);await legacyPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.level===14);
  let state=await legacyPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(state.saveVersion,9);assert.ok(state.talents.includes('workshop_8'));assert.ok(state.talents.includes('automation_8'));
  await legacyPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.openTalents());
  await legacyPage.waitForSelector('#talentScreen:not([hidden])');
  assert.match(await legacyPage.locator('[data-talent="salvage_8"]').innerText(),/Tier II/);
  assert.match(await legacyPage.locator('[data-talent="salvage_8"]').innerText(),/Нужен фургон/,'Tier II must explain the missing business milestone');
  await legacyPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await legacyPage.reload();await legacyPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.level===14);
  state=await legacyPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());assert.ok(state.talents.includes('workshop_8')&&state.talents.includes('automation_8'),'grandfathered node IDs must survive V9 reload');
  await legacyCtx.close();

  // Mature fixture can buy real Tier-II roots. Van Packing changes actual HUD capacity; Trade Choice renders two offers.
  const mature=structuredClone(base);mature.xp=125_000;mature.lastSeen=Date.now();mature.cash=2_000_000;mature.storage={metal:9999,copper:9999,plastic:9999};
  mature.talents=['salvage_1','salvage_2','salvage_3','salvage_4','salvage_5','salvage_6','salvage_7','logistics_1','logistics_2','logistics_3','logistics_4','trade_1','trade_2','trade_3'];
  mature.midgame.van.owned=true;mature.midgame.worker.hired=true;mature.midgame.worker.lastTick=Date.now();mature.contract={index:0,completed:0};
  const ctx=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(mature)}]}]}}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${ORIGIN}/?seed=progression-v2-live`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.level===30);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.openTalents());await page.waitForSelector('#talentScreen:not([hidden])');
  assert.equal(await page.locator('[data-talent="logistics_8"]').isDisabled(),false);assert.equal(await page.locator('[data-talent="trade_8"]').isDisabled(),false);
  await page.click('[data-talent="logistics_8"]');await page.click('[data-talent="trade_8"]');
  state=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());assert.ok(state.talents.includes('logistics_8')&&state.talents.includes('trade_8'));
  await page.click('#talentsClose');await page.waitForSelector('#talentScreen',{state:'hidden'});
  await page.waitForFunction(()=>document.querySelector('#vanText')?.textContent?.includes('/ 500 кг'));
  assert.match(await page.locator('#vanText').innerText(),/500 кг/,'Van Packing must change real field-buffer capacity');

  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');
  await page.waitForFunction(()=>document.querySelectorAll('#contractPanel [data-contract-offer]').length===2);
  const offers=page.locator('#contractPanel [data-contract-offer]');assert.equal(await offers.count(),2);const names=await offers.locator('h2').allInnerTexts();assert.equal(new Set(names).size,2,'Contract Choice must present two distinct offers');
  const before=Number((await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState().contract.completed))||0);
  const secondButton=offers.nth(1).locator('[data-contract-submit]');assert.equal(await secondButton.isDisabled(),false);await secondButton.click();
  await page.waitForFunction((n:number)=>(globalThis as any).__SALVAGE_TEST__.getState().contract.completed===n+1,before);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),SAVE_KEY);assert.ok(persisted.talents.includes('trade_8'));assert.ok(persisted.contract.recentIds?.length>0);
  assert.deepEqual(errors,[],`Progression Expansion V2 browser proof must not throw: ${errors.join(' | ')}`);
  await ctx.close();
  console.log('Progression Expansion V2 level + milestone + Tier-II browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
