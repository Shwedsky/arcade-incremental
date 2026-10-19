# Content Pack E V1 — checkpoint

Tracked by Issue #38.

Base main: `1b5b5707f78e987a0e114569d0d7e16fb7293646` (Progression Expansion V2 merged).

## Goal
Close the current macro progression spine with **Z8 Port Terminal + Processing Plant** while preserving the existing active-frontier, shallow-production and anti-skip rules.

## Source of truth
- `docs/ROADMAP_IMPLEMENTATION_AUDIT_V1.md` — P2 next package;
- `docs/MID_LATE_MODEL_V0.md` — Plant around 120h+, 150,000 kg structural storage target;
- `docs/MILESTONE_RECIPES_V1.md` — Plant dependency family and anti-skip intent;
- `models/mid_late_mechanics_sim_v1.py` — Z8 Port Terminal, 5.0 active-hour mastery target and late throughput shape;
- merged Progression Expansion V2 — levels now naturally cover the Z6/Z7/Z8 late gates.

## Locked product rules
1. Player personally opens/masters Z8; workers never earn mastery or first discovery.
2. Do not add a generic resource/component family merely to make Pack E look larger.
3. Reuse Steel / Aluminium / Alloy, current fabricated modules, industrial controllers/cylinders and Recovery-era systems.
4. A Z8 signature salvage item is allowed only as a recognizable Port/Plant progression key and must have deterministic pity.
5. Recovery Rig stays the player's late mobile buffer; Cart remains the local collector.
6. Processing Plant requires Industrial Workshop + Z8 mastery + mixed produced inputs + mature route capability. Cash alone cannot skip the production network.
7. Plant adds a readable industrial-line/storage baseline, not a deep factory-management rewrite.
8. Plant/Z8 should expose hooks for later large contracts and Workforce/Fleet V3 without implementing those whole packages here.

## Delivery sequence
1. reconcile exact runtime numbers against Packs C/D;
2. Pack E domain/state + deterministic smoke;
3. Save compatibility and migration decision;
4. Z8 field/gate/mastery/signature salvage/transport integration;
5. Processing Plant acquisition/production/storage baseline;
6. Plant-scale contract hooks;
7. dedicated Chromium proof + full regression;
8. exact-head review artifact and merge.

Status: **CHECKPOINT COMMITTED / DOMAIN RECONCILIATION IN PROGRESS**.
