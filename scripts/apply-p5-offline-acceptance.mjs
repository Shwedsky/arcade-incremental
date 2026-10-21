import fs from 'node:fs';

function patch(path,mutate){const before=fs.readFileSync(path,'utf8'),after=mutate(before);if(after===before)throw new Error(`${path}: patch produced no change`);fs.writeFileSync(path,after)}
function replaceOne(text,from,to,label){const count=text.split(from).length-1;if(count!==1)throw new Error(`${label}: expected 1 match, got ${count}`);return text.replace(from,to)}

patch('src/production_cells_v1.ts',text=>{
  text=replaceOne(text,
`export interface ProductionCompletionV1{
  cellId:ProductionCellIdV1;
  planId:ProductionPlanIdV1;
  jobId:string;
  outputs:IndustrialStockDeltaV1;
}`,
`export interface ProductionCompletionV1{
  cellId:ProductionCellIdV1;
  planId:ProductionPlanIdV1;
  label:string;
  jobId:string;
  outputs:IndustrialStockDeltaV1;
}`,'completion label interface');
  text=replaceOne(text,
`completed.push({cellId:cell.id,planId:job.planId,jobId:job.id,outputs:{...job.outputs}});cell.job=null;cell.completedCycles++;`,
`completed.push({cellId:cell.id,planId:job.planId,label:PRODUCTION_PLANS_V1[job.planId].label,jobId:job.id,outputs:{...job.outputs}});cell.job=null;cell.completedCycles++;`,'completion label runtime');
  return text;
});

patch('src/main.ts',text=>replaceOne(text,
"${productionCellsCompleted.length?`<h3>Industrial Workshop</h3><ul>${productionCellsCompleted.map(x=>`<li>${x.planId}</li>`).join('')}</ul>`:''}",
"${productionCellsCompleted.length?`<h3>Industrial Workshop</h3><ul class=\"offlineProductionCellsV1\">${productionCellsCompleted.map(x=>`<li>${x.label}</li>`).join('')}</ul>`:''}",
'offline production labels'));

patch('scripts/browser-production-cells-v1-smoke.ts',text=>{
  text=replaceOne(text,
`assert.match(runningSurface,/Recovery Rig/);assert.match(runningSurface,/−15%/);`,
`assert.match(runningSurface,/(Recovery Rig|Тяжёлая эвакуационная платформа)/);assert.match(runningSurface,/−15%/);\n  await page.evaluate(()=>(globalThis as any).__SALVAGE_PLATFORM__.forceSave());const offlineRaw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);assert.ok(offlineRaw,'running P5 Save V10 fixture must exist');const offlineFixture=JSON.parse(offlineRaw!);const offlineBaseline={reinforcedAlloy:running.stock.reinforcedAlloy,drive:running.stock.drive,hydraulicPower:running.stock.hydraulicPower};`,
'localized rig + capture offline fixture');
  text=replaceOne(text,
`assert.match(scene,/Refining Cell/);assert.match(scene,/Fabrication Cell/);assert.match(scene,/Heavy Assembly Cell/);assert.match(scene,/Recovery Rig/);assert.match(scene,/−15%/);`,
`assert.match(scene,/Refining Cell/);assert.match(scene,/Fabrication Cell/);assert.match(scene,/Heavy Assembly Cell/);assert.match(scene,/(Recovery Rig|Тяжёлая эвакуационная платформа)/);assert.match(scene,/−15%/);`,
'localized rig scene');
  text=replaceOne(text,
`  const rootBox=await page.locator('#productionCellsV1Root').boundingBox();assert.ok(rootBox&&rootBox.width<=390,'Production Cells surface must fit phone viewport');assert.equal(await page.locator('[data-production-cell]').count(),3);

  await context.close();console.log('P5-A/C/D Production Cells V1 browser acceptance: live stock + Logistician/Operator/Technician + 3 parallel cells + Recovery Rig + scene + persistence + mobile PASS');`,
`  const rootBox=await page.locator('#productionCellsV1Root').boundingBox();assert.ok(rootBox&&rootBox.width<=390,'Production Cells surface must fit phone viewport');assert.equal(await page.locator('[data-production-cell]').count(),3);
  await context.close();

  // P5-D: prove the normal startup offline pipeline completes the same persisted jobs exactly once.
  const past=Date.now()-3_600_000;offlineFixture.lastSeen=past;if(offlineFixture.workforceV3)offlineFixture.workforceV3.lastSimulatedAt=Date.now();
  for(const cell of Object.values(offlineFixture.productionCellsV1.cells) as any[]){if(!cell.job)continue;cell.job.startedAt=past-600_000;cell.job.endsAt=past+60_000}
  const offlineContext=await browser.newContext({viewport:{width:1440,height:1000},storageState:{cookies:[],origins:[{origin:ORIGIN,localStorage:[{name:SAVE_KEY,value:JSON.stringify(offlineFixture)}]}]}}),offlinePage=await offlineContext.newPage();
  await offlinePage.goto(ORIGIN+'/?seed=p5-production-offline');await offlinePage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.businessStage==='industrial_workshop');await offlinePage.waitForSelector('#offlineScreen:not([hidden])');await offlinePage.waitForSelector('.offlineProductionCellsV1 li');
  const offlineText=await offlinePage.locator('#offlineLoot').innerText();assert.match(offlineText,/Industrial Workshop/);assert.match(offlineText,/Усиленный сплав/);assert.match(offlineText,/Приводной модуль/);assert.match(offlineText,/Гидравлический силовой модуль/);
  const offlineView=await offlinePage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getProductionCellsV1View());assert.equal(offlineView.cells.every((cell:any)=>cell.job===null),true,'startup offline must clear completed jobs');assert.equal(offlineView.cells.every((cell:any)=>cell.status!=='running'),true);assert.equal(offlineView.stock.reinforcedAlloy,offlineBaseline.reinforcedAlloy+18);assert.equal(offlineView.stock.drive,offlineBaseline.drive+1);assert.equal(offlineView.stock.hydraulicPower,offlineBaseline.hydraulicPower+1);
  const completedCycles=await offlinePage.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.getState().productionCellsV1.cells);assert.equal(completedCycles.refining.completedCycles,1);assert.equal(completedCycles.fabrication.completedCycles,1);assert.equal(completedCycles.heavy_assembly.completedCycles,1);
  await offlinePage.click('#offlineClose');const once=JSON.stringify({stock:offlineView.stock,cycles:Object.fromEntries(Object.entries(completedCycles).map(([id,cell]:any)=>[id,cell.completedCycles]))});await offlinePage.reload();await offlinePage.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.productionCellsV1);const twice=await offlinePage.evaluate(()=>{const api=(globalThis as any).__SALVAGE_TEST__,view=api.getProductionCellsV1View(),cells=api.getState().productionCellsV1.cells;return JSON.stringify({stock:view.stock,cycles:Object.fromEntries(Object.entries(cells).map(([id,cell]:any)=>[id,cell.completedCycles]))})});assert.equal(twice,once,'second startup must not duplicate already-completed P5 jobs');await offlineContext.close();

  console.log('P5-A-D Production Cells V1 browser acceptance: live stock + Logistician/Operator/Technician + 3 parallel cells + Recovery Rig + scene + Save V10 startup-offline exactly-once + mobile PASS');`,
'tail startup offline acceptance');
  return text;
});

console.log('P5 offline acceptance patch applied');
