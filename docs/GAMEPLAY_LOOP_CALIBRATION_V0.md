# Gameplay Loop Calibration V0

Status: **READY FOR OWNER REVIEW**

This document connects the approved arcade feel to the existing economy model. It turns the first 90 minutes from abstract kg/hour into a discrete loop of targets, break times, cart trips, visible pickups and component drops.

Reproduce with:

```bash
python models/gameplay_loop_sim_v0.py
```

The script regenerates the proof CSVs in `docs/proofs/`.

## Core conclusion

The active loop should be much denser than "go out for four appliances".

Baseline target:

- **~9 destroyed targets per minute**;
- **~46–49 visible resource pickups/fragments per minute**;
- one 40 kg starting cart trip lasts about **4.3 minutes**;
- a starting trip breaks about **38 targets**;
- after the first cart/tool upgrades, a trip lasts about **5.5 minutes** and breaks about **52 targets**;
- early component drops average roughly **9–10 per active hour** across all four early component families.

This produces the desired arcade rhythm while keeping the macro resource value almost identical to Economy Simulation V0.

## Important interpretation rule

`MOVE_SECONDS_PER_TARGET = 4.5` and `RETURN_AND_UNLOAD_SECONDS = 35` are **simulation overhead**, not literal mandatory walking/animation delays.

They represent a mixture of:
- steering around obstacles;
- target selection;
- short travel between clusters;
- route inefficiency;
- returning;
- unloading;
- brief garage decisions.

The playable prototype must not make the player stare at a 35-second return animation.

## First map density

Recommended first-zone population: roughly **70–90 active breakable nodes**.

The starting cart consumes about 38 targets per trip; the early 55 kg cart consumes about 52. Therefore the player should still have route/target choice and should not simply clear four large props.

A return to the garage can partially refresh/reseed the route. This is an arcade abstraction, not a realistic persistent open world.

Representative 80-node mix from the calibrated probabilities:

- ~27 small scrap piles;
- ~14 cable bundles;
- ~16 small appliances;
- ~10 bicycle/fan-sized targets;
- ~8 medium appliances;
- ~4 large appliances.

Exact props can vary visually without changing the class math.

## Object-class calibration

| Class | Share | Auto-break time | Typical raw weight | Visual pickup fragments | Early component chance |
|---|---:|---:|---:|---:|---:|
| Small scrap | 34% | 0.45 s | ~0.45 kg | 3 | 0% |
| Cable bundle | 18% | 0.65 s | ~0.24 kg | 4 | 0% |
| Small appliance | 20% | 1.2 s | ~0.89 kg | 5 | 1.5% |
| Bike / fan class | 13% | 1.8 s | ~1.56 kg | 7 | 3.5% |
| Medium appliance | 10% | 3.2 s | ~2.30 kg | 9 | 5.5% |
| Large appliance | 5% | 5.0 s | ~3.60 kg | 12 | 9% |

These are gameplay weights/yields, not attempts at real-world appliance mass. A washing-machine sprite can represent a valuable destructible node without forcing the cart to obey literal 60 kg household-appliance physics.

The fantasy is "salvage value/haul load", not a logistics simulator.

## Why small gameplay weights are intentional

If one refrigerator consumes the whole starter cart, the active loop becomes:
1. find appliance;
2. break it;
3. return;
4. repeat.

That directly contradicts the approved product principle.

Instead, a large appliance produces many visible fragments and a meaningful chunk of the cart meter, but the player still destroys many targets per trip.

## Baseline phase results

Monte Carlo, fixed seed, 20,000 simulated trips per phase:

| Phase | Cart | Tool | Trip | Objects/trip | Objects/min | Pickups/min | Components/h |
|---|---:|---:|---:|---:|---:|---:|---:|
| Start, 0–15m | 40 kg | 1.00× | ~4.29m | ~38.3 | ~8.92 | ~45.9 | ~9.28 |
| Tool upgrade, 15–30m | 40 kg | 1.10× | ~4.21m | ~38.3 | ~9.08 | ~46.7 | ~9.52 |
| Cart + tool, 30–90m | 55 kg | 1.10× | ~5.55m | ~52.3 | ~9.43 | ~48.5 | ~9.88 |

The important progression is not that the player suddenly gets 2× richer. The same loop becomes smoother and lets the player stay in the field longer.

## Macro-economy compatibility

At the start-state calibration, the discrete simulation produces approximately:

- metal: **418 kg/h**;
- copper: **27.8 kg/h**;
- plastic: **80.1 kg/h**.

Economy Simulation V0 used:

- metal: 420 kg/h;
- copper: 27 kg/h;
- plastic: 75 kg/h.

This is close enough that we do **not** need to rebuild the macro progression merely to make the active loop denser.

At the existing base sale values, the discrete loop produces about the same gross value per active hour as the V0 economy benchmark.

## Early component cadence

The four approved early components remain:

- Bearings;
- Electric Motor;
- Hydraulic Unit;
- Electronic Module.

Start-state simulated rates are approximately:

- bearings: ~5.0/h;
- electric motor: ~2.0/h;
- hydraulic unit: ~0.6–0.7/h;
- electronic module: ~1.6–1.8/h.

Total component event cadence is around **9–10/h**, or roughly one component event every **6–7 active minutes** on average.

Not every component needs the same presentation strength:
- bearings/electronic module can use a strong uncommon pickup;
- electric motor/hydraulic unit can use the bigger rare-component burst.

Mandatory progression still keeps the targeted-source/shop fallback from Economy Simulation V0.

## Visual reward cadence

The model distinguishes economics from presentation.

A single destroyed object can produce multiple short-lived visual pickup fragments even if the backend only records a few resource quantities.

Target feel:
- **~9 break events/minute**;
- **~46–49 pickup fragments/minute**;
- resource counters update continuously;
- nearby fragments magnet into the cart;
- component event every several minutes;
- large objects emit a visibly larger burst.

Do not render 49 persistent physics objects every minute indefinitely. Pickups should be cheap, pooled, short-lived presentation.

Numeric callouts may aggregate nearby same-resource fragments to avoid unreadable text spam.

## First 90 minutes in physical terms

Using:
- 0–15m: 40 kg cart, base tool;
- 15–30m: first tool improvement (~10%);
- 30–90m: 55 kg cart + improved tool;

the expected active-equivalent first 90 minutes contain roughly:

- **836 destroyed targets**;
- **4,303 visual pickup fragments**;
- **17.9 cart/garage cycles**;
- **654 kg metal** gross collected;
- **43 kg copper** gross collected;
- **125 kg plastic** gross collected;
- **14–15 component events**.

These are gross expected collection events before:
- recipe spending;
- selling;
- contracts;
- press input;
- tutorial pauses;
- menus;
- offline periods.

A real first-time human will likely produce less because they read UI and make decisions. That is desirable; the simulation establishes the upper rhythm, not a speedrun promise.

## First 90-minute pacing recommendation

### 0–5 min
- no long tutorial;
- player is moving within seconds;
- first target breaks almost immediately;
- several targets should die before any modal explanation;
- first cart return happens around minute 4–5.

### 5–15 min
- repeat the satisfying loop;
- first Mastery point appears;
- foundational talent choices only;
- first component should normally have appeared by now;
- offline system is explained.

### 15–30 min
- first tool upgrade around this window;
- break cadence rises slightly;
- cart is still 40 kg, so the player notices that capacity has become the friction point;
- first contract and press preview can appear.

### 30–45 min
- 55 kg cart becomes the first major logistics improvement;
- press recipe becomes concrete;
- player can deliberately hunt bearings/hydraulic source.

### 45–65 min
- targeted hunt + remaining recipe requirements;
- press fabrication begins;
- active loop continues while the timer runs.

### 65–90 min
- press appears physically in the garage;
- player starts feeding loose metal into it;
- arcade collection remains useful because the first machine now creates demand for the material stream.

## Combo implications

Combo remains deeper in the Salvage tree, around 2–4h for a player specializing in that branch.

That is intentional.

The first 90 minutes must already feel good **without Combo**. Combo later amplifies a loop that is already satisfying rather than rescuing a weak baseline.

When unlocked, Combo should alter:
- audiovisual intensity;
- dismantle speed;
- pickup momentum;
- route pressure.

It should not be required to reach the baseline ~9 breaks/minute.

## Prototype acceptance targets

The first playable active-loop prototype should be considered off-target if human testing shows any of the following:

- fewer than ~6 meaningful break events/minute during normal movement;
- more than ~12/minute with no time to visually read the result;
- starting trip regularly under 3 minutes (cart friction too weak);
- starting trip regularly over 6 minutes (upgrade feedback arrives too slowly);
- large targets feel like long HP sponges rather than satisfying jackpots;
- common resource pickups are hard to read;
- component drops do not feel clearly more valuable than common resource bursts;
- the player spends more time travelling back than breaking things.

The target band is not sacred; human feel wins. But deviations should be deliberate and fed back into the reproducible model.

## Files

- `models/gameplay_loop_sim_v0.py` — reproducible discrete Monte Carlo model;
- `docs/proofs/gameplay_loop_v0_object_classes.csv` — class inputs;
- `docs/proofs/gameplay_loop_v0_phase_results.csv` — simulated trip/rate outputs;
- `docs/proofs/gameplay_loop_v0_first90_summary.csv` — first-90 aggregate proof;
- `docs/ECONOMY_SIM_V0.md` — macro pacing model this calibration is constrained to.

## V0 decision

Proceed to prototype using this feel target:

**dense field, ~9 breaks/min, ~4–5.5 minute haul cycles, dozens of targets per trip, constant magnetized resource motion, and a special component beat every several minutes.**

The active loop should feel like repeatedly turning a cluttered field into rising numbers, not like realistically transporting four household appliances.
