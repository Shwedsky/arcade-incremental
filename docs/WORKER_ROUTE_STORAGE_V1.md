# Worker Routes & Storage V1

Status: **DESIGN BASELINE FOR REVIEW**

This document converts "workers passively gather old zones" into an actual system with route capacity, delivery downtime, old-vehicle reuse and storage bottlenecks.

## Worker route loop

A passive field worker does not teleport resources directly into the base.

Each assigned route has:
1. mastered zone;
2. Scavenger worker/crew;
3. remote buffer or vehicle;
4. collection rate;
5. delivery cycle / downtime;
6. base storage destination.

Loop:

`collect in mastered zone -> fill route buffer -> deliver -> resume`

If the remote buffer or base storage cannot accept more material, the route slows/stops and the offline report states why.

## First worker without a spare Van

The first worker arrives after the player owns the Van, but the player is still using that Van personally.

Therefore the first route should not require permanently giving away the Van.

V1 solution:
- first worker can operate Z1/Z2 with a **Basic Route Kit**;
- represents handcart/trailer/local pickup logistics abstractly;
- small remote buffer (~150 kg placeholder);
- low output (~20% of active zone bulk rate);
- meaningful delivery downtime;
- gives the player a taste of automation without sacrificing the exciting new Van.

When the player later buys a Truck, the old Van becomes assignable to a passive route and that route's throughput/buffer improve substantially.

## Vehicle assignment ladder

### Basic Route Kit
- local Z1/Z2 only;
- ~150 kg buffer placeholder;
- early worker bulk efficiency ~20% of active zone rate;
- no heavy zones.

### Spare Van
- ~400 kg route buffer;
- supports Z1–Z4 type routes;
- representative worker bulk efficiency ~30%;
- makes the old player Van valuable after Truck acquisition.

### Truck Route
- ~1,000 kg buffer;
- industrial-zone capable;
- representative worker bulk efficiency ~38%;
- suitable for multiple high-value mid-game routes.

### Recovery Route
- ~1,800 kg buffer;
- heavy late zones;
- representative worker bulk efficiency ~45%;
- required for selected heavy component sources.

Vehicle efficiency is not only capacity: route class also represents tools, loading equipment and ability to service that zone.

## Driver role

Without a Driver, each route loses time when a load is delivered.

V0 calibration uses representative delivery downtime:
- Basic Route Kit: ~20 min;
- Van: ~15 min;
- Truck: ~12 min;
- Recovery Route: ~15 min.

A Driver reduces this downtime to roughly 35% of baseline in the first model.

Resulting expected throughput gain:
- Basic route: ~+14%;
- Van route: ~+8%;
- Truck route: ~+5%;
- Recovery route: ~+6%.

This is intentionally not a giant universal multiplier.

Driver value is highest where frequent small deliveries cause real idle time. Later, Driver/Foreman value can broaden into multi-route support.

## Why old vehicles matter

Transport lifecycle becomes cumulative:

`Player buys Van -> later buys Truck -> old Van becomes worker infrastructure`

Then:

`Player buys Recovery Rig -> Truck remains useful on Z4–Z6 routes`

This avoids the classic incremental-game problem where an expensive vehicle becomes worthless the instant the next tier unlocks.

## Base bulk storage targets

Storage should support roughly a full long absence / workday of representative worker input even **before** processing consumes material.

V0 placeholders:

| Base | Bulk storage | Representative routes | Nominal inbound | Fill time with no processing |
|---|---:|---:|---:|---:|
| Equipped Garage | 2,000 kg | 1 | 104 kg/h | 19.2h |
| Full Garage | 4,000 kg | 2 | 197 kg/h | 20.3h |
| Hangar | 12,000 kg | 3 | 506 kg/h | 23.7h |
| Salvage Yard | 30,000 kg | 5 | 1,376 kg/h | 21.8h |
| Industrial Workshop | 60,000 kg | 7 | 2,921 kg/h | 20.5h |
| Processing Plant | 150,000 kg | 10 | 5,928 kg/h | 25.3h |

These are game-balance storage units, not realism targets.

The important invariant is the fill window: ordinary background production should not stop after 30–60 minutes, but storage still needs to become a meaningful upgrade.

## Storage categories

To avoid tedious inventory micromanagement, V1 uses broad capacity buckets.

### Bulk raw storage
Weight-based:
- ferrous;
- copper;
- plastic;
- aluminium;
- alloy.

### Component storage
Discrete but much more compact.

Use shelves/racks and avoid making one bearing consume 1 kg of bulk storage.

### Processed-material storage
Can share industrial pallet/bulk capacity or have a separate generous buffer if UI remains clearer.

### Premium/signature salvage
Very low-count special inventory. Do not allow it to disappear because a bulk bin is full.

## Storage overflow behavior

Do not silently delete output.

When storage is full:
- route pauses;
- machine cell pauses if output has nowhere to go;
- offline report names the bottleneck;
- later automation talents may reroute, prioritize or maintain stock targets.

Example return report:

`Z3 Appliance Yard crew stopped 1h 14m: aluminium storage full.`

`Copper line stopped 38m: clean-copper pallet full.`

This turns capacity into understandable planning rather than hidden punishment.

## Worker output vs player output

V0 keeps passive rates deliberately lower.

Bulk:
- first route ~20% of active zone rate;
- spare-Van route ~30%;
- Yard-era route ~38%;
- industrial mature crew ~45%;
- Plant-era top route may approach ~50% for ordinary bulk.

Rare / signature component efficiency is lower still:
- early route target ~12% of active targeted component rate;
- mature route target ~28%.

Workers may collect a rare component only after the player has personally discovered that family in the zone ecosystem.

## Worker ranks

Workers should not have a full RPG inventory.

Suggested rank structure:
- Rank 1: baseline role;
- Rank 2: ~+10% role effectiveness;
- Rank 3: ~+20%;
- Rank 4: ~+35%;
- Rank 5: ~+50%.

Exact stacking must be capped/tuned against vehicle route limits so a Rank 5 worker does not magically outperform the player in a basic route kit.

Ranks can increase by working time and/or paid training.

## Worker hiring cost curve

Placeholder structure for future economy simulation:
- Worker #1: already modeled around 35k acquisition milestone;
- Worker #2: materially more expensive (~55k placeholder);
- Worker #3: ~85–95k;
- later hires scale with base tier and should be absorbed into Hangar/Yard expansion budgets rather than simple exponential spam.

Hiring cost is not locked yet.

## Worker slots by base

Working structural targets:
- Starter Garage: 0;
- Equipped Garage: 1;
- Full Garage: 2;
- Hangar: ~3–5;
- Salvage Yard: ~5–8;
- Industrial Workshop: ~8–12 equivalent staff capacity;
- Plant: transition from individual-card management to crews/cells.

## Field vs factory staffing decision

A worker slot should create a real choice:

`Scavenger on Z4` versus `Machine Operator on copper/metal line`.

Too many field workers:
- raw storage floods;
- processors fall behind.

Too many operators:
- production cells starve for input.

Driver/Foreman can reduce logistical losses.

This is the intended late-game management layer — a small set of understandable bottlenecks rather than conveyor-belt micromanagement.

## Model evidence

Reproducible source:
- `models/worker_route_storage_sim_v0.py`

Proofs:
- `docs/proofs/worker_route_throughput_v0.csv`
- `docs/proofs/base_storage_fill_v0.csv`

Structural assertions require:
- representative base storage >= ~18h of worker input with processing disabled;
- each Driver assignment improves route throughput;
- route buffers take roughly 1–3h to fill rather than minutes;
- storage capacity scales with crew count.

## Open decisions before implementation

Still needs another numeric pass:
- exact travel/delivery downtime per zone distance;
- whether Driver is a dedicated worker slot early or a vehicle upgrade/role toggle;
- worker rank training speed;
- component storage caps;
- production consumption reducing real base fill time;
- configured stock targets / smart routing in Automation Tier III;
- hiring costs and salaries/operating costs, if any.

No worker/vehicle/base visual production should be frozen until these stop moving.