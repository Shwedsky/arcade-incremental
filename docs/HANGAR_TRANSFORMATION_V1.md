# Hangar Transformation V1

Status: IMPLEMENTATION CHECKPOINT / P3
Baseline main: `e54ee7f0c6df6508641f47e52bbcb188a4d5b5a1`
Issue: #45

## Player promise

> This is no longer my crowded Garage. I now operate a small salvage business from a real Hangar.

## Product target

The Hangar must be the first undeniable business-scale transformation. Buying it is not complete if only a title, tint, stat, flag, tab, or capacity number changes.

The player must immediately perceive:
- a larger place;
- more people;
- more vehicles;
- more production capacity;
- clearer business organization;
- visible room to grow.

## Scene contract

### Garage
- compact personal workshop;
- one small vehicle bay;
- machines and storage feel crowded near the end of the tier;
- visual pressure should make the Hangar desirable.

### Hangar
- substantially larger interior and floor plan;
- dedicated machine floor;
- visible storage racks / pallets;
- dispatch / worker zone;
- multiple vehicle bays;
- owned Van / Truck shown as distinct assets;
- free/assigned vehicle state readable in presentation;
- visible empty expansion positions;
- materially stronger industrial ambience than Garage.

## Overview contract

Hangar Overview is a business-control surface, not another long list.
It should surface at a glance:
- current business stage;
- active vs idle workers;
- active vs free vehicles;
- current production / Workshop Queue pressure;
- storage pressure;
- the largest current bottleneck;
- next business milestone.

## Management surfaces

Reuse existing source-of-truth systems from Core Rebuild V1:
- Overview
- Production
- Storage
- Personnel
- Logistics
- Contracts
- Development

Do not fork worker/fleet/contract calculations inside the Hangar presentation.

## Visible ownership rules

Where practical, owned state should have a scene representation:
- machines appear in machine-floor positions;
- workers appear in dispatch / work positions;
- vehicles appear in bays;
- occupied/free state is distinguishable;
- stage modules/capacity should correspond to visible Hangar capabilities.

## Scope boundaries

No Z9+.
No prestige.
No monetization.
No new generic resource family.
No conveyor-belt factory simulation.
Do not rebuild Workforce/Fleet/Contracts from scratch.

## Automated acceptance

Tests must prove:
1. Garage and Hangar use structurally different scene composition/state.
2. Hangar presentation reflects owned machines, crew and fleet.
3. management tab navigation preserves existing V3 runtime state.
4. Save V10 loads with no reset.
5. existing Core Rebuild browser/domain proofs stay green.
6. responsive desktop/mobile Hangar surfaces remain usable.

## Owner-review gate

Do not send a review package after a cosmetic first slice.
The owner package should contain the complete Hangar transformation as one coherent milestone.

Success criterion:

> After buying/opening Hangar, the player immediately feels that the Garage era ended and a larger company began.
