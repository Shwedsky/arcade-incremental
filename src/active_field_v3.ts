import type { DropResult, ResourceKind, SalvageTarget, TargetClassId } from './sim.ts';

export const V3B_HIT_INTERVAL_SEC = 0.22;
export const V3B_BASE_CRIT_CHANCE = 0.08;
export const V3B_BASE_CRIT_MULTIPLIER = 2;
export const V3B_PILE_CHILD_COUNT = 3;

export interface CombatHit {
  damage: number;
  critical: boolean;
  baseDamage: number;
}

export function effectiveCombatDps(
  rawDps: number,
  critChance = V3B_BASE_CRIT_CHANCE,
  critMultiplier = V3B_BASE_CRIT_MULTIPLIER
): number {
  const chance = Math.max(0, Math.min(1, critChance));
  const multiplier = Math.max(1, critMultiplier);
  return Math.max(0, rawDps) * (1 + chance * (multiplier - 1));
}

export function resolveCombatHit(
  rawDps: number,
  roll: number,
  intervalSec = V3B_HIT_INTERVAL_SEC,
  critChance = V3B_BASE_CRIT_CHANCE,
  critMultiplier = V3B_BASE_CRIT_MULTIPLIER
): CombatHit {
  const baseDamage = Math.max(0, rawDps) * Math.max(0, intervalSec);
  const critical = roll < Math.max(0, Math.min(1, critChance));
  return {
    baseDamage,
    critical,
    damage: baseDamage * (critical ? Math.max(1, critMultiplier) : 1)
  };
}

export interface RawCargo {
  metal: number;
  copper: number;
  plastic: number;
}

export function rawCargoWeight(cargo: Readonly<RawCargo>): number {
  return Math.max(0, cargo.metal) + Math.max(0, cargo.copper) + Math.max(0, cargo.plastic);
}

export interface RawUnloadResult {
  moved: RawCargo;
  movedKg: number;
  remaining: RawCargo;
  storage: RawCargo;
}

/**
 * Moves raw expedition cargo to storage without loss.  The current game uses
 * Infinity because base storage has no capacity model yet; a finite capacity
 * is supported so the future storage upgrade can retain overflow in cargo.
 */
export function unloadRawCargo(
  cargo: Readonly<RawCargo>,
  storage: Readonly<RawCargo>,
  storageCapacityKg = Number.POSITIVE_INFINITY
): RawUnloadResult {
  const nextStorage: RawCargo = { ...storage };
  const remaining: RawCargo = { ...cargo };
  const moved: RawCargo = { metal: 0, copper: 0, plastic: 0 };
  const used = rawCargoWeight(storage);
  let room = Math.max(0, storageCapacityKg - used);

  for (const kind of ['metal', 'copper', 'plastic'] as ResourceKind[]) {
    const available = Math.max(0, remaining[kind]);
    const take = Math.min(available, room);
    nextStorage[kind] += take;
    remaining[kind] -= take;
    moved[kind] += take;
    room -= take;
  }

  return { moved, movedKg: rawCargoWeight(moved), remaining, storage: nextStorage };
}

function normalizedShares(count: number): number[] {
  if (count <= 0) return [];
  const raw = Array.from({ length: count }, (_, i) => Math.max(1, count - i));
  const total = raw.reduce((sum, value) => sum + value, 0);
  return raw.map((value) => value / total);
}

/**
 * Split one already-rolled pile reward budget across child targets.  The last
 * child receives the floating-point remainder, so no resource can be created
 * or lost by parent/child rounding.  A rare component belongs to exactly one
 * child and is never paid by the parent as well.
 */
export function splitPileDropBudget(drop: DropResult, childCount = V3B_PILE_CHILD_COUNT): DropResult[] {
  const count = Math.max(1, Math.floor(childCount));
  const shares = normalizedShares(count);
  const result: DropResult[] = Array.from({ length: count }, () => ({
    resources: { metal: 0, copper: 0, plastic: 0 }
  }));

  for (const kind of ['metal', 'copper', 'plastic'] as ResourceKind[]) {
    let assigned = 0;
    for (let index = 0; index < count; index += 1) {
      const amount = index === count - 1
        ? drop.resources[kind] - assigned
        : drop.resources[kind] * shares[index];
      result[index].resources[kind] = amount;
      assigned += amount;
    }
  }

  if (drop.component) result[count - 1].component = drop.component;
  return result;
}

export interface PileChildBlueprint {
  classId: TargetClassId;
  x: number;
  y: number;
  hpFactor: number;
  rotation: number;
  variant: number;
}

const PILE_CHILD_CLASSES: readonly TargetClassId[] = ['small_scrap', 'cable', 'small_appliance'];

/** Deterministic geometry: parent variant rotates the same readable 3-piece fan. */
export function pileChildBlueprints(parent: SalvageTarget): PileChildBlueprint[] {
  const phase = (parent.variant % 4) * Math.PI / 8;
  return PILE_CHILD_CLASSES.map((classId, index) => {
    const angle = phase + index * (Math.PI * 2 / PILE_CHILD_CLASSES.length);
    const distance = 46 + index * 7;
    return {
      classId,
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      hpFactor: 0.18 + index * 0.035,
      rotation: angle * 0.55,
      variant: (parent.variant + index + 1) % 4
    };
  });
}

export function sumDropResources(drops: readonly DropResult[]): RawCargo {
  return drops.reduce<RawCargo>((sum, drop) => ({
    metal: sum.metal + drop.resources.metal,
    copper: sum.copper + drop.resources.copper,
    plastic: sum.plastic + drop.resources.plastic
  }), { metal: 0, copper: 0, plastic: 0 });
}
