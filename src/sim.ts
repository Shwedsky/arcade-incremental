export type ResourceKind = 'metal' | 'copper' | 'plastic';
export type ComponentKind = 'bearing' | 'motor' | 'hydraulic' | 'electronics';
export type TargetClassId = 'small_scrap' | 'cable' | 'small_appliance' | 'bike_fan' | 'medium_appliance' | 'large_appliance';

export interface Vec2 { x: number; y: number }

export interface TargetClassDef {
  id: TargetClassId;
  label: string;
  share: number;
  breakSeconds: number;
  radius: number;
  fragments: number;
  componentChance: number;
  yields: Record<ResourceKind, number>;
  componentWeights: Partial<Record<ComponentKind, number>>;
}

export interface SalvageTarget extends Vec2 {
  id: number;
  classId: TargetClassId;
  x:number;
  y:number;
  hp: number;
  maxHp: number;
  rotation: number;
  variant: number;
  alive: boolean;
  respawnAt?:number;
}

export interface DropResult {
  resources: Record<ResourceKind, number>;
  component?: ComponentKind;
}

export const WORLD = { width: 2200, height: 1400, margin: 90 } as const;
export const START_POS: Vec2 = { x: 260, y: 700 };
export const FIELD_NODE_COUNT = 80;
export const BASE_DPS = 100;

export const TARGET_CLASSES: TargetClassDef[] = [
  {
    id: 'small_scrap', label: 'Мелкий лом', share: 0.34, breakSeconds: 0.45, radius: 18, fragments: 3,
    componentChance: 0, yields: { metal: 0.42, copper: 0.01, plastic: 0.02 }, componentWeights: {}
  },
  {
    id: 'cable', label: 'Кабель', share: 0.18, breakSeconds: 0.65, radius: 18, fragments: 4,
    componentChance: 0, yields: { metal: 0.02, copper: 0.14, plastic: 0.08 }, componentWeights: {}
  },
  {
    id: 'small_appliance', label: 'Мелкая техника', share: 0.20, breakSeconds: 1.2, radius: 23, fragments: 5,
    componentChance: 0.015, yields: { metal: 0.52, copper: 0.10, plastic: 0.27 },
    componentWeights: { electronics: 0.55, motor: 0.30, bearing: 0.15 }
  },
  {
    id: 'bike_fan', label: 'Велосипед / вентилятор', share: 0.13, breakSeconds: 1.8, radius: 27, fragments: 7,
    componentChance: 0.035, yields: { metal: 1.25, copper: 0.08, plastic: 0.23 },
    componentWeights: { bearing: 0.65, motor: 0.30, electronics: 0.05 }
  },
  {
    id: 'medium_appliance', label: 'Средняя техника', share: 0.10, breakSeconds: 3.2, radius: 32, fragments: 9,
    componentChance: 0.055, yields: { metal: 1.68, copper: 0.24, plastic: 0.38 },
    componentWeights: { motor: 0.42, bearing: 0.25, electronics: 0.20, hydraulic: 0.13 }
  },
  {
    id: 'large_appliance', label: 'Крупная техника', share: 0.05, breakSeconds: 5.0, radius: 39, fragments: 12,
    componentChance: 0.09, yields: { metal: 2.68, copper: 0.38, plastic: 0.54 },
    componentWeights: { motor: 0.38, hydraulic: 0.27, electronics: 0.20, bearing: 0.15 }
  }
];

const CLASS_BY_ID = new Map(TARGET_CLASSES.map((d) => [d.id, d]));
let latestField:SalvageTarget[]|null=null;
let lastRolledDrop:{classId:TargetClassId;drop:DropResult}|null=null;

export function getTargetClass(id: TargetClassId): TargetClassDef {
  const found = CLASS_BY_ID.get(id);
  if (!found) throw new Error(`Unknown target class: ${id}`);
  return found;
}

export function hashSeed(value: string | number): number {
  const text = String(value);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chooseTargetClass(rng: () => number): TargetClassDef {
  let roll = rng();
  for (const def of TARGET_CLASSES) {
    roll -= def.share;
    if (roll <= 0) return def;
  }
  return TARGET_CLASSES[TARGET_CLASSES.length - 1];
}

function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function generateField(seed: string | number, count = FIELD_NODE_COUNT): SalvageTarget[] {
  const rng = mulberry32(hashSeed(seed));
  const targets: SalvageTarget[] = [];
  let attempts = 0;

  while (targets.length < count && attempts < count * 100) {
    attempts += 1;
    const def = chooseTargetClass(rng);
    const x = WORLD.margin + rng() * (WORLD.width - WORLD.margin * 2);
    const y = WORLD.margin + rng() * (WORLD.height - WORLD.margin * 2);
    const candidate = { x, y };
    if (distanceSq(candidate, START_POS) < 190 * 190) continue;
    if (targets.some((target) => distanceSq(candidate, target) < (def.radius + getTargetClass(target.classId).radius + 14) ** 2)) continue;

    targets.push({
      id: targets.length + 1,
      classId: def.id,
      x,
      y,
      hp: def.breakSeconds * BASE_DPS,
      maxHp: def.breakSeconds * BASE_DPS,
      rotation: (rng() - 0.5) * 0.7,
      variant: Math.floor(rng() * 4),
      alive: true
    });
  }

  if (targets.length !== count) throw new Error(`Could not place ${count} salvage nodes, placed ${targets.length}`);
  latestField=targets;
  return targets;
}

function chooseWeightedComponent(weights: Partial<Record<ComponentKind, number>>, rng: () => number): ComponentKind | undefined {
  const entries = Object.entries(weights) as [ComponentKind, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return undefined;
  let roll = rng() * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return entries.at(-1)?.[0];
}

export function rollDrops(classId: TargetClassId, rng: () => number): DropResult {
  const def = getTargetClass(classId);
  const vary = () => 0.88 + rng() * 0.24;
  const resources: Record<ResourceKind, number> = {
    metal: def.yields.metal * vary(),
    copper: def.yields.copper * vary(),
    plastic: def.yields.plastic * vary()
  };
  const component = rng() < def.componentChance ? chooseWeightedComponent(def.componentWeights, rng) : undefined;
  const result={resources,component};
  lastRolledDrop={classId,drop:result};
  return result;
}

export function takeLastRolledDrop():{classId:TargetClassId;drop:DropResult}|null{
  const value=lastRolledDrop;lastRolledDrop=null;return value;
}

export function latestFieldAliveCount():number{return latestField?.filter(t=>t.alive).length??0}

export function respawnLatestField(enabled:boolean,paused:boolean,now=Date.now(),delayMs=3_500):number{
  if(!enabled||paused||!latestField)return 0;
  let revived=0;
  for(const target of latestField){
    if(target.alive){target.respawnAt=undefined;continue}
    if(target.respawnAt===undefined){target.respawnAt=now+delayMs;continue}
    if(target.respawnAt>now)continue;
    target.alive=true;target.hp=target.maxHp;target.respawnAt=undefined;revived++;
  }
  return revived;
}

export function expectedRawWeight(def: TargetClassDef): number {
  return def.yields.metal + def.yields.copper + def.yields.plastic;
}

export function expectedFieldMix(count = FIELD_NODE_COUNT): Record<TargetClassId, number> {
  return Object.fromEntries(TARGET_CLASSES.map((def) => [def.id, count * def.share])) as Record<TargetClassId, number>;
}
