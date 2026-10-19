# Worker & Progression Economy V2 — deterministic model

Status: **MODEL LOCK CANDIDATE** for Issue #26. Runtime implementation must be a separate PR after this model passes CI.

## 1. Why this pass exists

Manual Target Run V1 exposed three structural problems rather than isolated UI bugs:

1. The first worker is advertised after a mastered zone but is still gated by the Van.
2. Z2 introduces new visuals/components but does not feel like a stronger frontier; current XP/min is effectively flat versus Z1.
3. Later base structures still lean too heavily on large raw-metal totals instead of making the processing/fabrication chain the real progression gate.

The goal is not to make the game idle-first. Active frontier play remains the fastest and only source of mastery + first discoveries.

---

# 2. First worker: remove the Van gate

## Locked recommendation

First worker gate becomes:

- Z1 mastered to 100%;
- 35,000 ₽;
- **Van NOT required**.

Keep the existing 35,000 ₽ cost for the first implementation. The current early economy puts that cost near the Z1 mastery window without creating another artificial logistics dependency. We can tune the number later from telemetry rather than moving two variables at once.

The Van becomes an optional worker-route efficiency upgrade, not a hiring prerequisite.

---

# 3. Worker output is derived from the player's demonstrated route

## 3.1 Valid active benchmark

Each zone stores a best valid active benchmark. A qualifying excursion must:

- be played personally by the owner;
- destroy at least 20 targets;
- last at least 45 seconds;
- not use review/dev grants during the excursion;
- contain no worker-generated loot in the measured haul;
- end by returning to base, filling the active logistics chain, or clearing the zone.

Store the **whole excursion vector**, not independent per-resource records:

- duration;
- destroyed targets;
- metal / copper / plastic and zone-specific bulk materials;
- eligible already-discovered components;
- direct-sale-equivalent value.

Choose the resource benchmark by best sustainable value/min from a complete qualifying excursion. This avoids constructing an impossible synthetic benchmark from separate lucky records.

Rare-component benchmark should use a bounded rolling average of recent qualifying runs rather than the single luckiest run. A rare jackpot must not permanently turn the worker into a component printer.

## 3.2 10-minute worker parcel

Every 10 minutes of effective worker time, resource output is a fraction of the benchmark excursion.

Without route vehicle:

`parcel_fraction = min(0.50, 2.20 / benchmark_duration_minutes)`

This preserves the owner's intuitive example: a sufficiently fast route yields **half of one best excursion every 10 minutes**, while slow benchmarks are capped so automation never approaches active throughput.

The resulting worker rate is capped at **22% of demonstrated active throughput**.

### Example model

| Benchmark | Active result | Worker no Van | Relative to active | 2h offline shift |
|---|---:|---:|---:|---:|
| Weak | 32 kg / 7.5 min | 56.3 kg/h | 22.0% | 112.6 kg |
| Average | 48 kg / 4.5 min | 140.8 kg/h | 22.0% | 281.6 kg |
| Strong | 62 kg / 1.5 min | 186.0 kg/h | 7.5% | 372.0 kg |

The strong example intentionally follows the owner's observed intuition of roughly 50 targets / several rare modules in ~1.5 minutes. The worker improves in absolute output as the owner improves, but it does **not** mirror the owner's full speed increase. Active play therefore remains materially more valuable.

## 3.3 Components

Workers may return only component families already discovered personally.

Component output uses the benchmark component average multiplied by the normal worker parcel fraction and an additional **0.35 component factor**.

Rules remain:

- no first discovery from workers;
- no mastery from workers;
- fractional component progress is accumulated internally and only whole components are awarded;
- milestone/signature components may receive stricter family-specific caps in runtime.

---

# 4. Worker fatigue / offline shift

## Locked recommendation

- Online assigned worker can continue operating while the game is open.
- On leaving the game, the route has a maximum **2 hours of offline work budget**.
- At the base the player has an explicit action **`Отправить на смену`** which refreshes that offline budget to 2 hours.
- Closing/reopening the browser does not duplicate already-accounted elapsed time.
- The worker never receives more credit than real elapsed time.

This intentionally supports a player who checks the game every few hours and sends workers out again; that is engagement, not an exploit. The anti-abuse rule is specifically that the same offline interval cannot be credited twice.

No wage/tax loop is added.

---

# 5. Vehicle route bonus and old-vehicle second life

A route vehicle is optional and **exclusive to one worker route at a time**.

Van worker parcel:

- base parcel ×1.35;
- parcel hard cap 65% of one benchmark excursion / 10 min;
- worker throughput hard cap **30% of demonstrated active throughput**.

Model examples:

| Benchmark | Worker + Van | Relative to active | 2h offline shift |
|---|---:|---:|---:|
| Weak | 76.0 kg/h | 29.7% | 152.1 kg |
| Average | 187.2 kg/h | 29.3% | 374.4 kg |
| Strong | 241.8 kg/h | 9.8% | 483.6 kg |

Vehicle lifecycle recommendation:

- first worker can work on foot;
- Van can optionally be assigned to one worker route, but then is not simultaneously available as the player's active route vehicle;
- after Truck is acquired, the old Van naturally becomes attractive worker infrastructure;
- Truck gets the same second-life path after Recovery Rig, preserving the existing Pack D rule;
- one physical vehicle cannot boost multiple workers at once.

This implements the owner's idea that a worker with a Van wastes less time walking/hauling without making `buy Van` a disguised worker unlock.

---

# 6. Zone full-clear medal and online respawn

## Medal condition

Award a per-zone **Efficiency / Full Clear medal** when the player:

- is personally active in the zone;
- destroys every target that existed at the start of that excursion;
- does it without returning to base or changing zone;
- uses no dev grants during the attempt;
- receives no worker kills/loot toward the clear.

Unloading the local cart into a field vehicle is allowed: it is still one active excursion and makes logistics upgrades meaningful.

The medal is **not** required to hire the first worker. Mastery remains the worker-assignment gate.

## After medal

For a mastered zone with its medal:

- destroyed normal targets may respawn one-for-one after a short bounded delay;
- total live targets never exceed the zone's normal field population;
- respawn pauses while the local cart is full;
- unloading into an available field vehicle allows respawn to continue;
- respawned targets give normal active loot/XP but no extra mastery beyond 100%;
- the active player may still make a missing first discovery; workers may not.

The intent is exactly the owner's described reward: once the player proves they can clear the old map in one run, the map stops forcing artificial re-entry just to regenerate junk.

---

# 7. Frontier value curve: Z1 -> Z3

The deterministic comparison uses current target mixes/HP, recommended tool power, current sale prices and a fixed comparative 0.8 sec movement/interaction overhead per target. The absolute numbers are model values; the **ratios** are the decision gate.

## Current

| Zone | Raw kg/min | Direct-sale ₽/min | XP/min |
|---|---:|---:|---:|
| Z1 | 28.0 | 360 | 49.1 |
| Z2 | 33.4 | 436 | 48.2 |
| Z3 | 45.0 | 580 | 49.2 |

The owner's Z2 impression is therefore reproduced: Z2 gives some more bulk value, but **XP/min is actually slightly below Z1**, so the new frontier does not consistently feel stronger.

## Recommended early coefficients

- Z1: yield ×1.00, XP ×1.00
- Z2: yield **×1.30** instead of ×1.15; XP **×1.20**
- Z3: yield **×1.45** instead of ×1.35; XP **×1.30**

Model result:

| Zone | Raw kg/min | Direct-sale ₽/min | XP/min | Raw / target |
|---|---:|---:|---:|---:|
| Z1 | 28.0 | 360 | 49.1 | 0.99 |
| Z2 | 37.7 | 493 | 57.8 | 1.53 |
| Z3 | 48.3 | 623 | 64.0 | 2.69 |

This gives a perceptible frontier step without simply doubling all drops.

### Runtime guardrails

- Resource reward text keeps at least one decimal for fractional early drops; do not visually round a real increase back to the same integer `1`.
- XP should show the zone multiplier in actual awarded values, not only in a hidden rate.
- Z4+ should be validated against a target frontier-value step rather than blindly multiplying raw materials. Use richer composition, aluminium/alloy access, components and processed-material demand to carry part of the value increase.
- Target band after Z3: total active frontier value should generally improve roughly 10–25% per new zone, tapering later; exact Z4-Z8 coefficients remain subject to runtime/content availability.

---

# 8. Progressive recipe ladder

The later base should increasingly be paid for by **processing capability**, not thousands of raw metal.

Recommended model targets:

### Hangar

- 240 metal
- 24 clean copper
- 40 briquettes
- 12 steel blanks
- 6 aluminium billets
- 2 structural modules
- 1 control module

### Salvage Yard

- 280 metal
- 36 clean copper
- 40 briquettes
- 32 steel blanks
- 12 aluminium billets
- 42 alloy billets
- 2 hydraulic-power modules
- 2 heavy frames
- 2 control modules

### Industrial Workshop

- 360 metal
- 70 clean copper
- 60 plastic granulate
- 90 steel blanks
- 36 aluminium billets
- 150 alloy billets
- 3 drive modules
- 4 control modules
- 4 hydraulic-power modules
- 5 heavy frames
- 2 industrial controllers
- 2 heavy hydraulic cylinders

### Processing Plant (future/Z8 spine)

Model target only until Pack E exists:

- 420 metal
- 110 clean copper
- 100 plastic granulate
- 140 steel blanks
- 80 aluminium billets
- 240 alloy billets
- 4 drive modules
- 5 control modules
- 5 hydraulic-power modules
- 6 heavy frames
- 3 industrial controllers
- 3 heavy hydraulic cylinders
- 2 recovery assemblies
- 1 Z8 signature component placeholder

The point is not these numbers being eternally final. The locked structural rule is that raw metal becomes a supporting input while the number and weight of processed/intermediate families rises with each base tier.

Do **not** add deep multi-stage factory chains only to make the recipe look complicated.

---

# 9. Save migration recommendation

Runtime implementation should use **Save V9** because the new mechanics add durable progression semantics, not only presentation.

New durable fields should include conceptually:

- per-zone active benchmark record;
- recent qualifying component benchmark history / accumulator;
- per-zone full-clear medal;
- worker offline shift remaining / last accounted timestamp;
- optional route vehicle assignment;
- worker fractional component accumulator.

V8 -> V9 migration:

- preserve all inventory, mastery, discoveries, workers, assignments, vehicles and buildings;
- existing first worker remains hired regardless of old Van relationship;
- existing mastered zones do **not** receive a free full-clear medal; earn it once under the new rule;
- benchmark starts empty and is populated by the next qualifying active run;
- already-hired workers with no benchmark use a conservative temporary legacy baseline until a valid player benchmark exists, so migration does not silently disable automation;
- offline elapsed time must never be credited twice across migration/reload.

---

# 10. Worker development branch

Do not spend normal player mastery/talent points on worker development in this pass.

Leave the data/UI architecture open for a later crew-specific progression currency. A good future candidate is `Опыт бригады` earned from meaningful completed shifts and/or zone efficiency medals, but that is explicitly outside V2 runtime scope.

---

# 11. Runtime implementation order

After this model passes CI:

1. Save V9 + benchmark/medal/shift domain model.
2. First-worker gate without Van.
3. Benchmark-derived worker simulation and 2h offline shift.
4. Exclusive route-vehicle bonus.
5. Full-clear medal + mastered-zone online respawn.
6. Z2/Z3 reward + XP coefficients and visible reward proof.
7. Recipe ladder changes for implemented bases only; Processing Plant remains a future Pack E contract.
8. Browser acceptance + complete old regression suite.

No production visual overhaul and no Contract Board V2 in this package.
