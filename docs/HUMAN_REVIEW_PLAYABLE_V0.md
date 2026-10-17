# Human Review — Playable Salvage V0

Status: **TWO OWNER REVIEWS COMPLETED / INTERNAL COMPLETION PASS IN PROGRESS**

## Review #1 — first 3–4 cart runs

### Accepted
- basic gameplay loop is understandable:
  - dismantle junk;
  - collect drops;
  - haul to garage;
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
- machine inspector with recipe, owned/missing quantities, source hints and ready-made price;
- first Build/Install action.

## Review #2 — after visual/garage pass

Owner verdict:

### Active loop
- mechanic is acceptable for now;
- production visual polish should **not** consume more iteration time yet;
- final visuals will later follow the separately approved concept baseline.

### Garage/home rule
Current behavior was wrong if garage access depends on cart fill.

Owner requirement:

> The garage is the player's base/home. The player must be able to return whenever they want.

This is now a hard product rule:
- no minimum cart fill;
- explicit Home/Garage action is always available;
- returning unloads collected cargo;
- returning home does not force a fresh salvage field;
- player can go back to the same field route.

### Machine progression clarity
Owner specifically reported that the station still did not clearly state **what is required to get its upgrade/progression**.

The next runtime must therefore show, separately and explicitly:
1. conditions to unlock the machine;
2. exact recipe to build it;
3. current machine level;
4. conditions for the next machine level;
5. exact resources/components/cash for that next upgrade;
6. where missing items come from.

This information is required **before** the upgrade is available.

### Progression scope
Owner does not want another narrow test build.

Before the next owner package, the playable must include:
- XP;
- player levels;
- mastery points;
- five progression branches;
- prerequisites between nodes;
- actual early talent effects;
- Combo deeper in Salvage rather than at the tree root;
- persistence;
- coherent garage economy/progression.

## Internal completion pass now implemented/in progress

See `docs/PROGRESSION_RUNTIME_V0.md`.

Current runtime direction includes:
- persistent XP / level / mastery;
- 35 visible talent nodes across five branches;
- Combo at Salvage tier 3;
- functional early Salvage/Logistics/Workshop/Automation/Trade effects;
- anytime garage access;
- explicit machine unlock/build/upgrade requirements;
- machine levels;
- simple first machine processing;
- raw/processed sale loop;
- local persistence;
- baseline offline progress/report.

## Visual policy

Do not treat the current browser art as final art.

Current visuals are functional scaffolding. Production visual work should return to the approved concept after the systems loop is coherent enough to justify a broader visual pass.

## Next owner test gate

**Do not send another package yet.**

The next human package is allowed only after internal checks confirm:
- typecheck/build/smoke green;
- garage available at any moment;
- progression tree usable and understandable;
- XP and level cadence wired to active play;
- Combo cannot be reached without its prerequisite nodes/level;
- machine cards/inspector expose upgrade requirements;
- press and early sale loop are functional;
- save/offline state is sane;
- docs match runtime.
