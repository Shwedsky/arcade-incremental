import './style.css';
import {
  BASE_DPS, FIELD_NODE_COUNT, START_POS, WORLD,
  generateField, getTargetClass, hashSeed, mulberry32, rollDrops,
  type ComponentKind, type ResourceKind, type SalvageTarget, type Vec2
} from './sim.ts';
import {
  MACHINE_DEFS, STARTING_CASH, canAfford, machineUnlocked, nextUpgrade,
  ownedRequirement, requirementAmount, unmetUnlocks, unlockRequirementMet,
  type GarageInventory, type MachineId, type MachineRequirement, type ProgressContext
} from './garage.ts';
import {
  BRANCHES, TALENTS, canUnlockTalent, deriveEffects, earnedMasteryPoints,
  levelForXp, xpForComponent, xpForTarget, xpWindow,
  type BranchId, type TalentId
} from './progression.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
<main class="shell">
  <canvas id="game"></canvas>
  <div class="panel zone"><small>СТАРАЯ СВАЛКА · ЗОНА 1</small><b>Ломай всё, что видишь</b><span id="seed"></span></div>
  <div class="panel goal" id="goalCard"></div>
  <div class="panel playerProgress">
    <div class="levelRow"><b id="levelLabel">Ур. 1</b><span id="xpText">0 / 120 XP</span><strong>Очки: <i id="masteryPoints">0</i></strong></div>
    <div class="xpBar"><i id="xpFill"></i></div>
    <button id="talentsOpen" class="secondary compact">Развитие</button>
  </div>
  <div class="panel stats"><span>Разрушено <b id="destroyed">0</b></span><span>Темп <b id="rate">0/мин</b></span><span>Подборы <b id="pickups">0/мин</b></span><span>Вылазка <b id="timer">0:00</b></span></div>
  <div id="combo" class="combo"></div>
  <div id="target" class="target panel"></div>
  <div id="rare" class="rare"></div>
  <div id="full" class="full">Тележка полна — можно вернуться домой</div>
  <div id="toast" class="toast"></div>
  <div class="panel bottom">
    <div class="cart"><span>🛒</span><div><label>Тележка <b id="cartText"></b></label><i><em id="cartFill"></em></i></div></div>
    <div class="resources"><span>◻ <small>Металл</small> <b id="metal">0.0</b></span><span class="copper">◆ <small>Медь</small> <b id="copper">0.0</b></span><span class="plastic">● <small>Пластик</small> <b id="plastic">0.0</b></span></div>
    <div id="components" class="components"></div>
    <button id="garage">Домой / гараж <small>G</small></button>
  </div>

  <section id="garageScreen" class="garage" hidden>
    <div class="garageBox">
      <header>
        <div><small>ГАРАЖ · БАЗА</small><h1>Мастерская</h1><p>Сюда можно возвращаться в любой момент. Добыча разгружается автоматически.</p></div>
        <div class="garageMeta"><b id="tripSummary"></b><strong id="cash"></strong><button id="talentsGarage" class="secondary compact">Развитие</button></div>
      </header>
      <div class="floor">
        <div class="machineGrid" id="machineGrid"></div>
        <aside class="inspector" id="machineInspector"></aside>
        <aside class="store">
          <h2>Склад</h2><div id="storage"></div>
          <h3>Переработано</h3><div id="processed"></div>
          <h3>Компоненты</h3><div id="storageComponents"></div>
          <div class="storeActions"><button id="sellRaw" class="secondary">Продать сырьё</button><button id="sellProcessed" class="secondary">Продать переработанное</button></div>
        </aside>
      </div>
      <footer><span id="garageTip">Выбери станок — справа видны условия открытия, сборки и следующей прокачки.</span><button id="next">Вернуться на свалку</button></footer>
    </div>
  </section>

  <section id="talentScreen" class="talentScreen" hidden>
    <div class="talentBox">
      <header><div><small>МАСТЕРСТВО</small><h1>Ветки развития</h1><p id="talentSummary"></p></div><button id="talentsClose" class="secondary">Закрыть</button></header>
      <div id="talentBranches" class="talentBranches"></div>
      <footer>Первые узлы — фундамент. Более вкусные механики, включая Combo, находятся глубже в ветках.</footer>
    </div>
  </section>

  <section id="offlineScreen" class="offlineScreen" hidden>
    <div class="offlineBox"><small>ПОКА ТЕБЯ НЕ БЫЛО</small><h2>Гараж не простаивал</h2><div id="offlineLoot"></div><button id="offlineClose">Забрать</button></div>
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
const talentScreen = document.querySelector<HTMLElement>('#talentScreen')!;
const talentBranchesEl = document.querySelector<HTMLElement>('#talentBranches')!;
const offlineScreen = document.querySelector<HTMLElement>('#offlineScreen')!;

const componentName: Record<ComponentKind,string> = { bearing:'Подшипник', motor:'Электромотор', hydraulic:'Гидравлика', electronics:'Электронный модуль' };
const componentIcon: Record<ComponentKind,string> = { bearing:'◉', motor:'⚙', hydraulic:'◆', electronics:'▦' };
const resourceColor: Record<ResourceKind,string> = { metal:'#d7dfdf', copper:'#f08a45', plastic:'#46a7ff' };
const resourceName: Record<ResourceKind,string> = { metal:'Металл', copper:'Медь', plastic:'Пластик' };
const BASE_SALE: Record<ResourceKind,number> = { metal:8, copper:60, plastic:5 };
const PROCESSED_SALE = { briquette:10, cleanCopper:78, granulate:7 } as const;
const SAVE_KEY = 'arcade-incremental-playable-v0-save-v2';

interface Pickup extends Vec2 { kind: ResourceKind; amount:number; vx:number; vy:number; age:number }
interface FloatText extends Vec2 { text:string; color:string; life:number; big?:boolean }
interface Spark extends Vec2 { vx:number; vy:number; life:number; max:number; color:string; size:number }
interface Decor extends Vec2 { kind:'patch'|'barrel'|'tire'|'crate'|'fence'; size:number; rot:number; tone:number }
interface Telemetry { start:number; destroyed:number; pickupVisuals:number; components:number }
interface Processed { briquette:number; cleanCopper:number; granulate:number }
interface SaveState {
  v:2; xp:number; storage:Record<ResourceKind,number>; components:Record<ComponentKind,number>; processed:Processed;
  cash:number; installed:MachineId[]; machineLevels:Partial<Record<MachineId,number>>; talents:TalentId[];
  totalDestroyed:number; lastSeen:number;
}

const params = new URLSearchParams(location.search);
const baseSeed = params.get('seed') ?? String(Date.now());
if (params.get('reset') === '1') localStorage.removeItem(SAVE_KEY);

const defaultSave = ():SaveState => ({
  v:2, xp:0, storage:{metal:0,copper:0,plastic:0}, components:{bearing:0,motor:0,hydraulic:0,electronics:0},
  processed:{briquette:0,cleanCopper:0,granulate:0}, cash:STARTING_CASH, installed:['workbench'], machineLevels:{workbench:1}, talents:[], totalDestroyed:0, lastSeen:Date.now()
});
function loadSave():SaveState { try { const raw=localStorage.getItem(SAVE_KEY); const value=raw?JSON.parse(raw):null; return value?.v===2?{...defaultSave(),...value}:defaultSave(); } catch { return defaultSave(); } }
const save = loadSave();
let xp = save.xp;
let storage:Record<ResourceKind,number> = {...save.storage};
let storedComps:Record<ComponentKind,number> = {...save.components};
let processed:Processed = {...save.processed};
let cash = save.cash;
const installed = new Set<MachineId>(save.installed);
const machineLevels:Partial<Record<MachineId,number>> = {...save.machineLevels};
const talents = new Set<TalentId>(save.talents);
let totalDestroyed = save.totalDestroyed;

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
let haul:Record<ResourceKind,number> = {metal:0,copper:0,plastic:0};
let comps:Record<ComponentKind,number> = {bearing:0,motor:0,hydraulic:0,electronics:0};
let telemetry:Telemetry = {start:performance.now(),destroyed:0,pickupVisuals:0,components:0};
const player = {x:START_POS.x,y:START_POS.y,speed:235,fx:1,fy:0};
const camera = {x:0,y:0};
const keys = new Set<string>();
let pointer:Vec2|null = null;
let shake=0,shakeX=0,shakeY=0;
let comboCount=0,comboTimer=0;

const $ = <T extends HTMLElement>(id:string)=>document.querySelector<T>(`#${id}`)!;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const d2=(a:Vec2,b:Vec2)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const fmt=(s:number)=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
const screen=(v:Vec2)=>({x:v.x-camera.x+shakeX,y:v.y-camera.y+shakeY});
const money=(v:number)=>`${Math.round(v).toLocaleString('ru-RU')} ₽`;
const level=()=>levelForXp(xp);
const effects=()=>deriveEffects(talents);
const capacity=()=>40+effects().capacityBonus;
const masteryAvailable=()=>earnedMasteryPoints(level())-talents.size;
const context=():ProgressContext=>({level:level(),talents,installed});
const inventory=():GarageInventory=>({resources:{...storage},components:{...storedComps},cash});

function saveGame(){const state:SaveState={v:2,xp,storage:{...storage},components:{...storedComps},processed:{...processed},cash,installed:[...installed],machineLevels:{...machineLevels},talents:[...talents],totalDestroyed,lastSeen:Date.now()};localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
setInterval(saveGame,10000);addEventListener('beforeunload',saveGame);

function applyOffline(){
  const elapsed=Math.max(0,(Date.now()-save.lastSeen)/3600000); if(elapsed<.083)return;
  const e=effects(),hours=Math.min(elapsed,e.offlineCapHours),gain={metal:420*e.offlineEfficiency*hours,copper:27*e.offlineEfficiency*hours,plastic:75*e.offlineEfficiency*hours};
  storage.metal+=gain.metal;storage.copper+=gain.copper;storage.plastic+=gain.plastic;
  $('offlineLoot').innerHTML=`<p>${hours.toFixed(1)} ч зачтено · эффективность ${(e.offlineEfficiency*100).toFixed(0)}%</p><div><span>Металл <b>+${gain.metal.toFixed(1)} кг</b></span><span>Медь <b>+${gain.copper.toFixed(1)} кг</b></span><span>Пластик <b>+${gain.plastic.toFixed(1)} кг</b></span></div>`;
  offlineScreen.hidden=false;saveGame();
}

function showToast(text:string){toastEl.textContent=text;toastEl.classList.add('show');toastUntil=2.2}
function gainXp(amount:number,pos?:Vec2){const before=level();xp+=amount;const after=level();if(pos)texts.push({x:pos.x,y:pos.y-48,text:`+${amount} XP`,color:'#9ce7ff',life:1.2});if(after>before)showToast(`Уровень ${after}! +1 очко мастерства`);renderProgress();saveGame()}

function makeDecor(seed:string){const r=mulberry32(hashSeed(seed)),kinds:Decor['kind'][]=['patch','patch','patch','barrel','tire','crate','fence'];return Array.from({length:88},()=>({x:80+r()*(WORLD.width-160),y:80+r()*(WORLD.height-160),kind:kinds[Math.floor(r()*kinds.length)],size:16+r()*32,rot:(r()-.5)*Math.PI,tone:r()}))}
function refreshField(){trip++;rng=mulberry32(hashSeed(`${baseSeed}:${trip}`));targets=generateField(`${baseSeed}:field:${trip}`,FIELD_NODE_COUNT);drops=[];texts=[];sparks=[];decor=makeDecor(`${baseSeed}:decor:${trip}`);player.x=START_POS.x;player.y=START_POS.y;player.fx=1;player.fy=0;seedEl.textContent=`seed ${baseSeed} · поле ${trip}`}
function resetExcursionMetrics(){telemetry={start:performance.now(),destroyed:0,pickupVisuals:0,components:0};comboCount=0;comboTimer=0}

function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(r.width*d);canvas.height=Math.floor(r.height*d);ctx.setTransform(d,0,0,d,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(e.key.startsWith('Arrow'))e.preventDefault();if(k==='g'&&mode==='field'&&!talentScreen.hidden)closeTalents();else if(k==='g'&&mode==='field')garage();});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left+camera.x,y:e.clientY-r.top+camera.y};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left+camera.x,y:e.clientY-r.top+camera.y}});canvas.addEventListener('pointerup',e=>{pointer=null;canvas.releasePointerCapture(e.pointerId)});canvas.addEventListener('contextmenu',e=>e.preventDefault());

function move(dt:number){let x=0,y=0;if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;if(!x&&!y&&pointer){x=pointer.x-player.x;y=pointer.y-player.y;if(Math.hypot(x,y)<14)x=y=0}const l=Math.hypot(x,y);if(!l)return;x/=l;y/=l;player.fx=x;player.fy=y;const e=effects(),comboMove=e.comboUnlocked&&comboCount>=5?e.comboMoveBonus:0,slow=1-.12*(cart/capacity());const speed=player.speed*e.moveMultiplier*(1+comboMove)*slow;player.x=clamp(player.x+x*speed*dt,35,WORLD.width-35);player.y=clamp(player.y+y*speed*dt,35,WORLD.height-35)}
function nearest(){if(cart>=capacity()-.01)return null;let best:SalvageTarget|null=null,bd=Infinity;for(const t of targets){if(!t.alive)continue;const max=102+getTargetClass(t.classId).radius,dd=d2(player,t);if(dd<max*max&&dd<bd){best=t;bd=dd}}return best}
function spawnResource(kind:ResourceKind,amount:number,count:number,t:Vec2){if(amount<=.005)return;for(let i=0;i<count;i++){const a=rng()*Math.PI*2,s=80+rng()*175;drops.push({kind,amount:amount/count,x:t.x,y:t.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0});telemetry.pickupVisuals++}}
function spawnSparks(t:Vec2,color:string,count:number,big=false){for(let i=0;i<count;i++){const a=rng()*Math.PI*2,s=(big?130:70)+rng()*(big?220:120),life=.24+rng()*.45;sparks.push({x:t.x,y:t.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,color,size:(big?2.5:1.5)+rng()*3})}}
function applyPity(t:SalvageTarget,component:ComponentKind|undefined){if(component)return component;const bearings=storedComps.bearing+comps.bearing,hydraulics=storedComps.hydraulic+comps.hydraulic;if(t.classId==='bike_fan'&&bearings<2&&totalDestroyed>=(bearings===0?8:17))return 'bearing';if((t.classId==='medium_appliance'||t.classId==='large_appliance')&&hydraulics<1&&totalDestroyed>=22)return 'hydraulic';if(!['small_scrap','cable'].includes(t.classId)&&effects().componentChanceBonus&&rng()<effects().componentChanceBonus)return rng()<.55?'bearing':rng()<.78?'motor':'electronics';return component}
function registerCombo(){const e=effects();if(!e.comboUnlocked)return;if(comboTimer>0)comboCount=Math.min(e.comboCap,comboCount+1);else comboCount=1;comboTimer=e.comboTimeout}
function breakTarget(t:SalvageTarget){
  t.alive=false;t.hp=0;telemetry.destroyed++;totalDestroyed++;registerCombo();const def=getTargetClass(t.classId),r=rollDrops(t.classId,rng);r.component=applyPity(t,r.component);const total=r.resources.metal+r.resources.copper+r.resources.plastic;let left=def.fragments;shake=Math.min(12,4+def.radius*.12);spawnSparks(t,'#ffd36d',Math.round(8+def.fragments*.75),def.radius>31);
  (['metal','copper','plastic'] as ResourceKind[]).forEach((k,i)=>{const remaining=2-i,n=i===2?left:Math.max(1,Math.min(left-remaining,Math.round(def.fragments*r.resources[k]/total)));left-=n;spawnResource(k,r.resources[k],n,t);if(r.resources[k]>.03)texts.push({x:t.x+(rng()-.5)*34,y:t.y-24-i*18,text:`+${r.resources[k].toFixed(r.resources[k]<1?1:0)} ${resourceName[k].toLowerCase()}`,color:resourceColor[k],life:1.15})});
  gainXp(xpForTarget(t.classId),t);if(r.component){comps[r.component]++;telemetry.components++;gainXp(xpForComponent());texts.push({x:t.x,y:t.y-76,text:`${componentIcon[r.component]} ${componentName[r.component]}!`,color:'#ffe56f',life:2,big:true});rareEl.innerHTML=`<small>${r.component==='motor'||r.component==='hydraulic'?'РЕДКИЙ КОМПОНЕНТ':'КОМПОНЕНТ'}</small><b>${componentIcon[r.component]} ${componentName[r.component]}</b><em>Сохрани — он нужен в рецептах станков</em>`;rareEl.className=`rare show ${r.component==='motor'||r.component==='hydraulic'?'strong':''}`;rareUntil=2.3;spawnSparks(t,'#78d8ff',20,true)}
}
function combat(dt:number){selected=nearest();if(!selected)return;const before=selected.hp,e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1;selected.hp-=BASE_DPS*e.dpsMultiplier*comboMult*dt;if(Math.floor(before/30)!==Math.floor(selected.hp/30))spawnSparks(selected,'#f2cf7b',2);if(selected.hp<=0){breakTarget(selected);selected=null}}
function updateDrops(dt:number){const magnet=effects().magnetRadius;for(const p of drops){p.age+=dt;if(p.age<.3){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.045,dt);p.vy*=Math.pow(.045,dt);continue}const x=player.x-p.x,y=player.y-p.y,d=Math.max(1,Math.hypot(x,y));if(d<=magnet){const s=280+p.age*390;p.x+=x/d*s*dt;p.y+=y/d*s*dt}if(d<30&&cart<capacity()){const take=Math.min(capacity()-cart,p.amount);haul[p.kind]+=take;cart+=take;p.amount-=take}}drops=drops.filter(p=>p.amount>.002&&p.age<12)}
function updateEffects(dt:number){for(const t of texts){t.life-=dt;t.y-=25*dt}texts=texts.filter(t=>t.life>0);for(const p of sparks){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt)}sparks=sparks.filter(p=>p.life>0);if(rareUntil>0){rareUntil-=dt;if(rareUntil<=0)rareEl.className='rare'}if(toastUntil>0){toastUntil-=dt;if(toastUntil<=0)toastEl.classList.remove('show')}if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0){comboTimer=0;comboCount=0}}shake*=Math.pow(.025,dt);shakeX=(Math.random()-.5)*shake;shakeY=(Math.random()-.5)*shake}
function cam(){const r=canvas.getBoundingClientRect(),x=clamp(player.x-r.width/2,0,Math.max(0,WORLD.width-r.width)),y=clamp(player.y-r.height/2,0,Math.max(0,WORLD.height-r.height));camera.x+=(x-camera.x)*.12;camera.y+=(y-camera.y)*.12}

function rr(x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawWorld(){const r=canvas.getBoundingClientRect(),g=ctx.createLinearGradient(0,0,0,r.height);g.addColorStop(0,'#38533e');g.addColorStop(1,'#25392e');ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);const roadY=720-camera.y+shakeY;ctx.fillStyle='#38413c';ctx.fillRect(0,roadY-66,r.width,132);ctx.strokeStyle='#d8c97833';ctx.setLineDash([22,28]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,roadY);ctx.lineTo(r.width,roadY);ctx.stroke();ctx.setLineDash([]);for(const d of decor){const p=screen(d);if(p.x<-80||p.y<-80||p.x>r.width+80||p.y>r.height+80)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);if(d.kind==='patch'){ctx.fillStyle=d.tone>.5?'#2c4635':'#314b38';ctx.beginPath();ctx.ellipse(0,0,d.size*1.6,d.size*.75,0,0,6.3);ctx.fill()}else if(d.kind==='barrel'){ctx.fillStyle=d.tone>.5?'#b8653b':'#637b73';rr(-10,-14,20,28,5);ctx.fill()}else if(d.kind==='tire'){ctx.strokeStyle='#1b211e';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,10+d.size*.12,0,6.3);ctx.stroke()}else if(d.kind==='crate'){ctx.fillStyle='#8a6746';ctx.fillRect(-14,-12,28,24)}else{ctx.strokeStyle='#6f8076';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.lineTo(d.size,0);ctx.stroke()}ctx.restore()}}
function drawTarget(t:SalvageTarget){if(!t.alive)return;const p=screen(t),d=getTargetClass(t.classId),hp=t.hp/t.maxHp;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.rotation);ctx.shadowColor=selected?.id===t.id?'#ffd35faa':'#0007';ctx.shadowBlur=selected?.id===t.id?20:10;if(t.classId==='small_scrap'){ctx.fillStyle=t.variant%2?'#89938a':'#9d7656';ctx.fillRect(-18,-8,24,9);ctx.fillStyle='#66726c';ctx.fillRect(-5,3,23,8)}else if(t.classId==='cable'){ctx.strokeStyle='#df7b42';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,14,0,5.6);ctx.stroke()}else if(t.classId==='small_appliance'){ctx.fillStyle=t.variant%2?'#d9d6c8':'#95b3ad';rr(-21,-17,42,34,7);ctx.fill();ctx.fillStyle='#465754';ctx.fillRect(-13,-9,20,13)}else if(t.classId==='bike_fan'){ctx.strokeStyle=t.variant%2?'#d36a4c':'#d7b552';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-15,8,12,0,6.3);ctx.arc(16,8,12,0,6.3);ctx.moveTo(-15,8);ctx.lineTo(0,-9);ctx.lineTo(16,8);ctx.lineTo(-2,8);ctx.closePath();ctx.stroke()}else if(t.classId==='medium_appliance'){ctx.fillStyle='#d9ddd5';rr(-28,-32,56,64,9);ctx.fill();ctx.fillStyle='#52635f';ctx.beginPath();ctx.arc(0,6,18,0,6.3);ctx.fill()}else{ctx.fillStyle='#d7c7a7';rr(-32,-44,64,88,8);ctx.fill();ctx.strokeStyle='#74817c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-29,-12);ctx.lineTo(29,-12);ctx.stroke()}if(hp<.72){ctx.strokeStyle='#463d35bb';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-d.radius*.48,-d.radius*.4);ctx.lineTo(0,0);ctx.lineTo(d.radius*.42,d.radius*.35);ctx.stroke()}ctx.restore();if(selected?.id===t.id){const w=Math.max(40,d.radius*1.8),y=p.y-d.radius-18;ctx.fillStyle='#111d';rr(p.x-w/2,y,w,8,4);ctx.fill();ctx.fillStyle=hp>.35?'#79e86e':'#ffb74f';rr(p.x-w/2+1,y+1,(w-2)*hp,6,3);ctx.fill()}}
function drawDrop(p:Pickup){const s=screen(p);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.age*6);ctx.fillStyle=resourceColor[p.kind];ctx.shadowColor=resourceColor[p.kind];ctx.shadowBlur=12;if(p.kind==='metal')ctx.fillRect(-5,-5,10,10);else if(p.kind==='copper'){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,6,0,6.3);ctx.fill()}ctx.restore()}
function drawSpark(p:Spark){const s=screen(p),a=clamp(p.life/p.max,0,1);ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.size*a+.5,0,6.3);ctx.fill();ctx.globalAlpha=1}
function drawPlayer(){const p=screen(player),bx=p.x-player.fx*30,by=p.y-player.fy*30;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(p.x,p.y+18,24,9,0,0,6.3);ctx.fill();ctx.strokeStyle='#202824';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x,p.y+8);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#a98255';rr(bx-20,by-14,40,29,6);ctx.fill();ctx.fillStyle='#333d39';ctx.beginPath();ctx.arc(bx-14,by+17,6,0,6.3);ctx.arc(bx+14,by+17,6,0,6.3);ctx.fill();ctx.fillStyle='#f0a94b';rr(p.x-11,p.y-7,22,29,7);ctx.fill();ctx.fillStyle='#e6ad7b';ctx.beginPath();ctx.arc(p.x,p.y-13,9,0,6.3);ctx.fill()}
function render(){drawWorld();for(const t of targets.filter(t=>t.alive).sort((a,b)=>a.y-b.y))drawTarget(t);for(const p of drops)drawDrop(p);for(const p of sparks)drawSpark(p);drawPlayer();for(const t of texts){const p=screen(t);ctx.globalAlpha=clamp(t.life/(t.big?2:1.15),0,1);ctx.textAlign='center';ctx.font=`${t.big?850:750} ${t.big?19:14}px system-ui`;ctx.lineWidth=5;ctx.strokeStyle='#101512dd';ctx.strokeText(t.text,p.x,p.y);ctx.fillStyle=t.color;ctx.fillText(t.text,p.x,p.y);ctx.globalAlpha=1}}

function renderProgress(){const w=xpWindow(xp);$('levelLabel').textContent=`Ур. ${w.level}`;$('xpText').textContent=w.needed?`${Math.floor(w.current)} / ${w.needed} XP`:'MAX';$('masteryPoints').textContent=String(masteryAvailable());$<HTMLElement>('xpFill').style.width=`${w.ratio*100}%`;const combo=$('combo');if(effects().comboUnlocked&&comboCount>0){combo.className='combo show';combo.innerHTML=`<b>COMBO ×${comboCount}</b><i><em style="width:${Math.max(0,comboTimer/effects().comboTimeout)*100}%"></em></i>`}else combo.className='combo'}
function reqProgress(owned:number,needed:number,unit=''){const ok=owned+1e-9>=needed;return `<span class="req ${ok?'ok':'missing'}"><i>${ok?'✓':'●'}</i><b>${owned.toFixed(unit===' кг'?1:0)} / ${needed}${unit}</b></span>`}
function updateGoal(){const e=effects(),press=MACHINE_DEFS.press;if(!installed.has('press')){const metal=requirementAmount(press.requirements[0],e.machineCostMultiplier),bearing=requirementAmount(press.requirements[1],e.machineCostMultiplier),hyd=requirementAmount(press.requirements[2],e.machineCostMultiplier),cashNeed=requirementAmount(press.requirements[3],e.machineCostMultiplier);$('goalCard').className='panel goal';$('goalCard').innerHTML=`<small>СЛЕДУЮЩАЯ ЦЕЛЬ</small><b>▥ Малый гидропресс</b><div class="goalReqs"><span>Металл ${reqProgress(storage.metal+haul.metal,metal,' кг')}</span><span>Подшипники ${reqProgress(storedComps.bearing+comps.bearing,bearing)}</span><span>Гидравлика ${reqProgress(storedComps.hydraulic+comps.hydraulic,hyd)}</span><span>Расходники ${reqProgress(cash,cashNeed,' ₽')}</span></div><em>Домой можно вернуться когда угодно. На карточке станка подробно расписаны все условия.</em>`}else{const wire=MACHINE_DEFS.wire,unmet=unmetUnlocks(wire.unlocks,context());$('goalCard').className='panel goal done';$('goalCard').innerHTML=`<small>СЛЕДУЮЩАЯ ЦЕЛЬ</small><b>◉◉ Зачистка проводов</b><em>${unmet.length?`Для открытия: ${unmet.map(x=>x.label).join(' · ')}`:'Открыта: собирай рецепт в гараже.'}</em>`}}
function hud(){const min=Math.max((performance.now()-telemetry.start)/60000,1/60);$('destroyed').textContent=String(telemetry.destroyed);$('rate').textContent=`${(telemetry.destroyed/min).toFixed(1)}/мин`;$('pickups').textContent=`${(telemetry.pickupVisuals/min).toFixed(0)}/мин`;$('timer').textContent=fmt((performance.now()-telemetry.start)/1000);$('cartText').textContent=`${cart.toFixed(1)} / ${capacity()} кг`;$<HTMLElement>('cartFill').style.width=`${Math.min(100,cart/capacity()*100)}%`;(['metal','copper','plastic'] as ResourceKind[]).forEach(k=>$(k).textContent=haul[k].toFixed(1));$('components').innerHTML=(Object.keys(comps) as ComponentKind[]).map(k=>`<span class="${comps[k]?'has':''}">${componentIcon[k]} <b>${comps[k]}</b></span>`).join('');fullEl.classList.toggle('show',cart>=capacity()-.01);if(selected){targetEl.classList.add('show');const d=getTargetClass(selected.classId),e=effects(),comboMult=e.comboUnlocked?1+e.comboSpeedPerStack*Math.max(0,comboCount-1):1;targetEl.innerHTML=`<b>${d.label}</b><span>${(selected.hp/(BASE_DPS*e.dpsMultiplier*comboMult)).toFixed(1)}с</span>`}else targetEl.classList.remove('show');renderProgress();updateGoal()}

function requirementRows(requirements:MachineRequirement[]){const inv=inventory(),mult=effects().machineCostMultiplier;return requirements.map(req=>{const owned=ownedRequirement(req,inv),need=requirementAmount(req,mult),ok=owned+1e-9>=need,unit=req.kind==='resource'?' кг':req.kind==='cash'?' ₽':'';return `<div class="machineReq ${ok?'ok':'missing'}"><div><span>${ok?'✓':'●'}</span><b>${req.label}</b><strong>${req.kind==='cash'?money(owned):`${owned.toFixed(req.kind==='resource'?1:0)}${unit}`} / ${req.kind==='cash'?money(need):`${need.toFixed(req.kind==='resource'?1:0)}${unit}`}</strong></div><small>${ok?'Есть достаточно':`Где взять: ${req.source}`}</small></div>`}).join('')}
function unlockRows(reqs:typeof MACHINE_DEFS.press.unlocks){if(!reqs.length)return '<div class="gate ok">✓ Доступен по прогрессии</div>';return reqs.map(req=>`<div class="gate ${unlockRequirementMet(req,context())?'ok':'missing'}">${unlockRequirementMet(req,context())?'✓':'🔒'} ${req.label}</div>`).join('')}
function machineCardGate(id:MachineId){const def=MACHINE_DEFS[id],lvl=machineLevels[id]??1;if(installed.has(id)){const up=nextUpgrade(def,lvl);return up?`Ур. ${lvl} · далее: ${up.unlocks.map(x=>x.label).join(' + ')||'ресурсы'}`:`Ур. ${lvl} · максимум`}const unmet=unmetUnlocks(def.unlocks,context());if(unmet.length)return `Открыть: ${unmet.map(x=>x.label).join(' + ')}`;const req=def.requirements.slice(0,3).map(r=>`${r.label} ${Math.ceil(requirementAmount(r,effects().machineCostMultiplier))}`).join(' · ');return `Сборка: ${req}`}
function renderMachineCards(){machineGridEl.innerHTML=(Object.keys(MACHINE_DEFS) as MachineId[]).map(id=>{const def=MACHINE_DEFS[id],isInstalled=installed.has(id),lvl=machineLevels[id]??1;return `<article class="machine ${id===selectedMachine?'selected':''} ${isInstalled?'built':'locked'}" data-machine="${id}"><div class="lock">${isInstalled?`УР. ${lvl}`:machineUnlocked(def,context())?'ДОСТУПЕН':'🔒'}</div><div class="art ${id}">${def.icon}</div><b>${def.name}</b><small>${def.short}</small><em class="cardGate">${machineCardGate(id)}</em></article>`}).join('')}
function consume(requirements:MachineRequirement[]){const mult=effects().machineCostMultiplier;for(const req of requirements){const need=requirementAmount(req,mult);if(req.kind==='cash')cash-=need;else if(req.kind==='resource')storage[req.key as ResourceKind]-=need;else storedComps[req.key as ComponentKind]-=need}}
function renderInspector(){
  const def=MACHINE_DEFS[selectedMachine],inv=inventory(),isInstalled=installed.has(selectedMachine),unlocked=machineUnlocked(def,context()),lvl=machineLevels[selectedMachine]??1,upgrade=nextUpgrade(def,lvl),buildable=unlocked&&canAfford(def.requirements,inv,effects().machineCostMultiplier);
  let actions='';if(!isInstalled){actions=`<div class="machineActions"><button id="buildMachine" ${buildable?'':'disabled'}>${unlocked?(buildable?'Собрать и установить':'Не хватает ресурсов'):'Сначала выполнить условия открытия'}</button><button id="buyMachine" class="secondary" ${unlocked&&cash>=(def.buyPrice??Infinity)*effects().shopPriceMultiplier?'':'disabled'}>Купить готовый · ${money((def.buyPrice??0)*effects().shopPriceMultiplier)}</button></div>`}else if(upgrade){const gatesOk=unmetUnlocks(upgrade.unlocks,context()).length===0,afford=canAfford(upgrade.requirements,inv,effects().machineCostMultiplier);actions=`<div class="upgradeBlock"><h3>Прокачка до ур. ${upgrade.toLevel}: ${upgrade.name}</h3><p>${upgrade.benefit}</p><div class="unlockList">${unlockRows(upgrade.unlocks)}</div><div class="requirements">${requirementRows(upgrade.requirements)}</div><button id="upgradeMachine" ${gatesOk&&afford?'':'disabled'}>${!gatesOk?'Не выполнены условия':afford?'Прокачать':'Не хватает ресурсов'}</button></div>`}
  const processAction=isInstalled?processingAction(selectedMachine,lvl):'';
  inspectorEl.innerHTML=`<div class="inspectorHead"><div class="machineGlyph">${def.icon}</div><div><small>${isInstalled?`УСТАНОВЛЕН · УР. ${lvl}`:'СТАНОК'}</small><h2>${def.name}</h2><p>${def.short}</p></div></div><p class="description">${def.description}</p><h3>Условия открытия</h3><div class="unlockList">${unlockRows(def.unlocks)}</div>${!isInstalled?`<h3>Что нужно для сборки</h3><div class="requirements">${requirementRows(def.requirements)}</div>`:''}${processAction}${actions}${isInstalled&&!upgrade?'<div class="installedNote">✓ Максимальный уровень текущего прототипа.</div>':''}`;
}
function processingAction(id:MachineId,lvl:number){if(id==='workbench')return '<div class="installedNote muted">Верстак используется для сборки и апгрейдов.</div>';const e=effects(),batch=10*lvl;if(id==='press'){const take=Math.min(batch,storage.metal),out=take*e.workshopYieldMultiplier;return `<div class="processBlock"><h3>Работа станка</h3><p>${batch} кг металла → брикеты. Текущая партия: ${take.toFixed(1)} кг → ${out.toFixed(1)} кг.</p><button id="processMachine" ${take>0?'':'disabled'}>Спрессовать партию</button></div>`}if(id==='wire'){const take=Math.min(5*lvl,storage.copper),out=take*e.workshopYieldMultiplier;return `<div class="processBlock"><h3>Работа станка</h3><p>${take.toFixed(1)} кг кабельной меди → ${out.toFixed(1)} кг чистой меди.</p><button id="processMachine" ${take>0?'':'disabled'}>Зачистить партию</button></div>`}const take=Math.min(batch,storage.plastic),out=take*e.workshopYieldMultiplier;return `<div class="processBlock"><h3>Работа станка</h3><p>${take.toFixed(1)} кг пластика → ${out.toFixed(1)} кг гранул.</p><button id="processMachine" ${take>0?'':'disabled'}>Измельчить партию</button></div>`}
function renderGarage(){
  $('cash').textContent=`Наличные: ${money(cash)}`;$('storage').innerHTML=(['metal','copper','plastic'] as ResourceKind[]).map(k=>`<span>${resourceName[k]} <b>${storage[k].toFixed(1)} кг</b></span>`).join('');$('processed').innerHTML=`<span>Брикеты <b>${processed.briquette.toFixed(1)} кг</b></span><span>Чистая медь <b>${processed.cleanCopper.toFixed(1)} кг</b></span><span>Гранулы <b>${processed.granulate.toFixed(1)} кг</b></span>`;$('storageComponents').innerHTML=(Object.keys(storedComps) as ComponentKind[]).map(k=>`<span class="${storedComps[k]?'owned':''}">${componentIcon[k]} ${componentName[k]} <b>${storedComps[k]}</b></span>`).join('');renderMachineCards();renderInspector();const rawValue=(storage.metal*BASE_SALE.metal+storage.copper*BASE_SALE.copper+storage.plastic*BASE_SALE.plastic)*effects().saleMultiplier,processedValue=(processed.briquette*PROCESSED_SALE.briquette+processed.cleanCopper*PROCESSED_SALE.cleanCopper+processed.granulate*PROCESSED_SALE.granulate)*effects().saleMultiplier;$<HTMLButtonElement>('sellRaw').disabled=rawValue<1;$<HTMLButtonElement>('sellRaw').textContent=`Продать сырьё · ${money(rawValue)}`;$<HTMLButtonElement>('sellProcessed').disabled=processedValue<1;$<HTMLButtonElement>('sellProcessed').textContent=`Продать переработанное · ${money(processedValue)}`;renderProgress()}
function buildSelected(){const def=MACHINE_DEFS[selectedMachine];if(installed.has(selectedMachine)||!machineUnlocked(def,context())||!canAfford(def.requirements,inventory(),effects().machineCostMultiplier))return;consume(def.requirements);installed.add(selectedMachine);machineLevels[selectedMachine]=1;showToast(`${def.name} установлен`);saveGame();renderGarage();updateGoal()}
function buySelected(){const def=MACHINE_DEFS[selectedMachine],price=(def.buyPrice??Infinity)*effects().shopPriceMultiplier;if(installed.has(selectedMachine)||!machineUnlocked(def,context())||cash<price)return;cash-=price;installed.add(selectedMachine);machineLevels[selectedMachine]=1;showToast(`${def.name} куплен и установлен`);saveGame();renderGarage();updateGoal()}
function upgradeSelected(){const def=MACHINE_DEFS[selectedMachine],lvl=machineLevels[selectedMachine]??1,up=nextUpgrade(def,lvl);if(!up||unmetUnlocks(up.unlocks,context()).length||!canAfford(up.requirements,inventory(),effects().machineCostMultiplier))return;consume(up.requirements);machineLevels[selectedMachine]=up.toLevel;showToast(`${def.name}: уровень ${up.toLevel}`);saveGame();renderGarage()}
function processSelected(){const id=selectedMachine,lvl=machineLevels[id]??1,e=effects();if(!installed.has(id)||id==='workbench')return;if(id==='press'){const take=Math.min(10*lvl,storage.metal);storage.metal-=take;processed.briquette+=take*e.workshopYieldMultiplier}else if(id==='wire'){const take=Math.min(5*lvl,storage.copper);storage.copper-=take;processed.cleanCopper+=take*e.workshopYieldMultiplier}else{const take=Math.min(10*lvl,storage.plastic);storage.plastic-=take;processed.granulate+=take*e.workshopYieldMultiplier}saveGame();renderGarage()}
function sellRaw(){const value=(storage.metal*BASE_SALE.metal+storage.copper*BASE_SALE.copper+storage.plastic*BASE_SALE.plastic)*effects().saleMultiplier;if(value<1)return;cash+=value;storage={metal:0,copper:0,plastic:0};showToast(`Продано на ${money(value)}`);saveGame();renderGarage()}
function sellProcessed(){const value=(processed.briquette*PROCESSED_SALE.briquette+processed.cleanCopper*PROCESSED_SALE.cleanCopper+processed.granulate*PROCESSED_SALE.granulate)*effects().saleMultiplier;if(value<1)return;cash+=value;processed={briquette:0,cleanCopper:0,granulate:0};showToast(`Переработанное продано на ${money(value)}`);saveGame();renderGarage()}

function garage(){if(mode!=='field')return;mode='garage';for(const k of ['metal','copper','plastic'] as ResourceKind[]){storage[k]+=haul[k];haul[k]=0}for(const k of Object.keys(comps) as ComponentKind[]){storedComps[k]+=comps[k];comps[k]=0}cart=0;$('tripSummary').textContent=`Последняя вылазка: ${telemetry.destroyed} целей · ${fmt((performance.now()-telemetry.start)/1000)}`;garageScreen.hidden=false;renderGarage();saveGame()}
function leaveGarage(){garageScreen.hidden=true;mode='field';if(targets.filter(t=>t.alive).length<12)refreshField();resetExcursionMetrics();hud()}

garageScreen.addEventListener('click',e=>{const target=e.target as HTMLElement,card=target.closest<HTMLElement>('[data-machine]');if(card){selectedMachine=card.dataset.machine as MachineId;renderGarage();return}if(target.closest('#buildMachine'))buildSelected();else if(target.closest('#buyMachine'))buySelected();else if(target.closest('#upgradeMachine'))upgradeSelected();else if(target.closest('#processMachine'))processSelected()});
garageBtn.onclick=garage;nextBtn.onclick=leaveGarage;$<HTMLButtonElement>('sellRaw').onclick=sellRaw;$<HTMLButtonElement>('sellProcessed').onclick=sellProcessed;

function openTalents(){renderTalents();talentScreen.hidden=false}
function closeTalents(){talentScreen.hidden=true}
function renderTalents(){const points=masteryAvailable();$('talentSummary').textContent=`Уровень ${level()} · свободных очков: ${points}. Изучено: ${talents.size}.`;talentBranchesEl.innerHTML=(Object.keys(BRANCHES) as BranchId[]).map(branch=>{const meta=BRANCHES[branch],nodes=TALENTS.filter(t=>t.branch===branch).map(t=>{const unlocked=talents.has(t.id),check=canUnlockTalent(t,level(),talents),available=!unlocked&&points>0&&check.ok;return `<button class="talentNode ${unlocked?'unlocked':available?'available':'locked'}" data-talent="${t.id}" ${available?'':'disabled'}><span>${t.tier}</span><div><b>${t.name}</b><small>${t.description}</small><em>${unlocked?'✓ Изучено':check.reason??(points?'Можно изучить':'Нужно очко мастерства')}</em></div></button>`}).join('');return `<section class="talentBranch"><header><span>${meta.icon}</span><div><h2>${meta.name}</h2><p>${meta.fantasy}</p></div></header>${nodes}</section>`}).join('')}
talentBranchesEl.addEventListener('click',e=>{const node=(e.target as HTMLElement).closest<HTMLElement>('[data-talent]');if(!node)return;const id=node.dataset.talent as TalentId,def=TALENTS.find(t=>t.id===id);if(!def||masteryAvailable()<1||!canUnlockTalent(def,level(),talents).ok)return;talents.add(id);showToast(`Изучено: ${def.name}`);saveGame();renderTalents();renderProgress();hud();if(mode==='garage')renderGarage()});
$('talentsOpen').onclick=openTalents;$('talentsGarage').onclick=openTalents;$('talentsClose').onclick=closeTalents;$('offlineClose').onclick=()=>offlineScreen.hidden=true;

function frame(now:number){const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;if(mode==='field'&&talentScreen.hidden&&!offlineScreen.hidden===false){move(dt);combat(dt);updateDrops(dt);updateEffects(dt);cam();hud();render()}else updateEffects(dt);requestAnimationFrame(frame)}
refreshField();resetExcursionMetrics();applyOffline();hud();requestAnimationFrame(frame);
Object.assign(globalThis,{__SALVAGE_TEST__:{getState:()=>({xp,level:level(),mastery:masteryAvailable(),talents:[...talents],trip,cart,capacity:capacity(),alive:targets.filter(t=>t.alive).length,haul:{...haul},storage:{...storage},components:{...storedComps},cash,installed:[...installed],machineLevels:{...machineLevels},comboCount}),forceGarage:garage,openTalents,selectMachine:(id:MachineId)=>{selectedMachine=id;renderGarage()}}});
