import { getTargetClass, type ResourceKind, type SalvageTarget, type Vec2 } from './sim.ts';

export interface Pickup extends Vec2 { kind:ResourceKind; amount:number; vx:number; vy:number; age:number }
export interface FloatText extends Vec2 { text:string; color:string; life:number; big?:boolean }
export interface Spark extends Vec2 { vx:number; vy:number; life:number; max:number; color:string; size:number }
export interface Decor extends Vec2 { kind:'patch'|'barrel'|'tire'|'crate'|'fence'; size:number; rot:number; tone:number }
export interface PlayerView extends Vec2 { fx:number; fy:number }
export interface CameraView extends Vec2 { shakeX:number; shakeY:number }

const RESOURCE_COLOR:Record<ResourceKind,string>={metal:'#d7dfdf',copper:'#f08a45',plastic:'#46a7ff'};

export function makeDecor(rng:()=>number,width:number,height:number):Decor[]{
  const kinds:Decor['kind'][]=['patch','patch','patch','barrel','tire','crate','fence'];
  return Array.from({length:88},()=>({x:80+rng()*(width-160),y:80+rng()*(height-160),kind:kinds[Math.floor(rng()*kinds.length)],size:16+rng()*32,rot:(rng()-.5)*Math.PI,tone:rng()}));
}

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}

export function renderField(args:{
  ctx:CanvasRenderingContext2D;
  width:number;
  height:number;
  camera:CameraView;
  player:PlayerView;
  targets:SalvageTarget[];
  selected:SalvageTarget|null;
  drops:Pickup[];
  sparks:Spark[];
  texts:FloatText[];
  decor:Decor[];
}){
  const {ctx,width,height,camera,player,targets,selected,drops,sparks,texts,decor}=args;
  const screen=(v:Vec2)=>({x:v.x-camera.x+camera.shakeX,y:v.y-camera.y+camera.shakeY});
  const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'#38533e');g.addColorStop(1,'#25392e');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  const roadY=720-camera.y+camera.shakeY;ctx.fillStyle='#38413c';ctx.fillRect(0,roadY-66,width,132);ctx.strokeStyle='#d8c97833';ctx.setLineDash([22,28]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,roadY);ctx.lineTo(width,roadY);ctx.stroke();ctx.setLineDash([]);
  for(const d of decor){const p=screen(d);if(p.x<-80||p.y<-80||p.x>width+80||p.y>height+80)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);if(d.kind==='patch'){ctx.fillStyle=d.tone>.5?'#2c4635':'#314b38';ctx.beginPath();ctx.ellipse(0,0,d.size*1.6,d.size*.75,0,0,6.3);ctx.fill()}else if(d.kind==='barrel'){ctx.fillStyle=d.tone>.5?'#b8653b':'#637b73';rr(ctx,-10,-14,20,28,5);ctx.fill()}else if(d.kind==='tire'){ctx.strokeStyle='#1b211e';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,10+d.size*.12,0,6.3);ctx.stroke()}else if(d.kind==='crate'){ctx.fillStyle='#8a6746';ctx.fillRect(-14,-12,28,24)}else{ctx.strokeStyle='#6f8076';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.lineTo(d.size,0);ctx.stroke()}ctx.restore()}
  for(const t of targets.filter(x=>x.alive).sort((a,b)=>a.y-b.y)){
    const p=screen(t),d=getTargetClass(t.classId),hp=t.hp/t.maxHp;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.rotation);ctx.shadowColor=selected?.id===t.id?'#ffd35faa':'#0007';ctx.shadowBlur=selected?.id===t.id?20:10;
    if(t.classId==='small_scrap'){ctx.fillStyle=t.variant%2?'#89938a':'#9d7656';ctx.fillRect(-18,-8,24,9);ctx.fillStyle='#66726c';ctx.fillRect(-5,3,23,8)}
    else if(t.classId==='cable'){ctx.strokeStyle='#df7b42';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,14,0,5.6);ctx.stroke()}
    else if(t.classId==='small_appliance'){ctx.fillStyle=t.variant%2?'#d9d6c8':'#95b3ad';rr(ctx,-21,-17,42,34,7);ctx.fill();ctx.fillStyle='#465754';ctx.fillRect(-13,-9,20,13)}
    else if(t.classId==='bike_fan'){ctx.strokeStyle=t.variant%2?'#d36a4c':'#d7b552';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-15,8,12,0,6.3);ctx.arc(16,8,12,0,6.3);ctx.moveTo(-15,8);ctx.lineTo(0,-9);ctx.lineTo(16,8);ctx.lineTo(-2,8);ctx.closePath();ctx.stroke()}
    else if(t.classId==='medium_appliance'){ctx.fillStyle='#d9ddd5';rr(ctx,-28,-32,56,64,9);ctx.fill();ctx.fillStyle='#52635f';ctx.beginPath();ctx.arc(0,6,18,0,6.3);ctx.fill()}
    else{ctx.fillStyle='#d7c7a7';rr(ctx,-32,-44,64,88,8);ctx.fill();ctx.strokeStyle='#74817c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-29,-12);ctx.lineTo(29,-12);ctx.stroke()}
    if(hp<.72){ctx.strokeStyle='#463d35bb';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-d.radius*.48,-d.radius*.4);ctx.lineTo(0,0);ctx.lineTo(d.radius*.42,d.radius*.35);ctx.stroke()}ctx.restore();
    if(selected?.id===t.id){const w=Math.max(40,d.radius*1.8),y=p.y-d.radius-18;ctx.fillStyle='#111d';rr(ctx,p.x-w/2,y,w,8,4);ctx.fill();ctx.fillStyle=hp>.35?'#79e86e':'#ffb74f';rr(ctx,p.x-w/2+1,y+1,(w-2)*hp,6,3);ctx.fill()}
  }
  for(const p of drops){const s=screen(p);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.age*6);ctx.fillStyle=RESOURCE_COLOR[p.kind];ctx.shadowColor=RESOURCE_COLOR[p.kind];ctx.shadowBlur=12;if(p.kind==='metal')ctx.fillRect(-5,-5,10,10);else if(p.kind==='copper'){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,6,0,6.3);ctx.fill()}ctx.restore()}
  for(const p of sparks){const s=screen(p),a=Math.max(0,Math.min(1,p.life/p.max));ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.size*a+.5,0,6.3);ctx.fill();ctx.globalAlpha=1}
  const pp=screen(player),bx=pp.x-player.fx*30,by=pp.y-player.fy*30;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(pp.x,pp.y+18,24,9,0,0,6.3);ctx.fill();ctx.strokeStyle='#202824';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(pp.x,pp.y+8);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#a98255';rr(ctx,bx-20,by-14,40,29,6);ctx.fill();ctx.fillStyle='#333d39';ctx.beginPath();ctx.arc(bx-14,by+17,6,0,6.3);ctx.arc(bx+14,by+17,6,0,6.3);ctx.fill();ctx.fillStyle='#f0a94b';rr(ctx,pp.x-11,pp.y-7,22,29,7);ctx.fill();ctx.fillStyle='#e6ad7b';ctx.beginPath();ctx.arc(pp.x,pp.y-13,9,0,6.3);ctx.fill();
  for(const t of texts){const p=screen(t);ctx.globalAlpha=Math.max(0,Math.min(1,t.life/(t.big?2:1.15)));ctx.textAlign='center';ctx.font=`${t.big?850:750} ${t.big?19:14}px system-ui`;ctx.lineWidth=5;ctx.strokeStyle='#101512dd';ctx.strokeText(t.text,p.x,p.y);ctx.fillStyle=t.color;ctx.fillText(t.text,p.x,p.y);ctx.globalAlpha=1}
}
