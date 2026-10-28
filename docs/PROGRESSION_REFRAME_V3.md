# Progression Reframe V3 — Business Ascension + Active Salvage Loop

Status: **DESIGN SOURCE OF TRUTH / NO GAMEPLAY IMPLEMENTATION YET**

This document captures the owner review direction after Visual Rebuild V2 and UI Maturity V2.

The goal is not to add more systems. The goal is to make the existing game understandable as a coherent incremental journey:

> **active salvage -> stronger personal equipment -> working Garage -> business ascension -> stronger restart -> larger business -> industrial production**

The main product change is that `Garage -> Hangar -> Salvage Yard -> Industrial Workshop -> Processing Plant` becomes a sequence of explicit business eras, not one continuous pile of unlock flags.

---

## 1. Core player fantasy

The player should repeatedly experience this loop:

1. enter the current business era with a stronger baseline than before;
2. actively dismantle salvage and fill the current haul vehicle;
3. explicitly return and unload the haul into base storage;
4. process raw resources through machines;
5. improve personal dismantling power, carrying capacity and business throughput;
6. unlock and master the era frontier;
7. automate already-solved work where the current era allows it;
8. reach the era capstone;
9. perform a visible **business ascension** into a larger operating tier;
10. replay earlier field content much faster, while a new frontier again provides resistance.

This is incremental progression with a diegetic business promotion rather than an abstract prestige button.

---

## 2. Business eras

The major eras are:

1. **Garage** — one scavenger, cart, small machines, personal progression;
2. **Hangar** — Van, first meaningful crew/fleet management, larger production baseline;
3. **Salvage Yard** — several routes, heavier vehicles, bulk salvage network;
4. **Industrial Workshop** — configurable production cells/lines and specialized industrial staffing;
5. **Processing Plant** — macro production planning, high-volume supply chains and large contracts.

Existing internal stages such as `starter_garage`, `equipped_garage` and `workforce_garage` remain useful as sub-stages inside the Garage era. They are not separate global ascensions.

### Design rule

A business ascension must be unmistakable. It must change several of:
- active haul baseline;
- base scene;
- worker/fleet baseline;
- production topology;
- storage scale;
- available frontier;
- visible talent depth;
- contract scale.

---

## 3. Recommended reset model

Do **not** implement a classic prestige that deletes everything and asks the player to repeat the same purchases.

The preferred model is **compression into a stronger baseline**.

### Persistent across ascension

Keep:
- business era / owned major site;
- discovered recipes and machine knowledge;
- purchased permanent talent nodes;
- discovered component knowledge;
- important fleet/crew assets awarded by the era transition;
- lifetime statistics and achievements;
- permanent company-scale bonuses granted by the ascension.

### Reset / restart within the new era

Reset or rebase:
- current era XP/level pacing;
- zone mastery for the new cycle;
- active frontier progression;
- temporary/raw expedition cargo;
- most short-term stage economy pressure;
- machine **tier level**, by converting completed old-tier machines into stronger new-tier baseline machines instead of deleting them.

Example:

`Garage Press VI -> Hangar Press Line I`

The displayed level restarts, but the new Line I is materially stronger than Garage Press I.

### Why talents should initially remain permanent

For the first implementation, purchased talents should **not** reset. Re-buying the same talent tree each era would create repetition rather than meaningful incremental growth.

Instead, each business era exposes a deeper ring of the same talent tree. The player enters the next era with all earlier expertise intact and immediately feels stronger.

This can be revisited later only if a second permanent meta-progression currency is intentionally designed.

---

## 4. Zone / map progression

The existing Z1-Z8 structure should be retained, but its role changes.

Recommended first mapping:

- **Garage frontier:** Z1-Z3
- **Hangar frontier:** Z4-Z5
- **Salvage Yard frontier:** Z6
- **Industrial Workshop frontier:** Z7
- **Processing Plant frontier:** Z8

This matches the current product logic well: Z4 already conceptually expects Van-scale logistics, therefore Garage should naturally climax before it.

### What happens after business ascension

Earlier zones remain accessible and their cycle mastery can restart, but the new baseline makes them dramatically easier.

Desired power feeling:
- current frontier at first contact: meaningful resistance;
- current frontier near era cap: clearly fast and satisfying;
- one era behind: very fast dismantling;
- two or more eras behind: near-instant cleanup of ordinary objects.

The player should visibly feel:

> “This used to be difficult; now I destroy it almost without stopping.”

Old mastered zones are also the natural candidates for worker automation.

### Avoid replaying all eight as equal grind

The game should not require full-length mastery grinds of all eight maps after every ascension.

Old-zone replay exists primarily for:
- power fantasy;
- targeted materials;
- quick re-mastery;
- route setup.

The newest frontier remains the long-form active progression target.

---

## 5. Field loop V3 — real salvage piles

The field should become a continuous salvage ecosystem rather than a finite collection of similarly-shaped targets.

### Primary object: salvage pile / wreck cluster

A pile is a real gameplay object, not decoration.

Breaking it produces several actual child salvage objects, for example:
- sheet metal;
- cable bundle;
- appliance body;
- motor housing;
- wheel/frame;
- electrical module;
- rare industrial part where appropriate.

The child objects are then individually dismantled.

### Reward safety

The parent pile owns one fixed reward budget.

When it breaks, the reward budget is partitioned into the child objects. The parent must not pay a second full reward.

This prevents the “matryoshka = duplicated economy” problem.

### Continuous respawn

While the player dismantles child objects, new piles should appear elsewhere in the active area.

The field should target a stable density rather than becoming empty.

The intended rhythm is:

`find pile -> crack pile -> rapidly clear children -> magnet/pickup -> move to next pile`

The player does not need to leave the map merely because every original target was destroyed.

### Zone identity

Different zones must have materially different pile families and silhouettes, not only recolors/stat multipliers.

Examples:
- Z1: household scrap / cable / small frames;
- Z2: garage clutter / pumps / motors;
- Z3: large appliances;
- Z4: automotive shells and drivetrain scrap;
- later zones: increasingly industrial wreckage.

---

## 6. Explicit expedition unload

Returning to base must have a clear gameplay action.

Current hidden/automatic transfer is too easy to miss.

### Early game

At the base, cargo remains visibly inside the current haul container until the player presses:

- `Разгрузить тележку`
- later `Разгрузить фургон`
- equivalent wording for larger active haul assets if introduced.

The action should:
- visibly transfer resources into storage;
- count values upward or animate the transfer briefly;
- show storage capacity pressure;
- leave overflow in the vehicle if storage is full.

This gives a reason to return to base and makes the field/base loop legible.

### Later automation

Manual unloading can later become partially or fully automated through Logistics/Automation progression.

That creates meaningful evolution:

`manual unload -> assisted unload -> automatic logistics`

instead of starting with an invisible automatic rule.

---

## 7. Power curve and progression tempo

The owner feedback is that current power growth is not visually strong enough.

The intended field curve should be much more obvious.

### Target feel

For an ordinary target on the current frontier:
- early in the era: roughly several seconds of resistance;
- near era cap: roughly 1–2 seconds for ordinary targets;
- prior-zone ordinary targets: sub-second / rapid chain clear.

Large piles may remain longer because they convert into several child targets.

### XP / talents

Progression should provide more frequent visible decisions.

Recommended approach:
- preserve the current five branch identities;
- first change layout/reveal logic before dramatically increasing node count;
- after pacing model is measured, expand branches from the current 8 nodes only if the player regularly goes too long without a choice.

More points can be earned more frequently, but each point should still create a perceivable gameplay effect.

Avoid filling a longer tree with meaningless +1–3% nodes.

---

## 8. Talent tree V3 — radial tree + fog of knowledge

The current five branches remain:
- Разбор;
- Логистика;
- Мастерская;
- Автоматизация;
- Торговля.

### Layout

Use a central entity representing the player/current business identity.

Five branches radiate outward from the center instead of appearing as five unrelated vertical columns.

### Information reveal

For each branch:
- purchased nodes are fully visible;
- the **next node** is fully visible and can show requirements;
- all deeper nodes appear as `?` / unknown nodes;
- purchasing the current frontier node reveals the next node in that branch.

Example:

Before purchasing `Заточенный инструмент`:

`[Заточенный инструмент] -> [?] -> [?] -> [?]`

After purchase:

`[✓ Заточенный инструмент] -> [Слабые места] -> [?] -> [?]`

The player makes decisions based on currently known options rather than planning the entire solved build from minute one.

### Era depth

Later rings can additionally require a business-era gate.

Therefore a player may reach the end of currently known branch depth and see that further specialization belongs to the next business era.

---

## 9. Overview screen must actually be an overview

`Обзор` should not be another unique management system.

It should summarize the important state from nearly every unlocked detailed tab.

Recommended blocks:

### Business / next ascension
- current era and site;
- short description of current business identity;
- current era completion/progress;
- next ascension and missing requirements.

### Expedition
- current zone;
- current haul vehicle;
- cargo `current / capacity`;
- whether cargo needs unloading;
- recommended next frontier.

### Production
- number of active/idle/blocked machines or lines;
- current most important bottleneck;
- nearest completion;
- link to detailed Production screen.

### Storage
- total fullness;
- important low inputs;
- important overflowing resources;
- link to Storage.

### Contracts
- ready-to-submit contracts;
- highest-value currently relevant order;
- material currently blocking that order.

### Crew / logistics
- active routes;
- idle workers;
- idle vehicles;
- route with the largest bottleneck.

### Development
- unspent points;
- number of currently revealed next talent choices;
- short “next useful unlock” hint, without revealing hidden future nodes.

### One explicit “what should I do now?” card

Every era should expose one readable guidance chain:

`Current problem -> suggested action -> why it helps -> next milestone`

Example:

- Problem: repeated manual farming of Z1;
- Action: assign a worker + Van;
- Why: Z1 starts supplying bulk material passively;
- Next milestone: Hangar.

This is a lightweight contextual guide, not a long tutorial.

---

## 10. Machines versus Production Lines

This distinction must be explicit.

### Machine

A machine performs **one transformation step**.

Examples:
- metal -> briquette/profile;
- cable/copper -> clean copper;
- plastic -> granulate;
- component inputs -> one intermediate module.

Machines remain useful for:
- small batches;
- topping up intermediate stock;
- choosing exactly which resource to produce;
- keeping reserves of components needed elsewhere.

### Production Line

A production line is **a managed chain of several machine steps** that targets one final output at scale.

Example conceptual line:

`raw metal -> structural profile -> subassembly -> final module`

The player chooses:
- target final product;
- batch quantity or continuous target;
- input priority;
- minimum reserve floors for intermediate resources;
- assigned staff;
- optional heavy vehicle/support;
- line priority.

The line then coordinates the required steps automatically.

### Reserve rule is mandatory

The player must be able to say, for example:

> Produce Heavy Frames, but never consume my last 50 Bearings or 20 Control Modules.

Without reserve floors, macro production will constantly destroy ingredients needed for other upgrades/contracts and will feel uncontrollable.

### Why both systems matter

If the player needs bearings now, they run the relevant individual machine/recipe.

If the player needs 100 final industrial modules, they start a production line and allow it to coordinate several steps automatically.

Thus:

`Machine = one operation.`

`Production Line = orchestration of several operations toward a final target.`

---

## 11. Worker roles must be self-explanatory

Current runtime already gives role-specific bonuses, but that information is too hidden.

The UI should never make the player guess whether a worker is useful.

### Scavenger
Primary use: field routes.

Effect:
- active/passive salvage throughput;
- rank increases route output.

Should normally not be selectable for industrial production until retrained.

### Logistician
Primary use: movement of material.

Effect candidates:
- route throughput;
- vehicle effective capacity / loading;
- input-buffer feeding;
- output clearing;
- reduced logistics bottlenecks.

### Technician
Primary use: machines and industrial equipment.

Effect candidates:
- faster machine stages;
- reduced downtime;
- better yield or reduced material loss on appropriate lines.

### Operator
Primary use: coordination of a production line/cell.

Effect candidates:
- overall cycle speed;
- parallelism / automation behavior;
- line switching/setup time;
- later line-level control bonuses.

### Assignment UI rule

Every worker assignment must show the result **before confirmation**.

Example:

`Марина — Техник ур. 3`

`Heavy Assembly: -16% cycle time`

or

`Refining: no specialist bonus`

Prefer filtering out completely meaningless role/slot combinations rather than offering every worker everywhere.

### Rank clarity

Rank 1–5 must show a measurable delta.

Example:

`Technician Rank 2: -9%`

`Technician Rank 3: -12%`

The player should understand why training a specific worker matters.

---

## 12. Recommended era transition example

### Garage era

Player:
- uses cart;
- actively progresses through Z1-Z3;
- builds/levels Garage machines;
- upgrades personal tool/cart;
- purchases currently revealed talent nodes;
- completes Garage-scale contracts.

### Garage capstone

When the era requirements are complete, the Overview shows a major action:

`ПЕРЕЙТИ В АНГАР`

It explicitly previews:

**You keep:**
- talents;
- discovered recipes;
- permanent equipment baseline;
- business knowledge.

**You gain:**
- Hangar;
- first employee baseline;
- Van baseline;
- larger storage/production class;
- access to Z4-Z5 frontier.

**You restart/rebase:**
- current cycle level;
- zone mastery cycle;
- short-term field progression;
- Garage machine levels become Hangar-tier baseline levels.

### First Hangar session

Z1-Z3 are immediately much faster than before.

The player can personally use the Van or assign it to the first worker.

That creates an explicit strategic choice:

`Van for me = longer/faster active expedition.`

`Van for worker = stronger passive supply.`

The new serious resistance starts at the Hangar frontier.

The same pattern repeats at Yard, Workshop and Plant scale.

---

## 13. What should NOT be done

Do not:
- reset everything to zero without compensation;
- make the player rebuild identical machines under identical names every era;
- replay all eight zones as equal full-length grinds each era;
- expose the entire solved talent tree from the beginning;
- hide cargo transfer inside an automatic base transition;
- implement salvage piles as decorative objects that cannot be dismantled;
- duplicate rewards when a pile breaks into children;
- make every worker role selectable everywhere with no meaningful effect;
- call a single recipe card a “production line”;
- turn production into belt/power/factory-layout micromanagement.

---

## 14. Implementation order after design acceptance

The first implementation should be deliberately incremental and preserve Save V10 compatibility where possible.

Recommended order:

1. **Overview V2** — summaries + current problem / next action / next ascension.
2. **Talent Tree presentation V3** — radial layout + reveal frontier; initially preserve current talent effects/economy.
3. **Explicit unload** — cart/Van cargo remains visible until player unloads.
4. **Field salvage piles V3** — real breakable parent -> child targets + continuous respawn + reward-budget safety.
5. **Power-curve retune** — make old zones collapse quickly and current frontier visibly accelerate with upgrades.
6. **Business Ascension V1** — Garage -> Hangar first, with explicit carry/reset preview and stronger restart.
7. **Production clarity V2** — machine vs line semantics, reserves, visible chains and staffing previews.
8. Extend the same ascension model to Yard -> Industrial Workshop -> Processing Plant.

Do **not** implement all five eras at once. Garage -> Hangar should be the proof slice.

---

## 15. Acceptance criteria for the first proof slice

A fresh player should be able to explain without external documentation:

- why they dismantle salvage;
- why they return to base;
- when resources actually enter storage;
- what each Garage machine consumes and produces;
- why personal tool/cart upgrades matter;
- which talent choices are currently known and which are still hidden;
- what is required to finish the Garage era;
- what will be kept, gained and rebased when moving to Hangar;
- why Z1-Z3 become much easier after the ascension;
- why the Van can be valuable either to the player or to a worker;
- what the next frontier is.

At Industrial stages, the player must additionally be able to explain:

- the difference between a machine and a production line;
- the full input -> intermediate -> output chain of the selected line;
- which material is currently the bottleneck;
- what reserves the line is forbidden to consume;
- why a particular worker role helps that line;
- exactly how worker rank changes the result.

Green CI alone is not acceptance. The progression must be understandable by playing.