import assert from 'node:assert/strict';
import { cp, copyFile, rm } from 'node:fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REVIEW_PORT=41971;
const NORMAL_PORT=41972;
const REVIEW_ORIGIN=`http://127.0.0.1:${REVIEW_PORT}`;
const NORMAL_ORIGIN=`http://127.0.0.1:${NORMAL_PORT}`;
const SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const reviewDist=fileURLToPath(new URL('../.manual-review-browser-dist',import.meta.url));
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const reviewEntry=fileURLToPath(new URL('../review/review-start.html',import.meta.url));
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));

function server(port:number,outDir:string):ChildProcess{
  return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(port),'--strictPort','--outDir',outDir],{stdio:['ignore','pipe','pipe']});
}
async function waitServer(origin:string){for(let i=0;i<80;i++){try{const r=await fetch(origin);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(`server did not start: ${origin}`)}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1500))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
function overlaps(a:{x:number;y:number;width:number;height:number},b:{x:number;y:number;width:number;height:number}){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y}

await rm(reviewDist,{recursive:true,force:true});
await cp(dist,reviewDist,{recursive:true});
await copyFile(reviewEntry,`${reviewDist}/review-start.html`);

const normal=server(NORMAL_PORT,dist),review=server(REVIEW_PORT,reviewDist);
await Promise.all([waitServer(NORMAL_ORIGIN),waitServer(REVIEW_ORIGIN)]);
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});

  const normalPage=await context.newPage();
  await normalPage.goto(`${NORMAL_ORIGIN}/?seed=normal-sentinel`);
  await normalPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  await normalPage.evaluate((key)=>{
    localStorage.setItem(key,'ordinary-save-sentinel');
    localStorage.setItem(`${key}.backup`,'ordinary-backup-sentinel');
  },SAVE_KEY);

  const reviewPage=await context.newPage();
  await reviewPage.goto(`${REVIEW_ORIGIN}/review-start.html`);
  await reviewPage.waitForURL(`${REVIEW_ORIGIN}/?seed=owner-review-v1`);
  await reviewPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  const fresh=await reviewPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(fresh.xp,0,'manual review must begin from fresh progression');
  assert.equal(fresh.cash,3000,'manual review must begin from canonical starting cash');
  assert.deepEqual(fresh.storage,{metal:0,copper:0,plastic:0});
  assert.deepEqual(fresh.installed,['workbench']);
  assert.equal(new URL(reviewPage.url()).searchParams.has('reset'),false,'review gameplay URL must not retain destructive reset parameters');

  // Owner P1: field HUD cards must not stack on each other and should stay passive until explicitly focused.
  const zoneBox=await reviewPage.locator('.zone').boundingBox(),goalBox=await reviewPage.locator('.goal').boundingBox();
  assert.ok(zoneBox&&goalBox,'field HUD zone and goal cards must exist');
  assert.equal(overlaps(zoneBox!,goalBox!),false,'zone and goal HUD cards must not overlap');
  const passiveOpacity=Number(await reviewPage.locator('.zone').evaluate(el=>getComputedStyle(el).opacity));
  assert.ok(passiveOpacity<.9,'idle field HUD should be semi-transparent');
  await reviewPage.locator('.zone').hover();
  await reviewPage.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.zone')!).opacity)>.9);

  // Garage discovery UX: known basics are readable; future materials/components are mystery slots until found.
  await reviewPage.click('#garage');
  await reviewPage.waitForSelector('#garageScreen:not([hidden])');
  await reviewPage.waitForSelector('#storage [data-hf-slot="metal"]');
  assert.match(await reviewPage.locator('#storage [data-hf-slot="metal"]').innerText(),/Металл/);
  assert.match(await reviewPage.locator('#storage [data-hf-slot="alScrap"]').innerText(),/Неизвестный материал/);
  assert.match(await reviewPage.locator('#storageComponents [data-hf-slot="bearing"]').innerText(),/Неизвестный компонент/);
  assert.equal(await reviewPage.locator('#storageComponents [data-hf-slot="controller"]').evaluate(el=>el.classList.contains('hfLegendary')),true,'late component rarity must have a strong rarity frame');
  const garageText=await reviewPage.locator('#garageScreen').innerText();
  assert.doesNotMatch(garageText,/PACK [BCD]|Salvage Yard|Recovery Rig|Industrial Workshop|\bOperator\b|\bScavenger\b|Gearbox|Drive Module|Control Module/,'normal garage UI must not expose raw English production labels');

  // Owner P0 regression: launch action must be explicit and actually resume active field time.
  await reviewPage.waitForFunction(()=>document.querySelector('#next')?.textContent?.includes('Начать вылазку'));
  const launchLabel=await reviewPage.locator('#next').textContent();
  assert.match(launchLabel??'',/Начать вылазку/,'garage must expose an explicit excursion launch action');
  await reviewPage.click('#next');
  await reviewPage.waitForSelector('#garageScreen',{state:'hidden'});
  await reviewPage.waitForFunction(()=>{
    const timer=document.querySelector('#timer')?.textContent??'0:00';
    return timer!=='0:00';
  },undefined,{timeout:5000});

  await reviewPage.evaluate(()=>localStorage.setItem('__manual_review_progress_sentinel__','keep-on-reload'));
  await reviewPage.reload();
  await reviewPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  const reviewSentinel=await reviewPage.evaluate(()=>localStorage.getItem('__manual_review_progress_sentinel__'));
  assert.equal(reviewSentinel,'keep-on-reload','normal review reload must not clear review origin again');

  const ordinary=await normalPage.evaluate((key)=>({primary:localStorage.getItem(key),backup:localStorage.getItem(`${key}.backup`)}),SAVE_KEY);
  assert.deepEqual(ordinary,{primary:'ordinary-save-sentinel',backup:'ordinary-backup-sentinel'},'review fresh start must not touch ordinary origin save slots');

  console.log('manual review launch + HUD/readability/discovery browser smoke: PASS');
  await context.close();
}finally{
  await browser.close();
  await Promise.all([stop(normal),stop(review)]);
  await rm(reviewDist,{recursive:true,force:true});
}
