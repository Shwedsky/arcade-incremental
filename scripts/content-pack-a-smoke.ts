import { strict as assert } from 'node:assert';
import { MACHINE_DEFS } from '../src/garage.ts';
import { type ZoneId } from '../src/midgame.ts';
import { TARGET_CLASSES, type TargetClassId } from '../src/sim.ts';
import { GARAGE_GROWTH_LABEL, ZONE_CONTENT, garageGrowthStage, sourceObjects, targetContent, validateContentPack } from '../src/zone_content.ts';

assert.deepEqual(validateContentPack(),[]);

const zones=['z1','z2','z3'] as ZoneId[];
const classes=TARGET_CLASSES.map(x=>x.id) as TargetClassId[];
for(const zone of zones){
  for(const classId of classes){
    const names=new Set<number>();
    const labels=new Set<string>();
    for(let variant=0;variant<8;variant++){
      const item=targetContent(zone,classId,variant);
      labels.add(item.label);names.add(variant%ZONE_CONTENT[zone][classId].length);
    }
    assert.ok(labels.size>=4,`${zone}/${classId} needs >=4 readable variants`);
    assert.equal(names.size,ZONE_CONTENT[zone][classId].length);
  }
}
assert.ok(sourceObjects('z2','pump').some(x=>x.toLowerCase().includes('насос')));
assert.ok(sourceObjects('z3','compressor').some(x=>x.toLowerCase().includes('холодиль'))||sourceObjects('z3','compressor').some(x=>x.toLowerCase().includes('мороз')));

const installed=new Set<keyof typeof MACHINE_DEFS>(['workbench']);
assert.equal(garageGrowthStage(installed,false,false),'starter');
installed.add('press');assert.equal(garageGrowthStage(installed,false,false),'press');
installed.add('wire');assert.equal(garageGrowthStage(installed,false,false),'copper');
installed.add('plastic');assert.equal(garageGrowthStage(installed,false,false),'processing');
assert.equal(garageGrowthStage(installed,true,false),'crew');
assert.equal(garageGrowthStage(installed,true,true),'crew');
assert.ok(GARAGE_GROWTH_LABEL.crew.includes('команда'));

console.log(JSON.stringify({
  zones:zones.map(z=>({zone:z,variants:classes.reduce((n,c)=>n+ZONE_CONTENT[z][c].length,0)})),
  z2PumpSources:sourceObjects('z2','pump'),
  z3CompressorSources:sourceObjects('z3','compressor'),
  garageStages:Object.keys(GARAGE_GROWTH_LABEL)
},null,2));
console.log('content pack A smoke: PASS');
