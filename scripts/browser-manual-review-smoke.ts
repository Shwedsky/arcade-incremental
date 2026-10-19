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

await rm(reviewDist,{recursive:true,force:true});
await cp(dist,reviewDist,{recursive:true});
await copyFile(reviewEntry,`${reviewDist}/review-start.html`);

const normal=server(NORMAL_PORT,dist),review=server(REVIEW_PORT,reviewDist);
await Promise.all([waitServer(NORMAL_ORIGIN),waitServer(REVIEW_ORIGIN)]);
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext();
  const normalPage=await context.newPage();
  await normalPage.goto(`${NORMAL_ORIGIN}/?seed=normal-sentinel`);
  await normalPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  await normalPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  await normalPage.evaluate((key)=>{
    const raw=localStorage.getItem(key);if(!raw)throw new Error('normal save missing');
    const save=JSON.parse(raw);save.xp=777;save.lastSeen=Date.now();localStorage.setItem(key,JSON.stringify(save));
  },SAVE_KEY);
  await normalPage.reload();
  await normalPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.xp===777);

  const reviewPage=await context.newPage();
  await reviewPage.goto(`${REVIEW_ORIGIN}/review-start.html`);
  await reviewPage.waitForURL(`${REVIEW_ORIGIN}/?seed=owner-review-v1`);
  await reviewPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  const fresh=await reviewPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(fresh.xp,0,'manual review must begin from fresh progression');
  assert.equal(fresh.cash,3000,'manual review must begin from canonical starting cash');
  assert.deepEqual(fresh.storage,{metal:0,copper:0,plastic:0});
  assert.equal(fresh.installed.length,1);
  assert.equal(fresh.installed[0],'workbench');

  await reviewPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  await reviewPage.reload();
  await reviewPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===8);
  assert.equal(new URL(reviewPage.url()).searchParams.has('reset'),false,'review redirect must remove destructive reset parameters');

  await normalPage.reload();
  await normalPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.xp===777);
  const normalAfter=await normalPage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState());
  assert.equal(normalAfter.xp,777,'review origin must not clear or replace ordinary save origin');

  console.log('manual review isolation browser smoke: PASS');
  await context.close();
}finally{
  await browser.close();
  await Promise.all([stop(normal),stop(review)]);
  await rm(reviewDist,{recursive:true,force:true});
}
