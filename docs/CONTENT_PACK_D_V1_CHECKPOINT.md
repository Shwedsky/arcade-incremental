# Content Pack D V1 — Delivery Checkpoint

Status: **IMPLEMENTATION COMPLETE / CLEAN-HEAD VALIDATION PENDING**

Tracked by Issue #17.

Base: `main` @ `34ce67e3e7899adc9f72d67cdd0857d20f2bfc13` after merged Content Pack C V1.

## Delivered progression

`Salvage Yard + mastered Z6 -> Z7 Heavy Depot -> active Recovery Assembly discovery -> Recovery Rig -> mastered Z7 -> Industrial Workshop -> Worker #4 / Operator -> next late-game readiness`

## Delivered systems

### Z7 Heavy Depot / Тяжёлый парк
- Z7 is a first-class `ZoneId`, not a Pack-D-only exception;
- selectable only after accepted Pack C frontier prerequisites: mastered Z6 + Salvage Yard + Truck;
- distinct heavy-equipment content matrix and distinct visual theme;
- HP multiplier `3.25`, yield multiplier `2.55`, mastery target `12,200`;
- heavy source mix is intentionally dominated by medium/large industrial targets;
- Z7 source matrix exposes recognizable forklift / excavator / heavy-drive / hydraulic recovery targets;
- workers cannot unlock Z7, earn Z7 mastery or make the first signature discovery.

### Active Recovery Assembly
- Pack D signature component is obtained from eligible active Z7 medium/large targets;
- bounded anti-RNG protection: pity at `8` eligible targets;
- small junk cannot produce the signature assembly;
- Recovery Assembly is consumed by the Recovery Rig milestone and therefore cannot be bypassed with cash alone.

### Recovery Rig
- player logistics tier after Truck;
- capacity: **1,800 kg**;
- Hand Cart remains the local active collector;
- after acquisition the Rig becomes the active field bulk depot in HUD/rendering;
- Rig carries ordinary metal/copper/plastic plus both aluminium scrap and alloy scrap inside the same capacity;
- this preserves correct unloading when revisiting Z4/Z5/Z6 after the upgrade;
- returning home unloads Rig contents into the existing Pack B/C inventories;
- Truck is retained rather than deleted and exposes the Pack D worker-route second-life contract after Rig acquisition.

### Industrial Workshop
- real base milestone after Recovery Rig + mastered Z7;
- acquisition consumes Pack B/C manufactured materials, modules and industrial components rather than cash only;
- Pack D state exposes `productionCells = 2` after acquisition;
- runtime adds **one real generic workshop slot** on top of the existing talent-derived workshop capacity;
- existing processing/build/upgrade jobs can therefore use the increased concurrent capacity without introducing a second queue implementation inside Pack D.

### Worker #4 / Operator
- unlocked only after Industrial Workshop;
- mutually exclusive `Scavenger` / `Operator` role;
- Scavenger may work only mastered zones, including mastered Z7;
- online worker simulation is wired into the normal live tick;
- offline simulation supports up to 18 hours;
- Operator cannot scavenge simultaneously;
- Operator uses the accepted Automation unlock and applies a real `×0.85` Pack C industrial-cell duration multiplier;
- field presentation recognizes Worker #3/#4 Scavenger presence.

### Save V7
- Pack D state is persisted in Save V7;
- forward migration is supported from V6 / V5 / V4 / V3 / V2;
- accepted Pack B/C state is preserved during migration;
- Rig / Industrial Workshop / Worker #4 role and in-flight Pack C production survive reload.

## Dedicated Chromium Pack D acceptance

The Pack D browser proof verifies:

1. accepted Save V6 migrates to V7 without losing Truck or Salvage Yard;
2. Pack D defaults are created safely on migration;
3. Z7 appears as a real selectable map frontier after the Pack C prerequisites;
4. Recovery Rig remains unavailable without the active Recovery Assembly;
5. Recovery Rig can be acquired when the signature requirement and recipe are satisfied;
6. the active field transport reports **1,800 kg** capacity after Rig acquisition;
7. Industrial Workshop can be acquired only after the heavy frontier conditions are met;
8. Workshop acquisition exposes two cells and increases the generic workshop queue capacity;
9. Worker #4 can become a mastered-Z7 Scavenger;
10. Worker #4 can switch to Operator only through the accepted Automation path;
11. the Operator effect is measurable: a 240-second Pack C Alloy cycle becomes exactly **204 seconds** at `×0.85` in the isolated Pack D proof;
12. Pack D state and the in-flight industrial job survive reload.

## Regression / release proof already achieved before cleanup

Product/test head `4a0b88e3506967c4cea53b769e48e92d3a365e40` passed ordinary CI run `39250905754` end-to-end:

- TypeScript + Vite build;
- deterministic gameplay / Early / Midgame / Visual regression;
- Pack A / Pack B / Pack C / Pack D domain smokes;
- Save safety + platform adapter;
- progression pacing model;
- Mid/Late structural model;
- Chromium progression regression;
- Chromium Midgame regression under Save V7;
- Chromium Pack B regression under Save V7;
- Chromium Pack C regression under Save V7;
- dedicated Chromium Pack D proof;
- platform/responsive Chromium proof;
- release manifest;
- RC packaging and artifact upload.

RC from that validated product head:

- artifact: `arcade-incremental-release-candidate-v4`;
- artifact id: `12186020730`;
- size: `54,623 bytes`;
- digest: `sha256:2a24a0172408739ff2bcdedef2a9ebe392fc1ed042f681e0d4791148ac8c0643`.

A final ordinary CI run must still pass on the clean delivery head after removal of temporary integration tooling and this checkpoint update. That clean-head run is the merge gate.

## Queue UX boundary / Issue #19

The owner's new production UX requirements are deliberately **not** partially implemented inside Pack D.

Issue #19 — `Workshop Queue UX V1 — batch processing, sale quantities and reorderable offline queue` owns the next shared-system change:

- sale quantity slider + synchronized numeric input;
- batch/stack count when enqueuing processing;
- logical queue actions with requested/completed/remaining stacks;
- ordered waiting queue behind the available active workshop slots;
- offline continuation across multiple queued actions;
- waiting-action quantity edits and deletion;
- drag-and-drop reorder plus mobile/keyboard fallback controls;
- active action locked from reorder;
- explicit confirmation before cancelling an active build/upgrade;
- partial batch cancellation preserves already completed outputs;
- save migration and dedicated desktop/mobile Chromium acceptance.

Pack D intentionally contributes only the additional workshop capacity. The queue scheduler will be replaced once, coherently, in Issue #19 rather than implemented twice.

## Guardrails preserved

- no Z8 Port Terminal;
- no final Processing Plant;
- no final economy closure;
- no fuel micromanagement;
- Hand Cart remains active local collection;
- workers never earn mastery or first-discover required frontier families;
- old transport is not silently deleted after upgrades;
- production chains remain shallow/readable;
- no ads / IAP / leaderboards / Yandex Console work;
- no owner manual gate during implementation;
- temporary one-shot integration/repair scripts and workflows were removed before final clean-head CI.
