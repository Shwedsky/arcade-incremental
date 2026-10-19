import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=41974,ORIGIN=`http://127.0.0.1:${PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function knowledgeIcon(page:any,index:number){return page.locator('#components > span').nth(index).locator(':scope > .hfFieldKnowledgeIcon').textContent()}

const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  const seedContext=await browser.newContext({viewport:{width:1100,height:760}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=hf-v3-fixture`);
  await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===9);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate((key)=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical Save V8 fixture must exist');
  const fixture=JSON.parse(raw!);
  fixture.xp=1800;fixture.cash=20_000;fixture.installed=['workbench','press'];fixture.machineLevels={workbench:1,press:1,wire:1,plastic:1};fixture.equipmentLevels={tool:2,cart:2};
  fixture.midgame.currentZone='z2';fixture.midgame.mastery={...fixture.midgame.mastery,z1:100,z2:18};fixture.midgame.discoveredMidComponents=['pump'];fixture.midgame.midComponents={pump:0,compressor:0};fixture.midgame.pity={pump:0,compressor:0};fixture.lastSeen=Date.now();
  await seedContext.close();

  const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}});
  await context.addInitScript(()=>{
    (globalThis as any).__HF_V3_FACADE_Y=[];
    const original=CanvasRenderingContext2D.prototype.roundRect;
    CanvasRenderingContext2D.prototype.roundRect=function(x:number,y:number,w:number,h:number,r:any){
      if(w===154&&h===78){const ys=(globalThis as any).__HF_V3_FACADE_Y as number[];ys.push(y);if(ys.length>60)ys.splice(0,ys.length-60)}
      return original.call(this,x,y,w,h,r);
    };
  });
  const page=await context.newPage();await page.goto(`${ORIGIN}/?seed=hf-v3-smoke`);
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.currentZone==='z2');
  await page.waitForFunction(()=>document.querySelectorAll('#components > span').length>=9);
  await page.waitForFunction(()=>document.querySelector('#components > span:nth-child(5) .hfFieldKnowledgeIcon')?.textContent==='◍');

  assert.equal(await knowledgeIcon(page,4),'◍','previously discovered Pump must stay visibly revealed with zero current-haul count');
  assert.equal(await page.locator('#components > span').nth(4).getAttribute('aria-label'),'Насос');
  assert.equal(await page.locator('#components > span').nth(5).evaluate(el=>el.classList.contains('hfKnownOnly')),false,'undiscovered Compressor must remain unknown');

  // Re-entering the field through base must not erase player knowledge.
  await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.click('#next');await page.waitForSelector('#garageScreen',{state:'hidden'});
  await page.waitForFunction(()=>document.querySelector('#components > span:nth-child(5) .hfFieldKnowledgeIcon')?.textContent==='◍');
  assert.equal(await knowledgeIcon(page,4),'◍','Pump must remain revealed after base round-trip');

  // Save/reload must preserve the discovery too.
  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());await page.reload();
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.midgame?.discoveredMidComponents?.includes('pump'));
  await page.waitForFunction(()=>document.querySelector('#components > span:nth-child(5) .hfFieldKnowledgeIcon')?.textContent==='◍');
  assert.equal(await knowledgeIcon(page,4),'◍','Pump must remain revealed after Save V8 reload');

  // Z2 garage facades used to be hard-coded at y=34. Record their canvas roundRect Y,
  // move vertically, and prove the scenery now follows camera/parallax instead of the viewport.
  await page.waitForFunction(()=>((globalThis as any).__HF_V3_FACADE_Y?.length??0)>2);
  await page.waitForTimeout(500);
  const y0=await page.evaluate(()=>{const ys=(globalThis as any).__HF_V3_FACADE_Y as number[];return ys.at(-1)});
  await page.keyboard.down('s');await page.waitForTimeout(1800);await page.keyboard.up('s');await page.waitForTimeout(500);
  const y1=await page.evaluate(()=>{const ys=(globalThis as any).__HF_V3_FACADE_Y as number[];return ys.at(-1)});
  assert.equal(typeof y0,'number');assert.equal(typeof y1,'number');assert.ok(Math.abs(y1-y0)>8,`Z2 facade must move with vertical camera/parallax; y0=${y0}, y1=${y1}`);
  assert.notEqual(Math.round(y1),34,'Z2 facade must not remain at the old viewport-fixed y=34');

  await context.close();
  console.log('Human Feedback V3 persistent discovery + Z2 world-space backdrop browser smoke: PASS');
}finally{await browser.close();await stop(proc)}
