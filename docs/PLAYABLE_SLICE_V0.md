# Playable Salvage Slice V0

Status: **EARLY-GAME SYSTEMS COMPLETE / FINAL INTERNAL CI BEFORE OWNER PACKAGE**

This branch started as a narrow active-scavenging proof and has now become the coherent early-game systems slice requested by owner review. Production visuals remain intentionally deferred.

## Accepted foundation
- dense top-down salvage field;
- simple player with hand cart;
- automatic dismantle in range;
- six early target classes;
- resource burst + magnetic pickup;
- early components;
- garage/base loop;
- current visuals are functional scaffolding only.

## Hard owner rules

### Garage is home
The garage can be entered at **any time**. There is no minimum cart fill. `G` is a shortcut.

Returning home unloads current cargo and preserves the current salvage route unless the field is almost exhausted.

### The next test is a game loop, not another narrow proof
The owner-facing build must already contain XP, levels, mastery, development branches, physical upgrades, machine progression, persistence, timed work, economy and a reason to keep/select resources.

## Current runtime systems

### XP / mastery
XP comes from dismantled target class plus component-drop bonuses. The committed progression proof uses the approved ~9 breaks/minute calibration and yields about 962 XP per active hour:
- first mastery point: ~7.5 active minutes;
- second: ~26 minutes;
- third / earliest focused Combo: ~112 minutes (~1.87 h).

### Talent tree
35 visible nodes across:
- Salvage;
- Logistics;
- Workshop;
- Automation;
- Trade.

Early nodes are functional. Nodes that depend on later unimplemented systems remain visible but cannot waste mastery points.

Combo is Salvage tier 3 and requires Salvage 1+2 plus player level 4.

### Physical equipment
Tool and cart progression are separate from talents.

Tool levels currently progress from old crowbar -> reinforced pry bar -> battery cutter -> hydraulic shears and materially change dismantle power.

Cart levels currently progress 40 -> 55 -> 75 -> 100 kg base capacity. Logistics talents add bonuses on top.

Both equipment families use player-level gates, explicit recipes and timed fabrication.

See `docs/EARLY_GAME_SYSTEMS_V0.md`.

### Garage / machines
Machine tiles and inspector show:
- unlock conditions;
- exact build recipe;
- owned/missing values;
- source hints;
- installed level;
- next upgrade gates;
- exact next upgrade recipe;
- current queued state / remaining time.

The first press remains the first major machine milestone.

### Timed workshop queue
Workshop work is no longer instant.

The queue handles:
- machine fabrication;
- machine upgrades;
- tool/cart fabrication;
- processing batches.

Base workshop has one slot. Workshop talent `Parallel work` opens slot 2. `Calibration` speeds work.

Jobs use persisted timestamps, so they continue while scavenging and while the game is closed. Resources are committed when work starts; the result appears only at completion.

Base first press fabrication time is 12 minutes. Ready-made purchase remains the fast/expensive shortcut.

### Timed processing
Installed machines process through the same queue:
- press -> briquettes;
- wire stripper -> clean copper;
- plastic shredder -> granulate.

`Automation -> Auto-feed` can continue batches while stock remains, including across offline time.

### Contracts / economy
The garage now has a rotating first contract loop. Contracts consume requested stock and give both cash and XP.

This creates an early decision between:
- selling raw stock now;
- reserving materials/components for machine/equipment recipes;
- reserving them for a contract;
- processing them for better value.

Discrete component requirements remain whole items even when contract difficulty scales.

Raw/processed selling, ready-made machine pricing, Workshop modifiers and Trade modifiers remain integrated.

### Persistence / offline
Local save V3 persists progression, economy, equipment levels, machine levels, contract progress and active workshop jobs.

Old V2 saves migrate forward.

On return, the game first resolves workshop jobs that finished while away and then applies the approved passive salvage baseline (20% / 2h before talents). The offline report shows both categories.

## Automated acceptance

Pure/system tests cover:
- deterministic salvage/drop behavior;
- machine recipes and progression gates;
- XP/mastery pacing proof;
- tool/cart level definitions;
- queue slots / speed modifiers;
- timed processing math;
- auto-feed;
- contract rotation/scaling;
- whole-item component requirements.

A real headless Chromium flow additionally verifies:
- garage access with a 0 kg cart;
- five branches / 35 nodes;
- Combo prerequisite and reload persistence;
- exact next-upgrade press requirements;
- physical tool fabrication is queued rather than instant and persists;
- first press fabrication is queued rather than instant;
- first press processing is timed;
- first contract consumes stock and grants cash + XP;
- an elapsed workshop job completes after offline return and appears in the report;
- Workshop parallel talent visibly creates two queue slots.

## Visual policy
Do not spend this pass polishing placeholder Canvas art. Once this systems loop passes the owner feel test, production visuals return to `docs/VISUAL_BASELINE.md` and the approved concept evidence.

## Internal acceptance checklist
- [x] anytime garage/home access;
- [x] field route survives ordinary garage visits;
- [x] XP / levels / mastery;
- [x] 35-node / five-branch tree;
- [x] Combo prerequisites and runtime effect;
- [x] physical tool progression;
- [x] physical cart progression;
- [x] explicit machine build/upgrade gates and recipes;
- [x] timed persistent workshop queue;
- [x] offline fabrication/processing completion;
- [x] timed first processing loop;
- [x] raw/processed sale loop;
- [x] rotating first contracts with cash + XP;
- [x] local save migration V2 -> V3;
- [x] deterministic/system/browser test coverage;
- [ ] latest documentation head CI/package green.

## Owner test target
The next owner test should be played as a coherent early game, not as isolated feature checks:

`свалка -> XP/уровень -> выбор ветки -> физический апгрейд -> свободный возврат домой -> продажа/контракт -> сборка пресса -> ожидание в игре/offline -> переработка -> следующий виток`.

The main questions for that test are pacing and clarity. Production visual replacement follows after the systems loop is accepted.
