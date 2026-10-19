# Human Review — Playable Salvage V0

Status: **TWO OWNER REVIEWS COMPLETED / REQUESTED EARLY-GAME COMPLETION IMPLEMENTED**

## Review #1 — first 3–4 cart runs

### Accepted
- basic gameplay loop is understandable: dismantle -> collect -> haul home;
- active mechanic is accepted as the foundation.

### Problems found
- visual feedback was too prototype-like;
- garage purpose/readability was weak;
- locked machines looked like decoration;
- machine UI did not clearly explain recipe / missing pieces / sources.

### Iteration after review #1
- denser field dressing and clearer target silhouettes;
- stronger impact/drop presentation;
- clickable machines;
- first press goal card;
- machine inspector with recipe, owned/missing quantities, source hints and ready-made price.

## Review #2 — progression completion request

### Active loop / visuals
Owner accepted the mechanic for now and explicitly deferred further visual work. Production visuals will later return to the separately approved concept baseline.

### Garage/home rule
Owner requirement:

> The garage is the player's base/home. The player must be able to return whenever they want.

Hard rule now implemented:
- no minimum cart fill;
- Home/Garage action always available;
- returning unloads collected cargo;
- returning does not force a fresh salvage field;
- player resumes the same field route.

### Machine progression clarity
Owner reported that a station did not clearly state what is required for its progression.

Runtime now shows before an upgrade is available:
1. machine unlock conditions;
2. build recipe;
3. current machine level;
4. next-level gates;
5. exact resources/components/cash for the next level;
6. sources of missing items;
7. queued status / remaining time once work starts.

### Progression scope
Owner explicitly requested that the next package already contain development branches, XP and related progression rather than another narrow prototype.

Implemented before the next package:
- XP / levels / mastery;
- five branches / 35 visible nodes;
- prerequisites and real early talent effects;
- Combo deeper in Salvage;
- persistence;
- coherent garage economy;
- physical tool progression separate from talents;
- physical cart progression separate from talents;
- timed machine/equipment fabrication;
- timed processing;
- offline completion of workshop jobs;
- first rotating contract loop.

## Completion pass after review #2

See:
- `docs/PROGRESSION_RUNTIME_V0.md`;
- `docs/EARLY_GAME_SYSTEMS_V0.md`;
- `docs/PLAYABLE_SLICE_V0.md`.

### Equipment
Tool and cart now have their own levels, requirements, effects and fabrication timers. Talents improve play style on top of physical gear rather than substituting for it.

### Workshop
Machine builds, machine upgrades, equipment fabrication and processing batches now share a persisted workshop queue. Base queue has one slot; progression can unlock a second. Work continues while the player scavenges or is offline.

### First contract layer
The garage exposes an actual order with requested stock, cash reward and XP reward. After completion the next order rotates in. This gives resources an immediate keep-vs-sell-vs-build decision.

### Offline
Offline return resolves completed workshop jobs and reports them separately from passive salvage income.

## Internal automated verification

The integrated test suite now checks not just definitions but browser interactions:
- entering home with an empty cart;
- talent tree visibility and Combo gates;
- talent persistence after reload;
- machine build/upgrade requirement visibility;
- physical tool fabrication through the queue;
- first press fabrication through the queue;
- timed press processing;
- contract completion with stock consumption + cash/XP;
- offline workshop completion;
- two-slot workshop progression.

Separate deterministic tests cover equipment scaling, job timing, contract scaling and whole-item component requirements.

## Visual policy
Current browser art remains scaffolding. Do not use another systems iteration to polish it. Production visuals return to the approved concept only after the early-game systems feel is accepted.

## Next owner package gate
The next package is allowed after the **latest documentation/runtime head** passes the full CI/browser/package run.

The owner test should then focus on one continuous early-game session:

`свалка -> уровень -> ветка -> физический апгрейд -> гараж -> контракт/продажа -> постройка пресса -> таймер/offline -> переработка -> следующий виток`.

Expected feedback is primarily about pacing, clarity and whether each next goal is motivating. Visual verdict comes later.
