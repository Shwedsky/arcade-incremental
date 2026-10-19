import assert from 'node:assert/strict';
import { BACKUP_SUFFIX, MAX_SAVE_BYTES, TEMP_SUFFIX, chooseNewestSave, clearResilientSave, readResilientSave, toCloudSnapshot, writeResilientSave, type StorageLike } from '../src/save_store.ts';

class MemoryStorage implements StorageLike{
  map=new Map<string,string>();
  getItem(k:string){return this.map.get(k)??null}
  setItem(k:string,v:string){this.map.set(k,v)}
  removeItem(k:string){this.map.delete(k)}
}
const key='save';
const make=(lastSeen:number,extra:Record<string,unknown>={})=>JSON.stringify({v:4,lastSeen,xp:10,...extra});

const s=new MemoryStorage();
assert.equal(readResilientSave(s,key).source,'none');
assert.equal(writeResilientSave(s,key,make(100)).ok,true);
assert.equal(readResilientSave(s,key).source,'primary');
assert.equal(writeResilientSave(s,key,make(200,{xp:20})).ok,true);
assert.equal(JSON.parse(s.getItem(key+BACKUP_SUFFIX)!).lastSeen,100);

s.setItem(key,'{broken');
let recovered=readResilientSave(s,key);
assert.equal(recovered.source,'backup');assert.equal(recovered.recovered,true);assert.equal(JSON.parse(recovered.raw!).lastSeen,100);

const interrupted=new MemoryStorage();interrupted.setItem(key,'bad');interrupted.setItem(key+TEMP_SUFFIX,make(333));
recovered=readResilientSave(interrupted,key);assert.equal(recovered.source,'temp');assert.equal(JSON.parse(recovered.raw!).lastSeen,333);

const local=make(500),older=toCloudSnapshot(make(450))!,newer=toCloudSnapshot(make(700))!;
assert.equal(chooseNewestSave(local,older).winner,'local');
assert.equal(chooseNewestSave(local,newer).winner,'cloud');
assert.equal(chooseNewestSave(null,newer).winner,'cloud');
assert.equal(chooseNewestSave(local,null).winner,'local');

const huge=JSON.stringify({v:4,lastSeen:1,pad:'x'.repeat(MAX_SAVE_BYTES+100)});
assert.equal(writeResilientSave(s,key,huge).ok,false);

clearResilientSave(s,key);assert.equal(s.getItem(key),null);assert.equal(s.getItem(key+BACKUP_SUFFIX),null);assert.equal(s.getItem(key+TEMP_SUFFIX),null);
console.log(JSON.stringify({backupRecovery:true,tempRecovery:true,cloudNewerWins:true,maxBytes:MAX_SAVE_BYTES},null,2));
console.log('save safety smoke: PASS');
