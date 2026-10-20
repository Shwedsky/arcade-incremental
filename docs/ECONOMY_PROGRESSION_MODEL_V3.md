# Economy / Progression Model V3

Status: **deterministic planning contract**  
Executable proof: `models/economy_progression_model_v3.py`.

## Why V3 exists

Earlier models separately proved early zone value, worker output, recipe diversity and the level-30 extension. Product Roadmap V2 now needs one cross-system contract before Workforce/Hangar depth continues.

The important current finding is not that level 30 is too low. It is that the **currently enabled talent tree is too small for the point supply**.

At level 30:
- mastery-point supply = **29**;
- currently runtime-enabled talent point cost = **28**;
- therefore a normal player can mathematically buy every currently active talent and still have a point left.

That destroys specialization.

## P0 target

Do **not** extend the level cap again just because 30 looks small.

First expand the meaningful full current-scope talent budget to approximately **48 points** across the five permanent branches.

With the existing one-point-per-level rule:
- level 30 -> 29 points;
- 29 / 48 = **60.4%** of total tree cost;
- this sits inside the Product Roadmap V2 target of roughly **55–65%** tree ownership by normal Plant progression.

This means level 30 is provisionally adequate for the current Garage -> Plant product spine. A later cap extension should require evidence from pacing/retention, not intuition.

## Target branch budget

Planning aggregate, not yet a runtime migration:
- Salvage: 10 points;
- Logistics: 9;
- Workshop: 10;
- Automation: 10;
- Trade: 9;
- total: **48**.

Exact node costs/IDs are deferred to the talent implementation package because existing purchased talents must be grandfathered safely.

## Business-era timing windows

These are broad product targets, not promises that XP alone unlocks the stage.

- Starter Garage: 0–4h, around level 4;
- Equipped Garage: 3–12h, around level 8;
- Workforce Garage: 8–20h, around level 12;
- Hangar: 24–45h, around level 16;
- Salvage Yard: 45–75h, around level 20;
- Industrial Workshop: 75–110h, around level 25;
- Processing Plant: 110–150h, around level 30.

The windows intentionally overlap at boundaries because playstyle, active-session share and contract choices vary.

## XP rule

Existing post-level-10 frontier pacing remains about 2200 XP per active frontier hour in the current model.

The V3 constraint is:
- XP must make the required level reachable before the upper end of the era window;
- the real late-game gate should be infrastructure, recipes, discoveries and business capacity;
- grinding XP must not bypass missing business milestones.

For example, level 30 is reachable in fewer active-frontier hours than the target Plant business window, which is correct: the Plant should be delayed by actually building the business, not by an arbitrary XP wall.

## Passive-vs-active target

Passive bulk supply should grow by era while active play remains the strongest targeted tool.

Target bulk output as a share of an equivalently progressed focused active player:
- Workforce Garage: 15–30%;
- Hangar: 25–40%;
- Salvage Yard: 35–55%;
- Industrial Workshop: 40–60%;
- Processing Plant: 45–65%.

Passive rare/signature acquisition stays capped at roughly **35% or less** of focused active acquisition.

This preserves the intended loop:
`passive network supplies volume -> production exposes a deficit -> player personally solves the valuable deficit/frontier`.

## What V3 does not lock yet

- final cash prices of future worker ranks;
- exact training duration;
- final Hangar/Yard storage numbers;
- exact future talent node list;
- a level cap above 30;
- monetization timing.

Those values must be added only when their systems enter implementation.

## Acceptance invariants

The executable model asserts:
- era level/time order is monotonic;
- current active-tree saturation at level 30 is >=100%;
- proposed full-tree ownership at level 30 is 55–65%;
- a focused player can afford deep specialization but not the full tree;
- passive bulk scales upward but stays <=65% of active;
- passive rare/signature share stays <=35%;
- XP does not become the dominant Plant gate.
