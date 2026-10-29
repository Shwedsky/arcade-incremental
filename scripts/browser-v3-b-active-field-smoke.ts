import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=42021,ORIGIN=`http://127.0.0.1:${PORT}`;
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}

type Raw={metal:number;copper:number;plastic:number};
const rawTotal=(x:Raw)=>x.metal+x.copper+x.plastic;

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=v3b-active-field-owner-gate`);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await closeOffline(page);

  const initial=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(initial.effectiveDps>100,'effective DPS must include the V3-B combat model');

  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forcePileNearPlayerForTest());
  await page.waitForSelector('#target.show.v3bTarget',{timeout:3000});
  const targetText=await page.locator('#target').innerText();
  assert.match(targetText,/HP/,'target HUD must show HP');
  assert.match(targetText,/DPS/,'target HUD must show DPS');
  assert.match(targetText,/Крит/,'target HUD must explain crit feedback');

  const hpBefore=Number(((await page.locator('#target .targetHead strong').innerText()).match(/\d+/)?.[0])??0);
  await page.waitForTimeout(650);
  const hpAfter=Number(((await page.locator('#target .targetHead strong').innerText()).match(/\d+/)?.[0])??hpBefore);
  assert.ok(hpAfter<hpBefore,`visible target HP must fall under discrete hits (${hpBefore} -> ${hpAfter})`);

  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().pileChildrenAlive>0,{timeout:8000});
  const splitState=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(splitState.pileChildrenAlive>0,'large salvage pile must split into real living child targets');

  const storageBefore:Raw=splitState.storage;
  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.grantV3BCargoForTest());
  const fieldCargo=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(rawTotal(fieldCargo.haul)>=25,'test expedition cargo must stay in field haul');
  assert.deepEqual(fieldCargo.storage,storageBefore,'field cargo must not silently enter base storage');

  await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());
  await page.waitForSelector('#garageScreen:not([hidden])');
  const beforeUnload=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(rawTotal(beforeUnload.haul)>=25,'returning home must preserve expedition cargo until explicit unload');
  assert.deepEqual(beforeUnload.storage,storageBefore,'garage entry must not auto-bank expedition cargo');
  const panelBefore=await page.locator('#baseCargoPanel').innerText();
  assert.match(panelBefore,/Ждёт разгрузки/);
  assert.match(panelBefore,/Разгрузить на склад/);

  await page.click('#baseUnload');
  await page.waitForFunction(()=>{
    const s=(globalThis as any).__SALVAGE_TEST__.getState();
    return s.cart<0.001&&s.haul.metal<0.001&&s.haul.copper<0.001&&s.haul.plastic<0.001;
  });
  const afterUnload=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.ok(rawTotal(afterUnload.storage)>rawTotal(storageBefore),'explicit unload must increase base storage');
  assert.equal(rawTotal(afterUnload.haul),0,'explicit unload must clear raw expedition haul');
  assert.match(await page.locator('#baseCargoPanel').innerText(),/Груз уже разгружен/);

  await page.reload();
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await closeOffline(page);
  const reloaded=await page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(rawTotal(reloaded.haul),0,'unloaded expedition cargo must stay cleared after reload');
  assert.ok(rawTotal(reloaded.storage)>=rawTotal(afterUnload.storage)-0.001,'banked storage must survive reload');

  await context.close();
  console.log('V3-B browser acceptance: HP/DPS/crit + real pile split + explicit unload: PASS');
}finally{await browser.close();await stop(proc)}
