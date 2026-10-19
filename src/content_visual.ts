import type { ContentVisualKind } from './zone_content.ts';

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}

export function drawContentDetail(ctx:CanvasRenderingContext2D,kind:ContentVisualKind):void{
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=.9;
  if(kind==='sheet'){ctx.strokeStyle='#d4d9d3';ctx.lineWidth=2;ctx.strokeRect(-13,-4,24,9);line(ctx,-10,1,9,-2)}
  else if(kind==='pipes'){ctx.strokeStyle='#b8c2bc';ctx.lineWidth=4;for(const y of [-5,1,7])line(ctx,-13,y,13,y)}
  else if(kind==='frame'){ctx.strokeStyle='#c8d1cb';ctx.lineWidth=3;ctx.strokeRect(-12,-9,24,18);line(ctx,-10,8,9,-8)}
  else if(kind==='cans'){ctx.fillStyle='#b9c1bc';for(const x of [-8,0,8]){rr(ctx,x-3,-7,6,14,2);ctx.fill()}}
  else if(kind==='coil'||kind==='loom'){ctx.strokeStyle=kind==='coil'?'#e18a51':'#bd7851';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();if(kind==='loom'){line(ctx,-11,7,12,-7);line(ctx,-9,-8,10,8)}}
  else if(kind==='tool'){ctx.strokeStyle='#d2b16d';ctx.lineWidth=4;line(ctx,-10,8,9,-7);ctx.beginPath();ctx.arc(10,-8,4,0,Math.PI*2);ctx.stroke()}
  else if(kind==='small_motor'){ctx.fillStyle='#74857d';rr(ctx,-10,-7,20,14,4);ctx.fill();ctx.strokeStyle='#d0a75b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.stroke()}
  else if(kind==='fan'){ctx.strokeStyle='#c8d3cd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#7a8a83';for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.ellipse(4,0,7,3,0,0,Math.PI*2);ctx.fill();ctx.restore()}}
  else if(kind==='bike'){ctx.strokeStyle='#d2b15d';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-8,5,6,0,Math.PI*2);ctx.arc(8,5,6,0,Math.PI*2);ctx.moveTo(-8,5);ctx.lineTo(0,-5);ctx.lineTo(8,5);ctx.lineTo(0,5);ctx.closePath();ctx.stroke()}
  else if(kind==='cart'){ctx.strokeStyle='#b8c3bd';ctx.lineWidth=2.5;ctx.strokeRect(-10,-4,18,9);line(ctx,8,-4,13,-9);ctx.beginPath();ctx.arc(-6,7,3,0,Math.PI*2);ctx.arc(6,7,3,0,Math.PI*2);ctx.stroke()}
  else if(kind==='pump'){ctx.fillStyle='#5f7e86';rr(ctx,-10,-7,20,14,5);ctx.fill();ctx.strokeStyle='#d4c06f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-2,0,5,0,Math.PI*2);ctx.stroke();line(ctx,8,-1,13,-1)}
  else if(kind==='compressor'){ctx.fillStyle='#6c7b75';rr(ctx,-12,-6,24,13,6);ctx.fill();ctx.strokeStyle='#d6a758';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-7,9,3,0,Math.PI*2);ctx.arc(7,9,3,0,Math.PI*2);ctx.stroke();line(ctx,10,-5,13,-10)}
  else if(kind==='welder'){ctx.fillStyle='#67747a';rr(ctx,-10,-9,20,18,4);ctx.fill();ctx.fillStyle='#9ed5d7';ctx.fillRect(-6,-4,12,5);ctx.strokeStyle='#cc8b4b';ctx.lineWidth=2;line(ctx,8,7,13,12)}
  else if(kind==='heater'){ctx.strokeStyle='#d1d7d1';ctx.lineWidth=2;ctx.strokeRect(-11,-8,22,16);for(const x of [-6,-2,2,6])line(ctx,x,-5,x,5)}
  else if(kind==='vacuum'){ctx.fillStyle='#7d8a84';rr(ctx,-9,-8,18,16,7);ctx.fill();ctx.strokeStyle='#c8a35a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.stroke();line(ctx,8,-4,13,-10)}
  else if(kind==='microwave'){ctx.fillStyle='#9aa59f';rr(ctx,-12,-8,24,16,3);ctx.fill();ctx.fillStyle='#42514d';ctx.fillRect(-8,-5,12,10);ctx.fillStyle='#d4a952';ctx.beginPath();ctx.arc(8,-2,2,0,Math.PI*2);ctx.arc(8,4,2,0,Math.PI*2);ctx.fill()}
  else if(kind==='washer'||kind==='dishwasher'||kind==='dryer'){ctx.strokeStyle='#d8ddd8';ctx.lineWidth=2;ctx.strokeRect(-11,-12,22,24);if(kind==='dishwasher'){ctx.fillStyle='#596864';ctx.fillRect(-8,-7,16,4);ctx.fillRect(-8,0,16,7)}else{ctx.beginPath();ctx.arc(0,2,7,0,Math.PI*2);ctx.stroke();if(kind==='dryer'){ctx.strokeStyle='#c49e5e';line(ctx,-5,-8,5,-8)}}}
  else if(kind==='oven'){ctx.strokeStyle='#d3d7d2';ctx.lineWidth=2;ctx.strokeRect(-11,-13,22,26);ctx.fillStyle='#4b5652';ctx.fillRect(-7,-5,14,11);for(const x of [-6,0,6]){ctx.beginPath();ctx.arc(x,-9,1.6,0,Math.PI*2);ctx.fill()}}
  else if(kind==='fridge'||kind==='freezer'){ctx.strokeStyle='#e0ded2';ctx.lineWidth=2;ctx.strokeRect(-10,-15,20,30);if(kind==='fridge')line(ctx,-9,-2,9,-2);else line(ctx,-8,-9,8,-9);ctx.strokeStyle='#a4875e';line(ctx,6,-10,6,-5)}
  else if(kind==='boiler'){ctx.fillStyle='#8c9690';rr(ctx,-9,-14,18,28,8);ctx.fill();ctx.strokeStyle='#d0a85c';ctx.lineWidth=2;line(ctx,-4,-9,4,-9)}
  else if(kind==='generator'){ctx.fillStyle='#606f69';rr(ctx,-12,-9,24,18,4);ctx.fill();ctx.strokeStyle='#d7b25a';ctx.lineWidth=2;ctx.strokeRect(-15,-12,30,24);ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
}
