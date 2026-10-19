import { getTargetClass, type ResourceKind, type SalvageTarget, type Vec2 } from './sim.ts';
import type { ZoneId } from './midgame.ts';
import { TARGET_VISUALS, zoneVisual, type DecorVisualKind } from './visual_theme.ts';
import { targetContent } from './zone_content.ts';
import { drawContentDetail } from './content_visual.ts';

export interface Pickup extends Vec2 { kind:ResourceKind; amount:number; vx:number; vy:number; age:number }
export interface FloatText extends Vec2 { text:string; color:string; life:number; big?:boolean }
export interface Spark extends Vec2 { vx:number; vy:number; life:number; max:number; color:string; size:number }
export interface Decor extends Vec2 { kind:DecorVisualKind; size:number; rot:number; tone:number }
export interface PlayerView extends Vec2 { fx:number; fy:number }
export interface CameraView extends Vec2 { shakeX:number; shakeY:number }

const RESOURCE_COLOR:Record<ResourceKind,string>={metal:'#d7dfdf',copper:'#f08a45',plastic:'#46a7ff'};

export function makeDecor(rng:()=>number,width:number,height:number,zone:ZoneId='z1'):Decor[]{
  const theme=zoneVisual(zone),pool=[...theme.decor,...theme.decor,'patch'] as DecorVisualKind[];
  const count=zone==='z1'?92:zone==='z2'?78:104;
  return Array.from({length:count},()=>({
    x:70+rng()*(width-140),y:70+rng()*(height-140),
    kind:pool[Math.floor(rng()*pool.length)],size:14+rng()*36,rot:(rng()-.5)*Math.PI,tone:rng()
  }));
}

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}

function drawGround(ctx:CanvasRenderingContext2D,width:number,height:number,camera:CameraView,zone:ZoneId){
  const theme=zoneVisual(zone),g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,theme.groundTop);g.addColorStop(1,theme.groundBottom);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=theme.groundDust;
  const step=56,ox=(-camera.x*.15)%step,oy=(-camera.y*.15)%step;
  for(let y=oy-20;y<height+20;y+=step)for(let x=ox-20;x<width+20;x+=step){const dustRadius=1.2+((((x+y)%3)+3)%3);ctx.beginPath();ctx.arc(x,y,dustRadius,0,Math.PI*2);ctx.fill()}
  ctx.restore();
  const roadY=720-camera.y+camera.shakeY;
  if(zone==='z1'){
    ctx.fillStyle=theme.lane;ctx.fillRect(0,roadY-68,width,136);ctx.strokeStyle=theme.laneMark+'66';ctx.setLineDash([22,28]);ctx.lineWidth=3;line(ctx,0,roadY,width,roadY);ctx.setLineDash([]);
  }else if(zone==='z2'){
    ctx.fillStyle=theme.lane;ctx.fillRect(0,roadY-92,width,184);ctx.strokeStyle=theme.edge;ctx.lineWidth=7;line(ctx,0,roadY-92,width,roadY-92);line(ctx,0,roadY+92,width,roadY+92);ctx.strokeStyle=theme.laneMark+'66';ctx.setLineDash([32,24]);ctx.lineWidth=2;line(ctx,0,roadY,width,roadY);ctx.setLineDash([]);
    ctx.fillStyle='#293136';for(let x=-((camera.x*.4)%190)-80;x<width+180;x+=190){rr(ctx,x,34,154,78,7);ctx.fill();ctx.fillStyle='#526069';ctx.fillRect(x+15,58,54,42);ctx.fillRect(x+86,58,54,42);ctx.fillStyle='#293136'}
  }else{
    ctx.fillStyle=theme.lane;ctx.fillRect(0,roadY-78,width,156);ctx.strokeStyle=theme.laneMark+'44';ctx.lineWidth=2;for(let x=-((camera.x*.2)%120);x<width;x+=120)line(ctx,x,roadY-78,x+55,roadY+78);
    ctx.fillStyle='#2c312e';ctx.fillRect(0,18,width,34);ctx.fillStyle='#8b6746';for(let x=-((camera.x*.25)%240);x<width+240;x+=240){ctx.fillRect(x,20,116,30);ctx.fillStyle='#526365';ctx.fillRect(x+120,20,112,30);ctx.fillStyle='#8b6746'}
  }
}

function drawDecor(ctx:CanvasRenderingContext2D,d:Decor,p:Vec2,zone:ZoneId){
  const theme=zoneVisual(zone);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);ctx.globalAlpha=.88;
  if(d.kind==='patch'){ctx.fillStyle=d.tone>.5?theme.groundDust:theme.edge;ctx.globalAlpha=.22;ellipse(ctx,0,0,d.size*1.65,d.size*.72);ctx.fill()}
  else if(d.kind==='barrel'){ctx.fillStyle=d.tone>.5?'#b8693f':'#617a75';rr(ctx,-11,-16,22,32,5);ctx.fill();ctx.fillStyle='#25312e88';ctx.fillRect(-11,-4,22,5);ctx.fillRect(-11,8,22,4)}
  else if(d.kind==='tire'){ctx.strokeStyle='#171d1b';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,10+d.size*.12,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#6f797355';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,5+d.size*.08,0,Math.PI*2);ctx.stroke()}
  else if(d.kind==='crate'){ctx.fillStyle='#866348';ctx.fillRect(-15,-12,30,24);ctx.strokeStyle='#b08b62';ctx.lineWidth=2;line(ctx,-12,-9,12,9);line(ctx,12,-9,-12,9)}
  else if(d.kind==='fence'){ctx.strokeStyle='#788781';ctx.lineWidth=3;line(ctx,-d.size,0,d.size,0);for(let x=-d.size;x<=d.size;x+=12)line(ctx,x,-7,x,7)}
  else if(d.kind==='cone'){ctx.fillStyle='#e58b42';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,10);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.fillStyle='#e8e0c8';ctx.fillRect(-7,1,14,4)}
  else if(d.kind==='pallet'){ctx.fillStyle='#8a6c4c';ctx.fillRect(-18,-12,36,24);ctx.fillStyle='#b08a5e';for(let y=-9;y<=9;y+=9)ctx.fillRect(-18,y,36,3)}
  else if(d.kind==='puddle'){ctx.fillStyle=zone==='z2'?'#55778055':'#4c5f5750';ellipse(ctx,0,0,d.size*1.1,d.size*.42);ctx.fill();ctx.strokeStyle='#9cc4c322';ctx.lineWidth=1;ctx.stroke()}
  else{ctx.fillStyle='#4c5550';ctx.fillRect(-d.size*.7,-8,d.size*1.4,16);ctx.fillStyle='#777e78';ctx.fillRect(-d.size*.45,-15,d.size*.55,10);ctx.fillStyle='#9b6a47';ctx.fillRect(4,-13,d.size*.38,9)}
  ctx.restore();
}

function targetShadow(ctx:CanvasRenderingContext2D,r:number,depth:number){ctx.save();ctx.globalAlpha=.42;ctx.fillStyle='#08100d';ellipse(ctx,3,depth+8,r*.88,r*.32);ctx.fill();ctx.restore()}
function targetBody(ctx:CanvasRenderingContext2D,t:SalvageTarget){
  const v=TARGET_VISUALS[t.classId];targetShadow(ctx,getTargetClass(t.classId).radius,v.depthPx);
  if(t.classId==='small_scrap'){
    ctx.fillStyle=v.dark;ctx.fillRect(-19,-6+v.depthPx,30,10);ctx.fillStyle=t.variant%2?v.accent:v.base;ctx.fillRect(-20,-11,26,10);ctx.fillStyle=v.light;ctx.fillRect(-4,-3,23,7);ctx.strokeStyle='#17201c88';ctx.lineWidth=2;line(ctx,-16,-8,3,1);
  }else if(t.classId==='cable'){
    ctx.strokeStyle=v.dark;ctx.lineWidth=10;ctx.beginPath();ctx.arc(2,3,14,0,5.7);ctx.stroke();ctx.strokeStyle=v.base;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,14,0,5.7);ctx.stroke();ctx.strokeStyle=v.light;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-2,-2,12,3.2,5.4);ctx.stroke();
  }else if(t.classId==='small_appliance'){
    ctx.fillStyle=v.dark;rr(ctx,-21,-13+v.depthPx,42,34,7);ctx.fill();ctx.fillStyle=t.variant%2?v.light:v.base;rr(ctx,-21,-17,42,34,7);ctx.fill();ctx.fillStyle=v.dark;rr(ctx,-13,-9,22,14,4);ctx.fill();ctx.fillStyle=v.accent;ctx.beginPath();ctx.arc(14,-9,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff55';ctx.fillRect(-16,-13,22,3);
  }else if(t.classId==='bike_fan'){
    ctx.strokeStyle=v.dark;ctx.lineWidth=7;ctx.beginPath();ctx.arc(-15,11,12,0,Math.PI*2);ctx.arc(16,11,12,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=t.variant%2?v.accent:v.base;ctx.lineWidth=4;ctx.beginPath();ctx.arc(-15,8,12,0,Math.PI*2);ctx.arc(16,8,12,0,Math.PI*2);ctx.moveTo(-15,8);ctx.lineTo(0,-9);ctx.lineTo(16,8);ctx.lineTo(-2,8);ctx.closePath();ctx.stroke();ctx.fillStyle=v.light;ctx.fillRect(-3,-12,11,4);
  }else if(t.classId==='medium_appliance'){
    ctx.fillStyle=v.dark;rr(ctx,-28,-27+v.depthPx,56,64,9);ctx.fill();ctx.fillStyle=v.base;rr(ctx,-28,-32,56,64,9);ctx.fill();ctx.fillStyle=v.light;ctx.fillRect(-22,-26,44,6);ctx.fillStyle=v.dark;ctx.beginPath();ctx.arc(0,7,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#9fb8ba';ctx.beginPath();ctx.arc(0,7,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=v.accent;ctx.fillRect(-19,-21,20,5);
  }else{
    ctx.fillStyle=v.dark;rr(ctx,-32,-36+v.depthPx,64,88,8);ctx.fill();ctx.fillStyle=v.base;rr(ctx,-32,-44,64,88,8);ctx.fill();ctx.fillStyle=v.light;ctx.fillRect(-27,-38,54,7);ctx.strokeStyle=v.dark;ctx.lineWidth=3;line(ctx,-28,-12,28,-12);ctx.fillStyle=v.accent;rr(ctx,-22,2,44,24,5);ctx.fill();ctx.fillStyle='#dfe8e0aa';ctx.fillRect(-17,7,34,4);
  }
}

function drawVehicle(ctx:CanvasRenderingContext2D,screen:(v:Vec2)=>Vec2,load:number,capacity:number,workerHere:boolean){
  const p=screen({x:170,y:565});ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#0007';ellipse(ctx,0,22,53,15);ctx.fill();ctx.fillStyle='#34464d';rr(ctx,-52,-28,104,48,10);ctx.fill();ctx.fillStyle='#7ea9b2';rr(ctx,-44,-34,60,42,9);ctx.fill();ctx.fillStyle='#24353a';ctx.fillRect(-36,-27,25,15);ctx.fillRect(-6,-27,18,15);ctx.fillStyle='#d7b45a';ctx.fillRect(27,-8,20,5);ctx.fillStyle='#171d1e';ctx.beginPath();ctx.arc(-30,21,10,0,Math.PI*2);ctx.arc(31,21,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2e6e3';ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillText('SALVAGE',16,4);ctx.restore();
  const ratio=Math.max(0,Math.min(1,load/Math.max(1,capacity)));ctx.fillStyle='#09110edd';rr(ctx,p.x-43,p.y+39,86,8,4);ctx.fill();ctx.fillStyle=ratio>.9?'#e79f53':'#d9bd62';rr(ctx,p.x-42,p.y+40,84*ratio,6,3);ctx.fill();
  if(workerHere){const w=screen({x:235,y:600});ctx.fillStyle='#0005';ellipse(ctx,w.x,w.y+15,14,5);ctx.fill();ctx.fillStyle='#e0b56b';ctx.beginPath();ctx.arc(w.x,w.y-9,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#596e62';rr(ctx,w.x-9,w.y-3,18,25,5);ctx.fill();ctx.fillStyle='#e7bb48';ctx.fillRect(w.x-10,w.y-3,20,5)}
}

function drawPlayer(ctx:CanvasRenderingContext2D,p:Vec2,player:PlayerView){
  const bx=p.x-player.fx*32,by=p.y-player.fy*32;ctx.fillStyle='#0006';ellipse(ctx,p.x,p.y+19,25,9);ctx.fill();ctx.strokeStyle='#1c2824';ctx.lineWidth=5;line(ctx,p.x,p.y+8,bx,by);ctx.fillStyle='#5b674f';rr(ctx,bx-21,by-15,42,29,6);ctx.fill();ctx.fillStyle='#9a744c';ctx.fillRect(bx-18,by-12,36,7);ctx.fillStyle='#28332f';ctx.beginPath();ctx.arc(bx-15,by+17,6,0,Math.PI*2);ctx.arc(bx+15,by+17,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e99b46';rr(ctx,p.x-11,p.y-6,22,29,7);ctx.fill();ctx.fillStyle='#f1b77f';ctx.beginPath();ctx.arc(p.x,p.y-13,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#27342f';ctx.fillRect(p.x-10,p.y+7,20,5);ctx.fillStyle='#d8bd55';ctx.fillRect(p.x-10,p.y-6,20,4);
}

export function renderField(args:{
  ctx:CanvasRenderingContext2D;width:number;height:number;camera:CameraView;player:PlayerView;targets:SalvageTarget[];selected:SalvageTarget|null;
  drops:Pickup[];sparks:Spark[];texts:FloatText[];decor:Decor[];zone?:ZoneId;vanOwned?:boolean;vanLoad?:number;vanCapacity?:number;workerHere?:boolean;
}){
  const {ctx,width,height,camera,player,targets,selected,drops,sparks,texts,decor}=args,zone=args.zone??'z1',theme=zoneVisual(zone);
  const screen=(v:Vec2)=>({x:v.x-camera.x+camera.shakeX,y:v.y-camera.y+camera.shakeY});
  drawGround(ctx,width,height,camera,zone);
  for(const d of decor){const p=screen(d);if(p.x<-100||p.y<-100||p.x>width+100||p.y>height+100)continue;drawDecor(ctx,d,p,zone)}
  if(args.vanOwned)drawVehicle(ctx,screen,args.vanLoad??0,args.vanCapacity??400,!!args.workerHere);
  for(const t of targets.filter(x=>x.alive).sort((a,b)=>a.y-b.y)){
    const p=screen(t),d=getTargetClass(t.classId),hp=Math.max(0,t.hp/t.maxHp);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.rotation);ctx.shadowColor=selected?.id===t.id?theme.accent+'cc':theme.shadow;ctx.shadowBlur=selected?.id===t.id?22:9;targetBody(ctx,t);drawContentDetail(ctx,targetContent(zone,t.classId,t.variant).visual);
    if(hp<.72){ctx.strokeStyle=hp<.35?'#f0b06dcc':'#403b35bb';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-d.radius*.5,-d.radius*.42);ctx.lineTo(-2,0);ctx.lineTo(d.radius*.18,d.radius*.16);ctx.lineTo(d.radius*.45,d.radius*.38);ctx.stroke();if(hp<.35){ctx.beginPath();ctx.moveTo(d.radius*.2,-d.radius*.38);ctx.lineTo(4,-4);ctx.lineTo(-d.radius*.25,d.radius*.28);ctx.stroke()}}
    ctx.restore();
    if(selected?.id===t.id){ctx.strokeStyle=theme.accent+'aa';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(p.x,p.y,d.radius+9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);const w=Math.max(42,d.radius*1.9),y=p.y-d.radius-21;ctx.fillStyle='#0b1210dd';rr(ctx,p.x-w/2,y,w,8,4);ctx.fill();ctx.fillStyle=hp>.35?'#79e86e':'#ffad58';rr(ctx,p.x-w/2+1,y+1,(w-2)*hp,6,3);ctx.fill()}
  }
  for(const p of drops){const s=screen(p);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.age*7);ctx.fillStyle=RESOURCE_COLOR[p.kind];ctx.shadowColor=RESOURCE_COLOR[p.kind];ctx.shadowBlur=p.kind==='copper'?16:11;if(p.kind==='metal'){ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#ffffff77';ctx.fillRect(-4,-4,7,2)}else if(p.kind==='copper'){ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(8,5);ctx.lineTo(-7,5);ctx.closePath();ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill()}ctx.restore()}
  for(const p of sparks){const s=screen(p),a=Math.max(0,Math.min(1,p.life/p.max));ctx.globalAlpha=a;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(1,p.size*a);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-p.vx*.025*a,s.y-p.vy*.025*a);ctx.stroke();ctx.globalAlpha=1}
  drawPlayer(ctx,screen(player),player);
  for(const t of texts){const p=screen(t);ctx.globalAlpha=Math.max(0,Math.min(1,t.life/(t.big?2:1.15)));ctx.textAlign='center';ctx.font=`${t.big?850:750} ${t.big?19:14}px system-ui`;ctx.lineWidth=5;ctx.strokeStyle='#101512dd';ctx.strokeText(t.text,p.x,p.y);ctx.fillStyle=t.color;ctx.fillText(t.text,p.x,p.y);ctx.globalAlpha=1}
}
