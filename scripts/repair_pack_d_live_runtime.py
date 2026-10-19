#!/usr/bin/env python3
from pathlib import Path


def replace_once(path:str,old:str,new:str)->None:
    p=Path(path);text=p.read_text(encoding='utf-8')
    if old not in text: raise SystemExit(f'anchor not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

replace_once('src/main.ts',
"setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8),gain2=simulateSecondWorker(packB,now,10),gain3=simulateThirdWorker(packC,now,12);let changed=gain.weight>.001;if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k])}(Object.keys(gain2.resources) as ResourceKind[]).forEach(k=>{if(gain2.resources[k]>.001)changed=true;storage[k]+=gain2.resources[k]});(Object.keys(gain3.resources) as ResourceKind[]).forEach(k=>{if(gain3.resources[k]>.001)changed=true;storage[k]+=gain3.resources[k]});if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);",
"setInterval(()=>{const now=Date.now(),gain=simulateWorkerGain(midgame,now,8),gain2=simulateSecondWorker(packB,now,10),gain3=simulateThirdWorker(packC,now,12),gain4=simulateFourthWorker(packD,now,18);let changed=gain.weight>.001;if(gain.weight>.001){(Object.keys(gain.resources) as ResourceKind[]).forEach(k=>storage[k]+=gain.resources[k]);(Object.keys(gain.components) as ComponentKind[]).forEach(k=>storedComps[k]+=gain.components[k])}(Object.keys(gain2.resources) as ResourceKind[]).forEach(k=>{if(gain2.resources[k]>.001)changed=true;storage[k]+=gain2.resources[k]});(Object.keys(gain3.resources) as ResourceKind[]).forEach(k=>{if(gain3.resources[k]>.001)changed=true;storage[k]+=gain3.resources[k]});(Object.keys(gain4.resources) as ResourceKind[]).forEach(k=>{if(gain4.resources[k]>.001)changed=true;storage[k]+=gain4.resources[k]});if(changed){saveGame();if(mode==='garage')renderGarage()}},5000);")

replace_once('src/main.ts',
"renderField({ctx,width:r.width,height:r.height,camera,player,targets,selected,drops,sparks,texts,decor,zone:fieldZone,vanOwned:midgame.van.owned||packB.truck.owned,vanLoad:packB.truck.owned?truckWeight(packB):vanWeight(midgame.van),vanCapacity:packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG,workerHere:midgame.worker.assignment===fieldZone||packB.secondWorker.assignment===fieldZone})",
"renderField({ctx,width:r.width,height:r.height,camera,player,targets,selected,drops,sparks,texts,decor,zone:fieldZone,vanOwned:midgame.van.owned||packB.truck.owned||packD.recoveryRig.owned,vanLoad:packD.recoveryRig.owned?recoveryRigWeight(packD):packB.truck.owned?truckWeight(packB):vanWeight(midgame.van),vanCapacity:packD.recoveryRig.owned?RECOVERY_RIG_CAPACITY_KG:packB.truck.owned?TRUCK_CAPACITY_KG:VAN_CAPACITY_KG,workerHere:midgame.worker.assignment===fieldZone||packB.secondWorker.assignment===fieldZone||(packC.crew3.role==='scavenger'&&packC.crew3.assignment===fieldZone)||(packD.crew4.role==='scavenger'&&packD.crew4.assignment===fieldZone)})")

print('Pack D live runtime repair applied')