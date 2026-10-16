# Playable Salvage Slice V0

Status: **IMPLEMENTATION CHECKPOINT — OWNER APPROVED TO START**

This branch implements the first playable active-loop proof from the approved Design V2 and Gameplay Loop Calibration V0.

## Scope

Build only the minimum slice required to test the feel of active scavenging:

- compact top-down junk field;
- simple stylized player + hand cart;
- keyboard and pointer/touch movement;
- automatic dismantling of the nearest valid target in range;
- six calibrated target classes;
- dense deterministic field (~80 nodes);
- visible target damage/break feedback;
- resource burst + magnet pickup;
- metal / copper / plastic counters;
- 40 kg starter cart capacity;
- four early component families:
  - bearings;
  - electric motor;
  - hydraulic unit;
  - electronic module;
- stronger rare-drop presentation for motor/hydraulic unit;
- cart-full state;
- fast transition back to a simplified garage/unload screen;
- unload summary and return to refreshed field;
- developer telemetry for break cadence, pickups and trip duration.

## Explicitly out of scope

Do not implement yet:

- full garage machinery gameplay;
- press crafting/economy;
- talent tree;
- Combo;
- workers;
- offline progression;
- contracts;
- Yandex SDK/ads;
- final art/content catalog;
- real-world item weights.

## Feel targets from approved calibration

- normal play around ~9 destroyed targets/min;
- readable target band roughly 6–12/min;
- ~46–49 visible pickup fragments/min target presentation cadence;
- starting 40 kg cart trip roughly 4–5.5 minutes;
- dozens of targets per trip, not a handful of appliances;
- large targets should feel like jackpots, not HP sponges;
- component drop should read as clearly more valuable than common material drops;
- return/unload must be quick and must not dominate active time.

## Technical direction

Use TypeScript + Vite + Canvas 2D with lightweight DOM HUD. Avoid a heavy 3D engine for this proof. Keep gameplay state deterministic when a `seed` query parameter is supplied so human/automated tests can reproduce a field.

The prototype should be desktop-playable immediately and include pointer/touch movement primitives suitable for later mobile work.

## Acceptance

The branch is successful when the owner can open a built package, play several haul cycles, and answer:

1. Is breaking junk inherently satisfying before Combo exists?
2. Is the field dense enough?
3. Does the cart fill at a good pace?
4. Are common resource bursts readable rather than noisy?
5. Does a rare component drop feel exciting?
6. Is returning/unloading painless?

Human feel overrides model targets. Deviations discovered in testing must be fed back into the reproducible calibration docs/models.