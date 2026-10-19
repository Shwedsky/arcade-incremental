export interface StorageLike{
  getItem(key:string):string|null;
  setItem(key:string,value:string):void;
  removeItem(key:string):void;
}
export type SaveSource='primary'|'backup'|'temp'|'none';
export interface SaveReadResult{raw:string|null;source:SaveSource;recovered:boolean;reason?:string}
export interface CloudSaveSnapshot{schema:number;updatedAt:number;raw:string}
export interface SaveChoice{winner:'local'|'cloud'|'none';raw:string|null;localUpdatedAt:number;cloudUpdatedAt:number}

export const BACKUP_SUFFIX='.backup';
export const TEMP_SUFFIX='.tmp';
export const MAX_SAVE_BYTES=180_000;

export function parseGameSave(raw:string|null):Record<string,unknown>|null{
  if(!raw)return null;
  try{
    if(new TextEncoder().encode(raw).byteLength>MAX_SAVE_BYTES)return null;
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object')return null;
    const v=Number((value as any).v);
    if(!Number.isFinite(v)||v<2||v>20)return null;
    return value as Record<string,unknown>;
  }catch{return null}
}

export function saveUpdatedAt(raw:string|null):number{
  const value=parseGameSave(raw);if(!value)return 0;
  const ts=Number(value.lastSeen??0);return Number.isFinite(ts)&&ts>0?ts:0;
}

export function readResilientSave(storage:StorageLike,key:string):SaveReadResult{
  const primary=storage.getItem(key);
  if(parseGameSave(primary))return{raw:primary,source:'primary',recovered:false};
  const backup=storage.getItem(key+BACKUP_SUFFIX);
  if(parseGameSave(backup)){
    try{storage.setItem(key,backup!)}catch{}
    return{raw:backup,source:'backup',recovered:true,reason:primary?'primary_corrupt':'primary_missing'};
  }
  const temp=storage.getItem(key+TEMP_SUFFIX);
  if(parseGameSave(temp)){
    try{storage.setItem(key,temp!);storage.removeItem(key+TEMP_SUFFIX)}catch{}
    return{raw:temp,source:'temp',recovered:true,reason:primary?'primary_corrupt_backup_invalid':'interrupted_write'};
  }
  return{raw:null,source:'none',recovered:!!primary,reason:primary?'all_candidates_invalid':undefined};
}

export function writeResilientSave(storage:StorageLike,key:string,raw:string):{ok:boolean;bytes:number;reason?:string}{
  const parsed=parseGameSave(raw);const bytes=new TextEncoder().encode(raw).byteLength;
  if(!parsed)return{ok:false,bytes,reason:bytes>MAX_SAVE_BYTES?'too_large':'invalid_save'};
  try{
    const current=storage.getItem(key);
    if(parseGameSave(current))storage.setItem(key+BACKUP_SUFFIX,current!);
    storage.setItem(key+TEMP_SUFFIX,raw);
    storage.setItem(key,raw);
    storage.removeItem(key+TEMP_SUFFIX);
    return{ok:true,bytes};
  }catch{return{ok:false,bytes,reason:'storage_write_failed'}}
}

export function clearResilientSave(storage:StorageLike,key:string){
  for(const suffix of ['',BACKUP_SUFFIX,TEMP_SUFFIX]){try{storage.removeItem(key+suffix)}catch{}}
}

export function validCloudSnapshot(value:unknown):CloudSaveSnapshot|null{
  if(!value||typeof value!=='object')return null;
  const candidate=value as Partial<CloudSaveSnapshot>;
  if(typeof candidate.raw!=='string'||!parseGameSave(candidate.raw))return null;
  const updatedAt=Number(candidate.updatedAt),schema=Number(candidate.schema);
  if(!Number.isFinite(updatedAt)||updatedAt<=0||!Number.isFinite(schema)||schema<2)return null;
  return{raw:candidate.raw,updatedAt,schema};
}

export function chooseNewestSave(localRaw:string|null,cloudValue:unknown):SaveChoice{
  const localValid=parseGameSave(localRaw)?localRaw:null,cloud=validCloudSnapshot(cloudValue);
  const localUpdatedAt=saveUpdatedAt(localValid),cloudUpdatedAt=cloud?.updatedAt??0;
  if(!localValid&&!cloud)return{winner:'none',raw:null,localUpdatedAt,cloudUpdatedAt};
  if(!localValid&&cloud)return{winner:'cloud',raw:cloud.raw,localUpdatedAt,cloudUpdatedAt};
  if(localValid&&!cloud)return{winner:'local',raw:localValid,localUpdatedAt,cloudUpdatedAt};
  return cloudUpdatedAt>localUpdatedAt
    ?{winner:'cloud',raw:cloud!.raw,localUpdatedAt,cloudUpdatedAt}
    :{winner:'local',raw:localValid,localUpdatedAt,cloudUpdatedAt};
}

export function toCloudSnapshot(raw:string):CloudSaveSnapshot|null{
  const parsed=parseGameSave(raw);if(!parsed)return null;
  return{schema:Number(parsed.v),updatedAt:saveUpdatedAt(raw)||Date.now(),raw};
}
