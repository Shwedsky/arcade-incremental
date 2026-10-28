import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {openBaseSurface} from './base-shell-test-utils.ts';

const PORT=42001,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  // Seed from the actual serializer, then alter only legal Garage-era fields.
  const seedContext=await browser.newContext({viewport:{width:1440,height:1000}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=v3a-core-canonical`);await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw);const garage=JSON.parse(raw!);await seedContext.close();

  garage.xp=20_000;garage.cash=85_000;garage.installed=['workbench','press','wire','plastic'];garage.machineLevels={workbench:3,press:3,wire:2,plastic:2};garage.equipmentLevels={tool:4,cart:4};garage.talents=['salvage_1','salvage_2','logistics_1','workshop_1','automation_1','trade_1'];
  garage.storage={metal:650,copper:120,plastic:280};garage.contract={...garage.contract,index:0,completed:4};garage.midgame={...garage.midgame,currentZone:'z3',mastery:{...garage.midgame.mastery,z1:100,z2:100,z3:64,z4:0,z5:0,z6:0,z7:0,z8:0},van:{...garage.midgame.van,owned:false},worker:{...garage.midgame.worker,hired:false,assignment:null}};garage.packB={...garage.packB,hangarOwned:false};garage.packC={...garage.packC,salvageYardOwned:false};garage.packD={...garage.packD,industrialWorkshopOwned:false};garage.packE={...garage.packE,processingPlantOwned:false};delete garage.workforceV3;

  const context=await browser.newContext({viewport:{width:1440,height:1000},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(garage)}]}]}}),page=await context.newPage();
  await page.goto(`${ORIGIN}/?seed=v3a-core-garage`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);if(!(await page.locator('#garageScreen').isVisible()))await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseShellNav');

  await openBaseSurface(page,'overview');await page.waitForSelector('#v3AOverview');
  const overview=await page.locator('#v3AOverview').innerText();for(const token of ['ОБЗОР КОМПАНИИ','ПРОИЗВОДСТВО','СКЛАД','КОНТРАКТЫ','РАЗВИТИЕ','ЭКСПЕДИЦИЯ','ЧТО ДЕЛАТЬ СЕЙЧАС'])assert.match(overview,new RegExp(token));assert.match(overview,/650|1,050|1050/,'Overview must reflect canonical fixture state');

  await page.click('[data-base-surface="development"]');await page.waitForSelector('#talentScreen:not([hidden])');await page.waitForSelector('[data-v3-tree-root]');assert.equal(await page.locator('.v3TalentBranch').count(),5);
  const talentText=await page.locator('#talentBranches').innerText();assert.match(talentText,/Заточенный инструмент/);assert.match(talentText,/Слабые места/);assert.match(talentText,/Combo/);assert.ok((await page.locator('.v3TalentNode.unknown').count())>0);assert.doesNotMatch(talentText,/Широкий замах|Тяжёлая фабрикация/);
  await page.locator('[data-talent="salvage_3"]').click();await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().talents.includes('salvage_3'));await page.click('#talentsClose');

  await page.click('#zonesGarage');await page.waitForSelector('#zoneScreen:not([hidden])');await page.waitForFunction(()=>document.querySelector('#zoneGrid')?.getAttribute('data-v3a-map-stage')!=null);assert.equal(await page.locator('#zoneGrid .zoneCard[data-zone]').count(),3);assert.equal(await page.locator('#zoneGrid [data-v3-unknown]').count(),1);
  const mapText=await page.locator('#zoneGrid').innerText();assert.match(mapText,/Старая свалка/);assert.match(mapText,/Свалка бытовой техники/);assert.doesNotMatch(mapText,/Промышленная зона|Заброшенный завод|Тяжёлый парк|Портовый терминал/);await page.click('#zoneClose');

  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])');await page.waitForSelector('[data-v3-review-presets]');for(const id of ['garageStart','garageDeveloped','talentReveal','industrialStaffing'])assert.equal(await page.locator(`[data-v3-preset="${id}"]`).count(),1);
  await context.close();
  console.log('V3-A core clarity: canonical Overview + Talent Fog + Map Fog + DEV entry points: PASS');
}finally{await browser.close();await stop(proc)}
