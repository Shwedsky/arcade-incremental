# Economy Simulation V0

Status: **READY FOR OWNER REVIEW**

This is the first reproducible pacing model for the approved Design V2 baseline. It is deliberately an expected-value model, not final game balance.

Run with:

```bash
python models/economy_sim_v0.py
```

The script regenerates the CSV evidence in `docs/proofs/`.

## What V0 is trying to prove

The first question is not whether every price is final. The question is whether a plausible economy can simultaneously achieve:

- first Small Compactor Press in roughly 45–90 minutes of continuous active progression;
- equipped garage in roughly 4–8 progression hours;
- van in roughly 8–15 progression hours;
- first worker in roughly 12–20 progression hours and always after van;
- full garage in roughly 18–30 progression hours;
- hangar in roughly 28–50 progression hours;
- useful offline progress from the first session without making active play irrelevant.

V0 passes those high-level pacing checks under the baseline assumptions.

## Baseline input model

### Net active collection rates

These rates are intentionally modeled as **net delivered yield** after average movement/return overhead rather than as literal object physics:

| Resource | Net rate | Base sale value |
|---|---:|---:|
| Metal | 420 kg/h | 8 virtual RUB/kg |
| Copper | 27 kg/h | 60 virtual RUB/kg |
| Plastic | 75 kg/h | 5 virtual RUB/kg |

Baseline raw gross value is therefore about **5,355 virtual RUB per active hour** before upgrades and processing value-add.

The physical prototype should still present a starting hand cart around 40 kg and an early upgrade around 55 kg; V0 collapses this into throughput multipliers rather than simulating each individual return trip.

### Early component expected rates

| Component | Expected rate |
|---|---:|
| Bearings | 5.0 / active-equivalent h |
| Electric motor | 2.0 / h |
| Hydraulic unit | 0.7 / h |
| Electronic module | 1.8 / h |

Mandatory progression must never hard-lock behind RNG. For the first press, V0 assumes that once the recipe is revealed, a targeted source such as a discarded floor jack guarantees the first hydraulic unit by about **0.72 progression hours** if normal drops have not already supplied one.

Later mandatory recipes should use the same principle: targeted source, pity/guarantee and/or expensive shop fallback.

### Offline baseline

- efficiency: **20%** of active baseline;
- cap: **2 hours per absence**;
- fabrication timers continue while offline;
- installed machines can contribute during an absence after their fabrication finishes;
- first worker later increases offline throughput rather than unlocking offline.

### Combo assumption

V0 assumes a player specializing in Salvage reaches Combo at about **2.5 progression hours**. It is modeled as only about **+6% average realized active throughput**.

This is intentionally conservative: Combo is primarily a rhythm/visual mechanic and must not become an uncontrolled money multiplier.

## First machine assumptions

### Small Compactor Press

Build path in V0:

- 100 kg metal;
- bearings x2;
- hydraulic unit x1;
- 2,500 cash;
- 25 min fabrication.

Raw metal used in recipes is charged at its sale opportunity cost in the model, so building equipment is not treated as free simply because the player already owns the material.

Press processing assumption:

- up to 180 kg metal/h;
- briquette value uplift: +25%;
- physical game benefit also includes strongly reduced storage volume.

A ready-made shop purchase remains a much more expensive shortcut; its exact 20–25k early price is still a design placeholder and is not used by the baseline auto-build strategy.

## Baseline milestone result

For a continuous active benchmark:

| Milestone | Active/progression time |
|---|---:|
| Small Compactor Press complete | **1.22 h** |
| Wire stripper | **2.57 h** |
| Inspection/components bench | **4.15 h** |
| Plastic shredder | **5.73 h** |
| Van | **13.42 h** |
| First worker | **16.88 h** |
| Full garage | **23.58 h** |
| Hangar | **43.35 h** |

This sits inside every current Design V2 target band.

The important result is the shape: the first satisfying machine arrives in the first session, while major infrastructure changes remain long-term goals.

## Calendar-time examples with offline enabled

These profiles are not player promises; they show how the same economy behaves under different habits.

| Profile | Van | Worker | Hangar |
|---|---:|---:|---:|
| 15 min/day, one login | ~21 days | ~27 days | ~64 days |
| 30 min/day, one login | ~15 days | ~19 days | ~47 days |
| 60 min/day, two 30m sessions | ~7.5 days | ~9.5 days | ~23.5 days |
| Heavy, 3×60m/day | ~3.0 days | ~4.0 days | ~10.0 days |
| Offline-heavy, 3×5m/day | ~9.5 days | ~12.3 days | ~28.3 days |

This achieves the intended idle property: a player who checks in briefly still progresses, but a genuinely active player reaches the same infrastructure in fewer calendar days.

## Sensitivity findings

### 1. Offline cap is the strongest early retention lever

For a 30 min/day player:

- 1h cap -> van ~19 days, hangar ~60 days;
- **2h cap -> van ~15 days, hangar ~47 days**;
- 3h cap -> van ~13 days, hangar ~38 days.

For the 3×5m offline-heavy profile:

- 1h cap -> hangar ~48.5 days;
- **2h cap -> ~28.3 days**;
- 3h cap -> ~20 days.

Conclusion: keep the early **2h cap**. Increasing the cap is much more powerful than it initially appears and should be a meaningful later talent/infrastructure reward.

### 2. 20% offline efficiency is a reasonable starting point

For 30 min/day:

- 15% -> van ~17 days / hangar ~53 days;
- **20% -> ~15 / ~47 days**;
- 25% -> ~14 / ~42 days.

20% provides visible progress without immediately collapsing active-vs-idle separation.

### 3. Raw-price tuning has healthy room

Continuous-active van timing under a ±10% global raw-price change:

- -10% prices -> ~14.75h;
- baseline -> **13.42h**;
- +10% -> ~12.33h.

All remain inside the 8–15h target band. Hangar shifts roughly 39.7–47.8h and remains around the desired range.

This means we have room for human-test tuning without rebuilding the entire progression structure.

### 4. Mandatory component progression is intentionally insensitive

A ±30% change to component expected drop rates did not materially move the modeled milestones. That is not because components do not matter; it is because the current model uses targeted/guaranteed early progression plus shop fallback.

This is desirable. Rare drops should feel exciting, but a bad random seed should not stop the player from building a mandatory machine.

A later Monte Carlo model should validate the actual RNG/pity implementation once object tables exist.

## First-90-minute interpretation

The baseline continuous run completes the press at about **73 minutes**, which fits the approved first-session target.

The intended experience remains:

1. learn satisfying destruction and collection;
2. buy first basic tool/cart improvements;
3. reveal the press recipe;
4. deliberately hunt the missing component if necessary;
5. begin fabrication;
6. continue scavenging while it builds;
7. see the press physically appear and start turning loose metal into compact higher-value output.

A once-daily 30-minute player completes the same press around the second calendar day because offline progress contributes immediately. This is consistent with the requirement that offline be meaningful from the start.

## Current watchpoint: check-in frequency

Because the cap is per absence, multiple short logins can claim several capped offline windows per day. The `offline_heavy_3x5` profile demonstrates this clearly.

For now this is **not treated as a bug**: encouraging several brief check-ins is compatible with the product goal. But human testing should answer whether this feels rewarding or exploitable.

If it becomes too strong, options include:

- diminishing efficiency on repeated offline windows in one day;
- a soft daily offline-production pool;
- later cap growth tied more strongly to infrastructure rather than pure talent points.

Do not change this before testing; V0 simply exposes the lever.

## V0 limitations

This model intentionally does **not** yet simulate:

- discrete physical objects and exact route choice;
- cart-by-cart trips;
- hard storage blocking;
- exact random drop distributions;
- player mistakes or different talent builds;
- ad rewards;
- contract selection behavior;
- manual selling/keeping decisions;
- different zone object mixes;
- prestige or late-game factory systems.

The next simulation version should become more discrete only after the first playable prototype tells us how fast the active loop actually feels.

## Evidence files

- `models/economy_sim_v0.py` — reproducible model;
- `docs/proofs/economy_sim_v0_assumptions.csv` — model inputs;
- `docs/proofs/economy_sim_v0_profile_results.csv` — baseline player-profile outputs;
- `docs/proofs/economy_sim_v0_sensitivity.csv` — sensitivity sweep;
- `docs/VISUAL_BASELINE.md` and `docs/visual/approved_visual_baseline_v1_thumb.jpg` — approved visual evidence.

## V0 conclusion

The current concept is mathematically plausible without requiring fast exponential progression.

The strongest recommendation from V0 is:

**keep 20% / 2h as the initial offline baseline, keep van around 70k under the current income scale, and treat offline-cap upgrades as powerful progression rewards rather than cheap early percentage nodes.**
