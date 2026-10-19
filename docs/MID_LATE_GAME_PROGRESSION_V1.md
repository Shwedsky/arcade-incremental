# Mid / Late Game Progression V1

Status: **DESIGN BASELINE FOR REVIEW — NO VISUAL PRODUCTION YET**

This document extends `DESIGN_BASELINE_V2.md` beyond the accepted early-game loop. It defines what the game grows into after the first garage machines without replacing the active arcade scavenging that already works.

## North-star rule

**The player pushes the frontier. Workers consume mastered content.**

A newly unlocked salvage zone is initially active-player content. The player personally explores it, dismantles its new target families, discovers its signature components and establishes a viable route. Once that zone is mastered, workers may be assigned to it and turn it into a passive resource source.

The player is always allowed to return personally to any mastered zone. Returning with late-game equipment should deliberately create a power-fantasy moment: old targets that once took seconds now explode almost instantly and fill the screen with drops.

Workers must never make active play obsolete. Their job is to keep old materials/components flowing while the player chooses the newest, richest or most interesting frontier.

## Macro progression spine

| Target progression band | Home/base | Personal transport | Frontier focus | Automation milestone |
|---|---|---|---|---|
| 0–4h | Starter Garage | Hand cart | Old Junkyard | Offline baseline only |
| 4–8h | Equipped Garage | Upgraded cart | Garages & Backyards | First processing chain |
| 8–15h | Equipped Garage | **Van** + hand cart | Municipal Dump / Appliance Yard | Mobile unloading |
| 12–20h | Equipped Garage | Van | Mastered early zones | **First worker** |
| 18–30h | Full Garage 8/8 | Van | Auto Salvage Yard | Small crew / old-zone routes |
| 28–50h | **Hangar** | Van -> light truck | Industrial Zone | Multiple workers / more queues |
| 45–80h | Hangar + **Salvage Yard** | Truck | Abandoned Factory | Vehicle/crew assignments |
| 75–120h | **Industrial Workshop** | Truck / recovery rig | Heavy Depot / Construction | Production cells |
| 120h+ | **Processing Plant** | Heavy hauler | Port / Container Terminal | Industrial lines / large contracts |

Hours are target bands, not hard gates. Unlocks are milestone-driven and later require balance simulation.

## Zone state model

Every scavenging zone has three states.

### 1. Frontier
- newly unlocked;
- only the player can extract value;
- contains at least one new target family or new salvage behavior;
- contains at least one new economically meaningful material/component or a much better source of an existing one;
- zone mastery can only be earned through active player runs.

### 2. Mastered
A zone becomes mastered when active play fills its mastery meter and the player has recovered its signature salvage at least once.

Baseline mastery intent:
- several meaningful runs rather than one visit;
- active dismantling and returned haul increase mastery;
- recovering the zone signature part is a hard knowledge gate;
- workers cannot accelerate mastery.

Mastery means the player understands where value is and has established a repeatable route.

### 3. Automated
After mastery, a suitable worker + transport can be assigned.

Automated zones:
- generate common raw resources passively;
- generate already-discovered component families at lower rates than focused active farming;
- obey transport/storage bottlenecks;
- continue active + offline;
- report why production stopped if vehicle/base storage is full;
- remain personally playable at any time.

A signature component must be found manually once before workers are allowed to return it passively. This preserves discovery while preventing long-term RNG blockers.

## What changes when a new zone unlocks

A zone unlock is not `same junk + more HP`.

Each new frontier should change at least two of:
- target silhouette/family;
- raw resource mix;
- component source table;
- target size / required tool class;
- logistics pattern;
- extraction decision;
- active density/rhythm;
- contract type.

Examples:
- household zones emphasize many medium appliances and copper/electronics;
- auto salvage introduces vehicle assemblies, aluminium and gearboxes;
- industrial zones introduce huge machines, alloy scrap and industrial controllers;
- port content introduces generators, forklifts, container machinery and multi-stage heavy salvage.

## Transport rule

The hand cart remains part of the active loop rather than morphing directly into a truck.

### Hand cart
Physical upgrade ladder remains roughly:
- 40 kg;
- 55 kg;
- 75 kg;
- 100 kg.

### Van — first major logistics change
Target: 8–15h.

The van is a **mobile buffer**, not a replacement for the cart.

Loop becomes:

`break junk -> cart fills -> unload into van -> keep scavenging -> van fills -> return home`

The van therefore lengthens runs without deleting the satisfying cart/magnet loop.

Planned van systems:
- cargo capacity;
- component rack that protects/organizes rare parts;
- faster cart unload;
- later magnetic unload module;
- later winch/module for larger salvage.

### Truck
Target: Hangar / early Salvage Yard era.

The truck increases mobile storage by an order of magnitude and supports worker routes. When the player graduates to a truck, the van becomes useful infrastructure rather than obsolete junk: it can be assigned to a worker crew on a mastered zone.

### Heavy recovery rig / hauler
Late game. Enables recovery of targets that cannot fit through normal van/truck logistics and supports industrial/port salvage.

Transport progression should create new route structure, not only a larger capacity number.

## Worker rule

First worker is always after the van.

Workers automate known work; they do not discover content for the player.

V1 worker roles:

### Scavenger
Assigned to a mastered zone. Generates that zone's ordinary resources and discovered component families.

### Driver / Logistics
Raises route throughput, increases effective remote storage and moves worker haul to base. Becomes important once multiple zones are automated.

### Machine Operator
Assigned to workshop processing. Improves uptime/throughput and later enables dedicated production cells.

### Technician
Improves fabrication / advanced-machine efficiency and is used by late workshop/factory recipes.

### Foreman
Late-game crew multiplier / coordination role. Avoids micro-managing ten individual workers one by one.

Workers should have a simple role/rank model, not a character-RPG equipment system.

## Base evolution

The base is one of the main visible rewards of progression.

### Garage
- small, personal, crowded;
- first machines and workbench;
- approximately 8 meaningful equipment footprints is the intended fullness moment;
- `Garage full` becomes a real progression problem rather than an arbitrary level gate.

### Hangar
- major new home scene, not a UI reskin;
- much more floor space;
- vehicle bay;
- worker areas;
- forklift access;
- advanced machine footprints;
- supports parallel workflow and larger storage.

### Salvage Yard
Adds an outdoor industrial area around the hangar:
- vehicle parking;
- bulk scrap piles;
- heavy storage;
- crew dispatch;
- large-object staging.

### Industrial Workshop
Adds specialized production cells rather than isolated small machines.

### Processing Plant
Late-game home state:
- multiple industrial lines;
- bulk input from automated old zones;
- high-tier processed materials/modules;
- large contracts;
- player remains responsible for frontier discovery and premium salvage.

Base upgrades must visibly and mechanically expand what can be built, stored, staffed and processed.

## Active power fantasy

Progression must be felt through old content.

Examples:
- a fridge that once took ~5s becomes an almost instant pop;
- a player who originally handled one nearby target can later dismantle two targets in parallel;
- later chain/sweep mechanics clear dense low-tier junk extremely quickly;
- the player can choose to revisit an old zone for fun, contracts or a temporary resource shortage even if workers are assigned there.

Old maps are not deleted by progression; they become easier, faster and more spectacular.

## Mid/late active-mechanic evolution

Do not turn later zones into idle screens. Active scavenging remains movement + target priority + automatic tool action, but gains additional decisions.

Planned layers:
- **multi-target dismantling** talent: primary target at full power + secondary target at reduced power, later upgraded;
- heavy targets with higher tool-class requirements;
- limited multi-stage industrial targets where external sections break before the valuable core;
- optional intact-component extraction decisions on premium targets versus smashing everything for bulk materials;
- vehicle unload / route positioning decisions;
- signature salvage events that make each zone feel different.

No precision-action minigames are required for the core game.

## Talent-tree continuation

The existing five branches remain permanent:
- Salvage;
- Logistics;
- Workshop;
- Automation;
- Trade.

Current early tree is **Tier I**, not the complete lifetime tree.

New tiers unlock at major base/progression milestones rather than resetting progress:
- Tier II: Van / worker / Hangar era;
- Tier III: Salvage Yard / Industrial Workshop / Plant era.

Tier II/III are detailed in `TALENT_TREE_TIER_II_III_V1.md`.

## Economic loop at scale

Early game:
`active salvage -> sell / keep -> first processing -> machine/gear upgrade`

Mid game:
`active frontier + worker old zones -> processed materials -> fabricated modules -> vehicle/base expansion`

Late game:
`network of automated mastered zones -> industrial processing -> high-tier modules / large contracts`, while the player personally attacks new frontier zones for discoveries, rare parts and the best active yield.

## Anti-idle rule

If optimal play becomes "never enter a scavenging map again", the late-game design has failed.

Active frontier play must retain at least three advantages:
- fastest discovery of new components/materials;
- highest targeted component efficiency;
- access to signature/premium salvage and progression gates.

Workers provide dependable background supply, not replacement gameplay.

## Visual-production gate

Do **not** start the full mid/late visual pass from this document alone.

Before visual production, lock:
1. zone/content matrix;
2. material/component progression;
3. transport/base/worker mechanics;
4. Tier II/III talent tree;
5. a pacing/economy simulation for major milestones and passive-worker output.

Only after those are coherent should visual concepts be expanded beyond the already approved early-game style.