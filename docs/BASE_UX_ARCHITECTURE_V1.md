# Base UX Architecture V1

Status: **implementation contract for P0/P1 Foundation**  
Tracked by Issue #42 / PR #43.

## Problem

The runtime already contains Garage, workers, Van/Truck/Rig, Hangar, Salvage Yard, Industrial Workshop and Processing Plant, but most of that progression is rendered inside one growing Garage screen.

That creates two product failures:
1. a major purchase can change mechanics without changing the perceived place/business stage;
2. every new system increases scroll/card density instead of raising the level of management abstraction.

## UX rule

The base uses one stable navigation grammar while the business grows.

Available surfaces are unlocked by business stage; the UI does not invent a new unrelated management paradigm for every building.

### Permanent surfaces

- **Обзор** — current business stage, next pressure/milestone, high-level capacity and bottleneck summary;
- **Производство** — machines, upgrades and workshop queue;
- **Склад** — raw, processed and component inventory;
- **Контракты** — current buyer/order surface;
- **Развитие** — existing permanent talent tree.

### Growth surfaces

- **Логистика** — appears in Equipped Garage, before the Van is owned, because this surface must contain the first transport acquisition and then grow into vehicles/routes;
- **Персонал** — appears once the business enters the workforce stage and there is a real worker-management loop.

A system's purchase/unlock entry point must never be hidden behind the stage that the purchase itself creates.

## Business-stage navigation

### Starter Garage
`Обзор / Производство / Склад / Контракты / Развитие`

Player meaning: personal workshop.

### Equipped Garage
`Обзор / Производство / Склад / Логистика / Контракты / Развитие`

Logistics first acts as the place where the player acquires the first Van and learns the transport layer.

Player meaning: working recycling garage that is beginning to outgrow hand-cart-only logistics.

### Workforce Garage
Adds **Персонал** while retaining Logistics.

Player meaning: first small employer and first passive supply route.

### Hangar
Same surface grammar, but the visual scene/layout must become larger and more operational in the Hangar production package.

Player meaning: small salvage company.

### Salvage Yard / Industrial Workshop / Processing Plant
No explosion of top-level tabs. Complexity is absorbed inside Crew/Logistics/Production through grouping and higher-level controls.

Player meaning: network -> industrial production -> plant-scale operation.

## Base Shell V1 runtime slice

This package implements the navigation architecture without duplicating existing systems.

Existing DOM/runtime owners are moved into panes:
- `machineGrid + machineInspector + equipmentPanel + queuePanel` -> Production;
- existing `.store` -> Storage;
- `contractPanel` -> Contracts;
- `workerPanel` -> Crew;
- `transportPanel` -> Logistics;
- existing talent screen remains the Development surface/action.

Event handlers remain valid because the same DOM nodes stay under `garageScreen`; they are not reimplemented.

## Overview V1

Overview must immediately answer:
- what kind of business do I own now?
- what is the next major milestone?
- why do I need it?
- how many machines/workers/vehicles do I own?
- what frontier am I on?
- how much of the map is mastered?
- how much base work is currently queued/running?
- what level/mastery-point state am I in?

Overview V1 is not the final bottleneck dashboard. Workforce V3 will add expected output and explicit route/storage stoppage reasons.

## Visual-stage requirement

P0/P1 adds a minimum stage identity through title/accent/background treatment. This is intentionally not the final Hangar/Yard/Plant art pass.

From P3 onward, a major building is not accepted unless the base scene itself changes materially.

## Micro-scaling rule

Business scale must reduce micro per unit:
- 1–2 workers: individual cards are acceptable;
- several workers: route/crew grouping becomes primary;
- Plant scale: production-cell/crew management replaces dozens of individual cards.

## Acceptance

Base Shell V1 passes when automated browser review proves:
- Starter Garage hides Crew/Logistics;
- Equipped Garage exposes Logistics while Crew remains hidden;
- Workforce stage exposes Crew and Logistics;
- Hangar and Plant derive the correct stage from owned infrastructure;
- Production, Storage, Contracts and Development remain reachable;
- existing element IDs remain in the document and interactive;
- Save V10 schema is unchanged.
