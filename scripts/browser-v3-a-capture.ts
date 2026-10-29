import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const PORT=42003,ORIGIN=`http://127.0.0.1:${PORT}`,OUT=fileURLToPath(new URL('../visual-review-v3-a',import.meta.url)),TIMEOUT=10_000;
const dist=fileURLToPath(new URL('../dist',import.meta.url)),viteBin=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
function server():ChildProcess{return spawn(process.execPath,[viteBin,'preview','--host','127.0.0.1','--port',String(PORT),'--strictPort','--outDir',dist],{stdio:['ignore','pipe','pipe']})}
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(ORIGIN);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,125))}throw new Error('server did not start')}
async function stop(proc:ChildProcess){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await Promise.race([once(proc,'exit'),new Promise(r=>setTimeout(r,1200))]);if(proc.exitCode===null)proc.kill('SIGKILL')}
async function closeOffline(page:any){if(await page.locator('#offlineScreen').isVisible())await page.click('#offlineClose')}
async function applyPreset(page:any,id:string){
  console.log(`[V3-A CAPTURE] ${id}: seed`);
  await page.goto(`${ORIGIN}/?seed=v3a-capture-${id}`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10,null,{timeout:TIMEOUT});await closeOffline(page);
  await page.click('#hfDevToggle');await page.waitForSelector('#hfDevPanel:not([hidden])',{timeout:TIMEOUT});await page.waitForSelector(`[data-v3-preset="${id}"]`,{timeout:TIMEOUT});
  const navigation=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:TIMEOUT});
  await page.click(`[data-v3-preset="${id}"]`,{noWaitAfter:true});
  await navigation;
  await page.waitForSelector('#v3PresetBadge',{timeout:TIMEOUT});await closeOffline(page);
  await page.waitForFunction(()=>document.querySelector<HTMLElement>('#v3PresetBadge')?.dataset.v3SurfaceStable==='1',null,{timeout:TIMEOUT});
}

function intersects(a:any,b:any,pad=0){return a.x+pad<b.x+b.width&&a.x+a.width-pad>b.x&&a.y+pad<b.y+b.height&&a.y+a.height-pad>b.y}

await mkdir(OUT,{recursive:true});const proc=server();await waitServer();const browser=await chromium.launch({headless:true});
try{
  let context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();await applyPreset(page,'garageDeveloped');
  await page.waitForSelector('#v3AOverview',{timeout:TIMEOUT});
  const overviewBox=await page.locator('#v3AOverview').boundingBox(),legacyBox=await page.locator('#baseStageOverview').boundingBox();
  assert.ok(overviewBox&&legacyBox&&overviewBox.y<legacyBox.y,'V3-A company Overview must be the first visible overview layer, above the legacy stage summary');
  await page.locator('#v3AOverview').screenshot({path:`${OUT}/01-overview-garage.png`});
  await page.click('#zonesGarage');await page.waitForSelector('#zoneScreen:not([hidden])',{timeout:TIMEOUT});await page.waitForSelector('[data-v3-unknown]',{timeout:TIMEOUT});
  const routeCards=await page.locator('#zoneGrid > .zoneCard').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,unknown:(node as HTMLElement).dataset.v3Unknown??''}}));
  assert.ok(routeCards.length>=2,'map fog review must expose a current route plus one unknown frontier');
  for(let i=1;i<routeCards.length;i++)assert.ok(routeCards[i].x>routeCards[i-1].x,`zone route must progress left-to-right (${i-1} -> ${i})`);
  assert.ok(routeCards.at(-1)?.unknown,'last visible route card must be the unknown next frontier');
  await page.locator('#zoneGrid').screenshot({path:`${OUT}/03-map-garage-fog.png`});await context.close();

  context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();await applyPreset(page,'talentReveal');await page.waitForSelector('#talentScreen:not([hidden])',{timeout:TIMEOUT});await page.waitForSelector('[data-v3-tree-root]',{timeout:TIMEOUT});
  const core=await page.locator('.v3TalentCore').boundingBox();assert.ok(core,'talent core must be visible');
  const branches=await page.locator('.v3TalentBranch').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return{branch:(node as HTMLElement).dataset.v3Branch,x:r.x,y:r.y,width:r.width,height:r.height,gridRow:s.gridRowStart,gridColumn:s.gridColumnStart,alignSelf:s.alignSelf,marginTop:s.marginTop}}));
  console.log('[V3 TALENT GEOMETRY]',JSON.stringify({core,branches}));
  assert.equal(branches.length,5,'talent presentation must keep five explicit development tracks');
  const minBranchY=Math.min(...branches.map(b=>b.y)),maxBranchY=Math.max(...branches.map(b=>b.y));
  assert.ok(core.y+core.height<minBranchY,'all talent tracks must start below the central era summary');
  assert.ok(maxBranchY-minBranchY<24,`desktop talent tracks must share one clear starting row instead of orbiting the core: ${JSON.stringify(branches.map(b=>({branch:b.branch,y:b.y,row:b.gridRow,col:b.gridColumn,align:b.alignSelf,margin:b.marginTop})))}`);
  for(let i=1;i<branches.length;i++)assert.ok(branches[i].x>branches[i-1].x,`${branches[i].branch} must be a separate left-to-right development track`);
  for(const branch of branches){
    assert.equal(intersects(branch,core,8),false,`${branch.branch} branch must not collide with central talent core`);
    const nodes=await page.locator(`[data-v3-branch="${branch.branch}"] .v3TalentNode`).evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));
    for(let i=1;i<nodes.length;i++)assert.ok(nodes[i].y>nodes[i-1].y,`${branch.branch} nodes must progress downward in a directed track`);
  }
  for(let i=0;i<branches.length;i++)for(let j=i+1;j<branches.length;j++)assert.equal(intersects(branches[i],branches[j],6),false,`${branches[i].branch} and ${branches[j].branch} branches must not overlap`);
  assert.doesNotMatch(await page.locator('#talentBranches').innerText(),/Следующее кольцо/i,'player-facing talent UI must not reintroduce radial-ring language');
  await page.locator('#talentBranches').screenshot({path:`${OUT}/02-talent-tree-fog.png`});await context.close();

  context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();await applyPreset(page,'industrialStaffing');await page.waitForSelector('[data-production-cell="fabrication"]',{timeout:TIMEOUT});
  await page.waitForFunction(()=>{const timing=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');const worker=document.querySelector<HTMLSelectElement>('[data-pc-worker="fabrication"]');return !worker?.value&&timing?.dataset.adjustedSec===timing?.dataset.baseSec&&timing?.textContent?.includes('Без специалиста')},null,{timeout:TIMEOUT});
  await page.selectOption('[data-pc-worker="fabrication"]','worker-1');await page.selectOption('[data-pc-role="fabrication"]','technician');await page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');return Number(el?.dataset.adjustedSec)>0&&Number(el?.dataset.adjustedSec)<Number(el?.dataset.baseSec)},null,{timeout:TIMEOUT});
  await page.locator('#productionCellsV1Root').screenshot({path:`${OUT}/04-industrial-staffing-eta.png`});await context.close();

  console.log('V3-A formal review screenshots + directed talent/map route geometry: PASS');
}finally{await browser.close();await stop(proc)}
