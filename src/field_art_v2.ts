export type FieldArtFrame=
  |'player-idle'|'player-move'|'player-attack'
  |'small-scrap'|'cable'|'small-appliance'|'machine-frame'|'medium-generator'
  |'large-intact'|'large-damaged'|'large-critical'|'debris';

const CELL=256;
const FRAME_INDEX:Record<FieldArtFrame,number>={
  'player-idle':0,'player-move':1,'player-attack':2,'small-scrap':3,
  'cable':4,'small-appliance':5,'machine-frame':6,'medium-generator':7,
  'large-intact':8,'large-damaged':9,'large-critical':10,'debris':11
};

let atlas:HTMLImageElement|null=null;
let ready=false;
let failed=false;

function ensureAtlas(){
  if(atlas||failed||typeof Image==='undefined')return;
  atlas=new Image();
  atlas.decoding='async';
  atlas.onload=()=>{ready=true};
  atlas.onerror=()=>{failed=true;atlas=null};
  atlas.src='/art/v2/field_atlas.svg';
}

export function fieldArtReady(){ensureAtlas();return ready}

export function drawFieldArtFrame(
  ctx:CanvasRenderingContext2D,
  frame:FieldArtFrame,
  x:number,
  y:number,
  width:number,
  height=width,
  rotation=0,
  alpha=1
){
  ensureAtlas();
  if(!atlas||!ready)return false;
  const index=FRAME_INDEX[frame],sx=(index%4)*CELL,sy=Math.floor(index/4)*CELL;
  ctx.save();
  ctx.translate(x,y);
  if(rotation)ctx.rotate(rotation);
  ctx.globalAlpha*=alpha;
  ctx.drawImage(atlas,sx,sy,CELL,CELL,-width/2,-height/2,width,height);
  ctx.restore();
  return true;
}
