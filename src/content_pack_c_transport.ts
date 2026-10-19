import type { PackCState } from './content_pack_c.ts';

type PackCWithTransport=PackCState&{truckAlloyScrap?:number};

function ext(state:PackCState):PackCWithTransport{return state as PackCWithTransport}
export function truckAlloyScrap(state:PackCState):number{return Math.max(0,ext(state).truckAlloyScrap??0)}
export function packCTruckWeight(state:PackCState,baseWeight:number):number{return Math.max(0,baseWeight)+truckAlloyScrap(state)}
export function packCTruckRemaining(state:PackCState,baseWeight:number,capacity:number):number{return Math.max(0,capacity-packCTruckWeight(state,baseWeight))}
export function transferPackCAlloyToTruck(state:PackCState,baseWeight:number,capacity:number,haul:{value:number}):number{
  const moved=Math.min(Math.max(0,haul.value),packCTruckRemaining(state,baseWeight,capacity));
  if(moved<=0)return 0;
  haul.value-=moved;ext(state).truckAlloyScrap=truckAlloyScrap(state)+moved;return moved;
}
export function unloadPackCTruckAlloy(state:PackCState):number{
  const amount=truckAlloyScrap(state);ext(state).truckAlloyScrap=0;return amount;
}
