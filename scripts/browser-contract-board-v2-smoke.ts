import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=41981,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=():ChildProcess=>spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']});
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(p:ChildProcess){if(p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([once(p,'exit'),new Promise(r=>setTimeout(r,1200))]);if(p.exitCode===null)p.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedCtx=await browser.newContext({viewport:{width:1280,height:800}}),seed=await seedCtx.newPage();
  await seed.goto(`${ORIGIN}/?seed=contract-v3-compat-fixture`);await seed.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seed.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seed.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);const fresh=JSON.parse(raw!);await seedCtx.close();

  // Old Contract V2 save shape must load directly into the V3 player-facing surface.
  fresh.storage={metal:80,copper:0,plastic:0};fresh.cash=3000;fresh.contract={index:1,completed:7,recentIds:['metal_pickup','repair_shop']};fresh.lastSeen=Date.now();
  const earlyCtx=await browser.newContext({viewport:{width:1280,height:800},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fresh)}]}]}}),early=await earlyCtx.newPage(),earlyErrors:string[]=[];early.on('pageerror',e=>earlyErrors.push(e.message));
  await early.goto(`${ORIGIN}/?seed=contract-v3-compat-early`);await early.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await early.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(early,'contracts');
  const earlyText=await early.locator('#contractPanel').innerText();assert.match(earlyText,/Постоянные покупатели/);assert.match(earlyText,/Городской пункт металла/);assert.doesNotMatch(earlyText,/ПРОМЫШЛЕННЫЙ.*случайн/i);
  let st=await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState()),cashBefore=st.cash,metalBefore=st.storage.metal;
  await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.submitStandingV3('standing_metal',10));
  await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.submitStandingV3('standing_metal',5));
  st=await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());assert.ok(st.storage.metal<=metalBefore-14.99);assert.ok(st.cash>cashBefore);assert.ok(st.contract.standingProgress.standing_metal>=14.99,'partial standing progress must accumulate instead of rotating the board');
  await early.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await early.reload();await early.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);st=await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());assert.ok(st.contract.standingProgress.standing_metal>=14.99,'standing progress must persist alongside legacy contract fields');assert.equal(st.contract.completed,7,'migration must not erase historical V2 completion count');assert.deepEqual(earlyErrors,[]);await earlyCtx.close();

  // Mature save exposes high-margin special orders, but no second raw-material tax board.
  const late=structuredClone(fresh);late.xp=150000;late.lastSeen=Date.now();late.cash=5_000_000;late.storage={metal:9999,copper:9999,plastic:9999};late.components={bearing:99,motor:99,hydraulic:99,electronics:99};late.processed={briquette:9999,cleanCopper:9999,granulate:9999};late.installed=['workbench','press','wire','plastic'];
  late.midgame.mastery={...late.midgame.mastery,z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100,z8:100};late.midgame.discoveredComponents=['bearing','motor','hydraulic','electronics'];late.midgame.discoveredMidComponents=['pump','compressor'];late.midgame.midComponents={pump:99,compressor:99};
  late.packB.materials={...late.packB.materials,steelBlank:999,aluminiumBillet:0,aluminiumScrap:999};late.packB.modules={drive:99,control:99,structural:99};late.packB.industrial={gearbox:99,generator:99};late.packB.discoveredIndustrial=['gearbox','generator'];late.packB.hangarOwned=true;
  late.packC.materials={alloyScrap:999,alloyBillet:999};late.packC.modules={hydraulicPower:99,heavyFrame:99};late.packC.industrial={industrialController:99,heavyHydraulicCylinder:99};late.packC.discoveredIndustrial=['industrialController','heavyHydraulicCylinder'];late.packC.salvageYardOwned=true;
  late.packD={...(late.packD??{}),industrialWorkshopOwned:true,recoveryRig:{...late.packD?.recoveryRig,owned:true,resources:{metal:0,copper:0,plastic:0},aluminiumScrap:0,alloyScrap:0}};late.packE={...(late.packE??{}),processingPlantOwned:true,portPowerDiscovered:true,plantLines:2,production:[]};
  const ctx=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(late)}]}]}}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${ORIGIN}/?seed=contract-v3-compat-late`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());await page.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(page,'contracts');
  assert.ok(await page.locator('.standingBuyer').count()>=4,'mature business keeps dependable standing sales channels');assert.ok(await page.locator('.specialOrder').count()>=1,'mature business must expose high-margin special orders');const special=(await page.locator('.specialOrder').allInnerTexts()).join('\n');assert.doesNotMatch(special,/СПЕЦЗАКАЗ · RAW/,'special orders must not duplicate bulk raw drains');assert.deepEqual(errors,[]);await ctx.close();

  console.log('Contract Board V2 save -> Contract Board V3 runtime compatibility browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
