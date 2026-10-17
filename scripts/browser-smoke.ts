import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, type BrowserContext, type Page } from 'playwright';

const PORT=4173;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';

const server=spawn(process.platform==='win32'?'npx.cmd':'npx',['vite','preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',(b)=>serverOutput+=String(b));server.stderr.on('data',(b)=>serverOutput+=String(b));

async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`preview server did not start\n${serverOutput}`)}

const baseSave=(overrides:Record<string,unknown>={})=>({
  v:2,xp:0,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},
  processed:{briquette:0,cleanCopper:0,granulate:0},cash:3000,installed:['workbench'],machineLevels:{workbench:1},talents:[],totalDestroyed:0,lastSeen:Date.now(),...overrides
});

async function withSave(context:BrowserContext,save:ReturnType<typeof baseSave>){await context.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:save})}
async function state(page:Page){return page.evaluate(()=>(globalThis as typeof globalThis & {__SALVAGE_TEST__?:{getState:()=>unknown}}).__SALVAGE_TEST__?.getState()) as Promise<any>}

await waitServer();
const browser=await chromium.launch({headless:true});
try{
  // Scenario 1: fresh player can return home immediately; machine and tree information is visible.
  const c1=await browser.newContext();
  const p1=await c1.newPage();
  await p1.goto(`${ORIGIN}/?seed=browser-smoke&reset=1`);
  await p1.waitForSelector('#garage');
  assert.equal(await p1.locator('#garage').isDisabled(),false,'garage must never be gated by cart fill');
  const fresh=await state(p1);assert.equal(fresh.cart,0);assert.equal(fresh.level,1);assert.equal(fresh.capacity,40);
  await p1.click('#garage');await p1.waitForSelector('#garageScreen:not([hidden])');
  await p1.waitForFunction(()=>document.querySelector('[data-machine="press"] .cardGate')?.textContent?.includes('Металл'));
  const pressCard=await p1.locator('[data-machine="press"] .cardGate').textContent();
  assert.match(pressCard??'',/Металл/);assert.match(pressCard??'',/Подшипник/);assert.match(pressCard??'',/Гидравлик/);
  await p1.click('#talentsGarage');await p1.waitForSelector('#talentScreen:not([hidden])');
  assert.equal(await p1.locator('.talentBranch').count(),5,'exactly five progression branches must render');
  assert.equal(await p1.locator('.talentNode').count(),35,'all 35 planned nodes must render');
  const comboFresh=p1.locator('[data-talent="salvage_3"]');assert.equal(await comboFresh.isDisabled(),true,'Combo must not be a starting unlock');
  await c1.close();

  // Scenario 2: focused Salvage build at level 4 can spend its third point on Combo and persistence keeps it.
  const c2=await browser.newContext();await withSave(c2,baseSave({xp:1800,talents:['salvage_1','salvage_2']}));
  const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=combo-smoke`);await p2.click('#talentsOpen');await p2.waitForSelector('#talentScreen:not([hidden])');
  const comboReady=p2.locator('[data-talent="salvage_3"]');assert.equal(await comboReady.isDisabled(),false,'Combo should become available only after level/prerequisites');
  await comboReady.click();await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState().talents.includes('salvage_3'));
  const comboState=await state(p2);assert.equal(comboState.level,4);assert.ok(comboState.talents.includes('salvage_3'));assert.equal(comboState.mastery,0);
  await p2.reload();await p2.waitForSelector('#garage');assert.ok((await state(p2)).talents.includes('salvage_3'),'talent unlock must persist through reload');
  await c2.close();

  // Scenario 3: installed press exposes the exact next-upgrade gates and effective discounted recipe.
  const c3=await browser.newContext();await withSave(c3,baseSave({
    xp:3200,talents:['workshop_1'],installed:['workbench','press'],machineLevels:{workbench:1,press:1},
    storage:{metal:200,copper:0,plastic:0},components:{bearing:3,motor:1,hydraulic:1,electronics:0},cash:7000
  }));
  const p3=await c3.newPage();await p3.goto(`${ORIGIN}/?seed=upgrade-smoke`);await p3.click('#garage');await p3.waitForSelector('#garageScreen:not([hidden])');
  await p3.waitForFunction(()=>document.querySelector('[data-machine="press"] .cardGate')?.textContent?.includes('152'));
  const upgradeCard=await p3.locator('[data-machine="press"] .cardGate').textContent();
  // workshop_1 applies a 5% discount: 160 -> 152 metal, 4000 -> 3800 cash; components stay discrete.
  assert.match(upgradeCard??'',/152/);assert.match(upgradeCard??'',/Подшипник/);assert.match(upgradeCard??'',/Электромотор/);assert.match(upgradeCard??'',/3.?800/);
  await p3.click('[data-machine="press"]');const inspector=await p3.locator('#machineInspector').textContent();
  assert.match(inspector??'',/Прокачка до ур\. 2/);assert.match(inspector??'',/Уровень игрока 5/);assert.match(inspector??'',/Экономная сборка/);assert.match(inspector??'',/152/);assert.match(inspector??'',/3.?800/);
  await c3.close();

  console.log('browser progression smoke: PASS');
} finally {
  await browser.close();server.kill('SIGTERM');
}
