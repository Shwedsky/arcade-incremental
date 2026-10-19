# Content Pack A — Z1/Z2/Z3 Production Slice V1

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Base: `main` @ `4f28f3f3c30e6b3054f685d59fd7e6b70bc9800d`.

Depends on:
- accepted Early Game V0;
- locked Design V3;
- merged Midgame Proof V1;
- merged Visual Production Foundation V1.

## Goal

Turn the proven Z1–Z3 systems into a more content-complete production slice without changing the resource taxonomy or progression architecture.

## Pack A scope

### Zone identity
Each zone must be recognizable by **what is physically being dismantled**, not only by color/theme labels.

- **Z1 — Old Junkyard:** loose scrap, cable coils, fans/bikes, small household junk, occasional appliances.
- **Z2 — Garages / Backyards:** power tools, wiring harnesses, pumps, garage fans, compressors/heaters, workshop equipment.
- **Z3 — Appliance Yard:** microwave/vacuum-scale targets, washer/dishwasher targets, fridge/freezer/oven-scale targets, compressor-rich large appliances.

The six proven gameplay target classes remain the balance/runtime classes. Pack A adds zone-specific content variants on top rather than creating dozens of new economic resource types.

### Content rules
- every target class has multiple names/visual variants per zone;
- source hints for Pump / Compressor must match visible objects;
- zone composition remains compatible with existing `ZONE_DEFS.nodeWeights`;
- no new mandatory raw resource in Z1–Z3;
- no new save migration just for object names/appearance.

### Garage growth
The same garage must visibly read differently across milestones:
1. starter bench / mostly empty floor;
2. first real press installed;
3. copper processing added;
4. plastic processing added;
5. Van + first Worker present.

Growth is presentation/content state driven from existing machine/transport/worker state, not a separate progression system.

### Van / Worker content
- Van should look like owned working equipment, not only a HUD bar;
- first Worker gets a simple readable role/state presentation;
- revisiting the Worker’s zone should visually support the idea that they are already operating there.

## Non-goals
- no Z4+ content production;
- no new economy layer;
- no full realistic asset pipeline;
- no mechanic rebalance unless automated regression proves a direct content bug;
- no monetization/platform work in this pack.

## Acceptance
Before merge:
- all existing CI stays green;
- new content smoke verifies zone/class variant coverage;
- target names shown in runtime come from zone-specific content metadata;
- Pump/Compressor source language and content agree;
- Garage growth state is derived from existing installed/Van/Worker state;
- no manual owner gate is required before merge.
