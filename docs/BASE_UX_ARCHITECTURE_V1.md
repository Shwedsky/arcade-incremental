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

### Workforce surfaces

Appear once Van or first worker exists:
- **Персонал** — workers/roles/assignments;
- **Логистика** — vehicles, routes and transport assets.

## Business-stage navigation

### Starter Garage
`Обзор / Производство / Склад / Контракты / Развитие`

Player meaning: personal workshop.

### Equipped Garage
Same surfaces, but Overview communicates growing machine/storage pressure.

Player meaning: working recycling garage.

### Workforce Garage
Adds `Персонал / Логистика`.

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
- Starter and Equipped Garage hide Crew/Logistics;
- Workforce stage exposes Crew/Logistics;
- Hangar and Plant derive the correct stage from owned infrastructure;
- Production, Storage, Contracts and Development remain reachable;
- existing element IDs remain in the document and interactive;
- Save V10 schema is unchanged.
