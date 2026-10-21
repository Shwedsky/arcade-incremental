import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=42006,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`server did not start\n${output}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function waitGame(page:any){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10,undefined,{timeout:20_000});if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose');await page.waitForFunction(()=>(globalThis as any).__SALVAGE_OWNER_V6__?.refresh,undefined,{timeout:20_000})}
async function state(page:any){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState())}
async function forceGarage(page:any){const hidden=await page.locator('#garageScreen').getAttribute('hidden');if(hidden!==null)await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');await page.evaluate(()=>(globalThis as any).__SALVAGE_OWNER_V6__.refresh())}
async function unlockAll(page:any){
  await forceGarage(page);await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');
  const mainFrame=page.mainFrame();const navigated=page.waitForEvent('framenavigated',(frame:any)=>frame===mainFrame,{timeout:20_000});
  await page.click('[data-dev="unlockAll"]');await navigated;await page.waitForLoadState('load');await waitGame(page);
  await page.waitForFunction(()=>{const s=(globalThis as any).__SALVAGE_TEST__.getState();return s.level===50&&s.packE?.processingPlantOwned&&s.workforceV3?.workers?.length>=3},undefined,{timeout:20_000});
  await forceGarage(page)
}
async function mutateSave(page:any,mutatorSource:string){
  await page.evaluate(({key,source})=>{
    (globalThis as any).__SALVAGE_PLATFORM__.forceSave();
    const raw=localStorage.getItem(key);if(!raw)throw new Error('save missing');
    const save=JSON.parse(raw);(0,eval)(`(${source})(save)`);save.lastSeen=Date.now();localStorage.setItem(key,JSON.stringify(save));
  },{key:SAVE_KEY,source:mutatorSource});
  await page.reload();await waitGame(page);await forceGarage(page);
}

await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(10_000);
  page.on('pageerror',(error:any)=>console.error('PAGE ERROR:',error));
  console.log('V6 browser: boot and unlock');
  await page.goto(`${ORIGIN}/?seed=owner-review-v6`);await waitGame(page);await unlockAll(page);

  console.log('V6 browser: standing order');
  await openBaseSurface(page,'contracts');await page.waitForSelector('.contractV3');
  const standing=page.locator('.standingBuyer.ready [data-standing-submit]').first();assert.equal(await standing.count(),1,'mature state needs a ready standing buyer');
  let before=await state(page);const standingCash=before.cash;await standing.click();
  await page.waitForFunction((cash)=>((globalThis as any).__SALVAGE_TEST__.getState().cash)>cash,standingCash);
  assert.match(await page.locator('#ownerV6Notice').innerText(),/Отгружено|покупател|получено/i,'first standing-order click must show feedback');

  // Replenish through the legal DEV fixture so the special-order assertion is independent
  // from whichever resource the standing buyer just consumed.
  console.log('V6 browser: refresh mature fixture for special order');
  await unlockAll(page);await openBaseSurface(page,'contracts');await page.waitForSelector('.contractV3');
  console.log('V6 browser: special order');
  await page.waitForSelector('.specialOrder.ready [data-special-submit]');
  const special=page.locator('.specialOrder.ready [data-special-submit]').first();before=await state(page);const specialCash=before.cash;await special.click();
  await page.waitForFunction((cash)=>((globalThis as any).__SALVAGE_TEST__.getState().cash)>cash,specialCash);
  assert.match(await page.locator('#ownerV6Notice').innerText(),/Спецзаказ.*сдан|заказ.*сдан/i,'first special-order click must show feedback');

  console.log('V6 browser: localization sweep');
  const banned=/Processing Plant|Industrial Workshop|Salvage Yard|Recovery Rig|Workshop Queue|Production Cells|Refining Cell|Fabrication Cell|Heavy Assembly Cell|\bOPERATOR\b|\bOperator\b|\bScavenger\b|Truck conversion|Plant-линии|HEAVY BAY|\bTier (?:I|II|III)\b/;
  for(const surface of ['overview','production','storage','contracts','crew','logistics'] as const){
    await openBaseSurface(page,surface);await page.evaluate(()=>(globalThis as any).__SALVAGE_OWNER_V6__.refresh());await page.waitForTimeout(50);
    const text=await page.locator(`[data-base-pane="${surface}"]:not([hidden])`).innerText();
    assert.doesNotMatch(text,banned,`surface ${surface} must be player-facing Russian`);
  }
  await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.open('development'));await page.waitForSelector('#talentScreen:not([hidden])');await page.evaluate(()=>(globalThis as any).__SALVAGE_OWNER_V6__.refresh());await page.waitForTimeout(50);
  assert.doesNotMatch(await page.locator('#talentScreen').innerText(),banned,'talent UI must be player-facing Russian');
  await page.click('#talentsClose');

  console.log('V6 browser: plant clarity');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__.open('overview'));await page.waitForSelector('[data-base-pane="overview"]:not([hidden])');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_OWNER_V6__.refresh());
  assert.ok(await page.locator('#baseStageSceneV2.stage-plant .ownerPlantLegend').count(),'plant scene needs an explicit legend');
  assert.equal(await page.locator('#baseStageSceneV2.stage-plant .ownerPlantLineStatus').count(),2,'both plant lines need explicit state labels');

  console.log('V6 browser: insufficient training feedback');
  await mutateSave(page,`save=>{save.cash=0}`);
  await openBaseSurface(page,'crew');let s=await state(page);const worker=s.workforceV3.workers.find((w:any)=>w.rank<5);assert.ok(worker,'fixture needs a trainable worker');
  const train=page.locator(`[data-v3-train="${worker.id}"]`);assert.equal(await train.isDisabled(),false,'training must not silently dead-end behind a disabled button');
  const rankBefore=worker.rank;await train.click();await page.waitForSelector('#ownerV6Notice.show');
  assert.match(await page.locator('#ownerV6Notice').innerText(),/Не хватает .*₽.*обучен|обучен.*Не хватает .*₽/i);
  s=await state(page);assert.equal(s.workforceV3.workers.find((w:any)=>w.id===worker.id).rank,rankBefore,'failed training must not change rank');

  console.log('V6 browser: Hangar Overview gate');
  await mutateSave(page,`save=>{
    save.cash=1_000_000;
    save.packB.hangarOwned=false;
    save.packC.salvageYardOwned=false;
    save.packD.industrialWorkshopOwned=false;
    save.packD.recoveryRig={...(save.packD.recoveryRig??{}),owned:false};
    save.packE.processingPlantOwned=false;
    save.midgame.mastery={...(save.midgame.mastery??{}),z1:100,z2:100,z3:100};
    save.storage={...(save.storage??{}),metal:Math.max(1000,Number(save.storage?.metal??0))};
    save.processed={...(save.processed??{}),cleanCopper:Math.max(100,Number(save.processed?.cleanCopper??0)),briquette:Math.max(100,Number(save.processed?.briquette??0))};
    save.packB.materials={...(save.packB.materials??{}),steelBlank:Math.max(50,Number(save.packB.materials?.steelBlank??0))};
    save.packB.modules={...(save.packB.modules??{}),structural:Math.max(5,Number(save.packB.modules?.structural??0)),control:Math.max(3,Number(save.packB.modules?.control??0))};
  }`);
  await openBaseSurface(page,'overview');await page.waitForSelector('#ownerHangarMilestone');
  const reqText=await page.locator('#ownerHangarMilestone').innerText();
  for(const phrase of ['Освоить Зону 3','220','Металл','Чистая медь','Металлические брикеты','Конструкционный профиль','Конструкционная секция','Модуль управления'])assert.match(reqText,new RegExp(phrase));
  const openHangar=page.locator('[data-owner-acquire-hangar]');assert.equal(await openHangar.isDisabled(),false);
  await openBaseSurface(page,'logistics');const legacy=page.locator('#acquireHangar');if(await legacy.count())assert.equal(await legacy.isHidden(),true,'legacy Logistics hangar purchase must be hidden');
  await openBaseSurface(page,'overview');await page.locator('[data-owner-acquire-hangar]').click();await page.waitForFunction(()=>!!(globalThis as any).__SALVAGE_TEST__.getState().packB.hangarOwned);
  assert.match(await page.locator('#ownerV6Notice').innerText(),/Ангар открыт/);

  console.log('Owner Review V6 browser acceptance: one-click orders + RU UI + clear plant + money feedback + Overview hangar gate: PASS');
  await context.close();
}finally{await browser.close();await stopServer()}
