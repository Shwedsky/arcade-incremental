# Workforce Roles & Costs V1

Status: **LOCKED MECHANIC BASELINE / PRE-VISUAL**

## Purpose

Workers automate mastered content; they do not replace frontier play.

Every worker occupies exactly one active role at a time. Reassignment is allowed, but a worker cannot simultaneously scavenge and operate a machine.

## Worker slots by base stage

| Base stage | Worker slots |
|---|---:|
| Garage after Van | 1 |
| Full Garage | 2 |
| Hangar | 4 |
| Salvage Yard | 6 |
| Industrial Workshop | 9 |
| Processing Plant | 14 |

The base upgrade changes the physical management ceiling, not only a percentage multiplier.

## Hiring curve

Hiring is a one-time onboarding/training investment. No recurring cash wage is charged directly to avoid offline bankruptcy or a tax-like feel; routine labor/maintenance is already represented by worker efficiency being below active-player yield.

Recommended baseline:

| Worker # | Hire cost |
|---:|---:|
| 1 | 35,000 |
| 2 | 55,000 |
| 3 | 85,000 |
| 4 | 130,000 |
| 5 | 200,000 |
| 6 | 300,000 |
| 7 | 450,000 |
| 8 | 650,000 |
| 9 | 900,000 |
| 10+ | continue ~1.35x–1.45x, capped by late economy review |

First worker remains gated behind Van regardless of cash.

## Roles

### 1. Scavenger
Assigned to one mastered zone.

Does:
- gathers common materials;
- may recover already-discovered components at reduced rates;
- fills the route buffer/assigned vehicle;
- stops when route buffer or base storage blocks delivery.

Does not:
- discover a new component family;
- gain zone mastery;
- enter an unmastered zone;
- produce intact/signature active-only drops.

Representative bulk efficiency versus player active rate:
- first route: ~20%;
- spare-Van route: ~30%;
- Salvage Yard crew: ~38%;
- mature industrial crew: ~45%.

Rare-component efficiency is intentionally lower: roughly 12% early to 28% mature versus active targeted hunting.

### 2. Driver
Supports delivery rather than collection.

A Driver:
- reduces route delivery downtime by ~55–65%;
- can support one route initially;
- later Logistics/Automation upgrades allow two compatible routes;
- does not create resources directly.

Expected effective route throughput benefit is approximately +5% to +14% depending on how often the buffer fills.

The role matters most on small-buffer early routes and least on very large late buffers.

### 3. Operator
Assigned to one processing/fabrication cell.

Baseline effect:
- processing cycle time ×0.75;
- automatically restarts the configured recipe while input stock exists;
- respects input reserves and output storage;
- does not bypass a recipe/station unlock.

Without an Operator, current manual/Automation behavior remains valid. An Operator is a labor allocation choice: that worker is no longer scavenging.

### 4. Foreman
Late-game role unlocked in Automation Tier III.

A Foreman coordinates a crew group:
- supports up to three assigned workers initially;
- +10% effective crew throughput;
- reduces route/operator idle time;
- enables stock-target coordination across multiple cells/routes.

Foreman does not multiply frontier progress or active-player loot.

## Role reassignment

Reassignment is not permanently punitive.

Baseline:
- within same base: 5 min training/dispatch delay;
- moving a Scavenger to another zone: 10 min dispatch delay;
- assigning a new vehicle/route kit: 10–20 min depending on tier;
- no mastery reset and no skill loss.

Late Logistics/Automation talents reduce these delays.

## First-worker flow

The first worker arrives after Van.

To preserve the player's newly purchased Van:
- Worker #1 starts with a **Basic Route Kit**, approximately 150 kg remote buffer;
- suitable for Z1/Z2 mastered-zone collection;
- the player keeps using Van for Z3/frontier expeditions.

When Truck is acquired:
- Van becomes eligible for a worker route;
- the player keeps Truck;
- the old vehicle gains a second life rather than becoming dead inventory.

## Opportunity-cost examples

### Hangar with 4 workers

Option A — supply focus:
- 3 Scavengers;
- 1 Driver.

Result: high old-zone input, no dedicated production operator.

Option B — processing focus:
- 2 Scavengers;
- 1 Driver;
- 1 Operator.

Result: less incoming raw salvage but higher processed/module throughput.

Option C — component hunt support:
- 3 Scavengers on different mastered source zones;
- no Driver;
- 1 Operator.

Result: wider component trickle, more delivery idle time.

The player should be choosing a network shape, not merely buying every worker as a flat multiplier.

## Route buffer baseline

Representative buffers:
- Basic Route Kit: 150 kg;
- spare Van: 400 kg;
- route Truck: 1,000 kg;
- Recovery Rig route: 1,800 kg.

Route loop:

`collect -> buffer full -> delivery downtime -> base unload -> resume`

Base storage remains a global stop condition.

## Worker progression

Workers may have a simple rank (1–3) later, but V1 deliberately avoids RPG stat sheets.

If implemented:
- Rank 1: baseline;
- Rank 2: +10% role effectiveness;
- Rank 3: +20% role effectiveness / small role-specific perk.

Training costs/time must be modeled before implementation; no random worker rarity system is planned.
