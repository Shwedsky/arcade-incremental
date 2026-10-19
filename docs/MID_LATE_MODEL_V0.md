# Mid / Late Structural Model V0

Status: **SECOND QUANTITATIVE PASS — MECHANICS COHERENT, FINAL BALANCE NOT LOCKED**

Reproducible sources:
- `models/mid_late_progression_sim_v0.py`
- `models/worker_route_storage_sim_v0.py`
- `models/mid_late_sensitivity_v0.py`

Proof outputs:
- `docs/proofs/mid_late_milestone_profiles_v0.csv`
- `docs/proofs/mid_late_worker_vs_active_v0.csv`
- `docs/proofs/mid_late_transport_expeditions_v0.csv`
- `docs/proofs/mid_late_talent_pacing_v0.csv`
- `docs/proofs/mid_late_assumptions_v0.csv`
- `docs/proofs/worker_route_throughput_v0.csv`
- `docs/proofs/base_storage_fill_v0.csv`
- `docs/proofs/mid_late_sensitivity_v0.csv`

Structural checks pass in the design workspace.

## Model separation

V0 intentionally separates:
- **progress hours**: active play + approved base offline-equivalent progress;
- **economic value**: active salvage + worker background production;
- **zone mastery**: active player time only.

Workers can fund growth but **cannot discover a new component family, master a frontier zone or open the frontier by themselves**.

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

All major milestones sit inside the current structural bands.

This does **not** lock final prices. It proves the progression spine can be coherent without obvious dead zones.

## Calendar examples

### ~30 min once per day
- Van: day ~15;
- worker: day ~20;
- Hangar: day ~34;
- Salvage Yard: day ~49;
- Industrial Workshop: day ~83;
- Processing Plant: day ~133.

### ~60 min/day split into two sessions
- Van: day ~7.5;
- worker: day ~10;
- Hangar: day ~17;
- Salvage Yard: day ~24.5;
- Industrial Workshop: day ~41.5;
- Plant: day ~66.5.

## Offline finding

`offline_heavy_3x5` progresses materially faster than one 15-minute session per day because the existing 20% / 2h rule applies per absence.

This can reward several short check-ins more strongly than one equal-total-time session.

It is now a tracked balance question rather than an immediate rule change:
- keep the check-in reward;
- or later move worker/offline buffering toward a rolling/daily pool so players do not feel forced to reopen the game.

## Worker vs active output

V0 intentionally keeps passive routes below personal active play.

Bulk target relationship:
- first route: ~20% of active zone bulk rate;
- spare-Van route: ~30%;
- Yard-era route: ~38%;
- mature Industrial route: ~45%;
- Plant-era ordinary bulk may approach ~50%.

Representative rare-component relationship:
- early worker: ~12% of active targeted rate;
- mature worker: ~28%.

Example Z4 Auto Salvage:
- active bulk: ~845 kg/h expected-value input;
- early crew: ~169 kg/h;
- mature crew: ~380 kg/h;
- active gearbox: ~0.60/h;
- early worker gearbox: ~0.072/h;
- mature worker gearbox: ~0.168/h.

This preserves the core rule: **workers provide dependable background supply; personally hunting a needed part remains dramatically faster.**

## Worker route / Driver model

Passive production now has a logistics cycle:

`collect -> remote buffer fills -> delivery downtime -> resume`

Representative route results:

| Route | Buffer | Fill time | Effective no Driver | With Driver | Driver gain |
|---|---:|---:|---:|---:|---:|
| Basic Z1 route | 150 kg | 86 min | 84.7 kg/h | 96.6 kg/h | +13.9% |
| Spare Van Z3 | 400 kg | 115 min | 185.2 kg/h | 200.2 kg/h | +8.1% |
| Truck Z5 | 1,000 kg | 145 min | 382.5 kg/h | 402.5 kg/h | +5.2% |
| Recovery Z7 | 1,800 kg | 154 min | 637.8 kg/h | 676.7 kg/h | +6.1% |

This gives Driver a real purpose without making them a mandatory giant multiplier.

The first worker uses a Basic Route Kit so the player does **not** have to give away their newly purchased Van. Once the player buys Truck, the old Van becomes useful worker infrastructure.

## Base storage model

Representative storage is sized to survive roughly a long offline period even if processing is completely disabled.

| Base | Storage | Worker routes | Input | Fill time |
|---|---:|---:|---:|---:|
| Equipped Garage | 2,000 kg | 1 | 104 kg/h | 19.2h |
| Full Garage | 4,000 kg | 2 | 197 kg/h | 20.3h |
| Hangar | 12,000 kg | 3 | 506 kg/h | 23.7h |
| Salvage Yard | 30,000 kg | 5 | 1,376 kg/h | 21.8h |
| Industrial Workshop | 60,000 kg | 7 | 2,921 kg/h | 20.5h |
| Processing Plant | 150,000 kg | 10 | 5,928 kg/h | 25.3h |

This is a strong first result: storage can matter without background production stopping after 30 minutes.

Actual fill times will usually be longer because processors consume material.

## Transport calibration

Current placeholders:
- Cart: 40 -> 55 -> 75 -> 100 kg;
- Van: ~400 kg;
- Truck: ~1,000 kg;
- Recovery Rig: ~1,800 kg.

Representative gross fill windows:
- 40 kg cart in Z1: ~4.6 min;
- 55 kg cart in Z1: ~6.3 min;
- 75 kg cart in Z2: ~9.7 min before tool/talent correction;
- Van in Z3: ~34.4 min;
- Truck in Z5: ~55 min;
- Recovery Rig in Z7: ~69.5 min.

At Van era, 400 kg / expected ~75 kg cart = roughly **5.3 local unload cycles**, which matches the desired 4–6-cart expedition structure.

Later cart fill times still need realized tool/multi-target/movement throughput rather than raw zone baseline.

## Talent pacing

Current point model:
- Tier I ordinary nodes: 1 point;
- Tier II/III ordinary nodes: 1 point;
- Tier II/III branch capstones: 2 points.

Three-tier total = **115 mastery points**.

Expected totals:
- 8h: 5;
- ~15.6h: 8;
- 20.8h: 9;
- 28h: 13;
- 50h: 25;
- 75h: 39;
- 100h: 51;
- 120h: 62;
- 150h: 77;
- 220h: 112.

A focused Salvage build can therefore approach **Wide Swing / two-target dismantling** around the Van/worker era instead of waiting for deep late game.

At 150h the player still cannot own everything, preserving specialization. Near-full broad completion becomes a very long-tail goal.

## Late-cost / worker sensitivity

Sensitivity sweep changes late milestone costs by ±25% and worker efficiency by ±25%.

For continuous-active play:
- baseline Truck / Yard / Workshop: ~55 / 68 / 87h;
- -25% late costs: ~53 / 63 / 77h;
- +25% late costs: ~58 / 74 / 97h;
- -25% worker efficiency: ~57 / 71 / 92h;
- +25% worker efficiency: ~54 / 66 / 83h.

Even +25% late costs keep Plant around ~124 progress hours, inside the broad late target.

For a 30-min/day profile, many late milestones sit almost exactly on progress gates rather than money gates.

That protects casual progression from cash inflation, but creates a design warning:
- if every casual milestone is always progress-gated, late economic decisions may feel decorative.

The next economy pass should leave at least some meaningful resource/cash pressure without turning casual play into a wall.

## Resource complexity sanity

Only five common raw families are planned across the long-term game:
- ferrous metal;
- copper;
- plastic;
- aluminium;
- alloy scrap.

Depth comes from:
- changing target sources;
- 10 broad component families;
- processed materials;
- four fabricated module families;
- base/worker/transport bottlenecks.

Not from adding fifteen types of ore.

## Construction dependency status

`MILESTONE_RECIPES_V1.md` now defines why workshop outputs matter:
- Clean Copper feeds electrical/control recipes;
- Steel/Aluminium/Alloy outputs feed structural progression;
- Drive / Control / Hydraulic / Structural modules gate Truck/Hangar/Yard/Workshop/Plant growth;
- buying a chassis/building can accelerate cash cost but cannot completely bypass the player's production network.

## Strong enough to keep

Second-pass evidence supports these as the current working baseline:
1. Frontier -> Mastered -> Automated zone lifecycle.
2. Van as mobile buffer while cart remains local collection tool.
3. First worker after Van with a Basic Route Kit.
4. Old vehicles become worker-route infrastructure after player upgrades.
5. Hangar around ~40–50 progress hours is feasible.
6. Five raw families + progressive components avoid inventory explosion.
7. Worker rare-component rates stay useful without beating active hunting.
8. Wide Swing fits the Van/worker era.
9. Base storage can be sized around 20–25h of passive inflow.
10. Driver has measurable but non-mandatory route value.
11. Plant-scale late game can sit at 120h+ without exponential structural grind.

## Still unresolved before visuals

Remaining mechanical/numeric work:
- realized active throughput by tool/talent/zone;
- exact mastery-meter gains per target/haul;
- processed-material production rates and module fabrication times;
- component RNG/fallback for milestone recipes;
- worker hiring/training cost curve;
- Scavenger vs Operator opportunity-cost simulation;
- exact Truck/Yard/Plant construction recipes/costs;
- whether repeated short offline refresh is too strong;
- detailed stock-target behavior for late Automation.

## Visual gate

Still closed.

We now know **what** the Van, Hangar, workers, routes, factories and new resources do. One more focused material/worker opportunity-cost pass should happen before freezing their final visual concepts.