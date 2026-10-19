# Base, Transport & Workers V1

Status: **DESIGN BASELINE FOR REVIEW**

This document defines how the player's home, vehicles and workers change the structure of play from garage-scale scavenging to a late-game salvage network.

## Core progression rule

The game should never replace the active scavenging loop with menus.

Instead:
- the player handles new/valuable frontier content;
- transport extends how long the player can remain active;
- workers automate already-mastered zones;
- base upgrades increase processing/staffing/storage capability;
- old vehicles and buildings remain useful through worker assignments and production roles.

## Base ladder

### Stage 1 — Starter Garage
Target phase: 0–4h.

Capabilities:
- manual workbench;
- tiny storage;
- first small machines;
- one workshop queue baseline;
- no workers;
- hand cart only.

Player feeling:
- personal workshop;
- every machine placement visibly matters.

### Stage 2 — Equipped Garage
Target phase: 4–18h.

Capabilities:
- first processing chain;
- press / wire / plastic / parts stations;
- vehicle parking outside or at the entrance;
- van ownership;
- first worker after van;
- basic remote-zone dispatch.

The garage should visibly get crowded.

### Stage 3 — Full Garage
Target phase: 18–30h.

Design milestone:
- approximately 8/8 meaningful machine/utility footprints occupied;
- storage feels cramped;
- vehicle/workers exist but the space is obviously too small;
- "Buy Hangar" becomes a major aspiration, not a random level button.

A player should understand the need for the Hangar visually and mechanically.

### Stage 4 — Hangar
Target phase: 28–50h.

Major change:
- new base scene;
- much larger interior;
- dedicated vehicle bay;
- worker dispatch/crew area;
- forklift / pallet logistics;
- advanced machine footprints;
- larger storage;
- more workshop queue capacity;
- Sorting Conveyor and Furnace become natural additions.

The Hangar is the first base where the player starts feeling like an operator rather than only a scavenger.

### Stage 5 — Salvage Yard
Target phase: 45–80h.

Extends the Hangar with an outdoor industrial yard.

Capabilities:
- bulk scrap storage;
- multiple vehicle parking slots;
- crew staging;
- heavy-object staging;
- truck ownership;
- more worker routes;
- heavy fabrication equipment.

This is the phase where the passive network becomes significant but the player still personally drives frontier progression.

### Stage 6 — Industrial Workshop
Target phase: 75–120h.

Capabilities:
- dedicated production cells;
- industrial operators/technicians;
- advanced modules;
- heavy recovery equipment;
- multiple simultaneous processing chains;
- industrial contracts.

### Stage 7 — Processing Plant
Target phase: 120h+.

Capabilities:
- industrial lines rather than isolated small stations;
- several automated old-zone inputs;
- large storage buffers;
- high-tier module production;
- large contracts;
- late worker/vehicle coordination.

The plant should feel like the logical result of everything before it, not a separate idle game.

## Transport ladder

### Hand Cart
Always the player's local collection tool in ordinary maps.

Physical ladder:
- 40 kg;
- 55 kg;
- 75 kg;
- 100 kg.

The cart can eventually gain quality-of-life systems:
- faster unload;
- stronger magnet interaction;
- rare-component compartment;
- reduced movement penalty under load.

### Van
Target phase: 8–15h.

Purpose:
- mobile depot;
- extends expedition duration;
- creates a new loop without deleting the cart.

Loop:
`scavenge -> fill cart -> unload to van -> repeat -> van full -> home`

Suggested baseline capacity target for later simulation:
- enough for roughly 4–6 upgraded-cart loads at acquisition.

Van module families:
- cargo rack: more capacity;
- component locker: rare components do not compete with bulk storage / are clearly protected;
- quick unload: faster cart->van transfer;
- magnetic unload: later automatic unload near vehicle;
- light winch: required for selected medium-heavy salvage.

### Light / Medium Truck
Target phase: Hangar / Salvage Yard transition.

Purpose:
- much larger mobile depot;
- support longer industrial-zone runs;
- supports crew logistics;
- van can now be assigned to passive worker routes.

Truck modules:
- larger cargo body;
- powered winch;
- component cage;
- mobile tool power supply;
- crew seating / route support.

### Recovery Rig / Heavy Hauler
Target phase: Industrial Workshop / Plant.

Purpose:
- unlock selected heavy targets;
- move recovered industrial assemblies;
- support late port/depot zones;
- provide final logistics tier for workers and active player.

Do not add fuel micromanagement in V1. Transport cost can be represented by route time, upgrade investment or later abstract operating cost if balance needs it.

## Vehicle lifecycle rule

A new vehicle should not simply delete the previous one.

Examples:
- player buys truck -> old van becomes assignable to worker Route A;
- player obtains heavy hauler -> truck remains ideal for medium zones / second crew;
- different vehicle tiers may have different worker-route efficiency.

This turns old purchases into infrastructure and makes growth feel cumulative.

## Worker unlock

First worker requirement:
- Van already acquired;
- at least one zone mastered;
- base has a worker slot / simple staff area;
- target timing ~12–20h.

The worker should appear when the player has enough old content to automate, not before.

## Worker roles

### Scavenger
Main passive-field role.

Assigned to:
- one mastered zone;
- optionally a vehicle/route.

Produces:
- reliable common resources;
- discovered components at reduced rates.

Cannot:
- discover new components;
- earn zone mastery;
- open a new zone for the player.

### Driver / Logistician
Main purpose:
- increases remote haul capacity;
- shortens effective delivery cycles;
- reduces time lost to full route storage;
- later services several nearby crews.

Useful because a worker without transport should not magically teleport tonnes of scrap to base.

### Machine Operator
Assigned to:
- processor or production cell.

Effects:
- better uptime;
- faster processing;
- reduced idle time between queued batches;
- later enables automated dedicated lines.

### Technician
Assigned to:
- fabrication / industrial equipment.

Effects:
- advanced recipe eligibility where appropriate;
- fabrication speed/efficiency;
- machine-module quality bonuses.

### Foreman
Late game.

Purpose:
- manage a crew group rather than individual micro;
- improve several workers/vehicles in one zone or production cell;
- reduce UI burden.

## Worker progression model

Avoid RPG complexity.

Worker progression should be mostly:
- role;
- rank (for example 1–5);
- assigned zone/machine;
- assigned vehicle where needed.

No helmets, boots, stat-roll loot or individual skill trees in V1.

Rank can grow from time working or paid training.

Example effects:
- Scavenger rank -> zone yield / rare-part return chance;
- Driver rank -> route throughput;
- Operator rank -> machine uptime;
- Technician rank -> fabrication throughput.

## Worker-zone assignment loop

A mastered zone card should eventually show:
- expected resources/hour;
- expected component chances/hour;
- current worker;
- assigned vehicle;
- route storage;
- base storage availability;
- active bottleneck.

Example:

`Auto Salvage Yard — Mastered`

`Scavenger Lv2 + Van`

`Metal 92 kg/h · Aluminium 18 kg/h · Gearbox ~0.08/h`

`Stopped 24m: base aluminium storage full`

These numbers are placeholders for a future model.

## Passive-vs-active yield rule

For a mastered zone:
- passive workers provide reliable background supply;
- active player should still outperform workers significantly for targeted materials/components.

Suggested balance relationship to test later:
- one early worker crew: ~15–30% of an equivalently geared player's bulk active rate;
- mature crew with correct vehicle: ~35–55% bulk rate;
- targeted rare component rate remains meaningfully worse than focused active play.

This is not yet a locked numeric balance, only the intended relationship.

## Multiple workers

Suggested staffing milestones:
- Garage: 0 -> 1–2 workers;
- Hangar: 3–5 workers;
- Salvage Yard: 5–8 workers / crews;
- Industrial Workshop: 8–12 equivalent staff capacity;
- Plant: management becomes crew/cell based rather than displaying 20 tiny worker cards.

Numbers are structural targets and require simulation.

## Production staffing

As the base grows, workers create a meaningful choice:

Assign a worker to old-zone collection
**or**
assign them to processing throughput.

This creates a simple bottleneck puzzle:
- too many scavengers -> raw storage fills, processors lag;
- too many operators -> processors idle because not enough input;
- logistics determines whether remote supply actually reaches home.

The player should solve this at a high level, not with conveyor-belt micromanagement.

## Base storage and bottlenecks

Late-game passive income needs real sinks/limits.

Storage tiers:
- garage shelves;
- garage bulk bins;
- hangar pallets/racks;
- yard bulk storage;
- industrial silos/bins / warehouse abstraction.

If storage fills:
- worker routes pause or divert if later upgrades allow;
- processing may stop;
- offline report explains the bottleneck.

This makes storage upgrades meaningful without punishing the player invisibly.

## Expansion milestones

### Van milestone
Should feel like: **"I can stay out much longer."**

### First worker milestone
Should feel like: **"My old work now keeps happening without me."**

### Hangar milestone
Should feel like: **"This is a business now, not a personal garage."**

### Truck milestone
Should feel like: **"Industrial zones are practical to farm, and my van now works for my crew."**

### Salvage Yard milestone
Should feel like: **"I own a network of salvage operations."**

### Processing Plant milestone
Should feel like: **"Old zones feed an industry while I hunt the frontier."**

## No forced home timer

The garage/base remains accessible whenever the player wants.

Transport should encourage longer runs but never force the player to stay outside until a vehicle is full.

The player can always:
- return home early;
- manage machines;
- complete a contract;
- reassign workers;
- leave again.

Home is a hub, not a punishment screen.

## Required future simulation

Before implementation of workers/vehicles beyond the early prototype, model at least:
- van loads per active hour;
- expected trip length by cart/van/truck;
- worker bulk yield vs player active yield;
- worker component yield;
- storage fill times;
- value of assigning a vehicle to worker vs player;
- staffing break-even between field workers and machine operators;
- target time to Hangar / Yard / Plant.

These will become reproducible model/proof files before visual production.