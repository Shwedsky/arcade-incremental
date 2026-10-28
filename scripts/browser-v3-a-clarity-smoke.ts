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
  // Produce a canonical Save V10 fixture so V3-A proves compatibility with the real serializer.
  const seedContext=await browser.newContext({viewport:{width:1440,height:1000}}),seedPage=await seedContext.newPage();
  await seedPage.goto(`${ORIGIN}/?seed=v3a-canonical`);await seedPage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);
  await seedPage.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());
  const raw=await seedPage.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(raw,'canonical Save V10 fixture must exist');const canonical=JSON.parse(raw!);await seedContext.close();

  const openFixture=async(fixture:any,seed:string)=>{
    const context=await browser.newContext({viewport:{width:1440,height:1000},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(fixture)}]}]}}),page=await context.newPage();
    await page.goto(`${ORIGIN}/?seed=${seed}`);await page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await closeOffline(page);
    await page.click('#garage');await page.waitForSelector('#garageScreen:not([hidden])');await page.waitForSelector('#baseShellNav');
    return{context,page};
  };

  // Garage developed: Overview must summarize canonical state instead of becoming another isolated system.
  const garage=structuredClone(canonical);garage.xp=20_000;garage.cash=85_000;garage.installed=['workbench','press','wire','plastic'];garage.machineLevels={workbench:3,press:3,wire:2,plastic:2};garage.equipmentLevels={tool:4,cart:4};garage.talents=['salvage_1','salvage_2','logistics_1','workshop_1','automation_1','trade_1'];
  garage.storage={metal:650,copper:120,plastic:280};garage.contract={index:0,completed:4};garage.midgame={...garage.midgame,currentZone:'z3',mastery:{...garage.midgame.mastery,z1:100,z2:100,z3:64,z4:0,z5:0,z6:0,z7:0,z8:0},van:{...garage.midgame.van,owned:false},worker:{...garage.midgame.worker,hired:false,assignment:null}};garage.packB.hangarOwned=false;garage.packC.salvageYardOwned=false;garage.packD.industrialWorkshopOwned=false;garage.packE.processingPlantOwned=false;delete garage.workforceV3;
  const g=await openFixture(garage,'v3a-garage');
  await openBaseSurface(g.page,'overview');await g.page.waitForSelector('#v3AOverview');
  const overview=await g.page.locator('#v3AOverview').innerText();assert.match(overview,/ОБЗОР КОМПАНИИ/);assert.match(overview,/ПРОИЗВОДСТВО/);assert.match(overview,/СКЛАД/);assert.match(overview,/КОНТРАКТЫ/);assert.match(overview,/РАЗВИТИЕ/);assert.match(overview,/ЭКСПЕДИЦИЯ/);assert.match(overview,/ЧТО ДЕЛАТЬ СЕЙЧАС/);assert.match(overview,/650|1,050|1050/,'Overview must be derived from the fixture rather than static placeholder copy');

  // Talent fog: five branch identities remain, only learned + immediate frontier are named, deep future is not leaked.
  await g.page.click('[data-base-surface="development"]');await g.page.waitForSelector('#talentScreen:not([hidden])');await g.page.waitForSelector('[data-v3-tree-root]');
  assert.equal(await g.page.locator('.v3TalentBranch').count(),5,'V3-A must preserve the five canonical branch identities');
  const talentText=await g.page.locator('#talentBranches').innerText();assert.match(talentText,/Заточенный инструмент/);assert.match(talentText,/Слабые места/);assert.match(talentText,/Combo/,'next known Salvage node must be revealed');assert.ok((await g.page.locator('.v3TalentNode.unknown').count())>0,'deeper current-era talent nodes must stay unknown');assert.doesNotMatch(talentText,/Широкий замах/,'late future talent must not leak in Garage');assert.doesNotMatch(talentText,/Тяжёлая фабрикация/,'future industrial talent must not leak in Garage');
  // Existing click path must remain actually usable, not merely visible.
  await g.page.locator('[data-talent="salvage_3"]').click();await g.page.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__.getState().talents.includes('salvage_3'));
  await g.page.click('#talentsClose');

  // Map fog: Garage gets three named zones and one unknown frontier, deeper geography is hidden.
  await g.page.click('#zonesGarage');await g.page.waitForSelector('#zoneScreen:not([hidden])');await g.page.waitForFunction(()=>document.querySelector('#zoneGrid')?.getAttribute('data-v3a-map-stage')!=null);
  assert.equal(await g.page.locator('#zoneGrid .zoneCard[data-zone]').count(),3,'Garage map must expose exactly Z1-Z3 as named era content');assert.equal(await g.page.locator('#zoneGrid [data-v3-unknown]').count(),1,'Garage map must tease exactly one unknown next frontier');
  const mapText=await g.page.locator('#zoneGrid').innerText();assert.match(mapText,/Старая свалка/);assert.match(mapText,/Свалка бытовой техники/);assert.doesNotMatch(mapText,/Промышленная зона|Заброшенный завод|Тяжёлый парк|Портовый терминал/,'Garage must not leak later geography');
  await g.page.click('#zoneClose');

  // DEV panel exposes formal owner-review increments, not only low-level mutation buttons.
  await g.page.click('#hfDevToggle');await g.page.waitForSelector('#hfDevPanel:not([hidden])');await g.page.waitForSelector('[data-v3-review-presets]');
  for(const id of ['garageStart','garageDeveloped','talentReveal','industrialStaffing'])assert.equal(await g.page.locator(`[data-v3-preset="${id}"]`).count(),1,`missing formal V3-A DEV preset: ${id}`);
  await g.context.close();

  // Industrial fixture: staffing preview must show the real role/rank duration delta in m:ss.
  const now=Date.now();const industrial=structuredClone(canonical);industrial.xp=125_000;industrial.cash=2_500_000;industrial.installed=['workbench','press','wire','plastic'];industrial.machineLevels={workbench:5,press:5,wire:5,plastic:5};industrial.equipmentLevels={tool:7,cart:7};industrial.talents=['automation_1','automation_2','automation_3','automation_4','automation_5','automation_6','workshop_1','workshop_2','workshop_3','workshop_4','workshop_5','workshop_6'];industrial.storage={metal:9000,copper:1600,plastic:2200};industrial.components={bearing:30,motor:30,hydraulic:25,electronics:30};industrial.processed={briquette:2000,cleanCopper:1200,granulate:1400};industrial.midgame={...industrial.midgame,currentZone:'z7',mastery:{z1:100,z2:100,z3:100,z4:100,z5:100,z6:100,z7:35,z8:0},van:{...industrial.midgame.van,owned:true},worker:{...industrial.midgame.worker,hired:true,assignment:null,lastTick:now}};industrial.packB={...industrial.packB,hangarOwned:true,truck:{...(industrial.packB.truck??{}),owned:true},materials:{...(industrial.packB.materials??{}),steelBlank:600},industrial:{...(industrial.packB.industrial??{}),gearbox:20,generator:20},modules:{...(industrial.packB.modules??{}),drive:25,control:25,structural:25}};industrial.packC={...industrial.packC,salvageYardOwned:true,materials:{...(industrial.packC.materials??{}),alloyScrap:1000,alloyBillet:700},industrial:{...(industrial.packC.industrial??{}),industrialController:20,heavyHydraulicCylinder:20},modules:{...(industrial.packC.modules??{}),hydraulicPower:20,heavyFrame:20}};industrial.packD={...industrial.packD,industrialWorkshopOwned:true,productionCells:3,recoveryRig:{...(industrial.packD.recoveryRig??{}),owned:true}};
  industrial.workforceV3={version:3,nextWorkerSerial:5,nextVehicleSerial:4,nextRouteSerial:1,lastSimulatedAt:now,workers:[
    {id:'worker-1',name:'Антон',rank:3,role:'technician',status:'idle',routeId:null,productionCellId:null,hiredAt:now},
    {id:'worker-2',name:'Марина',rank:2,role:'logistician',status:'idle',routeId:null,productionCellId:null,hiredAt:now},
    {id:'worker-3',name:'Илья',rank:2,role:'operator',status:'idle',routeId:null,productionCellId:null,hiredAt:now},
    {id:'worker-4',name:'Олег',rank:3,role:'scavenger',status:'idle',routeId:null,productionCellId:null,hiredAt:now}
  ],fleet:[{id:'vehicle-1',type:'van',name:'Фургон #1',capacityKg:400,routeId:null,acquiredAt:now},{id:'vehicle-2',type:'truck',name:'Грузовик #1',capacityKg:1000,routeId:null,acquiredAt:now},{id:'vehicle-3',type:'recovery_rig',name:'Recovery Rig #1',capacityKg:1800,routeId:null,acquiredAt:now}],routes:[]};
  industrial.productionCellsV1={version:1,nextJobSerial:1,cells:{refining:{id:'refining',selectedPlanId:'reinforced_alloy',job:null,completedCycles:2},fabrication:{id:'fabrication',selectedPlanId:'drive_module',job:null,completedCycles:3},heavy_assembly:{id:'heavy_assembly',selectedPlanId:'hydraulic_power',job:null,completedCycles:1}}};
  const p=await openFixture(industrial,'v3a-industrial');await openBaseSurface(p.page,'production');await p.page.waitForSelector('[data-production-cell="fabrication"]');
  await p.page.selectOption('[data-pc-worker="fabrication"]','worker-1');await p.page.selectOption('[data-pc-role="fabrication"]','technician');
  await p.page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');return Number(el?.dataset.adjustedSec)>0&&Number(el?.dataset.adjustedSec)<Number(el?.dataset.baseSec)});
  const timing=p.page.locator('[data-production-cell="fabrication"] .pcTiming');const base=Number(await timing.getAttribute('data-base-sec')),adjusted=Number(await timing.getAttribute('data-adjusted-sec')),timingText=await timing.innerText();assert.equal(base,360);assert.ok(adjusted<base,'Technician must visibly shorten Fabrication using the same domain factor as runtime');assert.match(timingText,/6:00\s*→\s*5:/,'exact m:ss preview must replace whole-minute rounding');assert.match(timingText,/Техник ур\. 3/);assert.match(timingText,/−\d+%/);
  await p.page.selectOption('[data-pc-role="fabrication"]','logistician');await p.page.waitForFunction(()=>{const el=document.querySelector<HTMLElement>('[data-production-cell="fabrication"] .pcTiming');return el?.dataset.adjustedSec===el?.dataset.baseSec});assert.match(await timing.innerText(),/без профильного бонуса/,'irrelevant role must explicitly show no bonus');
  await p.context.close();

  console.log('V3-A Clarity Foundation: Overview + talent fog + map fog + exact staffing ETA + formal DEV presets: PASS');
}finally{await browser.close();await stop(proc)}
