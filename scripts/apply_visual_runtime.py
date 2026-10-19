#!/usr/bin/env python3
from pathlib import Path

p=Path(__file__).resolve().parents[1]/'src/main.ts'
s=p.read_text(encoding='utf-8')

replacements=[
("import './midgame.css';","import './midgame.css';\nimport './visual_foundation.css';"),
("decor=makeDecor(mulberry32(hashSeed(`${baseSeed}:decor:${midgame.currentZone}:${trip}`)),WORLD.width,WORLD.height);","decor=makeDecor(mulberry32(hashSeed(`${baseSeed}:decor:${midgame.currentZone}:${trip}`)),WORLD.width,WORLD.height,midgame.currentZone);"),
("renderField({ctx,width:r.width,height:r.height,camera,player,targets,selected,drops,sparks,texts,decor})","renderField({ctx,width:r.width,height:r.height,camera,player,targets,selected,drops,sparks,texts,decor,zone:fieldZone,vanOwned:midgame.van.owned,vanLoad:vanWeight(midgame.van),vanCapacity:VAN_CAPACITY_KG,workerHere:midgame.worker.assignment===fieldZone})")
]
for old,new in replacements:
    count=s.count(old)
    if count!=1: raise SystemExit(f'visual runtime patch expected 1 match, got {count}: {old[:80]}')
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('visual runtime wiring applied')
