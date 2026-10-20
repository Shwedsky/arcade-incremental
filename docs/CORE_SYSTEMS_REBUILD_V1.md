# Core Systems Rebuild V1

Status: **owner-directed rebuild source of truth**  
Tracking: Issue #44 / Draft PR #43

## Why this exists

The P0/P1 Foundation manual review proved that the runtime has accumulated more mechanics than readable game progression.

The owner rejected the current state because:
- talents often do not feel impactful and visible placeholder nodes cannot be purchased;
- the level/mastery-point model was being used to justify permanent incomplete ownership of the tree;
- Garage -> Hangar -> later infrastructure does not materially change the perceived place;
- worker assignment and vehicle assignment provide poor immediate feedback;
- worker implementation is fragmented into pack-specific worker #1/#2/#3/#4 behavior;
- Van/Truck/Rig ownership and purpose are not presented as a coherent fleet;
- industrial intermediate materials exist before their purpose is understandable;
- contract demand competes too aggressively with normal progression;
- equipment and machine ladders terminate too early.

This is not treated as a polish pass. It is a core-progression rebuild.

## Product north star

The game should feel like:

`one scavenger -> capable solo operator -> upgraded Garage -> small crew + fleet -> real Hangar -> salvage network -> industrial workshop -> processing plant`

The active field loop remains important at every stage. Business growth automates old/frontier-adjacent work but never deletes the value of personally pushing the newest frontier, hunting signature components and solving rare bottlenecks.

## Rules that replace earlier assumptions

### 1. The talent tree is eventually completable

The previous planning target of roughly 55-65% total tree ownership at the Plant era is removed.

For the current game scope:
- specialization controls **what the player gets first**;
- it must not permanently strand large visible parts of the tree;
- a sufficiently progressed end-of-scope player can eventually purchase the whole implemented tree;
- if that requires a higher level cap than 30, raise the cap and model it;
- no visible `runtime:false` placeholder node is allowed in the player-facing tree.

### 2. Every major purchase must be felt in at least three channels

A Garage/Hangar/Yard/Workshop/Plant milestone is not accepted unless it changes at least three of:
- visible base scene/layout;
- available staff/fleet capacity;
- production topology;
- storage/logistics capacity;
- management abstraction;
- available contracts/orders;
- meaningful talent/equipment options.

A title/accent/tab-only change does not count.

### 3. Growth increases scale and reduces micro per unit

- 1-2 workers can be managed as individuals;
- several workers should be grouped into routes/crews;
- Plant-era staff are managed at crew/cell level, not as twenty separate cards;
- the UI must always answer who/where/what/with what/output/bottleneck.

## A. Talent Rebuild V4

### Permanent branches

Keep five branches because they map cleanly to the game:
- **Разбор / Salvage** — active dismantling power, multi-target, heavy targets, rare/signature hunting;
- **Логистика / Logistics** — field carrying, pickup, vehicle capacity, route/fleet throughput;
- **Мастерская / Workshop** — processing yield/speed, queue/cell capacity, industrial production;
- **Автоматизация / Automation** — worker efficiency, offline duration, crew/dispatch automation;
- **Торговля / Trade** — standing buyer margins, special-order quality, supplier/build economics.

### Node quality

Every node must be one of:
- a clearly visible/measurable stat jump;
- a behavior-changing unlock;
- a bottleneck-changing capability;
- a new management option.

Small invisible filler is rejected.

The talent panel should show the concrete effect whenever practical, for example:
- `Разбор 132 -> 151 ед./с`;
- `Фургон 400 -> 520 кг`;
- `Рабочий 118 -> 147 кг/ч`;
- `Очередь 1 -> 2 слота`;
- `Offline 2:00 -> 3:00`.

### Progression model

The final number of levels is model-driven, not locked to 30.

Implementation target:
- early levels arrive quickly and teach the five branches;
- midgame continues awarding meaningful points through workforce/Hangar;
- later levels carry the player through Yard/Industrial/Plant;
- full current-scope talent cost is reachable by the final modeled level;
- player still makes meaningful priority decisions because points arrive over time.

## B. Equipment / machine progression

The current short ladders are replaced with longer meaningful progressions.

### Tool

Target: roughly 10-12 meaningful steps across eras, for example:
1. scrap pry bar;
2. reinforced pry bar;
3. powered cutter;
4. heavy powered cutter;
5. hydraulic cutter;
6. reinforced hydraulic cutter;
7. plasma/thermal field tool;
8. heavy industrial field tool;
9-12. late specialist variants/modules.

Not every step must be a new model, but major breakpoints must change appearance/behavior, not only a percentage.

### Carrier / field logistics

Do not stop at cart level 4.

Progress should evolve through useful forms/capacities such as:
hand cart -> reinforced cart -> powered trolley -> cargo trolley/trailer integration -> field carrier modules.

### Machines

Garage machines need a longer capability path:
- speed/yield;
- new recipes;
- queue/parallelism;
- automation compatibility;
- industrial cell compatibility.

Avoid a meaningless `level 1-4` ceiling if the business continues for many hours beyond it.

## C. Generic Workforce V3

Remove pack-specific worker implementations from the player model.

### Generic worker entity

Each worker has:
- stable id and display identity;
- role;
- rank/training;
- assignment;
- status;
- shift/offline budget;
- expected output;
- optional vehicle assignment;
- optional crew/cell assignment.

### Roles

Introduce only when the corresponding system exists:
- Scavenger — gathers in mastered zones;
- Operator — improves production cell throughput;
- Logistician/Driver — improves route/vehicle handling;
- Technician — improves advanced industrial uptime/output.

All workers use one assignment engine. No worker #2 restricted to Z1-Z3 and no hidden per-pack behavior differences.

### Capacity

Worker capacity comes from the base and its meaningful upgrades, not a global hardcoded four-worker limit.

Provisional scale to model:
- Garage: 0-2;
- Hangar: roughly 4-6;
- Yard: roughly 8-10;
- Industrial: roughly 10-14 equivalent staff;
- Plant: crews/cells rather than a large list of individual cards.

Exact values must be balanced, but the structural model is fixed.

## D. Fleet & Routes V3

Replace singleton ownership flags with a fleet.

### Vehicle entity

Each owned vehicle exposes:
- type;
- capacity;
- current assignment;
- current cargo/status;
- expected route contribution;
- stage/fleet-slot usage.

Multiple vehicles of a useful type are allowed when the base supports them.

The player should see explicit counts such as `Фургоны 1 / 3` rather than infer whether more can exist.

### Route card

One route card must show in one place:
- source zone;
- assigned worker/crew;
- assigned vehicle;
- expected kg/h and/or value/h;
- shift time remaining;
- capacity/storage bottleneck;
- clear active/paused/blocked state.

Assigning or removing a Van must immediately change the displayed expected output/capacity.

## E. Offline V3

Offline gains use the real save/simulation path.

The return report must show:
- actual elapsed offline time;
- worker/route gains separately;
- production jobs completed;
- storage/output added;
- where/why each line stopped;
- remaining shift/route capacity when relevant.

DEV acceleration may call the same real offline path with an artificial timestamp for testing, but must not fabricate a separate mock reward economy.

## F. Base stage visual rebuild

### Garage

Compact room, visible owned machines, storage, one small vehicle bay/door, first worker presence when hired.

### Hangar

Must be obviously a different place:
- much larger interior;
- multiple machine positions;
- vehicle bays;
- visible workers/dispatch area;
- racks/pallets/bulk storage;
- room for future expansion.

### Salvage Yard

Outdoor/industrial-scale area with bulk piles/storage, fleet parking, crew staging and heavy recovered-object area.

### Industrial Workshop

Dedicated heavy production cells/equipment, not just another card added to Garage.

### Processing Plant

Separate industrial-scale base identity with warehouse/buffers, several major lines/cells and inbound/outbound flow.

## G. Industrial chain simplification

The current stack of similarly named intermediates is audited aggressively.

A retained intermediate must have at least two real sinks among:
- infrastructure/fleet construction;
- machine/equipment upgrade;
- another meaningful production recipe;
- standing/special contract.

If an intermediate exists only to turn into another intermediate, strongly prefer collapsing the chain.

Target causal model should read naturally:

`field salvage -> useful processed material/component -> module/product -> infrastructure, upgrade or profitable order`

The production UI can explain this chain, but the chain must first make structural sense without the explanation.

## H. Contract Board V3

### Standing contracts

Always visible, non-expiring baseline buyers.

Properties:
- manageable quantities;
- partial delivery;
- reliable but lower margin;
- cover common raw and processed families;
- never drain progression-critical stock faster than normal play can reasonably replace it.

### Special orders

Separate rare/high-margin opportunities.

Properties:
- processed materials/components/modules/industrial output;
- significantly better margin;
- one or a small number at once;
- refresh/decline/expiry can exist;
- they supplement baseline income instead of replacing it.

Never show two near-duplicate bulk raw-metal drains as the player's only interesting choice.

## I. Implementation order

Do not ask for another owner manual review after each tiny slice.

### R1 — Core data/model migration
- Save V11 draft/migration plan;
- generic worker roster;
- generic fleet model;
- generic route model;
- Talent V4/level model;
- simplified industrial inventory schema;
- standing/special contract domain.

### R2 — Runtime and UX
- all-current-scope talents functional;
- extended equipment/machine progression;
- Crew/Logistics route dashboard;
- real offline report;
- Contract Board V3;
- meaningful production-chain UI.

### R3 — visible stage proof
- Garage scene states;
- genuinely different Hangar scene;
- worker/vehicle presence represented;
- meaningful base expansion modules visible.

### R4 — integration/hardening
- migrate existing Save V10 safely;
- deterministic economic proof;
- browser regressions;
- manual DEV accelerators using real domain paths;
- one owner review package.

## Next owner review gate

Do not deliver another review ZIP until all of the following are simultaneously true:
- no player-facing placeholder talent nodes;
- full current-scope talent tree can eventually be completed;
- Tool/carrier/machine growth no longer ends at the current short ladders;
- workers use one generic model;
- multiple vehicles/fleet capacity is explicit;
- route assignment gives immediate visible effect;
- offline return report proves real gains;
- standing contracts are permanently available and special orders are separate;
- industrial materials have clear repeated sinks;
- Garage and Hangar are visibly different places.

Only then is another human feel/readability verdict useful.
