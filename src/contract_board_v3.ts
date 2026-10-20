import type {ComponentKind,ResourceKind} from './sim.ts';
import type {ProcessKind,ContractState} from './early_game.ts';
import {
  CONTRACT_BOARD_V2,eligibleBoardContracts,contractSignature,
  type ContractBoardContext,type ContractBoardDef,type ContractBoardNeed
} from './contract_board_v2.ts';

export type StandingNeedKind='resource'|'processed';
export interface StandingBuyerV3{
  id:string;
  name:string;
  description:string;
  kind:StandingNeedKind;
  key:ResourceKind|ProcessKind;
  label:string;
  batchAmount:number;
  unitPrice:number;
  xpPerBatch:number;
  minLevel:number;
  requires?:string;
}

export interface ContractBoardV3State extends ContractState{
  standingProgress?:Record<string,number>;
  standingCompleted?:Record<string,number>;
  specialCurrentIds?:string[];
  specialRecentIds?:string[];
  specialCompleted?:number;
}

export interface StandingDeliveryV3{
  buyer:StandingBuyerV3;
  requested:number;
  consumed:number;
  cash:number;
  xp:number;
  batchesCompleted:number;
  progress:number;
}

export const STANDING_BUYERS_V3:StandingBuyerV3[]=[
  {id:'standing_metal',name:'Городской пункт металла',description:'Постоянный покупатель обычного металлолома. Не исчезает и принимает любую часть партии.',kind:'resource',key:'metal',label:'Металл',batchAmount:24,unitPrice:10.5,xpPerBatch:7,minLevel:1},
  {id:'standing_copper',name:'Приём цветмета',description:'Постоянный канал для меди. Небольшие партии не мешают копить ресурс на развитие.',kind:'resource',key:'copper',label:'Медь',batchAmount:4,unitPrice:78,xpPerBatch:8,minLevel:2},
  {id:'standing_plastic',name:'Переработчик полимеров',description:'Постоянно забирает пластик небольшими партиями.',kind:'resource',key:'plastic',label:'Пластик',batchAmount:12,unitPrice:6.5,xpPerBatch:6,minLevel:2},
  {id:'standing_briquette',name:'Малая литейка',description:'Стабильный покупатель прессованного металла. Платит за переработку, а не за объём сырья.',kind:'processed',key:'briquette',label:'Брикеты',batchAmount:12,unitPrice:14,xpPerBatch:10,minLevel:5,requires:'processed:briquette'},
  {id:'standing_clean_copper',name:'Электротехнический цех',description:'Постоянно принимает чистую медь небольшими партиями.',kind:'processed',key:'cleanCopper',label:'Чистая медь',batchAmount:4,unitPrice:104,xpPerBatch:12,minLevel:6,requires:'processed:cleanCopper'},
  {id:'standing_granulate',name:'Цех формовки',description:'Постоянный канал сбыта гранулята.',kind:'processed',key:'granulate',label:'Гранулы',batchAmount:10,unitPrice:10,xpPerBatch:10,minLevel:7,requires:'processed:granulate'}
];

export function standingBuyersForContext(ctx:ContractBoardContext):StandingBuyerV3[]{
  return STANDING_BUYERS_V3.filter(buyer=>buyer.minLevel<=ctx.level&&(!buyer.requires||ctx.capabilities.has(buyer.requires)));
}

function v3(state:ContractState):ContractBoardV3State{return state as ContractBoardV3State}
function progressMap(state:ContractState):Record<string,number>{const s=v3(state);return s.standingProgress??(s.standingProgress={})}
function completedMap(state:ContractState):Record<string,number>{const s=v3(state);return s.standingCompleted??(s.standingCompleted={})}
export function standingProgress(state:ContractState,buyerId:string):number{return Math.max(0,Number(progressMap(state)[buyerId])||0)}
export function standingCompleted(state:ContractState,buyerId:string):number{return Math.max(0,Math.floor(Number(completedMap(state)[buyerId])||0))}

export function deliverStandingV3(state:ContractState,buyerId:string,owned:number,requested:number,priceMultiplier=1):StandingDeliveryV3|null{
  const buyer=STANDING_BUYERS_V3.find(item=>item.id===buyerId);if(!buyer)return null;
  const consumed=Math.max(0,Math.min(Math.max(0,owned),Math.max(0,requested)));if(consumed<=1e-9)return{buyer,requested,consumed:0,cash:0,xp:0,batchesCompleted:0,progress:standingProgress(state,buyerId)};
  const map=progressMap(state),done=completedMap(state),before=standingProgress(state,buyerId),total=before+consumed,batchesCompleted=Math.floor((total+1e-9)/buyer.batchAmount),progress=total-batchesCompleted*buyer.batchAmount;
  map[buyerId]=progress;done[buyerId]=standingCompleted(state,buyerId)+batchesCompleted;
  return{buyer,requested,consumed,cash:consumed*buyer.unitPrice*Math.max(.1,priceMultiplier),xp:batchesCompleted*buyer.xpPerBatch,batchesCompleted,progress};
}

function specialPool(ctx:ContractBoardContext):ContractBoardDef[]{
  // Raw bulk demand belongs to standing buyers. Special orders must justify
  // inventory pressure with transformation/component/industrial margin.
  return eligibleBoardContracts(ctx).filter(def=>def.family!=='raw');
}

export function specialOrdersV3(state:ContractState,ctx:ContractBoardContext,count=1):ContractBoardDef[]{
  const pool=specialPool(ctx);if(!pool.length)return[];
  const s=v3(state),recent=(s.specialRecentIds??[]).slice(-5),current=(s.specialCurrentIds??[]).filter(id=>pool.some(def=>def.id===id));
  const target=Math.min(Math.max(1,count),Math.min(3,pool.length));
  const used=new Set(current),signatures=new Set(current.map(id=>contractSignature(pool.find(def=>def.id===id)!)));
  let pointer=Math.max(0,state.index)+Math.max(0,s.specialCompleted??0)*3;
  while(current.length<target){
    let candidates=pool.filter(def=>!used.has(def.id)&&!recent.includes(def.id)&&!signatures.has(contractSignature(def)));
    if(!candidates.length)candidates=pool.filter(def=>!used.has(def.id)&&!signatures.has(contractSignature(def)));
    if(!candidates.length)candidates=pool.filter(def=>!used.has(def.id));
    if(!candidates.length)break;
    const pick=candidates[pointer%candidates.length];pointer+=2;current.push(pick.id);used.add(pick.id);signatures.add(contractSignature(pick));
  }
  s.specialCurrentIds=current;
  return current.map(id=>pool.find(def=>def.id===id)).filter(Boolean) as ContractBoardDef[];
}

export function advanceSpecialOrderV3(state:ContractState,completed:ContractBoardDef):void{
  const s=v3(state),current=(s.specialCurrentIds??[]).filter(id=>id!==completed.id),recent=[...(s.specialRecentIds??[]),completed.id].slice(-6);
  s.specialCurrentIds=current;s.specialRecentIds=recent;s.specialCompleted=Math.max(0,s.specialCompleted??0)+1;state.completed=Math.max(0,state.completed)+1;state.index=Math.max(0,state.index)+1;
}

export function needOwnedFromInventory(need:ContractBoardNeed,inventory:{resources:Record<ResourceKind,number>;components:Record<ComponentKind,number>;processed:Record<ProcessKind,number>;lookup?:(need:ContractBoardNeed)=>number}):number{
  if(need.kind==='resource')return inventory.resources[need.key as ResourceKind]??0;
  if(need.kind==='component')return inventory.components[need.key as ComponentKind]??0;
  if(need.kind==='processed')return inventory.processed[need.key as ProcessKind]??0;
  return inventory.lookup?.(need)??0;
}

export function standingBuyerMarginVsDirectSale(buyer:StandingBuyerV3,directUnitPrice:number):number{return directUnitPrice<=0?Infinity:buyer.unitPrice/directUnitPrice}
export function specialOrderCountFromTalentChoices(contractChoices:number):number{return Math.max(1,Math.min(3,Math.floor(contractChoices||1)))}
export {CONTRACT_BOARD_V2};
