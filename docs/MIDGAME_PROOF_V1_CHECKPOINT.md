# Midgame Proof V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER BUILD UNTIL INTERNAL GREEN**

Base: `main` @ `e09791c7120e90c669cb5413dde8c78b6e0092da`

## Goal

Prove the long-term game model with one coherent playable bridge from accepted Early Game into the first automated old-zone loop.

Required proof:

`Z1 active -> unlock/select Z2 -> master old zone -> unlock/select Z3 -> Van as field buffer -> hire first worker -> assign worker to mastered Z1 -> passive Z1 supply while player runs Z3`

## Hard rules
- Garage remains freely enterable at any time.
- Existing Early Game systems and Save V3 must migrate forward without wipe.
- Zone mastery is active-only.
- Workers cannot discover components or master zones.
- First worker is after Van and uses Basic Route Kit; player keeps Van.
- Van does not replace the Hand Cart. It receives multiple cart unloads in-field.
- Production visual polish remains deferred. Current style is functional scaffolding.
- No owner-facing package until build + deterministic + model + headless-browser integration checks are green.

## Planned implementation blocks

1. Midgame domain model
   - Z1/Z2/Z3 definitions
   - unlock gates
   - mastery state
   - Van state/capacity
   - worker/route state
   - save migration V3 -> V4

2. Zone selection / active field integration
   - map/zone selector
   - per-zone target mix/drop multiplier
   - current zone HUD
   - mastery gain on active destruction

3. Van loop
   - purchase gate
   - 400 kg field buffer
   - unload cart to Van without returning home
   - Van + cart returned to garage together

4. First worker
   - hire gate after Van
   - assign only to mastered zone
   - Basic Route Kit 150 kg
   - passive bulk and discovered-component supply
   - offline route simulation/report

5. Acceptance automation
   - pure midgame smoke
   - Save V3 migration
   - zone mastery constraints
   - Van unload cycles
   - worker assignment restrictions
   - offline worker yield
   - headless Chromium integrated flow

## Explicitly not in this proof
- final production art;
- Hangar/Truck/Z4+ runtime;
- full Tier II UI/art;
- Worker Driver/Operator roles beyond the first Scavenger route;
- Yandex SDK/ads.
