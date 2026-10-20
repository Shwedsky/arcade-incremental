import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=4173;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));

const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',(b)=>serverOutput+=String(b));server.stderr.on('data',(b)=>serverOutput+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(resolve=>setTimeout(resolve,1500))]);if(server.exitCode===null)server.kill('SIGKILL')}

const baseSave=(overrides:Record<string,unknown>={})=>({
  v:3,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},
  processed:{briquette:0,cleanCopper:0,granulate:0},cash:3000,installed:['workbench'],machineLevels:{workbench:1},talents:[],
  equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now(),...overrides
});
async function withSave(context:BrowserContext,save:ReturnType<typeof baseSave>){await context.addInitScript(({key,value})=>{if(sessionStorage.getItem('__arcade_smoke_seeded__'))return;localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('__arcade_smoke_seeded__','1')},{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}
const workshopClock=new WeakMap<Page,number>();
async function advance(page:Page,ms:number){const base=Math.max(Date.now(),workshopClock.get(page)??0),target=base+ms;workshopClock.set(page,target);return page.evaluate((at)=>{const test=(globalThis as any).__SALVAGE_TEST__;return test?.advanceWorkshopTo(at)},target)}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // 1. Home is always available; historical progression remains visible plus five coherent Tier-II roots.
  const c1=await browser.newContext();const p1=await c1.newPage();await p1.goto(`${ORIGIN}/?seed=fresh&reset=1`);await p1.waitForSelector('#garage');
  assert.equal(await p1.locator('#garage').isDisabled(),false);const fresh=await state(p1);assert.equal(fresh.cart,0);assert.equal(fresh.capacity,40);assert.deepEqual(fresh.equipmentLevels,{tool:1,cart:1});
  await p1.click('#garage');await p1.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p1,'production');
  const pressCard=await p1.locator('[data-machine="press"] .cardGate').textContent();assert.match(pressCard??'',/Металл/);assert.match(pressCard??'',/Подшипник/);assert.match(pressCard??'',/Гидравлический узел/);assert.match(pressCard??'',/2.?500/);
  assert.match((await p1.locator('#equipmentPanel').textContent())??'',/Личное снаряжение/);assert.match((await p1.locator('#contractPanel').textContent())??'',/Пункт приёма: железо/);assert.match((await p1.locator('#queuePanel').textContent())??'',/0 \/ 1/);
  await p1.click('#talentsGarage');await p1.waitForSelector('#talentScreen:not([hidden])');assert.equal(await p1.locator('.talentBranch').count(),5);assert.equal(await p1.locator('.talentNode').count(),40);assert.equal(await p1.locator('[data-talent="salvage_3"]').isDisabled(),true);assert.equal(await p1.locator('[data-talent="salvage_8"]').isDisabled(),true);assert.equal(await p1.locator('[data-talent="workshop_8"]').isDisabled(),true);assert.equal(await p1.locator('[data-talent="automation_8"]').isDisabled(),true);await c1.close();

  // 2. Focused Salvage build unlocks Combo at its Talent V4 level gate, then persists through reload.
  const c2=await browser.newContext();await withSave(c2,baseSave({xp:5200,talents:['salvage_1','salvage_2']}));const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=combo`);await p2.click('#talentsOpen');await p2.waitForSelector('#talentScreen:not([hidden])');const combo=p2.locator('[data-talent="salvage_3"]');assert.equal(await combo.isDisabled(),false);await combo.click();await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState().talents.includes('salvage_3'));await p2.reload();await p2.waitForSelector('#garage');assert.ok((await state(p2)).talents.includes('salvage_3'));await c2.close();

  // 3. Installed press exposes exact next-upgrade gates and discounted effective recipe.
  const c3=await browser.newContext();await withSave(c3,baseSave({xp:3200,talents:['workshop_1'],installed:['workbench','press'],machineLevels:{workbench:1,press:1},storage:{metal:200,copper:0,plastic:0},components:{bearing:3,motor:1,hydraulic:1,electronics:0},cash:7000}));const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=upgrade`);await p3.click('#garage');await p3.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p3,'production');await p3.waitForFunction(()=>document.querySelector('[data-machine="press"] .cardGate')?.textContent?.includes('152'));const upgradeCard=await p3.locator('[data-machine="press"] .cardGate').textContent();assert.match(upgradeCard??'',/152/);assert.match(upgradeCard??'',/Подшипник/);assert.match(upgradeCard??'',/Электромотор/);assert.match(upgradeCard??'',/3.?800/);await p3.click('[data-machine="press"]');const inspector=await p3.locator('#machineInspector').textContent();assert.match(inspector??'',/Прокачка до ур\. 2/);assert.match(inspector??'',/Уровень игрока 5/);assert.match(inspector??'',/Экономная сборка/);await c3.close();

  // 4. Physical tool upgrade is distinct from talents, occupies queue time and persists after completion.
  const c4=await browser.newContext();await withSave(c4,baseSave({xp:420,storage:{metal:80,copper:0,plastic:0},cash:5000}));const p4=await c4.newPage();await p4.goto(`${ORIGIN}/?seed=equipment`);await p4.click('#garage');await p4.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p4,'production');const toolButton=p4.locator('[data-equipment-upgrade="tool"]');assert.equal(await toolButton.isDisabled(),false);await toolButton.click();let s4=await state(p4);assert.equal(s4.equipmentLevels.tool,1,'upgrade must not be instant');assert.equal(s4.jobs.length,1);assert.equal(s4.jobs[0].kind,'equipment');assert.ok(s4.storage.metal<80,'materials must be committed at queue start');await advance(p4,180_000);s4=await state(p4);assert.equal(s4.equipmentLevels.tool,2);assert.equal(s4.jobs.length,0);assert.equal(s4.capacity,40,'tool upgrade must not secretly upgrade cart');await p4.reload();await p4.waitForSelector('#garage');assert.equal((await state(p4)).equipmentLevels.tool,2);await c4.close();

  // 5. First press is fabricated through queue, then processing is also timed rather than instant.
  const c5=await browser.newContext();await withSave(c5,baseSave({xp:3200,storage:{metal:150,copper:0,plastic:0},components:{bearing:2,motor:0,hydraulic:1,electronics:0},cash:9000}));const p5=await c5.newPage();await p5.goto(`${ORIGIN}/?seed=press-queue`);await p5.click('#garage');await p5.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p5,'production');await p5.click('[data-machine="press"]');const build=p5.locator('#buildMachine');assert.equal(await build.isDisabled(),false);await build.click();let s5=await state(p5);assert.ok(!s5.installed.includes('press'));assert.equal(s5.jobs[0].kind,'build_machine');await advance(p5,13*60_000);s5=await state(p5);assert.ok(s5.installed.includes('press'));assert.equal(s5.jobs.length,0);await p5.click('[data-machine="press"]');await p5.click('#processMachine');s5=await state(p5);assert.equal(s5.jobs[0].kind,'process');assert.equal(s5.processed.briquette,0);await advance(p5,60_000);s5=await state(p5);assert.ok(s5.processed.briquette>0);assert.equal(s5.jobs.length,0);await c5.close();

  // 6. First contract consumes reserved material and grants both money and XP.
  const c6=await browser.newContext();await withSave(c6,baseSave({storage:{metal:35,copper:0,plastic:0},cash:3000}));const p6=await c6.newPage();await p6.goto(`${ORIGIN}/?seed=contract`);await p6.click('#garage');await p6.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p6,'contracts');const contractButton=p6.locator('#completeContract');assert.equal(await contractButton.isDisabled(),false);await contractButton.click();const s6=await state(p6);assert.equal(s6.contract.completed,1);assert.equal(s6.contract.index,1);assert.ok(s6.storage.metal<10);assert.ok(s6.cash>3000);assert.ok(s6.xp>=20);await c6.close();

  // 7. A job whose timer elapsed while the game was closed completes on return and is reported offline.
  const n=Date.now();const c7=await browser.newContext();await withSave(c7,baseSave({installed:['workbench','press'],machineLevels:{workbench:1,press:1},jobs:[{id:'offline-process',kind:'process',label:'Прессование металла',machineId:'press',processKind:'briquette',inputResource:'metal',inputAmount:10,outputAmount:10,startedAt:n-60_000,endsAt:n-30_000}],lastSeen:n-60*60_000}));const p7=await c7.newPage();await p7.goto(`${ORIGIN}/?seed=offline-job`);await p7.waitForSelector('#offlineScreen:not([hidden])');const s7=await state(p7);assert.equal(s7.jobs.length,0);assert.ok(s7.processed.briquette>=10);assert.match((await p7.locator('#offlineLoot').textContent())??'',/Брикеты/);await c7.close();

  // 8. Workshop parallel talent visibly expands queue capacity to two slots.
  const c8=await browser.newContext();await withSave(c8,baseSave({xp:5200,talents:['workshop_1','workshop_2','workshop_3']}));const p8=await c8.newPage();await p8.goto(`${ORIGIN}/?seed=parallel`);await p8.click('#garage');await p8.waitForSelector('#garageScreen:not([hidden])');await openBaseSurface(p8,'production');assert.match((await p8.locator('#queuePanel').textContent())??'',/0 \/ 2/);await c8.close();

  console.log('browser early-game progression smoke: PASS');
}finally{await browser.close();await stopServer()}