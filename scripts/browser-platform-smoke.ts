import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';

const PORT=4175,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE_KEY='arcade-incremental-playable-v0-save-v2';
const viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const server=spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
async function waitServer(){for(let i=0;i<80;i++){try{if((await fetch(ORIGIN)).ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error(output)}
async function stopServer(){if(server.exitCode!==null)return;server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,1200))]);if(server.exitCode===null)server.kill('SIGKILL')}
async function platformState(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__?.getState()) as Promise<any>}
async function gameState(page:Page){return page.evaluate(()=>(globalThis as any).__SALVAGE_TEST__?.getState()) as Promise<any>}
async function waitPlatform(page:Page){await page.waitForFunction(()=>(globalThis as any).__SALVAGE_PLATFORM__?.getState().initialized===true)}
async function assertViewport(page:Page,label:string){
  const metrics=await page.evaluate(()=>({iw:innerWidth,sw:document.documentElement.scrollWidth,canvas:(()=>{const r=document.querySelector('canvas')!.getBoundingClientRect();return{w:r.width,h:r.height,visible:r.bottom>0&&r.right>0}})()}));
  assert.ok(metrics.canvas.visible&&metrics.canvas.w>250&&metrics.canvas.h>220,`${label}: canvas invalid ${JSON.stringify(metrics)}`);
  assert.ok(metrics.sw<=metrics.iw+2,`${label}: horizontal overflow ${metrics.sw}/${metrics.iw}`);
}

await waitServer();const browser:Browser=await chromium.launch({headless:true});
try{
  // Local mode must not request SDK and must mark only real field gameplay active.
  const c1=await browser.newContext({viewport:{width:1440,height:900}});const p1=await c1.newPage();const requests:string[]=[];p1.on('request',r=>requests.push(r.url()));
  await p1.goto(`${ORIGIN}/?seed=platform-local&reset=1`);await waitPlatform(p1);let ps=await platformState(p1);assert.equal(ps.mode,'local');assert.equal(ps.ready,true);assert.equal(ps.gameplayActive,true);assert.ok(!requests.some(x=>x.endsWith('/sdk.js')),'local mode requested sdk.js');await assertViewport(p1,'desktop');
  await p1.click('#garage');await p1.waitForSelector('#garageScreen:not([hidden])');ps=await platformState(p1);assert.equal(ps.gameplayActive,false);await p1.click('#next');ps=await platformState(p1);assert.equal(ps.gameplayActive,true);await c1.close();

  // Corrupt primary must recover previous-good backup in the real browser boot path.
  const c2=await browser.newContext();await c2.addInitScript(({key})=>{localStorage.setItem(key,'{bad');localStorage.setItem(key+'.backup',JSON.stringify({v:4,xp:1800,storage:{metal:0,copper:0,plastic:0},components:{bearing:0,motor:0,hydraulic:0,electronics:0},processed:{briquette:0,cleanCopper:0,granulate:0},cash:3000,installed:['workbench'],machineLevels:{workbench:1},talents:[],equipmentLevels:{tool:1,cart:1},jobs:[],contract:{index:0,completed:0},totalDestroyed:0,lastSeen:Date.now()}))},{key:SAVE_KEY});const p2=await c2.newPage();await p2.goto(`${ORIGIN}/?seed=recover`);await waitPlatform(p2);assert.equal((await gameState(p2)).xp,1800);const diag=await p2.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.getDiagnostics());assert.ok(diag.events.some((e:any)=>e.type==='save.recovered'));await c2.close();

  // Portrait and short landscape layouts keep core screens usable without document overflow.
  for(const [label,width,height] of [['portrait',390,844],['landscape',844,390]] as const){
    const c=await browser.newContext({viewport:{width,height}}),p=await c.newPage();await p.goto(`${ORIGIN}/?seed=${label}&reset=1`);await waitPlatform(p);await assertViewport(p,label);await p.click('#garage');await p.waitForSelector('#garageScreen:not([hidden])');await p.click('#zonesGarage');await p.waitForSelector('#zoneScreen:not([hidden])');const close=p.locator('#zoneClose');assert.equal(await close.isVisible(),true);await close.click();await c.close();
  }

  // Mocked Yandex environment proves initialization, ready and gameplay pause/resume without real Console access.
  const cy=await browser.newContext();await cy.addInitScript(()=>{
    const calls:string[]=[];const handlers:Record<string,()=>void>={};(window as any).__YSDK_CALLS__=calls;(window as any).__YSDK_HANDLERS__=handlers;
    (window as any).YaGames={init:async()=>({features:{LoadingAPI:{ready:()=>calls.push('ready')},GameplayAPI:{start:()=>calls.push('start'),stop:()=>calls.push('stop')}},on:(e:string,h:()=>void)=>handlers[e]=h,off:(e:string)=>delete handlers[e],getPlayer:async()=>({getData:async()=>({}),setData:async()=>{calls.push('cloud')}})})};
  });const py=await cy.newPage();await py.goto(`${ORIGIN}/?seed=yandex-mock`);await waitPlatform(py);ps=await platformState(py);assert.equal(ps.mode,'yandex');assert.equal(ps.ready,true);const calls=await py.evaluate(()=>(window as any).__YSDK_CALLS__ as string[]);assert.ok(calls.includes('ready'));assert.ok(calls.includes('start'));await py.evaluate(()=>(window as any).__YSDK_HANDLERS__.game_api_pause());assert.equal((await platformState(py)).platformPaused,true);assert.equal((await platformState(py)).gameplayActive,false);await py.evaluate(()=>(window as any).__YSDK_HANDLERS__.game_api_resume());assert.equal((await platformState(py)).gameplayActive,true);await cy.close();

  console.log('browser platform/responsive smoke: PASS');
}finally{await browser.close();await stopServer()}
