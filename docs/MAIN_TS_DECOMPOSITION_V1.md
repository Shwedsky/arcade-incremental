# `main.ts` Decomposition V1

Status: **refactor map, no framework rewrite**

## Current problem

`src/main.ts` is the integration owner for almost the entire game:
- boot/save/platform reconciliation;
- active field/session state;
- combat/dismantling loop;
- garage rendering;
- machine/workshop actions;
- contracts;
- zones/mastery;
- workers;
- Van/Truck/Recovery Rig;
- Hangar/Yard/Industrial Workshop;
- Processing Plant;
- talent rendering;
- offline application;
- test API exposure.

The domain logic is already split into useful modules, but presentation/orchestration is still concentrated in one integration file. Adding full Hangar/Plant management directly into that file would increase regression risk and make visual-stage work slower.

## Refactor principle

Do not rewrite the game or change framework.

Preserve:
- TypeScript + Vite;
- current domain modules;
- current Save V10 schema unless a real feature requires migration;
- current automated browser acceptance;
- event delegation where it already works.

Extract orchestration gradually behind small interfaces.

## Target ownership map

### `app_bootstrap` / persistence integration
Owns:
- initial Save load/migration;
- platform/cloud reconciliation;
- periodic save/flush;
- global diagnostics/test bootstrap.

### `field_controller`
Owns:
- active excursion lifecycle;
- player movement/combat/dismantling;
- cart/haul state;
- target respawn/session metrics;
- entering/leaving field.

### `base_controller`
Owns:
- base open/close lifecycle;
- derived Business Stage;
- Base Shell navigation;
- high-level refresh coordination.

### `workshop_controller`
Owns:
- installed machines/equipment presentation;
- workshop scheduler UI/actions;
- processing queue controls.

### `crew_controller`
Owns:
- worker cards;
- role/training/assignment actions;
- offline/shift state presentation.

### `logistics_controller`
Owns:
- Van/Truck/Rig ownership;
- player-vs-route assignment;
- route/fleet presentation.

### `contracts_controller`
Owns:
- Contract Board rendering/actions;
- eligibility/offer presentation.

### `progression_controller`
Owns:
- talent screen rendering/actions;
- level/mastery presentation;
- milestone gate messaging.

### `industrial_controller`
Owns:
- Pack C/D/E production surfaces;
- Industrial Workshop cells;
- Processing Plant lines;
- production-plan UI in later phases.

## P0/P1 implementation boundary

This package does **not** extract all controllers yet.

It introduces two safe seams first:
1. `business_stage.ts` — pure derived stage model independent of DOM;
2. `base_shell_v1.ts` — presentation shell that rearranges existing DOM owners without duplicating their logic.

This proves the target UX architecture while leaving gameplay ownership stable.

## Next safe extraction sequence

After Base Shell owner review:
1. move pure Garage/Business Stage read models out of `main.ts`;
2. extract base render coordination;
3. extract Crew/Logistics UI before Workforce & Van V3;
4. extract Industrial production UI before Industrial Workshop/Plant V2;
5. only then consider splitting active field controller if needed.

Avoid extracting field/combat first: it is already stable and is not the immediate roadmap bottleneck.

## Regression rule

Every extraction must preserve:
- existing element/action semantics or deliberately migrate tests in the same PR;
- exact Save V10 compatibility;
- Pack A-E domain/browser tests;
- manual review flow;
- test API needed by deterministic browser acceptance.
