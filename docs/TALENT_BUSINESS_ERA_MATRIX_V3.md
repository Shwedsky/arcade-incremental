# Talent / Business Era Matrix V3

Status: **planning source for the next talent implementation package**

This document does not change Save V10 talent ownership yet. It defines how the permanent five branches should grow with the business ladder.

## Permanent branches

### Разбор / Salvage
Player-facing active power.

Expected progression:
- Garage: direct dismantling speed/power, Combo and target handling;
- Workforce era: multi-target and targeted rare recovery;
- Hangar: stronger heavy/multi-stage target interaction;
- Industrial: specialist frontier advantages;
- Plant capstone: active rare/signature hunter that solves production deficits faster than passive routes.

### Логистика / Logistics
Everything that moves loot between target, player, vehicle, route and storage.

Expected progression:
- Garage: cart capacity, movement, magnet/pickup;
- Workforce: Van capacity/unload and route support;
- Hangar: multi-vehicle value and turnaround;
- Yard/Industrial: fleet/route throughput and protected cargo;
- Plant capstone: high-level inbound logistics specialization rather than a raw movement bonus.

### Мастерская / Workshop
Transformation throughput and production capacity.

Expected progression:
- Garage: build economics, yield, queue slots, processing speed;
- Workforce: repeat processing and queue quality-of-life;
- Hangar: advanced machines / additional capacity;
- Industrial: production-cell speed/yield/parallelism;
- Plant capstone: line specialization or high-tier production efficiency.

### Автоматизация / Automation
Workers, offline continuity and management scale.

Expected progression:
- Garage: only early offline foundations are available;
- Workforce: shift duration, Scavenger efficiency, role basics;
- Hangar: Operator/Driver effectiveness and training;
- Yard/Industrial: crew/group behavior and Technician/dispatch depth;
- Plant capstone: Foreman/crew automation that reduces micro rather than creating more individual controls.

### Торговля / Trade
How the business converts output into money/opportunity.

Expected progression:
- Garage: sale value and basic supplier economics;
- Workforce: multiple contract choice and better old-zone monetization;
- Hangar: larger orders / preferred buyers;
- Industrial: industrial contract margin and reroll/decline economics;
- Plant capstone: market specialization / large-order strategy.

## Era gates

Talent availability should combine level, prerequisites and business milestones.

Logical eras:
1. **Tier I — Garage**
2. **Tier II — Van / first workforce**
3. **Tier III — Hangar**
4. **Tier IV — Salvage Yard / Industrial Workshop**
5. **Capstone layer — Processing Plant**, only where a real behavior-changing capstone exists.

Pure XP must never unlock a system that the player has not built.

## Current runtime problem

Current level-30 supply is 29 mastery points, while the total cost of currently runtime-enabled talents is 28.

So the current enabled tree is mathematically maxable before the broader business game is complete.

The fix is **not** immediately more levels. The P0 model target is roughly 48 total meaningful point cost across the complete current-scope tree, giving a level-30 player about 60% ownership.

## Node quality rules

A talent should pass at least one of these tests:
- clearly changes behavior;
- unlocks a new option/system interaction;
- changes a bottleneck in a measurable way;
- produces a large enough numeric effect to be noticeable in normal play.

Guardrails:
- ordinary pure-stat node: usually ~5–10%+ in its measured domain;
- avoid more than two consecutive pure-stat nodes without a behavior-changing node;
- capstones may cost 2–3 points;
- branch identity must remain readable from the node list;
- no fake choice where one branch is mathematically mandatory for every build.

## Reachability targets

By each era, the player should have multiple useful choices that are actually reachable with the expected point supply.

Planning checkpoints:
- level 8 / 7 points: meaningful Garage specialization begins;
- level 12 / 11 points: first workforce-oriented choice without abandoning character growth;
- level 16 / 15 points: Hangar-era branch depth becomes reachable;
- level 20 / 19 points: network/industrial choices open;
- level 25 / 24 points: at least one deep specialization plus secondary branch depth;
- level 30 / 29 points: roughly 55–65% of full-tree point cost, enough for one complete focus and deep secondary choices, not enough for everything.

## Migration rule

Existing purchased Talent IDs must never disappear or silently become unaffordable after loading a Save V10 game.

If future point-cost changes affect already-owned nodes, implementation must either:
- grandfather their historical cost; or
- grant a deterministic compensating point adjustment.

No negative free-point state after migration is acceptable.

## Next implementation order

Do not enable all missing talent definitions in P0/P1.

Recommended sequence:
1. use Economy/Progression Model V3 to finalize branch cost budget;
2. map existing IDs into business-era tiers without breaking saves;
3. design behavior-changing nodes for gaps where the underlying system exists;
4. implement P2 Workforce nodes alongside Workforce & Van V3;
5. implement Hangar/Industrial nodes together with the systems they modify;
6. add Plant capstones only when Plant V2 behavior exists.
