import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41994,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`server did not start\n${output}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function state(page:any){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState())}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}
async function waitGame(page:any){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page)}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:980}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=owner-feedback-v5`);await waitGame(page);
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');

  // Reach a mature legal state through the same owner DEV control used in manual review.
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  await Promise.all([page.waitForLoadState('load'),page.click('[data-dev="unlockAll"]')]);await waitGame(page);
  await page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState();return s.level===50&&s.workforceV3?.workers?.length>=3&&s.workforceV3?.fleet?.length>=3});
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');

  // OWNER BUG: Crew cards/selects used to be destroyed/recreated every 250ms and
  // again by the legacy Garage renderer, making assignment practically impossible.
  await openBaseSurface(page,'crew');await page.waitForSelector('#workforceV3Root .v3WorkerCard');
  let s=await state(page);const workerId=s.workforceV3.workers.find((w:any)=>w.status==='idle')?.id??s.workforceV3.workers[0].id;
  const zoneSelector=`[data-v3-zone="${workerId}"]`,vehicleSelector=`[data-v3-vehicle="${workerId}"]`;
  await page.selectOption(zoneSelector,'z1');
  await page.evaluate((selector)=>{(globalThis as any).__OWNER_STABLE_SELECT__=document.querySelector(selector)},zoneSelector);
  await page.waitForTimeout(1700); // longer than both V3 refresh and legacy garage render intervals
  assert.equal(await page.evaluate((selector)=>document.querySelector(selector)===(globalThis as any).__OWNER_STABLE_SELECT__,zoneSelector),true,'Crew zone select must survive live refresh instead of blinking/recreating');
  assert.equal(await page.locator(zoneSelector).inputValue(),'z1','user selection must survive live metrics refresh');
  s=await state(page);const freeVan=s.workforceV3.fleet.find((v:any)=>v.type==='van'&&!v.routeId);assert.ok(freeVan,'mature fixture needs a free Van');
  await page.selectOption(vehicleSelector,freeVan.id);await page.click(`[data-v3-assign="${workerId}"]`);
  await page.waitForFunction((id)=>((globalThis as any).__SALVAGE_TEST__.getState().workforceV3.routes??[]).some((r:any)=>r.workerIds.includes(id)),workerId);
  s=await state(page);let route=s.workforceV3.routes.find((r:any)=>r.workerIds.includes(workerId));assert.equal(route.zone,'z1');assert.equal(route.vehicleId,freeVan.id,'assignment must be possible through stable Crew UI');

  // OWNER REQUEST: fleet slots must never dead-end because they were filled with Vans.
  await openBaseSurface(page,'logistics');await page.waitForSelector('#fleetV3Root');
  const buyVan=page.locator('[data-v3-buy-vehicle="van"]');assert.equal(await buyVan.count(),1);await buyVan.click();
  await page.waitForFunction(()=>((globalThis as any).__SALVAGE_TEST__.getState().workforceV3.fleet??[]).filter((v:any)=>v.type==='van').length>=2);
  s=await state(page);const sellableVan=s.workforceV3.fleet.find((v:any)=>v.type==='van'&&!v.routeId);assert.ok(sellableVan&&sellableVan.id!==freeVan.id,'new/free Van must be sellable');
  const fleetBefore=s.workforceV3.fleet.length,cashBefore=s.cash;
  page.once('dialog',dialog=>dialog.accept());await page.click(`[data-v3-sell-vehicle="${sellableVan.id}"]`);
  await page.waitForFunction(({id,count})=>{const s=(globalThis as any).__SALVAGE_TEST__.getState();return s.workforceV3.fleet.length===count-1&&!s.workforceV3.fleet.some((v:any)=>v.id===id)},{id:sellableVan.id,count:fleetBefore});
  s=await state(page);assert.equal(s.cash,cashBefore+54_000,'Van sale must refund 60% of 90k purchase price');
  assert.equal(await page.locator(`[data-vehicle-card="${freeVan.id}"] [data-v3-sell-vehicle]`).count(),0,'assigned vehicle cannot be sold until removed from route');

  // OWNER CONFUSION: color must mean state only; Tier is explained separately.
  // V3-A fog-of-knowledge is allowed to hide later-tier real nodes, so this proof
  // verifies the CSS state contract without forcing hidden Tier II content visible.
  await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.open('development'));await page.waitForSelector('#talentScreen:not([hidden])');await page.waitForSelector('#talentImpactV4 .talentStateLegend');
  const legend=await page.locator('.talentStateLegend').innerText();assert.match(legend,/Зелёный.*изучено/s);assert.match(legend,/Золотой.*можно купить/s);assert.match(legend,/Серый.*закрыто/s);assert.match(legend,/Этап I \/ II \/ III.*этап развития/s);
  assert.ok(await page.locator('.talentNode.unlocked:visible').count()>0,'mature fixture must show at least one learned talent');
  const colors=await page.evaluate(()=>{const host=document.createElement('div'),one=document.createElement('button'),two=document.createElement('button');host.style.cssText='position:fixed;left:-10000px;top:-10000px';one.className='talentNode tier1 unlocked';two.className='talentNode tier2 unlocked';host.append(one,two);document.body.append(host);const result=[getComputedStyle(one).backgroundColor,getComputedStyle(two).backgroundColor];host.remove();return result});assert.equal(colors[0],colors[1],'learned Tier I and Tier II nodes must share the same state color even when fog hides a future real node');
  await page.click('#talentsClose');

  // OWNER REQUEST: a 100%-mastered zone must stay alive while the cart has room,
  // even without the old full-clear medal requirement. Walk the actual character
  // until real combat breaks one object; then prove that the mastered-zone runtime
  // replenishes that deficit. This avoids a fake test-only destroy shortcut.
  await page.evaluate((key)=>{(globalThis as any).__SALVAGE_PLATFORM__.forceSave();const raw=localStorage.getItem(key);if(!raw)throw new Error('save missing');const save=JSON.parse(raw);save.midgame.currentZone='z1';save.midgame.mastery={...save.midgame.mastery,z1:100};save.midgame.economyV2={...save.midgame.economyV2,medals:{...(save.midgame.economyV2?.medals??{}),z1:false}};save.lastSeen=Date.now();localStorage.setItem(key,JSON.stringify(save))},SAVE_KEY);
  await page.reload();await waitGame(page);await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.selectZone('z1'));await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.click('#next');
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().alive>20);const initialAlive=(await state(page)).alive;
  let sawRealBreak=false;
  for(const key of ['d','s','a','w','d','s']){
    await page.keyboard.down(key);
    try{await page.waitForFunction((initial)=>(globalThis as any).__SALVAGE_TEST__.getState().alive<initial,initialAlive,{timeout:2200});sawRealBreak=true}catch{}
    finally{await page.keyboard.up(key)}
    if(sawRealBreak)break;
  }
  assert.equal(sawRealBreak,true,'real movement/combat on mastered Z1 must be able to destroy salvage');
  const aliveAfterBreak=(await state(page)).alive;assert.ok(aliveAfterBreak<initialAlive,'test needs a real field deficit before checking respawn');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceRespawnTick());
  await page.waitForFunction((before)=>(globalThis as any).__SALVAGE_TEST__.getState().alive>before,aliveAfterBreak,{timeout:2500});
  const aliveAfterRespawn=(await state(page)).alive;assert.ok(aliveAfterRespawn>aliveAfterBreak,'100% mastered zone must replenish destroyed objects while cart has room');

  // OWNER REQUEST: full DEV reset must be obvious and really start progression over.
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  const reset=page.locator('[data-dev="reset"]');assert.equal(await reset.count(),1);assert.match(await reset.innerText(),/Сбросить ВЕСЬ прогресс/);
  page.once('dialog',dialog=>dialog.accept());await reset.click();
  await page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__?.getState?.();return s?.level===1&&s?.workforceV3?.workers?.length===0&&!s?.packE?.processingPlantOwned},{timeout:12_000});
  s=await state(page);assert.equal(s.level,1);assert.equal(s.workforceV3.workers.length,0);assert.equal(s.packE.processingPlantOwned,false);

  console.log('Owner Feedback V5 browser acceptance: stable Crew UI + route assignment + fleet resale + talent legend + mastered respawn + full DEV reset: PASS');
  await context.close();
}finally{await browser.close();await stopServer()}
