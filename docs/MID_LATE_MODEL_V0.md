# Mid / Late Structural Model V0

Status: **FIRST QUANTITATIVE PASS — GOOD ENOUGH TO CONTINUE MECHANICS, NOT FINAL BALANCE**

Reproducible source: `models/mid_late_progression_sim_v0.py`.

Proof outputs:
- `docs/proofs/mid_late_milestone_profiles_v0.csv`
- `docs/proofs/mid_late_worker_vs_active_v0.csv`
- `docs/proofs/mid_late_transport_expeditions_v0.csv`
- `docs/proofs/mid_late_talent_pacing_v0.csv`
- `docs/proofs/mid_late_assumptions_v0.csv`

The model's `--check` structural assertions pass in the design workspace.

## What V0 models

This is an expected-value structural model, not a final economy simulator.

It intentionally separates:
- **progress hours**: active play + approved base offline-equivalent progress;
- **economic value**: active salvage + worker background production;
- **zone mastery**: active player time only.

Important consequence:

Workers can help pay for growth but **cannot open the frontier by themselves**.

## Major milestone pacing

Continuous-active expected-value profile currently lands at:

| Milestone | Progress hours | Target band |
|---|---:|---:|
| Van | 13.6h | 8–15h |
| First worker | 18.1h | 12–20h |
| Full Garage | 26.8h | 18–30h |
| Hangar | 46.1h | 28–50h |
| Truck | 55.4h | 38–65h |
| Salvage Yard | 68.2h | 45–80h |
| Industrial Workshop | 87.2h | 75–120h |
| Processing Plant | 120.0h | 120–180h |

All major milestones currently sit inside their intended structural bands.

This does **not** mean the prices are final. It means the proposed progression spine can be made economically coherent without obvious dead zones.

## Calendar-time examples

### ~30 min once per day
Approximate modeled calendar milestones:
- Van: day 15;
- worker: day 20;
- Hangar: day 34;
- Salvage Yard: day 49;
- Industrial Workshop: day 83;
- Processing Plant: day 133.

### ~60 min/day split into two sessions
- Van: day ~7.5;
- worker: day ~10;
- Hangar: day ~17;
- Salvage Yard: day ~24.5;
- Industrial Workshop: day ~41.5;
- Plant: day ~66.5.

These profiles are useful because the project is intended to support long-running incremental play rather than only multi-hour continuous sessions.

## Important offline finding

The `offline_heavy_3x5` profile progresses materially faster than one 15-minute session per day because the existing 20% / 2h offline rule is applied per absence.

That creates a possible incentive to open the game several times per day purely to refresh offline windows.

This is **not yet declared a problem**, but it is now a tracked balance question:
- do we like rewarding several short check-ins;
- or should long-term worker/offline systems use a daily/rolling buffer so players do not feel forced to reopen the game repeatedly?

Do not change the early-game offline rule yet solely from this model; test it later with real behavior.

## Worker vs active output

V0 intentionally keeps worker output below personal active play.

Representative bulk relationship:
- early crew: ~20% of a zone's active bulk rate;
- mature industrial-workshop crew: ~45% bulk rate.

Representative rarer-component relationship:
- early worker route: ~12% of active targeted rate;
- mature worker route: ~28% of active targeted rate.

Example Z4 Auto Salvage:
- active bulk: ~845 kg/h expected-value input;
- early crew: ~169 kg/h;
- mature crew: ~380 kg/h;
- active gearbox rate: ~0.60/h;
- early worker gearbox rate: ~0.072/h;
- mature worker gearbox rate: ~0.168/h.

This supports the desired rule:

**workers keep background supply flowing; active targeted farming remains dramatically better when you need a specific part.**

## Transport calibration

First-pass capacities:
- Cart: 40 -> 55 -> 75 -> 100 kg;
- Van: ~400 kg;
- Truck: ~1,000 kg;
- Recovery Rig: ~1,800 kg.

Expected fill time using representative zone bulk rates:
- 40 kg cart in Z1: ~4.6 min;
- 55 kg cart in Z1: ~6.3 min;
- 75 kg cart in Z2: ~9.7 min before tool/progression-speed correction;
- Van in Z3: ~34.4 min;
- Truck in Z5: ~55 min;
- Recovery Rig in Z7: ~69.5 min.

The CSV's `equivalent_55kg_cartloads` column is only a common normalization. It is **not** the real number of unloads expected at those eras.

For example:
- 400 kg Van / expected ~75 kg cart = ~5.3 local cart unloads;
- 1,000 kg Truck / 100 kg cart = ~10 unloads over roughly an hour.

This matches the desired Van feeling: multiple local collection cycles without forcing a return home every few minutes.

### Open transport calibration issue

75/100 kg cart fill times are probably overstated because the V0 zone table does not yet multiply bulk rate by the player's improved tool, multi-target talent and movement efficiency.

Next transport model should use **realized player throughput**, not raw zone baseline.

## Talent pacing

V0 continues the committed early XP proof and then assumes a long-tail cadence of roughly one mastery point per 2 progress hours plus milestone bonuses.

Expected totals:
- 8h: 5 points;
- ~15.6h: 8 points;
- ~20.8h: 9 points;
- 28h: 13 points;
- 50h: 25 points;
- 75h: 39 points;
- 100h: 51 points;
- 120h: 62 points;
- 150h: 77 points.

Design implication:

A player who heavily specializes in Salvage can finish the current Tier I Salvage line and approach the first Tier II node — **Wide Swing / two-target dismantling** — around the Van/worker era instead of waiting until deep late game.

This matches the intended reward timing better than placing multi-target dismantling at 50h+.

The total planned tree is intentionally larger than what a player owns at 150h, so meaningful specialization remains. Exact total node count may still be reduced during tree review.

## Resource progression sanity

The model currently assumes only five common raw families in the whole long-term game:
- ferrous metal;
- copper;
- plastic;
- aluminium;
- alloy scrap.

This is deliberate. Mid/late depth primarily comes from:
- changing source targets;
- components;
- processed materials;
- fabricated modules;
- worker/transport/base bottlenecks;

—not from adding fifteen kinds of ore.

## What is now strong enough to keep

V0 supports keeping these mechanics as the working baseline:
1. Frontier -> Mastered -> Automated zone lifecycle.
2. Van as mobile buffer while cart remains local collection tool.
3. First worker after Van.
4. Old vehicles gain worker-route use after the player upgrades.
5. Hangar around ~40–50 progress hours is feasible.
6. New resources/components can be introduced gradually without inventory explosion.
7. Worker rare-component rates can remain useful without beating active hunting.
8. Two-target Salvage can become a meaningful mid-game reward around the Van/worker era.
9. Plant-scale late game can sit at 120h+ without requiring exponential grind in the first structural pass.

## Still unresolved before visuals

The next quantitative iteration must refine:
- actual player tool/talent throughput by zone;
- zone mastery meter speed;
- worker route buffers / storage stoppage;
- worker count/hiring costs;
- Driver vs Scavenger vs Operator opportunity cost;
- detailed processed-material throughput;
- exact base/vehicle construction recipes;
- whether multi-session offline refresh is too strong;
- sensitivity around Truck / Yard / Plant costs;
- Tier II/III mastery-point node cost structure.

## Visual gate remains closed

No need to draw Van/Hangar/Factory production concepts yet.

Mechanics are now coherent enough for a **second balance/model pass**, but several numeric dependencies still need refinement before we freeze the objects that visuals must represent.