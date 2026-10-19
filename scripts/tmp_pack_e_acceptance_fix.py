from pathlib import Path
p=Path('scripts/browser-pack-e-smoke.ts')
t=p.read_text(encoding='utf-8')
old2="await p2.goto(`${ORIGIN}/?seed=packe-z8`);await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
new2="await p2.goto(`${ORIGIN}/?seed=packe-z8`);await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p2.locator('#offlineScreen').isVisible())await p2.click('#offlineClose');await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
old3="await p3.goto(`${ORIGIN}/?seed=packe-plant`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
new3="await p3.goto(`${ORIGIN}/?seed=packe-plant`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p3.locator('#offlineScreen').isVisible())await p3.click('#offlineClose');await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
for old,new,label in [(old2,new2,'z8 fixture'),(old3,new3,'plant fixture')]:
    if t.count(old)!=1: raise SystemExit(f'{label}: expected one match, got {t.count(old)}')
    t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('Pack E browser fixtures dismiss offline overlay')
