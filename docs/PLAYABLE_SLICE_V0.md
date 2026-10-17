# Playable Salvage Slice V0

Status: **INTERNAL COMPLETION PASS — NOT READY FOR OWNER PACKAGE YET**

This branch started as a narrow active-scavenging proof and is now being completed into a coherent early-game slice before the next human build is sent.

## Accepted foundation
- dense top-down salvage field;
- simple player with hand cart;
- automatic dismantle in range;
- six early target classes;
- resource burst + magnetic pickup;
- early components;
- garage/base loop;
- current visuals are functional scaffolding only.

## Hard rules added after owner review

### Garage is home
The garage can be entered at **any time**. There is no minimum cart fill. `G` is a shortcut.

Returning home unloads current collected cargo and preserves the current salvage route unless the field is almost exhausted.

### Progression must already exist before next test
The next owner-facing package must include:
- XP and levels;
- mastery points;
- five development branches;
- prerequisites;
- real early talent effects;
- Combo deeper in Salvage;
- persistent state;
- machine unlock/build/upgrade clarity;
- working first processing/sale loop.

## Current runtime systems

### XP / mastery
XP comes from dismantled target class plus a bonus for component drops. Level thresholds and mastery pacing are defined in `docs/PROGRESSION_RUNTIME_V0.md` and implemented in `src/progression.ts`.

### Talent tree
35 visible nodes:
- Salvage;
- Logistics;
- Workshop;
- Automation;
- Trade.

Early nodes are functional. Later nodes that depend on not-yet-implemented systems remain visible but cannot waste mastery points.

### Combo
Combo is Salvage tier 3 and requires the first two Salvage nodes plus player level 4.

### Garage / machines
Machine tiles and inspector show:
- unlock conditions;
- build recipe;
- owned/missing values;
- source hints;
- installed level;
- next upgrade gates;
- exact next upgrade recipe.

Machine tiles also carry a concise direct summary so upgrade requirements are not hidden behind the inspector.

### Early economy
- raw material sale;
- processed-material sale;
- ready-made machine shortcut pricing;
- Trade talents affect sale/shop multipliers;
- Workshop talent affects construction cost / processed yield.

### Machine work
Prototype immediate-batch actions exist for:
- press -> briquettes;
- wire stripper -> clean copper;
- plastic shredder -> granulate.

Timers/queues remain a later refinement.

### Persistence / offline
Local save persists progression/economy. Offline baseline begins at the approved 20% / 2h and Automation nodes modify it.

## Visual policy
Do not spend the next iteration polishing these placeholder Canvas drawings. Once the system loop is stable, production visuals return to `docs/VISUAL_BASELINE.md` and the approved concept evidence.

## Internal acceptance checklist

- [x] garage action no longer has a cart-fill gate;
- [x] field state persists through ordinary garage visits;
- [x] XP / level / mastery runtime exists;
- [x] 35-node / 5-branch tree exists;
- [x] Combo is tier 3 in Salvage and has prerequisites;
- [x] early talent effects modify runtime values;
- [x] station cards expose concise build/upgrade requirements;
- [x] inspector exposes exact unlock/build/upgrade requirements and sources;
- [x] installed station levels/upgrades exist;
- [x] first processing actions exist;
- [x] raw/processed sale loop exists;
- [x] persistence exists;
- [x] offline baseline/report exists;
- [x] pure smoke tests cover progression gates and machine requirements;
- [ ] latest branch head CI fully completed after final docs/presentation commits;
- [ ] internal runtime/manual browser sanity pass before owner package.

## Next test gate
No new ZIP is sent merely because CI is green.

Before the next owner package:
1. typecheck/build/smoke green;
2. static review of garage-anytime rule;
3. XP/mastery cadence and prerequisites verified;
4. all five branches visible;
5. machine build/upgrade requirements visible on card and inspector;
6. press build/process/sale flow internally coherent;
7. persistence/offline state sanity checked;
8. docs and PR description match runtime.
