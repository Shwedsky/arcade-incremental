# P4 — Salvage Yard & Fleet Network V1

Status: ACTIVE IMPLEMENTATION CHECKPOINT

Source of truth: `docs/PRODUCT_ROADMAP_V2.md` P4 and Issue #47.

Baseline main: `62ddf0ae0f28e0a6d2611f9834fc34681256b673` (merged P3 Hangar Transformation V1).

## Product promise

> I own several salvage operations and a real logistics network.

P4 converts the existing generic Workforce/Fleet V3 mechanics into a network-scale business layer. It must deepen existing owned systems rather than add another frontier map or another generic resource family.

## Delivery slices

### P4-A — Yard place + network read model
- distinct Salvage Yard Overview presentation;
- bulk/heavy staging and route activity visible in the Yard;
- canonical network summary derived from Workforce/Fleet V3;
- several simultaneous routes visible together;
- route card exposes zone, workers/crew, vehicle, throughput, capacity, shift state and explicit bottleneck.

### P4-B — Crew grouping + dispatch
- small reusable crew/group presets;
- individuals remain inspectable;
- common dispatch chooses crew + mastered zone + vehicle;
- combined throughput preview before dispatch;
- dispatch writes only canonical Workforce/Fleet V3 routes.

### P4-C — Storage / bottleneck network
- route remote-buffer/cargo pressure becomes explicit;
- base storage pressure becomes explicit;
- vehicle capacity and staffing/logistics readiness are named bottlenecks;
- changing the limiting asset changes the displayed bottleneck causally.

### P4-D — Offline / persistence / responsive hardening
- multiple active routes persist through Save V10;
- offline report summarizes route-level gains/stops;
- Yard/network UI remains usable on desktop/mobile;
- all P0-P3/Core Rebuild/Owner Feedback regressions remain green.

## Non-goals
- no Z9+;
- no prestige;
- no monetization;
- no new generic resource family;
- no conveyor/belt simulation;
- no P5 Industrial Workshop redesign.

## Review process change
Manual owner testing is deferred to the later combined product slice. Each milestone still requires a dedicated browser acceptance plus the complete CI regression gate before merge.
