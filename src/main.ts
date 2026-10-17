import './style.css';
import {
  BASE_DPS, FIELD_NODE_COUNT, START_POS, WORLD,
  generateField, getTargetClass, hashSeed, mulberry32, rollDrops,
  type ComponentKind, type ResourceKind, type SalvageTarget, type Vec2
} from './sim.ts';
import {
  MACHINE_DEFS, STARTING_CASH, canBuild, ownedRequirement,
  type GarageInventory, type MachineId
} from './garage.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
<main class="shell">
  <canvas id="game"></canvas>
  <div class="panel zone"><small>СТАРАЯ СВАЛКА · ЗОНА 1</small><b>Ломай всё, что видишь</b><span id="seed"></span></div>
  <div class="panel goal" id="goalCard">
    <small>СЛЕДУЮЩАЯ ЦЕЛЬ</small><b>▥ Малый гидропресс</b>
    <div class="goalReqs"><span id="goalMetal"></span><span id="goalBearing"></span><span id="goalHydraulic"></span></div>
    <em>В гараже нажми на станок — там рецепт и источники деталей.</em>
  </div>
  <div class="panel stats"><span>Разрушено <b id="destroyed">0</b></span><span>Темп <b id="rate">0/мин</b></span><span>Подборы <b id="pickups">0/мин</b></span><span>Вылазка <b id="timer">0:00</b></span></div>
  <div id="target" class="target panel"></div>
  <div id="rare" class="rare"></div>
  <div id="full" class="full">Тележка полна — пора разгружаться</div>
  <div id="toast" class="toast"></div>
  <div class="panel bottom">
    <div class="cart"><span>🛒</span><div><label>Тележка <b id="cartText">0 / 40 кг</b></label><i><em id="cartFill"></em></i></div></div>
    <div class="resources"><span>◻ <small>Металл</small> <b id="metal">0.0</b></span><span class="copper">◆ <small>Медь</small> <b id="copper">0.0</b></span><span class="plastic">● <small>Пластик</small> <b id="plastic">0.0</b></span></div>
    <div id="components" class="components"></div>
    <button id="garage" disabled>В гараж</button>
  </div>
  <section id="garageScreen" class="garage" hidden>
    <div class="garageBox">
      <header><div><small>ГАРАЖ · УРОВЕНЬ 1</small><h1>Мастерская</h1><p>Разгружай добычу, выбирай следующий станок и собирай его из найденных деталей.</p></div><div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong></div></header>
      <div class="floor">
        <div class="machineGrid" id="machineGrid">
          <article class="machine" data-machine="workbench"><div class="installed">✓ Установлен</div><div class="art bench">🛠️</div><b>Верстак</b><small>Ручной разбор и сборка</small></article>
          <article class="machine locked focus" data-machine="press"><div class="lock">🔒 ЦЕЛЬ</div><div class="art press"><span>▥</span><i></i></div><b>Малый гидропресс</b><small>Металл → брикеты</small></article>
          <article class="machine locked" data-machine="wire"><div class="lock">🔒</div><div class="art wire"><span>◉</span><span>◉</span></div><b>Зачистка проводов</b><small>Кабель → чистая медь</small></article>
          <article class="machine locked" data-machine="plastic"><div class="lock">🔒</div><div class="art shredder"><span>▼</span><i></i></div><b>Дробилка пластика</b><small>Пластик → гранулы</small></article>
        </div>
        <aside class="inspector" id="machineInspector"></aside>
        <aside class="store"><h2>Склад</h2><div id="storage"></div><h3>Компоненты</h3><div id="storageComponents"></div><h3>Подсказка</h3><p>Нажимай на закрытые станки. Игра покажет не только рецепт, но и где искать каждую недостающую деталь.</p></aside>
      </div>
      <footer><span id="garageTip">Первая цель — собрать гидропресс. Это даст смысл обычному металлу.</span><button id="next">Новая вылазка</button></footer>
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
const inspectorEl = document.querySelector<HTMLElement>('#machineInspector')!;
const machineGridEl = document.querySelector<HTMLElement>('#machineGrid')!;
const toastEl = document.querySelector<HTMLElement>('#toast')!;

const componentName: Record<ComponentKind,string> = { bearing:'Подшипник', motor:'Электромотор', hydraulic:'Гидравлика', electronics:'Электронный модуль' };
const componentIcon: Record<ComponentKind,string> = { bearing:'◉', motor:'⚙', hydraulic:'◆', electronics:'▦' };
const resourceColor: Record<ResourceKind,string> = { metal:'#d7dfdf', copper:'#f08a45', plastic:'#46a7ff' };
const resourceName: Record<ResourceKind,string> = { metal:'Металл', copper:'Медь', plastic:'Пластик' };

interface Pickup extends Vec2 { kind: ResourceKind; amount:number; vx:number; vy:number; age:number }
interface FloatText extends Vec2 { text:string; color:string; life:number; big?:boolean }
interface Spark extends Vec2 { vx:number; vy:number; life:number; max:number; color:string; size:number }
interface Decor extends Vec2 { kind:'patch'|'barrel'|'tire'|'crate'|'fence'; size:number; rot:number; tone:number }
interface Telemetry { start:number; destroyed:number; pickupVisuals:number; components:number }

const params = new URLSearchParams(location.search);
const baseSeed = params.get('seed') ?? String(Date.now());
let trip = 0;
let rng = mulberry32(hashSeed(baseSeed));
let targets: SalvageTarget[] = [];
let drops: Pickup[] = [];
let texts: FloatText[] = [];
let sparks: Spark[] = [];
let decor: Decor[] = [];
let selected: SalvageTarget | null = null;
let selectedMachine: MachineId = 'press';
let mode: 'field'|'garage' = 'field';
let last = performance.now();
let rareUntil = 0;
let toastUntil = 0;
let cart = 0;
const capacity = 40;
let haul: Record<ResourceKind,number> = { metal:0,copper:0,plastic:0 };
let storage: Record<ResourceKind,number> = { metal:0,copper:0,plastic:0 };
let comps: Record<ComponentKind,number> = { bearing:0,motor:0,hydraulic:0,electronics:0 };
let storedComps: Record<ComponentKind,number> = { bearing:0,motor:0,hydraulic:0,electronics:0 };
let cash = STARTING_CASH;
const installed = new Set<MachineId>(['workbench']);
let telemetry: Telemetry = { start:performance.now(), destroyed:0, pickupVisuals:0, components:0 };
const player = { x:START_POS.x,y:START_POS.y,speed:235,fx:1,fy:0 };
const camera = { x:0,y:0 };
const keys = new Set<string>();
let pointer: Vec2|null = null;
let shake = 0;
let shakeX = 0;
let shakeY = 0;

const $ = <T extends HTMLElement>(id:string) => document.querySelector<T>(`#${id}`)!;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const d2=(a:Vec2,b:Vec2)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const fmt=(s:number)=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
const screen=(v:Vec2)=>({x:v.x-camera.x+shakeX,y:v.y-camera.y+shakeY});
const money=(v:number)=>`${Math.round(v).toLocaleString('ru-RU')} ₽`;

function showToast(text:string){toastEl.textContent=text;toastEl.classList.add('show');toastUntil=2.1}

function makeDecor(seed:string){
  const r=mulberry32(hashSeed(seed));
  const kinds:Decor['kind'][]=['patch','patch','patch','barrel','tire','crate','fence'];
  return Array.from({length:88},()=>({
    x:80+r()*(WORLD.width-160), y:80+r()*(WORLD.height-160), kind:kinds[Math.floor(r()*kinds.length)],
    size:16+r()*32, rot:(r()-.5)*Math.PI, tone:r()
  }));
}

function resetTrip(){
  trip++; rng=mulberry32(hashSeed(`${baseSeed}:${trip}`)); targets=generateField(`${baseSeed}:field:${trip}`,FIELD_NODE_COUNT); drops=[];texts=[];sparks=[];decor=makeDecor(`${baseSeed}:decor:${trip}`);cart=0;
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
function spawnResource(kind:ResourceKind,amount:number,count:number,t:Vec2){if(amount<=.005)return;for(let i=0;i<count;i++){const a=rng()*Math.PI*2,s=80+rng()*175;drops.push({kind,amount:amount/count,x:t.x,y:t.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0});telemetry.pickupVisuals++}}
function spawnSparks(t:Vec2,color:string,count:number,big=false){for(let i=0;i<count;i++){const a=rng()*Math.PI*2,s=(big?130:70)+rng()*(big?220:120),life=.24+rng()*.45;sparks.push({x:t.x,y:t.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,color,size:(big?2.5:1.5)+rng()*3})}}

function applyPity(t:SalvageTarget, component:ComponentKind|undefined):ComponentKind|undefined{
  if(component)return component;
  const bearings=storedComps.bearing+comps.bearing;
  const hydraulics=storedComps.hydraulic+comps.hydraulic;
  if(t.classId==='bike_fan'&&bearings<2&&telemetry.destroyed>=(bearings===0?8:17))return 'bearing';
  if((t.classId==='medium_appliance'||t.classId==='large_appliance')&&hydraulics<1&&telemetry.destroyed>=22)return 'hydraulic';
  return undefined;
}

function breakTarget(t:SalvageTarget){
  t.alive=false;t.hp=0;telemetry.destroyed++;const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng);r.component=applyPity(t,r.component);const total=r.resources.metal+r.resources.copper+r.resources.plastic;let left=def.fragments;
  shake=Math.min(12,4+def.radius*.12);spawnSparks(t,'#ffd36d',Math.round(8+def.fragments*.75),def.radius>31);
  (['metal','copper','plastic'] as ResourceKind[]).forEach((k,i)=>{const remaining=2-i;const n=i===2?left:Math.max(1,Math.min(left-remaining,Math.round(def.fragments*r.resources[k]/total)));left-=n;spawnResource(k,r.resources[k],n,t);if(r.resources[k]>.03)texts.push({x:t.x+(rng()-.5)*34,y:t.y-24-i*18,text:`+${r.resources[k].toFixed(r.resources[k]<1?1:0)} ${resourceName[k].toLowerCase()}`,color:resourceColor[k],life:1.15})});
  if(r.component){comps[r.component]++;telemetry.components++;texts.push({x:t.x,y:t.y-76,text:`${componentIcon[r.component]} ${componentName[r.component]}!`,color:'#ffe56f',life:2,big:true});rareEl.innerHTML=`<small>${r.component==='motor'||r.component==='hydraulic'?'РЕДКИЙ КОМПОНЕНТ':'КОМПОНЕНТ'}</small><b>${componentIcon[r.component]} ${componentName[r.component]}</b><em>${r.component==='bearing'?'Нужен для первого пресса':r.component==='hydraulic'?'Ключевая деталь гидропресса':'Сохрани — пригодится в рецептах'}</em>`;rareEl.className=`rare show ${r.component==='motor'||r.component==='hydraulic'?'strong':''}`;rareUntil=2.3;spawnSparks(t,'#78d8ff',20,true)}
}
function combat(dt:number){selected=nearest();if(!selected)return;const before=selected.hp;selected.hp-=BASE_DPS*dt;if(Math.floor(before/30)!==Math.floor(selected.hp/30))spawnSparks(selected,'#f2cf7b',2,false);if(selected.hp<=0){breakTarget(selected);selected=null}}
function updateDrops(dt:number){for(const p of drops){p.age+=dt;if(p.age<.3){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.045,dt);p.vy*=Math.pow(.045,dt);continue}const x=player.x-p.x,y=player.y-p.y,d=Math.max(1,Math.hypot(x,y)),s=280+p.age*390;p.x+=x/d*s*dt;p.y+=y/d*s*dt;if(d<30&&cart<capacity){const take=Math.min(capacity-cart,p.amount);haul[p.kind]+=take;cart+=take;p.amount-=take}}drops=drops.filter(p=>p.amount>.002&&p.age<12)}
function updateEffects(dt:number){for(const t of texts){t.life-=dt;t.y-=25*dt}texts=texts.filter(t=>t.life>0);for(const p of sparks){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt)}sparks=sparks.filter(p=>p.life>0);if(rareUntil>0){rareUntil-=dt;if(rareUntil<=0)rareEl.className='rare'}if(toastUntil>0){toastUntil-=dt;if(toastUntil<=0)toastEl.classList.remove('show')}shake*=Math.pow(.025,dt);shakeX=(Math.random()-.5)*shake;shakeY=(Math.random()-.5)*shake}
function cam(){const r=canvas.getBoundingClientRect(),x=clamp(player.x-r.width/2,0,Math.max(0,WORLD.width-r.width)),y=clamp(player.y-r.height/2,0,Math.max(0,WORLD.height-r.height));camera.x+=(x-camera.x)*.12;camera.y+=(y-camera.y)*.12}

function rr(x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawWorld(){
  const r=canvas.getBoundingClientRect();const g=ctx.createLinearGradient(0,0,0,r.height);g.addColorStop(0,'#38533e');g.addColorStop(1,'#25392e');ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);
  ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle='#c4d6bd';ctx.lineWidth=1;for(let x=-(camera.x*.14%80);x<r.width;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.height);ctx.stroke()}for(let y=-(camera.y*.14%80);y<r.height;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.width,y);ctx.stroke()}ctx.restore();
  const roadY=720-camera.y+shakeY;ctx.fillStyle='#38413c';ctx.fillRect(0,roadY-66,r.width,132);ctx.strokeStyle='#d8c97833';ctx.setLineDash([22,28]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,roadY);ctx.lineTo(r.width,roadY);ctx.stroke();ctx.setLineDash([]);
  for(const d of decor){const p=screen(d);if(p.x<-80||p.y<-80||p.x>r.width+80||p.y>r.height+80)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);if(d.kind==='patch'){ctx.fillStyle=d.tone>.5?'#2c4635':'#314b38';ctx.beginPath();ctx.ellipse(0,0,d.size*1.6,d.size*.75,0,0,Math.PI*2);ctx.fill()}else if(d.kind==='barrel'){ctx.fillStyle=d.tone>.5?'#b8653b':'#637b73';rr(-10,-14,20,28,5);ctx.fill();ctx.fillStyle='#17211c66';ctx.fillRect(-10,-5,20,4)}else if(d.kind==='tire'){ctx.strokeStyle='#1b211e';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,10+d.size*.12,0,Math.PI*2);ctx.stroke()}else if(d.kind==='crate'){ctx.fillStyle='#8a6746';ctx.fillRect(-14,-12,28,24);ctx.strokeStyle='#5d432d';ctx.strokeRect(-14,-12,28,24)}else{ctx.strokeStyle='#6f8076';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.lineTo(d.size,0);ctx.stroke();ctx.lineWidth=1;for(let x=-d.size;x<=d.size;x+=9){ctx.beginPath();ctx.moveTo(x,-10);ctx.lineTo(x+8,10);ctx.stroke()}}ctx.restore()}
}
function drawTarget(t:SalvageTarget){if(!t.alive)return;const p=screen(t),d=getTargetClass(t.classId),hp=t.hp/t.maxHp;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.rotation);ctx.shadowColor=selected?.id===t.id?'#ffd35faa':'#0007';ctx.shadowBlur=selected?.id===t.id?20:10;
  if(t.classId==='small_scrap'){ctx.fillStyle=t.variant%2?'#89938a':'#9d7656';ctx.fillRect(-18,-8,24,9);ctx.fillStyle='#66726c';ctx.fillRect(-5,3,23,8)}
  else if(t.classId==='cable'){ctx.strokeStyle=t.variant%2?'#df7b42':'#c45e42';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,14,0,5.6);ctx.stroke();ctx.strokeStyle='#2a332f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,5.6);ctx.stroke()}
  else if(t.classId==='small_appliance'){ctx.fillStyle=t.variant%2?'#d9d6c8':'#95b3ad';rr(-21,-17,42,34,7);ctx.fill();ctx.fillStyle='#465754';ctx.fillRect(-13,-9,20,13);ctx.fillStyle='#e7b551';ctx.beginPath();ctx.arc(13,-9,3,0,6.3);ctx.fill()}
  else if(t.classId==='bike_fan'){ctx.strokeStyle=t.variant%2?'#d36a4c':'#d7b552';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-15,8,12,0,6.3);ctx.arc(16,8,12,0,6.3);ctx.moveTo(-15,8);ctx.lineTo(0,-9);ctx.lineTo(16,8);ctx.lineTo(-2,8);ctx.closePath();ctx.stroke()}
  else if(t.classId==='medium_appliance'){ctx.fillStyle=t.variant%2?'#e5e0d3':'#c9d5d2';rr(-28,-32,56,64,9);ctx.fill();ctx.fillStyle='#52635f';ctx.beginPath();ctx.arc(0,6,18,0,6.3);ctx.fill();ctx.fillStyle='#8bd1c1';ctx.beginPath();ctx.arc(0,6,11,0,6.3);ctx.fill()}
  else{ctx.fillStyle=t.variant%2?'#d9ddd5':'#d7c7a7';rr(-32,-44,64,88,8);ctx.fill();ctx.strokeStyle='#74817c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-29,-12);ctx.lineTo(29,-12);ctx.stroke();ctx.fillStyle='#6d7d77';ctx.fillRect(15,-35,6,14)}
  if(hp<.72){ctx.strokeStyle='#463d35bb';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-d.radius*.48,-d.radius*.4);ctx.lineTo(0,0);ctx.lineTo(d.radius*.42,d.radius*.35);ctx.moveTo(0,0);ctx.lineTo(-d.radius*.15,d.radius*.48);ctx.stroke()}ctx.restore();if(selected?.id===t.id){const w=Math.max(40,d.radius*1.8),y=p.y-d.radius-18;ctx.fillStyle='#111d';rr(p.x-w/2,y,w,8,4);ctx.fill();ctx.fillStyle=hp>.35?'#79e86e':'#ffb74f';rr(p.x-w/2+1,y+1,(w-2)*hp,6,3);ctx.fill()}}
function drawDrop(p:Pickup){const s=screen(p);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.age*6);ctx.fillStyle=resourceColor[p.kind];ctx.shadowColor=resourceColor[p.kind];ctx.shadowBlur=12;if(p.kind==='metal'){ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#ffffff55';ctx.fillRect(-3,-4,6,2)}else if(p.kind==='copper'){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,6,0,6.3);ctx.fill()}ctx.restore()}
function drawSpark(p:Spark){const s=screen(p),a=clamp(p.life/p.max,0,1);ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(s.x,s.y,p.size*a+.5,0,6.3);ctx.fill();ctx.globalAlpha=1}
function drawPlayer(){const p=screen(player),bx=p.x-player.fx*30,by=p.y-player.fy*30;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(p.x,p.y+18,24,9,0,0,6.3);ctx.fill();ctx.strokeStyle='#202824';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x,p.y+8);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#a98255';rr(bx-20,by-14,40,29,6);ctx.fill();ctx.fillStyle='#333d39';ctx.beginPath();ctx.arc(bx-14,by+17,6,0,6.3);ctx.arc(bx+14,by+17,6,0,6.3);ctx.fill();ctx.fillStyle='#f0a94b';rr(p.x-11,p.y-7,22,29,7);ctx.fill();ctx.fillStyle='#e6ad7b';ctx.beginPath();ctx.arc(p.x,p.y-13,9,0,6.3);ctx.fill();ctx.strokeStyle='#ffe06b2a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,102,0,6.3);ctx.stroke()}
function render(){drawWorld();for(const t of targets.filter(t=>t.alive).sort((a,b)=>a.y-b.y))drawTarget(t);for(const p of drops)drawDrop(p);for(const p of sparks)drawSpark(p);drawPlayer();for(const t of texts){const p=screen(t);ctx.globalAlpha=clamp(t.life/(t.big?2:1.15),0,1);ctx.textAlign='center';ctx.font=`${t.big?850:750} ${t.big?19:14}px system-ui`;ctx.lineWidth=5;ctx.strokeStyle='#101512dd';ctx.strokeText(t.text,p.x,p.y);ctx.fillStyle=t.color;ctx.fillText(t.text,p.x,p.y);ctx.globalAlpha=1}}

function inventory(includeHaul=false):GarageInventory{return {resources:{metal:storage.metal+(includeHaul?haul.metal:0),copper:storage.copper+(includeHaul?haul.copper:0),plastic:storage.plastic+(includeHaul?haul.plastic:0)},components:{bearing:storedComps.bearing+(includeHaul?comps.bearing:0),motor:storedComps.motor+(includeHaul?comps.motor:0),hydraulic:storedComps.hydraulic+(includeHaul?comps.hydraulic:0),electronics:storedComps.electronics+(includeHaul?comps.electronics:0)},cash}}
function progressText(owned:number,needed:number,unit=''){const ok=owned+1e-9>=needed;return `<span class="req ${ok?'ok':'missing'}"><i>${ok?'✓':'●'}</i><b>${owned.toFixed(unit===' кг'?1:0)} / ${needed}${unit}</b></span>`}
function updateGoal(){const inv=inventory(true);if(installed.has('press')){$('goalCard').classList.add('done');$('goalCard').innerHTML='<small>ЦЕЛЬ ВЫПОЛНЕНА</small><b>✓ Малый гидропресс установлен</b><em>Следующий слой — реальная переработка в гараже.</em>';return}$('goalMetal').innerHTML=`Металл ${progressText(inv.resources.metal,100,' кг')}`;$('goalBearing').innerHTML=`Подшипники ${progressText(inv.components.bearing,2)}`;$('goalHydraulic').innerHTML=`Гидравлика ${progressText(inv.components.hydraulic,1)}`}
function hud(){const min=Math.max((performance.now()-telemetry.start)/60000,1/60);$('destroyed').textContent=String(telemetry.destroyed);$('rate').textContent=`${(telemetry.destroyed/min).toFixed(1)}/мин`;$('pickups').textContent=`${(telemetry.pickupVisuals/min).toFixed(0)}/мин`;$('timer').textContent=fmt((performance.now()-telemetry.start)/1000);$('cartText').textContent=`${cart.toFixed(1)} / ${capacity} кг`;$<HTMLElement>('cartFill').style.width=`${cart/capacity*100}%`;
  (['metal','copper','plastic'] as ResourceKind[]).forEach(k=>$(k).textContent=haul[k].toFixed(1));$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class="${comps[k]?'has':''}">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('');garageBtn.disabled=cart<capacity*.58;garageBtn.textContent=cart>=capacity-.01?'Тележка полна — в гараж':'В гараж';fullEl.classList.toggle('show',cart>=capacity-.01);if(selected){targetEl.classList.add('show');const d=getTargetClass(selected.classId);targetEl.innerHTML=`<b>${d.label}</b><span>${(selected.hp/BASE_DPS).toFixed(1)}с</span>`}else targetEl.classList.remove('show');updateGoal()}

function renderMachineCards(){for(const el of machineGridEl.querySelectorAll<HTMLElement>('[data-machine]')){const id=el.dataset.machine as MachineId;el.classList.toggle('selected',id===selectedMachine);el.classList.toggle('locked',!installed.has(id));el.classList.toggle('built',installed.has(id));const lock=el.querySelector<HTMLElement>('.lock');const badge=el.querySelector<HTMLElement>('.installed');if(lock)lock.textContent=installed.has(id)?'✓':id==='press'?'🔒 ЦЕЛЬ':'🔒';if(badge&&id!=='workbench')badge.textContent=installed.has(id)?'✓ Установлен':''}}
function renderInspector(){
  const def=MACHINE_DEFS[selectedMachine],inv=inventory(false),isInstalled=installed.has(selectedMachine),buildable=canBuild(def,inv);
  const reqs=def.requirements.map(req=>{const owned=ownedRequirement(req,inv),ok=owned+1e-9>=req.amount;const unit=req.kind==='resource'?' кг':req.kind==='cash'?' ₽':'';return `<div class="machineReq ${ok?'ok':'missing'}"><div><span>${ok?'✓':'●'}</span><b>${req.label}</b><strong>${req.kind==='cash'?money(owned):`${owned.toFixed(req.kind==='resource'?1:0)}${unit}`} / ${req.kind==='cash'?money(req.amount):`${req.amount}${unit}`}</strong></div><small>${ok?'Есть достаточно':`Где взять: ${req.source}`}</small></div>`}).join('');
  inspectorEl.innerHTML=`<div class="inspectorHead"><div class="machineGlyph">${def.icon}</div><div><small>${isInstalled?'УСТАНОВЛЕН':'СТАНОК'}</small><h2>${def.name}</h2><p>${def.short}</p></div></div><p class="description">${def.description}</p>${def.requirements.length?`<h3>Что нужно для сборки</h3><div class="requirements">${reqs}</div>`:''}<div class="unlockHint">💡 ${def.unlockHint}</div>${selectedMachine==='press'&&!isInstalled?`<div class="machineActions"><button id="buildMachine" ${buildable?'':'disabled'}>${buildable?'Собрать и установить':'Не хватает ресурсов'}</button><button class="secondary" disabled>Купить готовый · ${money(def.buyPrice??0)}</button></div>`:isInstalled?'<div class="installedNote">✓ Станок установлен. Рабочую переработку подключим следующим слоем.</div>':'<div class="installedNote muted">Этот станок пока показан как будущая цель progression.</div>'}`;
}
function renderGarage(){
  $('cash').textContent=`Наличные: ${money(cash)}`;$('storage').innerHTML=(['metal','copper','plastic'] as ResourceKind[]).map(k=>`<span>${resourceName[k]} <b>${storage[k].toFixed(1)} кг</b></span>`).join('');$('storageComponents').innerHTML=(Object.keys(storedComps) as ComponentKind[]).map(k=>`<span class="${storedComps[k]?'owned':''}">${componentIcon[k]} ${componentName[k]} <b>${storedComps[k]}</b></span>`).join('');renderMachineCards();renderInspector();
}
function buildSelected(){const def=MACHINE_DEFS[selectedMachine],inv=inventory(false);if(selectedMachine!=='press'||installed.has(selectedMachine)||!canBuild(def,inv))return;for(const req of def.requirements){if(req.kind==='cash')cash-=req.amount;else if(req.kind==='resource')storage[req.key as ResourceKind]-=req.amount;else storedComps[req.key as ComponentKind]-=req.amount}installed.add(selectedMachine);showToast('Гидропресс установлен!');$('garageTip').textContent='Гидропресс готов. Следующий slice подключит загрузку металла и выпуск брикетов.';renderGarage();updateGoal()}

function garage(){if(mode!=='field')return;mode='garage';for(const k of ['metal','copper','plastic'] as ResourceKind[])storage[k]+=haul[k];for(const k of Object.keys(comps) as ComponentKind[])storedComps[k]+=comps[k];$('tripSummary').textContent=`${telemetry.destroyed} целей · ${fmt((performance.now()-telemetry.start)/1000)}`;garageScreen.hidden=false;selectedMachine='press';renderGarage()}
garageScreen.addEventListener('click',e=>{const target=e.target as HTMLElement;const card=target.closest<HTMLElement>('[data-machine]');if(card){selectedMachine=card.dataset.machine as MachineId;renderGarage();return}if(target.closest('#buildMachine'))buildSelected()});
garageBtn.onclick=garage;nextBtn.onclick=()=>{garageScreen.hidden=true;mode='field';resetTrip()};

function frame(now:number){const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;if(mode==='field'){move(dt);combat(dt);updateDrops(dt);updateEffects(dt);cam();hud();render()}else updateEffects(dt);requestAnimationFrame(frame)}
resetTrip();requestAnimationFrame(frame);
Object.assign(globalThis,{__SALVAGE_TEST__:{getState:()=>({trip,cart,capacity,alive:targets.filter(t=>t.alive).length,telemetry:{...telemetry},haul:{...haul},components:{...comps},storage:{...storage},storedComponents:{...storedComps},cash,pressInstalled:installed.has('press')}),forceGarage:garage,selectMachine:(id:MachineId)=>{selectedMachine=id;renderGarage()}}});
