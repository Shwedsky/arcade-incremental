from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')

def write(path: str, text: str) -> None:
    Path(path).write_text(text,encoding='utf-8')

def once(text: str, old: str, new: str, label: str) -> str:
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected one match, got {count}')
    return text.replace(old,new,1)

p='package.json'; t=read(p)
t=once(t,'    "smoke:browser:packd": "tsx scripts/browser-pack-d-smoke.ts",','    "smoke:browser:packd": "tsx scripts/browser-pack-d-smoke.ts",\n    "smoke:browser:packe": "tsx scripts/browser-pack-e-smoke.ts",','package pack e browser')
write(p,t)

changed=[]
for path in sorted(Path('scripts').glob('browser-*.ts')):
    if path.name=='browser-pack-e-smoke.ts': continue
    text=path.read_text(encoding='utf-8'); old=text
    text=text.replace('saveVersion===9','saveVersion===10')
    text=text.replace('saveVersion === 9','saveVersion === 10')
    text=re.sub(r'(saveVersion\s*,\s*)9([),])',r'\g<1>10\2',text)
    if text!=old:
        path.write_text(text,encoding='utf-8');changed.append(str(path))

p=Path('scripts/browser-pack-e-smoke.ts'); t=p.read_text(encoding='utf-8')
old2="await p2.goto(`${ORIGIN}/?seed=packe-z8`);await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
new2="await p2.goto(`${ORIGIN}/?seed=packe-z8`);await p2.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p2.locator('#offlineScreen').isVisible())await p2.click('#offlineClose');await p2.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
old3="await p3.goto(`${ORIGIN}/?seed=packe-plant`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
new3="await p3.goto(`${ORIGIN}/?seed=packe-plant`);await p3.waitForFunction(()=>(globalThis as any).__SALVAGE_TEST__?.getState()?.saveVersion===10);if(await p3.locator('#offlineScreen').isVisible())await p3.click('#offlineClose');await p3.evaluate(()=>(globalThis as any).__SALVAGE_TEST__.forceGarage());"
for old,new,label in [(old2,new2,'z8 fixture'),(old3,new3,'plant fixture')]:
    if t.count(old)!=1: raise SystemExit(f'{label}: expected one match, got {t.count(old)}')
    t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')

print('Pack E acceptance code prepared:', ', '.join(changed) or 'no legacy browser assertions changed')
