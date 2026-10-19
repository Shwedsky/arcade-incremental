# Mid / Late Validation Plan V1

Status: **REQUIRED BEFORE MID/LATE VISUAL PRODUCTION**

This document defines what must be proven numerically before spending time on full mid/late visual concepts.

## Why this exists

The current mechanics are intentionally ambitious:
- multiple zones;
- transport tiers;
- workers;
- passive mastered-zone routes;
- expanding bases;
- advanced materials/components;
- late production cells.

Without a reproducible model it would be easy to build an appealing concept where:
- the van becomes obsolete too quickly;
- the first worker removes too much reason to play actively;
- Hangar costs either feel trivial or impossible;
- passive workers flood rare components;
- old-zone storage fills every few minutes;
- too many resource families arrive at once.

## Required simulation outputs

### 1. Major milestone pacing
Model expected progression hours and calendar time for at least:
- Van;
- first worker;
- full Garage;
- Hangar;
- Truck;
- Salvage Yard;
- Industrial Workshop;
- Processing Plant.

Profiles should include at least:
- heavy active player;
- ~60 min/day;
- ~30 min/day;
- short-session/offline-heavy player.

Acceptance intent:
- preserve the already approved Van / worker / Hangar target bands;
- avoid major gaps where the player has no visible next objective;
- later stages should expand total playtime without exponential dead zones.

### 2. Expedition length by transport
For each transport tier model:
- cart loads per expedition;
- expected time before forced unload/home;
- expected active target count;
- bulk kg returned;
- component events per expedition.

Target player feeling:
- Cart only: short local runs;
- Van: several cart cycles before home;
- Truck: practical industrial runs;
- Heavy rig: late heavy recovery, not simply infinite inventory.

### 3. Worker vs active yield
For representative mastered zones compare:
- active player bulk kg/h;
- worker bulk kg/h;
- active targeted component/h;
- worker component/h.

Acceptance intent:
- one early worker crew should feel useful but not replace active play;
- mature crews may produce large bulk supply;
- focused active farming must remain clearly best for a needed rare component;
- workers cannot discover new components/zone mastery.

### 4. Worker/vehicle assignment value
Model opportunity cost of:
- keeping Van for player use;
- assigning Van to Z1/Z2 crew after Truck unlock;
- assigning Truck vs light vehicle to a worker route;
- adding Driver vs second Scavenger;
- assigning a worker to field route vs Machine Operator.

There should be no universally correct worker assignment for all stages.

### 5. Storage bottlenecks
Estimate fill times for:
- Garage storage;
- Hangar storage;
- Salvage Yard bulk storage;
- remote vehicle buffers.

Acceptance intent:
- storage upgrades matter;
- background production should not stop after 10 minutes by default;
- a player returning after the offline cap should receive a useful bottleneck report.

### 6. Resource-family introduction
At every milestone count how many resource/component families the player is actively expected to care about.

Target:
- 0–4h: 3 raw + 4 component families;
- 4–15h: add at most 2 component families + aluminium;
- 15–40h: add at most 2 component families;
- 28–80h: add alloy + 2 industrial component families;
- late game: do not keep adding raw families just to inflate complexity.

### 7. Production-chain throughput
For each important processed material calculate:
- input/h;
- output/h;
- worker/operator effect;
- sale value/h;
- module consumption/h or milestone demand.

Required materials:
- briquettes;
- clean copper;
- plastic granulate;
- aluminium billet;
- steel blank;
- alloy billet.

Acceptance intent:
- processing should have both sale and construction value;
- one machine should not permanently dominate all other processing choices;
- late automation should absorb repetitive short batches.

### 8. Talent pacing
Simulate mastery points through at least 150 progression hours.

Measure:
- earliest Tier II access;
- earliest Wide Swing / two-target dismantling;
- earliest worker-automation specialization;
- earliest Tier II capstone;
- earliest Tier III access;
- expected percentage of total tree owned at 20h / 50h / 100h / 150h.

Acceptance intent:
- meaningful specialization exists for long periods;
- eventual broad completion remains possible for a long-running incremental game;
- player cannot farm Z1 forever and bypass milestone gates.

## Structural invariants

The model/proofs must fail if any of these are violated:

1. first worker occurs before Van;
2. Hangar occurs before full-Garage pressure exists;
3. worker automation is possible on an unmastered zone;
4. passive workers can discover a component family;
5. a new raw resource has no immediate processing/recipe sink;
6. active targeted component farming becomes worse than a basic worker route;
7. previous transport has no post-upgrade use;
8. late game eliminates all reason to enter active zones.

## Deliverables before visuals

Required repository artifacts:
- `models/mid_late_progression_sim_v0.py`;
- milestone profile CSV;
- worker-vs-active yield CSV;
- transport expedition CSV;
- talent pacing CSV;
- assumptions CSV / documented constants;
- summary document with findings and required rebalance decisions.

## Visual gate

Mid/late visual production begins only when:
- mechanics docs are accepted;
- simulation outputs are within target bands or deviations are consciously approved;
- resource/component list is stable enough that environment props and machine concepts will not immediately become obsolete.

Early approved visual direction remains valid; this gate only delays expansion into the new zones/bases/vehicles/workers.