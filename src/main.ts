import './style.css';
import {
  BASE_DPS, FIELD_NODE_COUNT, START_POS, WORLD,
  generateField, getTargetClass, hashSeed, mulberry32, rollDrops,
  type ComponentKind, type ResourceKind, type SalvageTarget, type Vec2
} from './sim.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
<main class="shell">
  <canvas id="game"></canvas>
  <div class="panel zone"><small>СТАРАЯ СВАЛКА · ЗОНА 1</small><b>Ломай и собирай</b><span id="seed"></span></div>
  <div class="panel stats"><span>Разрушено <b id="destroyed">0</b></span><span>Темп <b id="rate">0/мин</b></span><span>Подборы <b id="pickups">0/мин</b></span><span>Вылазка <b id="timer">0:00</b></span></div>
  <div id="target" class="target panel"></div>
  <div id="rare" class="rare"></div>
  <div id="full" class="full">Тележка полна — пора разгружаться</div>
  <div class="panel bottom">
    <div class="cart"><span>🛒</span><div><label>Тележка <b id="cartText">0 / 40 кг</b></label><i><em id="cartFill"></em></i></div></div>
    <div class="resources"><span>◻ <small>Металл</small> <b id="metal">0.0</b></span><span class="copper">◆ <small>Медь</small> <b id="copper">0.0</b></span><span class="plastic">● <small>Пластик</small> <b id="plastic">0.0</b></span></div>
    <div id="components" class="components"></div>
    <button id="garage" disabled>В гараж</button>
  </div>
  <section id="garageScreen" class="garage" hidden>
    <div class="garageBox">
      <header><div><small>ГАРАЖ · УРОВЕНЬ 1</small><h1>Разгрузка завершена</h1></div><b id="tripSummary"></b></header>
      <div class="floor">
        <article class="machine"><div class="art bench">🔧</div><b>Верстак</b><small>Ручной разбор</small></article>
        <article class="machine locked focus"><div class="lock">🔒</div><div class="art press">▥</div><b>Малый гидропресс</b><small>Первая большая цель</small></article>
        <article class="machine locked"><div class="lock">🔒</div><div class="art">◉◉</div><b>Зачистка проводов</b><small>Позже</small></article>
        <article class="machine locked"><div class="lock">🔒</div><div class="art">▼</div><b>Дробилка пластика</b><small>Позже</small></article>
        <aside><h2>Склад</h2><div id="storage"></div><h3>Компоненты</h3><div id="storageComponents"></div></aside>
      </div>
      <footer><span>Станки пока только визуальный preview. Проверяем основной loop.</span><button id="next">Новая вылазка</button></footer>
    </div>
  </section>
</main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const garageBtn = document.querySelector<HTMLButtonElement>('#garage')!;
const garageScreen = document.querySelector<HTMLElement>('#garageScreen')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next')!;
const seedEl = document.querySelector<HTMLElement>('#seed')!;
const rareEl = document.querySelector<HTMLElement>('#rare')!;
const fullEl = document.querySelector<HTMLElement>('#full')!;
const targetEl = document.querySelector<HTMLElement>('#target')!;

const componentName: Record<ComponentKind,string> = { bearing:'Подшипник', motor:'Электромотор', hydraulic:'Гидравлика', electronics:'Электронный модуль' };
const componentIcon: Record<ComponentKind,string> = { bearing:'◉', motor:'⚙', hydraulic:'◆', electronics:'▦' };
const resourceColor: Record<ResourceKind,string> = { metal:'#d7dfdf', copper:'#e98a46', plastic:'#4ba5ff' };

interface Pickup extends Vec2 { kind: ResourceKind; amount:number; vx:number; vy:number; age:number }
interface FloatText extends Vec2 { text:string; color:string; life:number; big?:boolean }
interface Telemetry { start:number; destroyed:number; pickupVisuals:number; components:number }

const params = new URLSearchParams(location.search);
const baseSeed = params.get('seed') ?? String(Date.now());
let trip = 0;
let rng = mulberry32(hashSeed(baseSeed));
let targets: SalvageTarget[] = [];
let drops: Pickup[] = [];
let texts: FloatText[] = [];
let selected: SalvageTarget | null = null;
let mode: 'field'|'garage' = 'field';
let last = performance.now();
let rareUntil = 0;
let cart = 0;
const capacity = 40;
let haul: Record<ResourceKind,number> = { metal:0,copper:0,plastic:0 };
let storage: Record<ResourceKind,number> = { metal:0,copper:0,plastic:0 };
let comps: Record<ComponentKind,number> = { bearing:0,motor:0,hydraulic:0,electronics:0 };
let storedComps: Record<ComponentKind,number> = { bearing:0,motor:0,hydraulic:0,electronics:0 };
let telemetry: Telemetry = { start:performance.now(), destroyed:0, pickupVisuals:0, components:0 };
const player = { x:START_POS.x,y:START_POS.y,speed:235,fx:1,fy:0 };
const camera = { x:0,y:0 };
const keys = new Set<string>();
let pointer: Vec2|null = null;

const $ = <T extends HTMLElement>(id:string) => document.querySelector<T>(`#${id}`)!;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const d2=(a:Vec2,b:Vec2)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const fmt=(s:number)=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
const screen=(v:Vec2)=>({x:v.x-camera.x,y:v.y-camera.y});

function resetTrip(){
  trip++; rng=mulberry32(hashSeed(`${baseSeed}:${trip}`)); targets=generateField(`${baseSeed}:field:${trip}`,FIELD_NODE_COUNT); drops=[];texts=[];cart=0;
  haul={metal:0,copper:0,plastic:0}; comps={bearing:0,motor:0,hydraulic:0,electronics:0}; player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;
  telemetry={start:performance.now(),destroyed:0,pickupVisuals:0,components:0}; selected=null; seedEl.textContent=`seed ${baseSeed} · поле ${trip}`; hud();
}

function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(r.width*d);canvas.height=Math.floor(r.height*d);ctx.setTransform(d,0,0,d,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key.startsWith('Arrow'))e.preventDefault()}); addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left+camera.x,y:e.clientY-r.top+camera.y};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left+camera.x,y:e.clientY-r.top+camera.y}});
canvas.addEventListener('pointerup',e=>{pointer=null;canvas.releasePointerCapture(e.pointerId)});canvas.addEventListener('contextmenu',e=>e.preventDefault());

function move(dt:number){let x=0,y=0;if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;
  if(!x&&!y&&pointer){x=pointer.x-player.x;y=pointer.y-player.y;if(Math.hypot(x,y)<14)x=y=0}const l=Math.hypot(x,y);if(!l)return;x/=l;y/=l;player.fx=x;player.fy=y;const slow=1-.12*(cart/capacity);player.x=clamp(player.x+x*player.speed*slow*dt,35,WORLD.width-35);player.y=clamp(player.y+y*player.speed*slow*dt,35,WORLD.height-35)}

function nearest(){if(cart>=capacity-.01)return null;let best:null|SalvageTarget=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}
function spawnResource(kind:ResourceKind,amount:number,count:number,t:Vec2){if(amount<=.005)return;for(let i=0;i<count;i++){const a=rng()*Math.PI*2,s=60+rng()*120;drops.push({kind,amount:amount/count,x:t.x,y:t.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0});telemetry.pickupVisuals++}}
function breakTarget(t:SalvageTarget){t.alive=false;t.hp=0;telemetry.destroyed++;const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng);const total=r.resources.metal+r.resources.copper+r.resources.plastic;let left=def.fragments;
  (['metal','copper','plastic'] as ResourceKind[]).forEach((k,i)=>{const remaining=2-i;const n=i===2?left:Math.max(1,Math.min(left-remaining,Math.round(def.fragments*r.resources[k]/total)));left-=n;spawnResource(k,r.resources[k],n,t);if(r.resources[k]>.03)texts.push({x:t.x+(rng()-.5)*28,y:t.y-24-i*17,text:`+${r.resources[k].toFixed(r.resources[k]<1?1:0)} ${k==='metal'?'металл':k==='copper'?'медь':'пластик'}`,color:resourceColor[k],life:1.1})});
  if(r.component){comps[r.component]++;telemetry.components++;texts.push({x:t.x,y:t.y-70,text:`${componentIcon[r.component]} ${componentName[r.component]}!`,color:'#ffe56f',life:1.8,big:true});rareEl.innerHTML=`<small>${r.component==='motor'||r.component==='hydraulic'?'РЕДКИЙ КОМПОНЕНТ':'КОМПОНЕНТ'}</small><b>${componentIcon[r.component]} ${componentName[r.component]}</b>`;rareEl.className=`rare show ${r.component==='motor'||r.component==='hydraulic'?'strong':''}`;rareUntil=1.9}}
function combat(dt:number){selected=nearest();if(!selected)return;selected.hp-=BASE_DPS*dt;if(selected.hp<=0){breakTarget(selected);selected=null}}
function updateDrops(dt:number){for(const p of drops){p.age+=dt;if(p.age<.28){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.045,dt);p.vy*=Math.pow(.045,dt);continue}const x=player.x-p.x,y=player.y-p.y,d=Math.max(1,Math.hypot(x,y)),s=260+p.age*330;p.x+=x/d*s*dt;p.y+=y/d*s*dt;if(d<28&&cart<capacity){const take=Math.min(capacity-cart,p.amount);haul[p.kind]+=take;cart+=take;p.amount-=take}}drops=drops.filter(p=>p.amount>.002&&p.age<12)}
function updateTexts(dt:number){for(const t of texts){t.life-=dt;t.y-=22*dt}texts=texts.filter(t=>t.life>0);if(rareUntil>0){rareUntil-=dt;if(rareUntil<=0)rareEl.className='rare'}}
function cam(){const r=canvas.getBoundingClientRect(),x=clamp(player.x-r.width/2,0,Math.max(0,WORLD.width-r.width)),y=clamp(player.y-r.height/2,0,Math.max(0,WORLD.height-r.height));camera.x+=(x-camera.x)*.12;camera.y+=(y-camera.y)*.12}

function rr(x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawTarget(t:SalvageTarget){if(!t.alive)return;const p=screen(t),d=getTargetClass(t.classId),hp=t.hp/t.maxHp;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.rotation);ctx.shadowColor=selected?.id===t.id?'#ffd35f88':'#0005';ctx.shadowBlur=selected?.id===t.id?16:8;ctx.fillStyle='#79857e';
  if(t.classId==='small_scrap'){ctx.fillRect(-17,-8,22,8);ctx.fillRect(-5,2,22,8)}else if(t.classId==='cable'){ctx.strokeStyle='#d06f3e';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,14,0,5.5);ctx.stroke()}else if(t.classId==='small_appliance'){ctx.fillStyle='#d8d2bd';rr(-20,-16,40,32,7);ctx.fill();ctx.fillStyle='#4c5a59';ctx.fillRect(-12,-9,20,13)}else if(t.classId==='bike_fan'){ctx.strokeStyle='#b85640';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-15,8,12,0,6.3);ctx.arc(16,8,12,0,6.3);ctx.moveTo(-15,8);ctx.lineTo(0,-9);ctx.lineTo(16,8);ctx.lineTo(-2,8);ctx.closePath();ctx.stroke()}else if(t.classId==='medium_appliance'){ctx.fillStyle='#e2ded0';rr(-27,-31,54,62,8);ctx.fill();ctx.fillStyle='#5c6965';ctx.beginPath();ctx.arc(0,6,17,0,6.3);ctx.fill()}else{ctx.fillStyle='#d7dad2';rr(-31,-43,62,86,8);ctx.fill();ctx.strokeStyle='#7a8581';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-28,-12);ctx.lineTo(28,-12);ctx.stroke()}
  if(hp<.72){ctx.strokeStyle='#463d35aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-d.radius*.45,-d.radius*.4);ctx.lineTo(0,0);ctx.lineTo(d.radius*.4,d.radius*.35);ctx.stroke()}ctx.restore();if(selected?.id===t.id){const w=Math.max(38,d.radius*1.7),y=p.y-d.radius-16;ctx.fillStyle='#111c';rr(p.x-w/2,y,w,7,4);ctx.fill();ctx.fillStyle=hp>.35?'#72da69':'#ffb74f';rr(p.x-w/2+1,y+1,(w-2)*hp,5,3);ctx.fill()}}
function drawDrop(p:Pickup){const s=screen(p);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.age*5);ctx.fillStyle=resourceColor[p.kind];ctx.shadowColor=resourceColor[p.kind];ctx.shadowBlur=8;if(p.kind==='metal')ctx.fillRect(-5,-5,10,10);else if(p.kind==='copper'){ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(6,5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,5,0,6.3);ctx.fill()}ctx.restore()}
function drawPlayer(){const p=screen(player),bx=p.x-player.fx*29,by=p.y-player.fy*29;ctx.strokeStyle='#202824';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x,p.y+8);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#9d7951';rr(bx-19,by-13,38,27,6);ctx.fill();ctx.fillStyle='#333d39';ctx.beginPath();ctx.arc(bx-14,by+16,6,0,6.3);ctx.arc(bx+14,by+16,6,0,6.3);ctx.fill();ctx.fillStyle='#dfa04a';rr(p.x-10,p.y-6,20,27,7);ctx.fill();ctx.fillStyle='#e6ad7b';ctx.beginPath();ctx.arc(p.x,p.y-12,8,0,6.3);ctx.fill();ctx.strokeStyle='#ffd35f22';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,102,0,6.3);ctx.stroke()}
function render(){const r=canvas.getBoundingClientRect();ctx.fillStyle='#293b30';ctx.fillRect(0,0,r.width,r.height);ctx.strokeStyle='#ffffff0a';for(let x=-(camera.x*.15%72);x<r.width;x+=72){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.height);ctx.stroke()}for(let y=-(camera.y*.15%72);y<r.height;y+=72){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.width,y);ctx.stroke()}for(const t of targets.filter(t=>t.alive).sort((a,b)=>a.y-b.y))drawTarget(t);for(const p of drops)drawDrop(p);drawPlayer();for(const t of texts){const p=screen(t);ctx.globalAlpha=clamp(t.life/(t.big?1.8:1.1),0,1);ctx.textAlign='center';ctx.font=`${t.big?800:700} ${t.big?18:14}px system-ui`;ctx.lineWidth=4;ctx.strokeStyle='#101512dd';ctx.strokeText(t.text,p.x,p.y);ctx.fillStyle=t.color;ctx.fillText(t.text,p.x,p.y);ctx.globalAlpha=1}}

function hud(){const min=Math.max((performance.now()-telemetry.start)/60000,1/60);$('destroyed').textContent=String(telemetry.destroyed);$('rate').textContent=`${(telemetry.destroyed/min).toFixed(1)}/мин`;$('pickups').textContent=`${(telemetry.pickupVisuals/min).toFixed(0)}/мин`;$('timer').textContent=fmt((performance.now()-telemetry.start)/1000);$('cartText').textContent=`${cart.toFixed(1)} / ${capacity} кг`;$<HTMLElement>('cartFill').style.width=`${cart/capacity*100}%`;
  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>$(k).textContent=haul[k].toFixed(1));$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class="${comps[k]?'has':''}">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('');garageBtn.disabled=cart<capacity*.58;garageBtn.textContent=cart>=capacity-.01?'Тележка полна — в гараж':'В гараж';fullEl.classList.toggle('show',cart>=capacity-.01);if(selected){targetEl.classList.add('show');const d=getTargetClass(selected.classId);targetEl.innerHTML=`<b>${d.label}</b><span>${(selected.hp/BASE_DPS).toFixed(1)}с</span>`}else targetEl.classList.remove('show')}

function garage(){if(mode!=='field')return;mode='garage';for(const k of ['metal','copper','plastic'] as ResourceKind[])storage[k]+=haul[k];for(const k of Object.keys(comps) as ComponentKind[])storedComps[k]+=comps[k];$('tripSummary').textContent=`${telemetry.destroyed} целей · ${fmt((performance.now()-telemetry.start)/1000)}`;$('storage').innerHTML=(['metal','copper','plastic'] as ResourceKind[]).map(k=>`<span>${k==='metal'?'Металл':k==='copper'?'Медь':'Пластик'} <b>${storage[k].toFixed(1)} кг</b></span>`).join('');$('storageComponents').innerHTML=(Object.keys(storedComps) as ComponentKind[]).map(k=>`<span>${componentIcon[k]} ${componentName[k]} <b>${storedComps[k]}</b></span>`).join('');garageScreen.hidden=false}
garageBtn.onclick=garage;nextBtn.onclick=()=>{garageScreen.hidden=true;mode='field';resetTrip()};

function frame(now:number){const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;if(mode==='field'){move(dt);combat(dt);updateDrops(dt);updateTexts(dt);cam();hud();render()}requestAnimationFrame(frame)}
resetTrip();requestAnimationFrame(frame);
Object.assign(globalThis,{__SALVAGE_TEST__:{getState:()=>({trip,cart,capacity,alive:targets.filter(t=>t.alive).length,telemetry:{...telemetry},haul:{...haul},components:{...comps}}),forceGarage:garage}});
