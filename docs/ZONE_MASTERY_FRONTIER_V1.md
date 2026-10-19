# Zone Mastery & Frontier Rules V1

Status: **LOCKED MECHANIC BASELINE / PRE-VISUAL**

## Core rule

Every new salvage zone is a **frontier** first. The player must personally enter it, dismantle its targets and discover its component families.

Only after the zone is mastered may workers be assigned there.

Workers can maintain supply from old content; they cannot open new zones, discover new component families or earn frontier mastery for the player.

The player may revisit any mastered zone at any time. Returning with late-game tools/talents is intentionally a power-fantasy experience: old junk should break dramatically faster.

## Zone mastery state

Each zone has one visible `Освоение` meter from 0–100%.

Mastery comes only from active player actions in that zone:
- small target destroyed: 1 mastery unit;
- medium target: 2;
- large target: 4;
- signature/heavy target: 6;
- first active discovery of a component family in the zone: +5 one-time;
- completing an expedition with at least 60% of local cart/vehicle capacity used: +3 one-time per expedition.

The exact conversion to percent is normalized per zone so expected active mastery time remains the target below. The unit weights are the gameplay scoring contract; final target counts may change with map density.

### Target active mastery time

| Zone | Target active time |
|---|---:|
| Z1 Old Junkyard | ~1.5 h |
| Z2 Garage/Backyards | ~2.0 h |
| Z3 Appliance Yard | ~2.5 h |
| Z4 Auto Salvage | ~3.0 h |
| Z5 Industrial Zone | ~3.5 h |
| Z6 Abandoned Factory | ~4.0 h |
| Z7 Heavy Depot | ~4.5 h |
| Z8 Port Terminal | ~5.0 h |

Mastery is deliberately not tied to money spent or offline time.

## What mastering a zone unlocks

At 100%:
1. worker route assignment becomes available;
2. route preview shows expected bulk/component yield;
3. discovered component families from that zone become eligible for worker recovery;
4. active player gains a small route-knowledge benefit (resource/source hints), not a universal damage multiplier;
5. the zone remains permanently selectable for active play.

## Active frontier pacing

The player should not spend the late game repeatedly returning home every 60–90 seconds. Tool power, target toughness, route density, local cart capacity and vehicle buffering are calibrated together so a representative **frontier local-cart cycle remains roughly 5–7 minutes** across the game.

Representative realized throughput baseline:

| Zone | Effective local capacity | Realized bulk rate | Local fill |
|---|---:|---:|---:|
| Z1 | 55 kg | ~522 kg/h | ~6.3 min |
| Z2 | 55 kg | ~535 kg/h | ~6.2 min |
| Z3 | 75 kg | ~838 kg/h | ~5.4 min |
| Z4 | 100 kg | ~1,056 kg/h | ~5.7 min |
| Z5 | 120 kg incl. Logistics bonuses | ~1,308 kg/h | ~5.5 min |
| Z6 | 140 kg effective | ~1,447 kg/h | ~5.8 min |
| Z7 | 160 kg effective | ~1,555 kg/h | ~6.2 min |
| Z8 | 180 kg effective | ~1,715 kg/h | ~6.3 min |

`Effective local capacity` includes permanent cart hardware plus later Logistics talent bonuses; the physical cart itself still caps at the previously approved 100 kg hardware tier.

These rates are structural targets, not final loot tables.

## Multi-target dismantling

`Wide Swing` is the first important Salvage Tier-II mechanic.

Baseline:
- primary valid target: 100% tool power;
- second nearby valid target: 55%;
- automatic secondary selection;
- same movement/route control as today;
- secondary hits can refresh Combo once the relevant follow-up talent is learned.

Progression:
- Wide Swing: 55% secondary;
- Split Force: ~80%;
- Dual Break: ~100%;
- Tier III later adds controlled chain/third-target behavior.

This mechanic is included in realized mid-game throughput rather than being treated as a pure +money multiplier.

## Old-zone power fantasy

Frontier zones are balanced around contemporary tool tier. Mastered older zones do **not** scale up to the player forever.

Therefore a player returning from Z5+ to Z1/Z2 should experience:
- near-instant small-target destruction;
- frequent chain-like visual bursts;
- very fast local collection;
- unchanged old-zone rare-component families;
- lower economic value than current frontier despite spectacular clear speed.

This keeps revisits fun without making Z1 the optimal forever-farm.

## Automation guardrail

A worker route requires:
- zone mastered 100%;
- at least one available worker;
- compatible route buffer/vehicle;
- base storage space;
- component family already discovered actively if component recovery is requested.

No worker assignment can satisfy the unlock/mastery requirement of a later zone.
