# Progression Runtime V0

Status: **IMPLEMENTED INTERNALLY — DO NOT ROLL A NEW OWNER TEST BUILD YET**

This pass responds to owner feedback after the first 3–4 cart human tests.

## Owner verdict carried forward

- active dismantle/haul mechanic is accepted for now;
- production visual polish is postponed and must later follow the approved concept baseline;
- garage is the player's home/base and **must be enterable at any time**;
- a machine card must explicitly explain what is required to unlock, build and upgrade it;
- the next human build should already contain XP, levels and meaningful progression branches rather than another isolated technical slice.

## Garage rule

There is no cart-fill gate for returning home.

The player may enter the garage at any time via the visible button or `G`.

Entering the garage:
- unloads currently collected resources/components;
- does not require a full cart;
- does not regenerate the salvage field;
- preserves the current field route so the player can return to it;
- only refreshes a nearly exhausted field when the player leaves the garage.

This is a product rule, not a tuning parameter.

## XP and levels

XP is earned from active dismantling.

Base XP per destroyed target:
- small scrap: 1 XP;
- cable: 1 XP;
- small appliance: 2 XP;
- bike/fan class: 2 XP;
- medium appliance: 3 XP;
- large appliance: 5 XP;
- any component drop: +3 XP.

Cumulative level thresholds:

| Level | Cumulative XP | Total mastery points earned |
|---:|---:|---:|
| 1 | 0 | 0 |
| 2 | 120 | 1 |
| 3 | 420 | 2 |
| 4 | 1,800 | 3 |
| 5 | 3,200 | 4 |
| 6 | 5,200 | 5 |
| 7 | 7,800 | 6 |
| 8 | 11,000 | 7 |
| 9 | 15,000 | 8 |
| 10 | 20,000 | 9 |

The steep gap before level 4 is intentional: a player specializing in Salvage needs three mastery points to reach Combo, keeping the mechanic around the approved ~2h active target rather than handing it out in the first few carts.

## Talent tree

Five branches, seven visible nodes each (35 total):

1. **Salvage / Разбор**
2. **Logistics / Логистика**
3. **Workshop / Мастерская**
4. **Automation / Автоматизация**
5. **Trade / Торговля**

The tree rule remains:

> 1–2 foundational nodes → first meaningful mechanic → upgrades to that mechanic → later strong systems.

### Salvage

1. +10% dismantle speed
2. another +10% dismantle speed
3. **Combo unlock**
4. longer Combo timer
5. Combo cap 5 → 8
6. movement bonus at high Combo
7. high-Combo rare-component bonus

### Logistics

Early functional nodes increase cart capacity, movement speed and pickup radius. Later visible nodes continue into cargo handling/field automation.

### Workshop

Early functional nodes reduce machine construction/upgrade cost and improve processed-material yield. Later nodes prepare queues and advanced equipment.

### Automation

The first two nodes are already functional:
- offline 20% → 25%;
- offline cap 2h → 3h.

Further visible nodes remain locked until their corresponding production systems are implemented.

### Trade

The first two nodes are already functional:
- +5% sale price;
- -5% shop price.

Further visible nodes are reserved for contracts/special buyers/dynamic pricing.

## Combo runtime

Combo is not a starting mechanic.

When unlocked:
- destroying a target starts/increments the series;
- base window is 3 seconds;
- default cap is 5;
- each active stack increases dismantle throughput modestly;
- deeper nodes extend the window/cap and later audiovisual intensity.

The current gameplay must remain satisfying without Combo.

## Machine clarity rule

Every machine UI must show three distinct layers:

### 1. Unlock conditions
Examples:
- player level;
- previous machine installed;
- required Workshop talent.

### 2. Build recipe
For every requirement show:
- exact required quantity;
- current owned quantity;
- whether complete;
- where the missing resource/component comes from.

### 3. Next upgrade
For installed machines show:
- current machine level;
- next level name and benefit;
- all progression gates;
- exact resource/component/cash recipe.

This information must be visible before the player owns the upgrade.

## Machine runtime in this pass

The garage now models machine levels and explicit upgrades.

The first machines also receive basic batch processing so installed stations are not decorative:
- press: metal → briquettes;
- wire stripper: cable/copper stream → clean copper;
- plastic shredder: plastic → granulate.

Processed materials have a higher sale value than raw input.

This is an intentionally simple immediate-batch implementation; production queues/timers are a later refinement.

## Cash loop

Garage includes explicit sale actions for:
- raw resources;
- processed materials.

This makes early cash requirements meaningful before contracts are implemented.

## Persistence

Local save persists:
- XP / level progress;
- talent unlocks;
- cash;
- stored resources/components;
- processed materials;
- installed machines;
- machine levels;
- lifetime destroyed-target count.

## Offline baseline

On returning after a meaningful absence, the runtime applies the approved initial baseline:
- 20% active collection efficiency;
- maximum 2 hours per absence.

Automation talents modify those values.

The offline report is shown separately so passive progress is understandable rather than silently appearing in storage.

## Human-test gate

Do **not** produce another owner-facing test package merely because one subsystem lands.

Before the next package, internal completion must include at minimum:
- green typecheck/build/smoke;
- garage-anytime behavior;
- persistent XP/level/mastery;
- five visible progression branches;
- functional early talent effects;
- Combo correctly gated behind the third Salvage node;
- station unlock/build/upgrade requirements shown explicitly;
- first station processing/sale loop;
- persistence/offline sanity check;
- documentation updated to match runtime.

Visual production polish remains deliberately deferred until this systems pass is coherent.
