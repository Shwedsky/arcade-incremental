# Progression Reframe V3 — Business Ascension + Active Salvage Loop

Status: **DESIGN SOURCE OF TRUTH / NO GAMEPLAY IMPLEMENTATION YET**

This document captures the owner review direction after Visual Rebuild V2 and UI Maturity V2.

The goal is not to add random systems. The goal is to turn the mechanics already present into a coherent incremental journey:

> **active salvage -> stronger personal equipment -> working Garage -> business ascension -> stronger restart -> larger business -> industrial production**

The major product change is that `Garage -> Hangar -> Salvage Yard -> Industrial Workshop -> Processing Plant` becomes a sequence of explicit business eras rather than one continuous pile of unlock flags.

---

## 1. Core player fantasy

The player repeatedly experiences this loop:

1. enter the current business era with a stronger baseline than before;
2. actively dismantle salvage and fill the current haul vehicle;
3. explicitly return and unload the haul into base storage;
4. process raw resources through machines;
5. improve personal dismantling power, carrying capacity and business throughput;
6. unlock and master the current era frontier;
7. automate already-solved work where the era allows it;
8. reach the era capstone;
9. perform a visible **business ascension** into a larger operating tier;
10. replay earlier field content much faster while a new frontier again provides meaningful resistance.

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

A business ascension must be unmistakable and change several of:
- active haul baseline;
- base scene;
- worker/fleet baseline;
- production topology;
- storage scale;
- available frontier;
- visible talent depth;
- contract scale.

---

## 3. Ascension / reset model

Do **not** implement a classic prestige that deletes everything and asks the player to repeat identical purchases.

Use **compression into a stronger baseline**.

### Persistent across ascension

Keep:
- business era / owned major site;
- discovered recipes and machine knowledge;
- purchased talent nodes and their permanent ranks;
- discovered component knowledge;
- important fleet/crew assets awarded by the transition;
- lifetime statistics / achievements;
- permanent company-scale bonuses granted by the ascension.

### Reset / rebase inside the new era

Reset or rebase:
- current era XP/level pacing;
- cycle mastery for zones;
- active frontier progression;
- temporary/raw expedition cargo;
- most short-term economy pressure;
- machine **tier level**, by converting completed old-tier machines into stronger new-tier baseline machines instead of deleting them.

Example:

`Garage Press VI -> Hangar Press Line I`

The displayed level restarts, but Hangar Press Line I is materially stronger than Garage Press I.

### Ascension is also a talent-tree expansion moment

The talent tree should visibly become larger after an ascension.

Example player perception:

- Garage era: the player believes the branch currently contains roughly the visible first depth;
- Hangar ascension: a second depth appears and the tree is suddenly materially deeper;
- Yard / Workshop / Plant: later depths continue to reveal.

The player should not see all future branch depth from the first session.

---

## 4. Zone / map progression

Retain Z1-Z8, but change how they are revealed and how they function between eras.

Recommended first mapping:

- **Garage frontier:** Z1-Z3
- **Hangar frontier:** Z4-Z5
- **Salvage Yard frontier:** Z6
- **Industrial Workshop frontier:** Z7
- **Processing Plant frontier:** Z8

This fits the current mechanical logic: Z4 already conceptually expects Van-scale logistics, so Garage should naturally climax before it.

### Map fog / discovery

The map should not expose all eight zones and all future geography immediately.

During Garage:
- Z1-Z3 can be visible as the current era route;
- the next frontier can appear only as a `?` / unknown destination;
- Z5-Z8 remain completely hidden.

After Hangar ascension:
- Z4-Z5 are revealed;
- one next unknown frontier can be teased;
- deeper future maps remain hidden.

The same rule repeats at later eras.

The player should repeatedly experience: **“I thought I knew the size of the game; the business upgrade revealed more world.”**

### Earlier zones after ascension

Earlier zones remain accessible and their cycle mastery can restart, but the stronger baseline makes them dramatically easier.

Desired power feeling:
- current frontier at first contact: meaningful resistance;
- current frontier near era cap: fast and satisfying;
- one era behind: very fast dismantling;
- two or more eras behind: near-instant cleanup of ordinary objects.

Old zones exist for:
- power fantasy;
- targeted materials;
- quick re-mastery;
- route setup / automation.

Do not require eight equal-length mastery grinds after every ascension.

---

## 5. Field loop V3 — real salvage piles

The field becomes a continuous salvage ecosystem rather than a finite collection of similarly-shaped targets.

### Salvage pile / wreck cluster

A pile is a real gameplay object, not decoration.

Breaking it produces several **real child salvage targets**, e.g.:
- sheet metal;
- cable bundle;
- appliance body;
- motor housing;
- wheel/frame;
- electrical module;
- rare industrial part where appropriate.

The child objects are then individually dismantled.

### Reward safety

The parent pile owns one fixed reward budget. Breaking the parent partitions that budget between the child objects; the parent does not also pay a second full reward.

### Continuous respawn

While the player clears one pile and its children, other piles respawn elsewhere to maintain a stable density.

Target rhythm:

`find pile -> crack pile -> rapidly clear children -> collect -> next pile`

The map should not become empty and force an artificial exit/re-entry simply to repopulate targets.

### Zone identity

Different zones require different pile families and silhouettes, not recolors:
- Z1 household scrap / cable / small frames;
- Z2 garage clutter / pumps / motors;
- Z3 large appliances;
- Z4 automotive shells / drivetrain scrap;
- later zones increasingly industrial wreckage.

---

## 6. Explicit expedition unload

Returning to base must contain a visible cargo action.

Early game:
- `Разгрузить тележку`
- later `Разгрузить фургон`
- equivalent wording for larger active haul assets.

The action must:
- visibly transfer cargo into storage;
- show what was transferred;
- show storage pressure;
- leave overflow in the vehicle when storage is full.

Later progression can evolve this into:

`manual unload -> assisted unload -> automatic logistics`

This makes automation itself feel like progression.

---

## 7. Combat / dismantling readability V3

The field should communicate power like a light RPG while preserving the automatic top-down dismantling loop.

### Target HP

When a target is engaged, show:
- target name;
- `current HP / max HP`;
- HP bar;
- target class / rare state where relevant.

The current “estimated seconds to break” can remain secondary, but must not be the only explanation of durability.

### Player DPS

Expose the player’s effective current dismantling DPS clearly in the HUD / character summary.

DPS should already include:
- base power;
- tool multiplier;
- talent multiplier;
- combo multiplier when active;
- era baseline multiplier where applicable.

This lets a player understand why 500 HP takes a certain amount of time.

### Damage numbers

Do not emit a number every animation frame. Use readable damage pulses / aggregation (for example several combat ticks per second) while preserving approximately the same average DPS.

Show floating damage values for those pulses.

### Critical dismantling

Add a lightweight crit layer because damage numbers make it readable and satisfying.

Initial design target, subject to model tuning:
- modest baseline critical chance;
- meaningful critical damage multiplier;
- visibly differentiated floating number / spark;
- later Salvage talents can increase crit chance, crit damage or weak-point behavior.

This should remain an arcade feedback mechanic, not become a full equipment-stat RPG.

### Power-growth requirement

Numeric DPS growth must also be physically obvious:
- old ordinary targets collapse rapidly;
- current frontier transitions from several seconds early in the era to roughly 1–2 seconds near era cap;
- pile parents can remain more durable because they create additional breakable children.

---

## 8. Talent Tree V3 — directed branches, hidden future, ranks and respec

Keep the five identities:
- Разбор;
- Логистика;
- Мастерская;
- Автоматизация;
- Торговля.

### Layout

Use a central player/business identity followed by five explicit **directed development tracks**. Each branch must read from known/current progress toward its next choice; it must not use a circular/radial/constellation or PoE-like web. On wide screens the five tracks may sit side by side; on narrow screens they may stack, but branch direction and progression order must stay obvious.

### Fog of knowledge

For each branch:
- purchased nodes are fully visible;
- only the **next node** is fully visible with requirements;
- deeper nodes are `?`;
- buying the frontier node reveals the next one;
- later era depths remain completely absent until the corresponding business ascension.

The player makes decisions from the known frontier instead of solving the entire build at minute one.

### Talent ranks / quality upgrades

An already-owned node can become stronger in later eras.

Example concept:

`Заточенный инструмент I` — blue — `+12% dismantling power`

After the appropriate ascension / depth unlock:

`Заточенный инструмент II` — purple — `+24% dismantling power`

Later ranks may use a stronger visual grade (gold etc.) where appropriate.

Important rules:
- upgraded ranks must be clearly stronger, not tiny +1–3% filler;
- a new rank costs another mastery point or an era-specific point cost;
- rank upgrades compete with buying newly revealed nodes, creating a useful “stronger now vs broader later” choice;
- do not make every node require many repetitive ranks. Prefer 2–3 meaningful ranks for selected foundational skills.

### Talent point economy

Do **not** make normal talent points infinitely farmable from repeatable trivial actions. If the player can eventually max everything by grinding, branch choice loses meaning.

Preferred sources:
- level / era progression;
- one-time zone mastery milestones;
- business ascension rewards;
- one-time major / capstone contracts;
- selected achievements.

A very late endgame repeatable source can be evaluated later, but should not undermine build identity during the main progression.

### Respec is required

Because points are intentionally limited, the player must be able to recover from a bad build.

Recommended V1 rule:
- full talent respec available;
- one free respec on every business ascension;
- outside ascension, one full respec roughly every 24 hours;
- no irreversible build traps.

The 24-hour option deliberately allows temporary specialization, e.g. a logistics-heavy day followed by a workshop-heavy day, but must be monitored so it does not become mandatory daily micromanagement.

The Overview / talent screen should show when the next free reset is available.

---

## 9. Overview V2 — actual company overview

`Обзор` is not another unique management system. It summarizes nearly every unlocked detailed tab.

Recommended blocks:

### Business / ascension
- current era/site;
- current era progress;
- next ascension;
- missing capstone requirements.

### Expedition
- current zone;
- current active haul vehicle;
- cargo current/capacity;
- unload-needed state;
- recommended current frontier.

### Production
- active / idle / blocked machines or lines;
- most important bottleneck;
- nearest completion;
- link to Production.

### Storage
- fullness;
- critical low inputs;
- overflowing / abundant resources;
- link to Storage.

### Contracts
- ready-to-submit orders;
- most relevant high-value order;
- missing material blocking it.

### Crew / Logistics
- active routes;
- idle workers;
- idle vehicles;
- route with the largest bottleneck.

### Development
- unspent points;
- revealed next choices;
- respec availability;
- next era depth teaser without revealing hidden nodes.

### One explicit “what should I do now?” card

Every era exposes one readable chain:

`current problem -> suggested action -> why it helps -> next milestone`

This is the future in-game mini-guide. It should be contextual and compact, not a long tutorial.

---

## 10. Machines versus Production Lines

This distinction is mandatory.

### Machine

A machine performs **one transformation step**.

Examples:
- metal -> briquette/profile;
- cable -> clean copper;
- plastic -> granulate;
- component inputs -> one intermediate item.

Machines remain useful for:
- small batches;
- topping up an intermediate stock;
- producing one exact resource;
- keeping reserves for upgrades/contracts.

### Production Line

A line is **orchestration of several production steps toward one final output at scale**.

Example:

`raw metal -> structural profile -> subassembly -> final module`

The player configures:
- final target product;
- batch quantity / continuous target;
- input priority;
- minimum reserve floors;
- assigned staff;
- optional heavy support;
- line priority.

The line coordinates the needed intermediate operations automatically.

### Reserve floors are mandatory

Example:

> Produce Heavy Frames, but never consume the final 50 Bearings or 20 Control Modules.

Without reserves, production will constantly consume ingredients the player intended to keep for another machine, upgrade or contract.

### Production UI must show the chain

A line card should visually answer:

`What goes in? -> which intermediate stages happen? -> what comes out? -> what is blocking it now?`

For example:

`1000 Metal -> 200 Profiles -> 40 Subassemblies -> 10 Final Modules`

The player should be able to understand the economic meaning before pressing Start.

---

## 11. Worker roles must be self-explanatory

The runtime can contain specialization, but the player must never need source-code knowledge to understand it.

### Scavenger
Primary use: field routes.

### Logistician
Primary use: material movement, route throughput, input/output buffers and vehicle utilization.

### Technician
Primary use: machines / industrial equipment / appropriate fabrication steps.

### Operator
Primary use: coordination of a whole production cell/line.

### Assignment preview

Before confirmation, show the exact effect:

`Марина — Техник ур. 3`

`Heavy Assembly: 4:00 -> 3:31 (-12%)`

or:

`Refining: no specialist bonus`

If a role provides no meaningful effect in a slot, prefer disabling/filtering it rather than pretending every role is equally valid everywhere.

### Rank clarity

Ranks 1–5 must show explicit deltas, e.g.:

`Technician Rank 2: -9% cycle time`

`Technician Rank 3: -12% cycle time`

### Confirmed current UI defect to fix

The current production runtime **does apply** role/rank duration factors to actual job `endsAt`, but the display rounds durations over one minute upward to whole minutes. This means a real `4:00 -> 3:36` improvement can still be shown as `4 мин`.

Required fix:
- show exact `m:ss` or `X мин Y сек` for short cycles;
- show base -> adjusted duration before assignment/start;
- after start, ETA must use the adjusted job end time;
- browser acceptance must verify that displayed ETA materially changes when the specialist changes.

---

## 12. Garage -> Hangar proof ascension

### Garage era

Player:
- uses cart;
- actively progresses through Z1-Z3;
- builds / levels Garage machines;
- upgrades personal tool/cart;
- buys revealed talent nodes / ranks;
- completes Garage-scale contracts.

### Garage capstone

Overview eventually exposes one major action:

`ПЕРЕЙТИ В АНГАР`

Preview explicitly lists:

**Keep:**
- purchased talents / ranks;
- recipes / knowledge;
- permanent equipment baseline;
- lifetime discoveries.

**Gain:**
- Hangar;
- first employee baseline;
- Van baseline;
- larger storage/production class;
- access to Z4-Z5;
- newly revealed talent depth.

**Rebase:**
- current cycle level;
- zone mastery cycle;
- short-term field economy;
- Garage machine levels -> Hangar-tier baseline levels.

### First Hangar session

Z1-Z3 immediately feel dramatically easier.

The Van has a real opportunity cost:

`Van for player = better active haul.`

`Van for worker = stronger passive route.`

The new serious resistance starts on the Hangar frontier.

The same pattern later repeats at Yard, Workshop and Plant scale.

---

## 13. What remains from the current implementation

Keep as technical/product foundations unless a proof explicitly disproves them:
- TypeScript/Vite browser stack;
- top-down automatic dismantling control model;
- Z1-Z8 identifiers and broad zone themes;
- five talent branch identities;
- current Garage machine families and basic one-step-processing concept;
- Storage and Contracts as distinct surfaces;
- Workforce/Fleet V3 canonical worker/vehicle state;
- worker ranks 1–5;
- Production Cells V1 as a technical foundation for industrial jobs;
- Save V10 additive migration principles;
- BusinessStage derivation as an internal state concept;
- offline / exactly-once production guarantees;
- no conveyor/power-grid layout simulation.

---

## 14. What changes

Change:
- business stages from mostly continuous unlocks into explicit player-facing eras;
- talent presentation from fully visible columns into five directed fog-of-knowledge development tracks;
- selected foundational talents into meaningful multi-rank skills;
- talent point model to include safe respec and one-time non-level sources;
- map from eight immediately knowable destinations into era-gated discovery;
- field from finite objects into respawning pile -> child salvage ecology;
- target feedback from “seconds to break” into HP + DPS + damage numbers + crit feedback;
- hidden auto-unload into explicit unload interaction;
- power curve so previous-era content becomes obviously easier;
- production terminology so Machine and Line have distinct meanings;
- production staffing so exact worker effect is visible before assignment;
- Overview so it summarizes the whole company and tells the player what currently matters.

---

## 15. What is added

Add:
- explicit business ascension domain/model;
- era-gated talent depths;
- talent node rank/grade states;
- talent respec/cooldown state;
- era-gated map reveal / unknown nodes;
- HP/DPS/crit/damage-number presentation;
- real salvage pile parent/child targets with reward-budget partitioning;
- continuous target-density respawn;
- explicit cargo unload state/action;
- contextual Overview guidance;
- production-chain definition and reserve floors;
- exact staffing preview and exact adjusted ETA.

---

## 16. Minimal implementation roadmap

Do **not** build all five eras at once. The first product proof is `Garage -> Hangar`.

### Phase A — correctness + clarity, no economy redesign

A1. Fix production specialist ETA display:
- exact base duration;
- adjusted duration;
- exact running ETA;
- role/rank preview.

A2. Overview V2:
- summaries from existing tabs;
- current bottleneck;
- current recommended action;
- Garage capstone progress placeholder.

A3. Talent Tree presentation V3:
- five explicit directed branch tracks; no radial / PoE-like web;
- current nodes + one next node only;
- deeper nodes `?`;
- future-era rings hidden;
- preserve current effects initially.

A4. Map fog V1:
- Garage visibly owns Z1-Z3;
- one unknown next node;
- deeper zones hidden;
- no zone-economy rewrite yet.

### Phase B — field readability and satisfying active loop

B1. Target HP/DPS UI:
- HP bar + numeric HP;
- player effective DPS;
- accurate TTK secondary label.

B2. Damage pulse + crit feedback:
- readable aggregated damage numbers;
- baseline crit model;
- no major control rewrite.

B3. Explicit unload:
- cart cargo remains cargo until unload;
- storage receives cargo only via explicit action in early era;
- clean transfer feedback.

B4. Real salvage piles:
- parent -> actual breakable children;
- fixed reward budget;
- continuous respawn;
- distinct Z1-Z3 pile families first.

### Phase C — progression/economy model before ascension

C1. Recompute Garage-era pacing:
- XP/hour;
- talent-point cadence;
- tool/cart growth;
- Z1-Z3 target HP;
- machine requirements;
- expected Garage completion window.

C2. Tune power curve:
- early current frontier several seconds;
- end-of-era current targets ~1–2 sec ordinary clear;
- older zones collapse much faster.

C3. Talent economy V3:
- meaningful selected talent ranks;
- one-time points from milestones/capstone contracts;
- free respec on ascension;
- ~24h respec outside ascension;
- no infinite trivial farming source.

### Phase D — Business Ascension V1 proof

D1. Implement explicit Garage-era capstone requirements.

D2. Implement `Garage -> Hangar` transition preview:
- keep / gain / rebase summary;
- deliberate confirm action;
- Save migration safety.

D3. Convert Garage machine capstones into Hangar baseline machine tier.

D4. Grant/reveal the Hangar baseline:
- Hangar scene;
- Van;
- first worker baseline or immediate first-worker acquisition path;
- Z4-Z5 reveal;
- new talent depth.

D5. Verify Z1-Z3 power fantasy after ascension.

### Phase E — Hangar management proof

E1. Van choice:
- personally use it for active haul;
- or assign it to worker route;
- UI explains opportunity cost.

E2. Worker role clarity:
- relevant roles only;
- explicit bonus preview;
- rank effect preview;
- exact production/route outcome.

E3. Overview now summarizes worker/vehicle/route state.

### Phase F — Production semantics V2

Only after Garage -> Hangar progression feels understandable:

F1. Preserve individual Machines as one-step production.

F2. Introduce Production Line orchestration on an industrial-capable stage.

F3. Add line chain visualization.

F4. Add reserve floors and target quantities.

F5. Tie Operator/Technician/Logistician roles to clearly different line responsibilities.

### Phase G — replicate proven model

Once Garage -> Hangar is accepted:
- Hangar -> Salvage Yard;
- Yard -> Industrial Workshop;
- Workshop -> Processing Plant.

Do not start the old P6 implementation until this progression proof has been accepted, because the meaning of Plant is now downstream of the ascension/line model.

---

## 17. Acceptance criteria for Garage -> Hangar proof

A fresh player must be able to explain without external documentation:
- why they dismantle salvage;
- their current DPS and why a target has its current HP/TTK;
- what a critical hit is;
- why they return to base;
- exactly when cargo enters storage;
- what each Garage machine consumes/produces;
- why tool/cart upgrades matter;
- which talent choices are known, which are hidden and why;
- how talent ranks differ from new talent nodes;
- how to respec a bad build;
- which maps belong to the current era;
- what is required to finish Garage;
- what is kept, gained and rebased during ascension;
- why Z1-Z3 are much easier after Hangar;
- why the Van can be used by the player or by a worker;
- what Z4-Z5 represent as the new frontier.

At industrial stages, the player must additionally explain:
- Machine vs Production Line;
- full input -> intermediate -> output chain;
- current bottleneck;
- protected reserve floors;
- why a particular worker role helps;
- exactly how worker rank changes ETA/throughput.

Green CI alone is not acceptance. The progression must be understandable by playing.

---

## 18. Guardrails

Do not:
- reset everything to zero without compensation;
- rebuild identical machines under identical names every era;
- expose all eight zones from session one;
- require all eight zones as equal full-length regrinds every era;
- expose the entire talent tree from the beginning;
- make talent points infinitely farmable during the main progression;
- make daily respec mandatory for optimal play;
- hide cargo transfer inside an automatic base transition;
- leave salvage piles decorative/non-breakable;
- duplicate rewards in parent/child pile destruction;
- show damage every rendering frame;
- make every worker role valid everywhere;
- show a production bonus that does not change the actual displayed ETA;
- call one recipe a production line;
- turn the game into conveyor/power/factory-layout micromanagement.