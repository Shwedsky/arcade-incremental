# Product Roadmap V2 — Active Salvage -> Industrial Business

Status: **CURRENT FORWARD PRODUCT ROADMAP**

Audited main: `465da864a603d6ab940affe878c639209fe346b6`.

This document replaces the forward-looking package order from `ROADMAP_IMPLEMENTATION_AUDIT_V1.md` after:
- Progression Expansion V2;
- Content Pack E / Z8 / Processing Plant mechanical baseline;
- Save V10;
- Manual Review DEV V2;
- owner review confirming that the mechanical breadth is ahead of the visible/base-management experience.

Historical design/audit documents remain valid as evidence for earlier decisions, but new product work should follow this roadmap.

---

## 1. Product direction

The game is no longer only a small arcade/incremental clone target.

The active reference remains the readable, satisfying `break -> collect -> grow stronger -> break bigger things` loop associated with the original Space Rock Breaker quality target, but the product direction is now broader:

> **A top-down active salvage game that gradually becomes an industrial salvage business, without ever deleting the active frontier loop.**

The player fantasy should evolve through these identities:

`one scavenger -> garage owner -> small employer -> hangar operator -> salvage network owner -> industrial producer -> plant operator`

The active field remains the heartbeat at every stage:
- new zones are personally explored;
- first discoveries are personally earned;
- rare/signature targets remain best farmed actively;
- active play remains the strongest targeted way to solve bottlenecks;
- passive systems automate mastered work, not frontier progression.

The business layer grows around that heartbeat.

---

## 2. Current project position

### Mechanically implemented today

The current runtime already contains a much wider mechanical spine than the visible product experience suggests:
- active dismantling and pickup loop;
- Garage machines, storage, contracts and workshop queue;
- character XP and five permanent talent branches;
- levels through 30 and first coherent Tier-II roots;
- Van, Truck and Recovery Rig;
- four worker slots plus Scavenger/Operator behavior;
- mastered-zone passive work and offline shifts;
- Hangar, Salvage Yard and Industrial Workshop milestone states;
- Z1-Z8, including Port Terminal;
- Processing Plant baseline with two independent production lines;
- Save V10.

### Experientially implemented today

The visible experience is materially earlier:
- most business progression still happens inside one large Garage screen;
- Hangar / Yard / Industrial Workshop are primarily mechanical state changes and cards rather than strong new places;
- buying major buildings does not yet produce a large visual or interaction change;
- workers are still mostly assigned one-by-one with shallow management;
- fleet progression is present mechanically, but does not yet feel like an owned vehicle network;
- Plant exists mechanically, but not yet as a compelling plant-scale management game;
- the talent system has the right permanent branch identities but not enough depth, stage alignment or modeled point economy.

### Product verdict

The project is **mechanically at the beginning of the Plant era, but experientially around the Garage -> first workforce -> early Hangar transition**.

Therefore the next work should **not** be Z9, more generic materials, more workers, or monetization.

The next work must convert existing mechanics into a coherent progression of visibly different businesses.

---

## 3. Non-negotiable progression rules

### 3.1 Active play never becomes obsolete

Passive infrastructure should provide reliable background supply, but the player should still want to enter the field because active play provides:
- frontier mastery;
- first discovery;
- best targeted rare/signature farming;
- faster response to a production bottleneck;
- access to new zones and business milestones;
- the strongest direct character-power fantasy.

### 3.2 A new business tier must be visible

A purchase such as Hangar, Salvage Yard, Industrial Workshop or Processing Plant is not complete if it only changes a flag, card or number.

Every major base tier must change at least three of these dimensions:
- background/base scene;
- available management screens/tabs;
- machine capacity/layout;
- storage capacity/presentation;
- worker capacity/roles;
- vehicle capacity/parking;
- production topology;
- available contracts;
- talent tier/gates.

### 3.3 New systems should solve a pressure created earlier

Examples:
- Van solves short active expeditions;
- first worker solves repeated farming of mastered zones;
- Hangar solves crowded Garage space, queue pressure and worker/vehicle management;
- Yard solves bulk material and heavy vehicle staging;
- Industrial Workshop solves advanced fabrication capacity;
- Plant solves scale: several old routes feeding several industrial lines and large contracts.

A milestone should therefore feel necessary before it becomes purchasable.

### 3.4 Automation is macro-management, not conveyor-belt simulation

The game may become partially `Clash-like` in the sense that the player:
- starts long upgrades;
- assigns people/assets;
- chooses what runs while away;
- returns to completed work and new bottlenecks.

But it should not become a factory-layout spreadsheet.

The player manages:
- people;
- vehicles;
- routes;
- queues;
- production plans;
- storage/bottlenecks;
- contracts.

The player should not be required to manually route belts, power cables, fuel or dozens of tiny machines.

---

## 4. Roadmap overview from current stage

The roadmap is intentionally depth-first from here.

### P0 — Product architecture + economy/talent model V3
**Purpose:** make the next stages safe to build instead of continuing to accumulate features in a monolithic screen/runtime.

### P1 — Active Salvage & Garage V2
**Purpose:** make the first business stage clear, satisfying and visibly upgradeable.

### P2 — Workforce & Van V3
**Purpose:** make passive progress and small-employer gameplay a real second loop.

### P3 — Hangar Transformation V1
**Purpose:** create the first undeniable business-scale transformation and split management into usable surfaces.

### P4 — Salvage Yard & Fleet Network V1
**Purpose:** turn several workers/vehicles/routes into a salvage network instead of a list of individual buttons.

### P5 — Industrial Workshop & Production Cells V1
**Purpose:** make advanced production and industrial staffing a distinct stage.

### P6 — Processing Plant V2
**Purpose:** turn the existing mechanical Plant baseline into a real late-game operating layer.

### P7 — Production polish, content expansion, platform and monetization
**Purpose:** only after the progression spine is experientially coherent, prepare the game for external acquisition/retention testing and monetization.

---

# P0 — Product Architecture + Economy/Talent Model V3

## Player-facing increment

Almost none. This is an enabling package.

The visible benefit is that subsequent screens and progression can be built without destabilizing the already-wide runtime.

## Technical increment

### A. Split the current orchestration/UI ownership

`main.ts` currently owns too many responsibilities at once: field runtime, Garage rendering, zone navigation, talents, workers, transport, late buildings and Plant actions.

Before the Hangar UI becomes multi-screen, extract clear controllers/modules for at least:
- field/session orchestration;
- base shell/navigation;
- workshop/machines;
- crew/workers;
- logistics/fleet;
- contracts/trade;
- progression/talents;
- industrial production.

This does not require a framework rewrite. Preserve the current TypeScript/Vite browser stack and domain modules; reduce the integration monolith.

### B. Introduce a derived Business Stage model

The runtime needs a single readable concept such as:

`starter_garage -> equipped_garage -> workforce_garage -> hangar -> salvage_yard -> industrial_workshop -> processing_plant`

Prefer deriving the stage from owned infrastructure instead of storing a fragile duplicated flag.

The stage becomes an input to:
- UI shell;
- available tabs;
- visual scene;
- talent tier gates;
- contract pools;
- tutorial/goal messaging;
- management capacity.

### C. Create Economy/Progression Model V3 before retuning

Add a deterministic model that covers in one place:
- active kg/hour by zone and equipment;
- active cash/hour;
- rare/signature component acquisition;
- worker output by rank/role/vehicle;
- storage fill time;
- machine/production consumption;
- expected milestone time;
- XP/hour and level timing;
- mastery-point supply;
- talent total cost and reachable share;
- offline contribution.

The model should produce milestone windows, not one exact perfect playthrough.

## In-game business increment

None directly. This package creates the accounting rules for every later business tier.

## Product/business value

This is risk reduction:
- prevents another situation where mechanics reach Plant while the player still feels inside one Garage;
- prevents talent nodes from being added faster than points/levels can support them;
- makes later balance changes testable instead of subjective.

## Exit gate

P0 is complete only when:
- every current owned infrastructure state maps to one business stage;
- existing Save V10 loads with no reset;
- current field and base regressions remain green;
- the model can simulate from fresh start to Plant milestone;
- target milestone ranges and talent-point constraints are written down before P1/P2 tuning.

---

# P1 — Active Salvage & Garage V2

## Player promise

> **I start as one person breaking junk, and I can see my personal workshop becoming a real working Garage.**

This is still early game.

## Technical/gameplay increment

### Active dismantling

Refine the primary loop before adding more frontier content:
- stronger distinction between target sizes/classes;
- clearer dismantling feedback and power growth;
- improve multi-stage/valuable-target interactions where justified;
- preserve automatic attack/readable arcade control;
- make tool/cart progression visibly change field efficiency.

The goal is not to redesign combat. The goal is to make progression in dismantling strength obvious.

### Garage progression

The Garage should have visible states rather than one static room/card layout.

Example visual states:
- bare starter Garage;
- equipped Garage with 2–3 machines;
- crowded Garage with machines, storage and vehicle area;
- visibly full Garage shortly before Hangar purchase.

Machine purchases/upgrades should alter the scene or machine presentation.

### Base UI shell V1

Stop treating all systems as one long screen.

Create a reusable base shell with stage-aware navigation. Early Garage may expose only:
- `База/Обзор`;
- `Станки`;
- `Склад`;
- `Контракты`;
- `Развитие`.

`Персонал` and `Логистика` appear only when those systems exist.

The Overview is not another spreadsheet; it is the visible business scene and next-goal surface.

## In-game business increment

The player moves from:

`sell whatever I found`

to:

`collect -> decide what to keep -> process -> improve equipment/machines -> fulfill better contracts`.

The Garage becomes a production asset, not only a menu between trips.

## Talent increment

Tier I must be cleaned up around the first identity choices.

Keep the five permanent branches:
- **Разбор / Salvage** — active dismantling power, combo, target handling, rare-focused active play;
- **Логистика / Logistics** — cart, pickup, movement, expedition capacity;
- **Мастерская / Workshop** — processing efficiency, queue/build speed, early machine economics;
- **Автоматизация / Automation** — initially mostly locked/foreshadowed until workers exist;
- **Торговля / Trade** — sale value, contract choice, supplier/buyer advantages.

Tier-I nodes should not contain meaningless filler. A numeric node should normally create a clearly measurable effect; tiny +1–3% nodes are not acceptable unless they support a larger mechanic.

## Product/business value

This phase improves:
- first-session clarity;
- visible progression;
- early retention;
- the quality of the core loop against the original arcade reference target.

## Exit gate

A fresh player should be able to answer without explanation:
- what becomes stronger when the character levels;
- why a new machine matters;
- what the Garage currently produces;
- what the next Garage limitation is;
- why Van/worker progression is desirable.

The Garage must look materially different near the end of P1 than at game start.

---

# P2 — Workforce & Van V3

## Player promise

> **My old work continues without me, and my first vehicle changes both active trips and passive logistics.**

This is the second early-game layer, not yet the full management game.

## Technical/gameplay increment

### Crew system V3

Replace worker assignment as a mostly individual low-context action with a proper Crew surface.

Each worker card should show:
- role;
- rank;
- current assignment;
- expected output;
- current bottleneck;
- shift/offline state;
- assigned vehicle if relevant.

Initial roles:
- Scavenger;
- Operator where production already supports it.

Driver/Logistician becomes the first new dedicated role in this package or the beginning of P3 depending on model results.

### Worker ranks

Introduce a shallow 1–5 rank model, not RPG gear.

Ranks improve role-specific throughput and may unlock one role behavior at defined thresholds.

Training can use time, cash, or both; exact cost is model-driven.

### Van as an asset, not only a capacity number

The Van must have two competing uses:
- player expedition support;
- passive route support.

Add a clearer Van upgrade ladder around capacity/route usefulness rather than many micro-modules.

The player should understand the opportunity cost of assigning the Van to a worker.

### Offline report V2

On return, explain:
- what each route produced;
- what stopped early;
- what storage filled;
- which vehicle/worker was the bottleneck;
- what production continued.

## In-game business increment

The player becomes an employer.

Economically this creates the first real separation between:
- active frontier income;
- passive mastered-zone supply.

The target relationship should preserve existing design intent:
- early worker route roughly ~15–30% of an equivalently progressed active bulk rate;
- mature correctly-supported route roughly ~35–55% bulk rate;
- targeted rare/signature farming remains materially better actively.

Exact values come from Model V3.

## Talent increment

Tier II begins to matter here.

Branch identities expand:
- Salvage: active multi-target / weak-point / rare focus;
- Logistics: Van capacity, unload, route capacity, vehicle availability;
- Workshop: queue depth and process throughput;
- Automation: worker shift efficiency, offline cap, worker output, role unlocks;
- Trade: contract choice, better buyers/suppliers, larger order economics.

Tier II should require both level progress and a real business milestone where appropriate.

Pure XP must not unlock a talent whose system does not exist yet.

## Product/business value

This phase creates the main reason to return after being away.

It converts the game from only session-based arcade progression into a real incremental loop without reducing the value of active play.

## Exit gate

A player with one or two workers and a Van should be able to:
- leave the game;
- return to understandable gains;
- identify why gains stopped or slowed;
- choose whether the Van helps the player or a route more;
- feel that mastered zones are now assets rather than obsolete maps.

---

# P3 — Hangar Transformation V1

## Player promise

> **This is no longer my crowded Garage. I now operate a small salvage business from a real Hangar.**

This is the most important experiential milestone in the current roadmap.

## Technical/gameplay increment

### A real new base scene

Buying the Hangar must load/use a visibly different base environment.

Required visual language:
- larger interior;
- dedicated machine area;
- dedicated storage/racks/pallets;
- vehicle bay;
- worker/dispatch area;
- visible capacity for expansion;
- stronger business-scale ambience than the Garage.

A Hangar purchase that leaves the player looking at the old Garage screen is not considered implemented.

### Base shell V2

At Hangar stage the management UI should be split into stable tabs/surfaces such as:
- **Обзор** — visual Hangar + current bottlenecks + next milestone;
- **Производство** — machines, upgrades, queue;
- **Персонал** — workers, roles, training;
- **Логистика** — vehicles and routes;
- **Склад** — capacities/input/output;
- **Контракты** — orders/trade;
- **Развитие** — talents/business unlocks.

Exact grouping can be reduced after UX review, but workers/vehicles/production must no longer be one scrolling page.

### Multiple vehicle ownership becomes real

The Truck should not replace the Van.

At Hangar stage:
- Van can service a worker route;
- Truck can support the player or another route;
- parking/bay presentation shows both assets;
- route UI treats vehicles as assignable resources.

### Expanded staffing

Target structural range remains roughly 3–5 worker capacity at Hangar maturity, subject to model tuning.

Introduce/complete:
- Scavenger;
- Driver/Logistician;
- Operator.

## In-game business increment

The economic loop changes from:

`player + one helper`

to:

`several supply sources -> shared storage -> processing queues -> contracts`.

The player begins solving bottlenecks rather than only farming enough money for the next button.

## Talent increment

Tier III roots become available through the Hangar milestone.

This is where the talent tree must visibly split character power from business power.

Example deepening:
- Salvage Tier III: heavy/multi-stage target advantage;
- Logistics Tier III: multi-vehicle routing / faster turnaround;
- Workshop Tier III: advanced machine cells / parallel queue benefit;
- Automation Tier III: role efficiency / training / dispatch quality;
- Trade Tier III: larger contracts / market specialization.

## Product/business value

This should be the mid-game retention milestone that communicates the product's broader identity.

It is also the point where screenshots/videos can show something clearly beyond a simple arcade incremental.

## Exit gate

Hangar V1 is complete only if owner testing confirms:
- the base visibly changed;
- management is easier despite more systems;
- multiple workers and vehicles are understandable;
- the player can identify one current bottleneck from the Overview without opening every tab;
- the player still has a clear reason to personally go to the frontier.

---

# P4 — Salvage Yard & Fleet Network V1

## Player promise

> **I own several salvage operations and a real logistics network.**

## Technical/gameplay increment

### Yard as a physical extension

The Salvage Yard becomes a distinct outdoor/industrial area or strong extension of the Hangar, with:
- bulk scrap storage;
- heavy-material staging;
- several vehicle slots;
- crew staging;
- large recovered-object area;
- visible route activity.

### Fleet routing

Generalize vehicle/worker assignment:
- more than one route can exist simultaneously;
- Van/Truck/Recovery-capable assets have different strengths;
- route card shows expected output, capacity and bottleneck;
- no magical infinite transport.

### Crew grouping begins

Once individual worker micro becomes noisy, introduce small crew presets/groups.

The player may still inspect individuals, but common actions should support:
- assign crew to zone;
- assign vehicle;
- dispatch/refresh shift;
- see combined throughput.

### Storage/bottleneck network

Make remote route storage and base storage meaningful.

A route may pause because:
- vehicle capacity is insufficient;
- remote buffer is full;
- base storage is full;
- required logistics role is absent.

The UI must say which one.

## In-game business increment

This is where passive production becomes significant enough to feed the player's processing operation.

Old zones become supply nodes.

The active player still handles:
- frontier zone progression;
- rare/signature hunting;
- targeted emergency supply.

## Talent increment

Late Tier III / first industrial-capstone effects should now change network behavior, not only percentages.

Examples of acceptable talent value:
- one extra route slot;
- shared logistics support for two nearby crews;
- protected rare-component cargo;
- automatic reroute of common bulk input;
- a meaningful throughput multiplier with a real condition.

## Product/business value

This phase creates the long-term management puzzle that separates the game from a straightforward active incremental.

It also creates natural future monetization surfaces without adding monetization yet: time, capacity, route convenience and optional acceleration all become understandable systems.

## Exit gate

The player can manage several routes without excessive clicking and can answer:
- who is collecting what;
- which vehicle moves it;
- where it is stored;
- what is currently limiting throughput.

---

# P5 — Industrial Workshop & Production Cells V1

## Player promise

> **I am no longer only recycling scrap. I manufacture industrial outputs from a supply network.**

## Technical/gameplay increment

### Industrial Workshop becomes a real production stage

Replace the current mainly mechanical milestone with a dedicated industrial production surface/scene.

Use production cells rather than a long list of small machines.

A cell may represent a coherent operation such as:
- material refining;
- inspection/sorting;
- fabrication;
- heavy assembly.

### Operators and Technicians

Complete worker role differentiation:
- Operator -> line uptime/throughput;
- Technician -> fabrication efficiency, advanced recipes or downtime reduction;
- Driver/Logistician -> inbound/outbound flow;
- Scavenger -> supply.

The player decides where limited staff creates the most value.

### Parallel chains

Support several meaningful simultaneous chains without turning the UI into a factory simulator.

The management decision should be:
- which production plan runs;
- which inputs are reserved;
- which worker operates it;
- which contract/output is prioritized.

### Recovery Rig / heavy content identity

Recovery Rig should gain a clearer role in accessing/moving selected late heavy targets and assemblies, not only be another capacity number.

## In-game business increment

Revenue/value shifts from mainly selling recovered/processed material to producing higher-value modules and industrial orders.

The business now has real transformation margin:

`old zones -> raw inputs -> processed materials -> modules -> industrial contracts`.

## Talent increment

Industrial tier talents should strongly specialize production strategy.

Avoid allowing one player to max every path immediately.

By this point the model should support a focused build completing one branch and reaching deep nodes in one or two others, while broad builds remain viable but shallower.

## Product/business value

This phase creates deeper mid/late-game planning and supports longer retention without relying on endless new maps.

## Exit gate

The player can run at least two meaningful production activities in parallel, can see the input bottleneck, and understands why assigning one worker/vehicle differently changes output.

---

# P6 — Processing Plant V2

## Current state

Processing Plant already exists mechanically:
- acquisition gate;
- large storage baseline;
- two independent production lines;
- Save V10 persistence;
- late contract hooks.

That is a technical baseline, not the final Plant gameplay.

## Player promise

> **My mastered zones and crews feed an industrial plant while I personally push the frontier and solve high-value bottlenecks.**

## What Plant gameplay should look like

The Plant is primarily a **macro production planning screen plus a large visual industrial base**, not a conveyor-placement game.

The player should manage:
- 2–4 large production lines/cells at current scope;
- input and output buffers;
- one production plan per line;
- worker/crew assignment at line level;
- inbound route priorities;
- outbound large contracts;
- line upgrades/capacity;
- visible bottlenecks.

The player should not manually connect dozens of belts.

### Example Plant decision loop

1. A large contract or upgrade needs a high-tier output.
2. The player assigns Plant lines to the required intermediate/output plan.
3. The Logistics view shows which old zones/materials must feed it.
4. Workers/fleet provide bulk supply while offline.
5. A rare/signature input becomes the limiting factor.
6. The player actively goes to the frontier to hunt that component or chooses another production plan.
7. On return, production continues and the large order completes.

This preserves active play as the decisive accelerator and frontier unlock mechanism.

## Technical/gameplay increment

- real Plant Overview scene;
- configurable production plans;
- line-level worker roles;
- large storage/warehouse buffers;
- logistics priority rules;
- plant-scale contracts;
- Foreman/crew grouping to reduce late-game worker micro;
- strong offline report with line/route bottlenecks;
- late base upgrades that visibly change Plant capacity.

## In-game business increment

The player moves from a salvage company into an industrial recycling/manufacturing operation.

Old content now has a systemic purpose because mastered zones feed industrial demand.

## Talent increment

Final current-scope talent tier should include capstones that change strategy rather than only speed:
- active rare-hunting specialization;
- fleet specialization;
- production-line specialization;
- automation/foreman specialization;
- contract/market specialization.

## Product/business value

Plant V2 becomes the long-tail retention layer and the first point where monetization can be designed around a proven economy rather than guessed in advance.

## Exit gate

The Plant is complete only when:
- buying it visibly changes the game;
- line choices matter;
- worker/fleet inputs matter;
- an offline return can produce both gains and understandable bottlenecks;
- active field play still provides a strong reason to leave the Plant screen.

---

# P7 — Production Polish, Content Expansion, Platform & Monetization

This is deliberately after the product spine above.

## Production polish

- final art pass for targets, bases, vehicles and workers;
- animation/VFX/audio pass;
- strong visual identity for every zone and business stage;
- responsive/mobile browser UX finalization;
- onboarding/tutorial cleanup;
- accessibility/readability pass;
- performance profiling on target devices.

Visual work is **not entirely deferred until P7**. Every roadmap phase has a minimum visual acceptance gate. P7 is the final consistency/quality pass.

## Content expansion

Only after the current business ladder works experientially:
- additional frontier zones;
- new signature targets;
- optional special events;
- prestige/endgame systems if retention data shows a need.

Do not add generic resource families only to make numbers larger.

## Platform and monetization

After retention/return-loop testing:
- real Yandex account/cloud verification;
- analytics events/funnels;
- external cohort testing;
- rewarded ads where they preserve player agency;
- ordinary ads only if session design supports them;
- optional IAP only around clear convenience/value propositions;
- publication/moderation readiness.

Monetization must not be used to solve weak progression design.

---

# 5. Talent / Level / Mathematical Progression V3

This is a cross-cutting system implemented incrementally through P1–P6, but modeled first in P0.

## Permanent branch identities

Keep five permanent branches instead of creating a new tree for every building:

### Salvage
Primary scope:
- character dismantling;
- target handling;
- combo/active tempo;
- multi-target mechanics;
- targeted rare recovery.

### Logistics
Primary scope:
- cart and pickup;
- active expedition capacity;
- Van/Truck/Recovery Rig value;
- route transport;
- storage transfer/turnaround.

### Workshop
Primary scope:
- machines;
- queue;
- processing/fabrication;
- yield/speed;
- industrial production cells.

### Automation
Primary scope:
- workers;
- offline efficiency;
- roles;
- training;
- crew/Foreman behavior;
- automated production continuity.

### Trade
Primary scope:
- sale economics;
- contract choice;
- supplier/buyer advantages;
- large-order economics;
- late market specialization.

## Tier alignment

Talent tiers should align to business eras instead of existing as arbitrary level bands.

Recommended logical eras:
- **Tier I — Garage / personal operator**;
- **Tier II — Van + first workforce**;
- **Tier III — Hangar + fleet/crew**;
- **Tier IV — Yard / Industrial Workshop**;
- **Tier V or capstone layer — Plant specialization**, only if the model proves the extra tier improves choice rather than bloat.

Each node may require:
- minimum level;
- prior node;
- business milestone;
- sometimes a system discovery.

## Point-economy constraints

Do not choose the final point total by intuition.

Model these invariants:
- the player must always have reachable useful choices when receiving a point;
- no intended node can remain unreachable because level supply ends too early;
- the player should not max the full tree during the current normal progression;
- a focused build should be able to reach branch capstones;
- a broad build should remain viable but shallower;
- by the end of the current Plant progression, target roughly **55–65% of total tree point cost** as purchasable before optional endgame/prestige systems; exact value must be simulated;
- capstone/behavior-changing nodes may cost 2–3 points;
- ordinary stat nodes should normally produce a noticeable effect, typically at least ~5–10% in their measured domain unless they unlock/modify a behavior;
- avoid more than two consecutive pure-stat nodes without a mechanic-changing node;
- milestone gates must prevent XP grinding from bypassing business progression.

## Level curve constraints

Current level 30 is no longer assumed to be final.

Model the level ceiling against the complete current-scope tree and expected time-to-Plant.

Possible result may be level 40, 50, 60 or another value; do not lock the number before simulation.

The curve must ensure:
- early levels arrive quickly enough to teach the tree;
- mid-game points remain meaningful during workforce/Hangar growth;
- late game still produces occasional character/business growth;
- offline production must not award frontier mastery by proxy;
- active play remains the primary XP/mastery source unless a later deliberate system says otherwise.

## Talent acceptance tests

For every new/changed talent:
- deterministic effect test;
- save migration compatibility;
- UI gate/reason test;
- model impact measured against milestone timing;
- owner review: the effect should be perceivable without reading source code.

---

# 6. Base UX architecture

The base should evolve in visual scale while preserving a consistent navigation grammar.

## Early Garage

Few tabs, few machines, personal workshop feel.

## Workforce Garage

Crew/Logistics surfaces appear when the first worker/Van exists.

## Hangar

Full management shell becomes the main home hub.

## Yard / Industrial

Additional Overview regions and production/fleet capacity appear; avoid adding a new unrelated UI paradigm for every building.

## Plant

Overview becomes higher-level and crew/cell based so the player does not manage twenty individual cards.

### Core UX rule

Increasing business scale must **reduce micro per unit**, not multiply it.

If the player owns 10 workers, the UI should become more aggregated than when they owned 2.

---

# 7. Visual progression rule

Visual progression is now a functional requirement, not a final-art luxury.

Every major acquisition must have a minimum visible payoff in the same package:
- Van appears as a real owned asset;
- workers appear in the base/crew representation;
- Hangar changes the base;
- Truck/Recovery Rig occupy distinct bays/yard space;
- Salvage Yard changes scale/storage/staging;
- Industrial Workshop adds production cells/heavy equipment;
- Plant becomes a separate industrial-scale scene.

Final art quality can improve later, but **stage identity cannot be deferred**.

---

# 8. Implementation order and delivery process

Each phase should follow the same delivery sequence:

1. owner/product specification with clear player promise and out-of-scope list;
2. deterministic economy/progression model for any material balance change;
3. UX wireframe/state model for any new management surface;
4. domain/runtime implementation in a dedicated branch;
5. save migration if required;
6. focused automated acceptance;
7. full regression CI;
8. uniquely named owner manual-review artifact;
9. owner verdict;
10. fix pass before the next roadmap phase.

Do not merge a major progression phase only because CI is green. Major base/fleet stages require a human verdict because their primary success condition is comprehension and perceived business growth.

---

# 9. Immediate next package

The next package from current main should be:

## **P0/P1 Foundation — Business Stage + Base UX Architecture + Economy/Talent Model V3**

It should NOT yet attempt the full Hangar redesign.

Deliverables:
- `BUSINESS_STAGE_V1` derived model;
- `ECONOMY_PROGRESSION_MODEL_V3` with fresh-start -> Plant timing and talent-point outputs;
- `BASE_UX_ARCHITECTURE_V1` wireframes/spec for Garage -> Hangar -> Yard -> Workshop -> Plant;
- integration refactor plan for splitting current `main.ts` responsibilities;
- concrete Tier I–late talent matrix draft with milestone gates and modeled point budget;
- implementation slice that introduces the base-shell navigation without deleting current functionality;
- owner review artifact proving the new Garage navigation/Overview before Workforce/Hangar depth continues.

After that, proceed to **P2 Workforce & Van V3**, then **P3 Hangar Transformation V1**.

This order intentionally turns the current broad mechanical prototype into the intended game instead of adding more breadth.