import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=41981,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=():ChildProcess=>spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']});
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(p:ChildProcess){if(p.exitCode!==null)return;p.kill('SIGTERM');await Promise.race([once(p,'exit'),new Promise(r=>setTimeout(r,1200))]);if(p.exitCode===null)p.kill('SIGKILL')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedCtx=await browser.newContext({viewport:{width:1280,height:800}}),seed=await seedCtx.newPage();
  await seed.goto(`${ORIGIN}/?seed=contract-v2-fixture`);await seed.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===9);
  await seed.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seed.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);const fresh=JSON.parse(raw!);
  await seedCtx.close();

  // Fresh player: readable board only, no unavailable advanced families.
  const earlyCtx=await browser.newContext({viewport:{width:1280,height:800},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify({...fresh,lastSeen:Date.now()})}]}]}}),early=await earlyCtx.newPage();
  await early.goto(`${ORIGIN}/?seed=contract-v2-early`);await early.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===9);
  await early.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());
  await early.waitForSelector('#garageScreen:not([hidden])');
  const earlyText=await early.locator('#contractPanel').innerText();
  assert.match(earlyText,/\d+ доступно/);assert.doesNotMatch(earlyText,/ПРОМЫШЛЕННЫЙ|Насос|Компрессор|Стальные заготовки/);
  await earlyCtx.close();

  // Mature fixture: all currently implemented contract families become eligible.
  const late=structuredClone(fresh);late.xp=30_000;late.lastSeen=Date.now();late.cash=2_000_000;
  late.storage={metal:9999,copper:9999,plastic:9999};late.components={bearing:99,motor:99,hydraulic:99,electronics:99};late.processed={briquette:9999,cleanCopper:9999,granulate:9999};
  late.installed=['workbench','press','wire','plastic'];
  late.contract={index:0,completed:0};
  late.midgame.mastery={...late.midgame.mastery,z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:100};
  late.midgame.discoveredComponents=['bearing','motor','hydraulic','electronics'];late.midgame.discoveredMidComponents=['pump','compressor'];late.midgame.midComponents={pump:99,compressor:99};
  late.packB.materials={...late.packB.materials,steelBlank:99,aluminiumBillet:99,aluminiumScrap:999};late.packB.modules={drive:99,control:99,structural:99};late.packB.industrial={gearbox:99,generator:99};late.packB.discoveredIndustrial=['gearbox','generator'];late.packB.hangarOwned=true;
  late.packC.materials={alloyScrap:999,alloyBillet:99};late.packC.modules={hydraulicPower:99,heavyFrame:99};late.packC.industrial={industrialController:99,heavyHydraulicCylinder:99};late.packC.discoveredIndustrial=['industrialController','heavyHydraulicCylinder'];late.packC.salvageYardOwned=true;

  const ctx=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(late)}]}]}}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${ORIGIN}/?seed=contract-v2-late`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===9);await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());
  await page.waitForSelector('#garageScreen:not([hidden])');
  const header=await page.locator('#contractPanel .contractHead small').innerText();const match=header.match(/(\d+) доступно/);assert.ok(match);assert.ok(Number(match![1])>=20,'late board must expose the broad staged pool');
  const titles:string[]=[];
  for(let i=0;i<10;i++){
    const before=(await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState().contract.completed)) as number;
    titles.push((await page.locator('#contractPanel h2').innerText()).trim());
    const button=page.locator('#completeContract');assert.equal(await button.isDisabled(),false,`late fixture should afford contract ${i}`);await button.click();
    await page.waitForFunction((n:number)=>(globalThis as any).__SALVAGE_TEST__.getState().contract.completed===n+1,before);
  }
  assert.ok(new Set(titles).size>=8,`expected broad visible variety, got ${titles.join(' | ')}`);
  for(let i=1;i<titles.length;i++)assert.notEqual(titles[i],titles[i-1],'no immediate repeat on live board');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).contract,SAVE_KEY);
  assert.equal(persisted.completed,10);assert.ok(Array.isArray(persisted.recentIds)&&persisted.recentIds.length>0,'recent-history cooldown must persist in Save V9');
  assert.deepEqual(errors,[],`Contract Board V2 browser proof must not throw: ${errors.join(' | ')}`);
  await ctx.close();
  console.log('Contract Board V2 staged pool + repetition protection browser acceptance: PASS');
}finally{await browser.close();await stop(proc)}
