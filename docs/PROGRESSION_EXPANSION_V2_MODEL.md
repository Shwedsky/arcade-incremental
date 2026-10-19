# Progression Expansion V2 — model and first Tier-II runtime tranche

Status: **IMPLEMENTATION CONTRACT FOR ISSUE #36**

Base: audited Save V9 main after Roadmap Implementation Audit V1.

## Why this package exists

The current playable spine already reaches Z7, while player level hard-stops at 10. This is not only a pacing problem: existing runtime zone gates already require **level 12 for Z6** and **level 14 for Z7**, so normal progression cannot naturally satisfy them without an expanded level table.

Owner feedback also identified long gaps between meaningful perks/unlocks. V2 restores a mid/late reward cadence before Z8 / Processing Plant is added.

## Level curve V2

Levels 1-10 are frozen for save compatibility:

`0, 120, 420, 1800, 3200, 5200, 7800, 11000, 15000, 20000 XP`

V2 extends cumulatively through level 30:

| Level | XP |
|---:|---:|
| 10 | 20,000 |
| 11 | 23,000 |
| 12 | 26,000 |
| 13 | 29,500 |
| 14 | 33,000 |
| 15 | 37,000 |
| 16 | 41,000 |
| 17 | 45,500 |
| 18 | 50,000 |
| 19 | 55,000 |
| 20 | 60,000 |
| 21 | 65,500 |
| 22 | 71,000 |
| 23 | 77,000 |
| 24 | 83,000 |
| 25 | 89,500 |
| 26 | 96,000 |
| 27 | 103,000 |
| 28 | 110,000 |
| 29 | 117,500 |
| 30 | 125,000 |

At the conservative V2 planning rate of ~2,200 active frontier XP/hour after level 10:
- L12 arrives about 2.7 active frontier hours after L10;
- L14 about 5.9h after L10;
- L20 about 18.2h after L10;
- L30 about 47.7h after L10.

Actual zone/player throughput can be faster, but infrastructure/mastery gates still prevent XP-only skipping.

## Mastery points

V2 keeps the currently understandable rule:

**1 permanent mastery point per level after level 1.**

Therefore:
- L10 = 9 points;
- L14 = 13;
- L20 = 19;
- L30 = 29.

This is intentionally not enough to buy the complete long-term 115-point three-tier design. Specialization remains meaningful.

The runtime gains explicit `pointCost` support now so later capstones can cost 2 points without rewriting the currency model.

## User-facing tiers

The old `TalentDef.tier` field is a branch sequence number, not the long-term Tier I / II / III concept. V2 adds a separate user-facing progression tier.

- **Tier I**: original foundation nodes.
- **Tier II**: Van / Worker / Hangar / Yard-era mechanic nodes.
- **Tier III**: deferred for future packages.

Existing talent IDs are never renamed or reset.

## First coherent Tier-II tranche

V2 establishes exactly one live Tier-II root per permanent branch. It does **not** implement all 35 Tier-II nodes.

| Branch | Node | Gate | Effect |
|---|---|---|---|
| Salvage | `salvage_8` Wide Swing | L10 + Van + `salvage_7` | Existing second target at 55% power. |
| Logistics | `logistics_8` Van Packing | L10 + Van + `logistics_4` | Van usable cargo 400 -> 500 kg. |
| Workshop | `workshop_8` Heavy Fabrication | L12 + Hangar + `workshop_4` | Existing industrial production cycle ×0.90. |
| Automation | `automation_8` Operator Assignment | L12 + Salvage Yard + `automation_3` | Existing industrial Operator role unlock. |
| Trade | `trade_8` Contract Choice | L11 + first worker + `trade_3` | Contract Board V2 shows two eligible offers; player chooses which one to fulfil. |

The Workshop and Automation IDs already exist in merged saves. Existing owners keep them unlocked; milestone gates only control future purchases.

## Applicable Tier-I completion in this package

Only nodes whose underlying mechanics already exist and can have a truthful effect should be activated. Do not make dead talents merely to make the tree look full.

V2 activates:
- `automation_4` **Night Shift**: offline baseline 25% -> 30% after the existing Automation path.
- `trade_4` **Copper Specialist**: +8% sale value for copper and clean copper only.

Other currently non-runtime Tier-I placeholders remain visibly future/locked until their real systems exist.

## Milestone gates

Runtime milestone vocabulary introduced by V2:
- `van`
- `first_worker`
- `hangar`
- `salvage_yard`
- `industrial_workshop`

A talent can require both level/prerequisite and one milestone. This explicitly prevents farming old Z1 for XP to bypass physical business progression.

## Contract Choice state

Trade Tier-II root extends the already-merged Contract Board V2; it does not create a second contract system.

When unlocked:
- generate two eligible offers from the same capability-aware pool;
- offers must not be duplicate templates or duplicate requirement signatures when alternatives exist;
- selecting/completing either advances the same persistent recent-history cooldown;
- no daily timer / FOMO / forced reroll;
- legacy Save V9 with one `currentId` stays valid.

## Compatibility

No save-schema bump is required for the level table or talent metadata.

Existing Save V9 contains:
- accumulated XP — interpreted against the extended table;
- talent IDs — preserved exactly;
- milestone state already stored in Midgame / Pack B / Pack C / Pack D.

If an existing save already owns `salvage_8`, `workshop_8` or `automation_8`, it remains owned regardless of the new milestone gate.

## Acceptance

V2 is complete only when automated proof confirms:
1. old 1-10 thresholds unchanged;
2. level 12 and 14 are naturally reachable;
3. mastery points continue above 9;
4. all five Tier-II roots have real milestone gates;
5. old unlocked IDs survive Save V9 reload;
6. locked Tier-II root explains its missing milestone in UI;
7. Van Packing changes actual field buffer capacity;
8. Contract Choice renders two valid offers and completing either persists history;
9. Automation/Trade Tier-I additions have real economic effects;
10. all Pack A-D / Queue / Human Feedback / Worker Economy / Contract Board V2 regressions stay green.
