# Content Pack E V1 — checkpoint

Tracked by Issue #38.

Base main: `1b5b5707f78e987a0e114569d0d7e16fb7293646` (Progression Expansion V2 merged).

## Goal
Close the current macro progression spine with **Z8 Port Terminal + Processing Plant** while preserving the existing active-frontier, shallow-production and anti-skip rules.

## Source of truth
- `docs/ROADMAP_IMPLEMENTATION_AUDIT_V1.md` — P2 package priority;
- `docs/MID_LATE_MODEL_V0.md` — Plant around 120h+, 150,000 kg structural storage target;
- `docs/MILESTONE_RECIPES_V1.md` — Plant dependency family and anti-skip intent;
- `models/mid_late_mechanics_sim_v1.py` — Z8 Port Terminal, 5.0 active-hour mastery target and late throughput shape;
- `docs/CONTENT_PACK_E_V1_MODEL.md` — reconciled Pack E runtime numbers;
- merged Progression Expansion V2 — level curve naturally covers late frontier gates.

## Implemented Z8
- first-class `z8` zone: **Портовый терминал**;
- level 16 + Z7 mastery + Industrial Workshop + Recovery Rig gate;
- HP multiplier 3.85, yield multiplier 2.90, mastery target 14,200;
- port-heavy target composition: 60% large targets;
- recognizable port target/content vocabulary: reach-stackers, reefers, generators, hoists, power cabinets and crane sections;
- existing aluminium/alloy and already-discovered late industrial component families reused instead of adding a new generic resource;
- signature **Port Power Assembly**:
  - active-player discovery only;
  - large targets only;
  - 3.5% base chance;
  - guaranteed on the 8th eligible miss via deterministic pity;
  - persistent `portPowerDiscovered` history;
- Z8 mastery is capped at 99.9% until the player personally discovers the signature; workers therefore cannot complete the frontier indirectly;
- after 100% mastery, mature Scavenger workers may service Z8 through the existing mastery gate and benchmark-worker rules.

## Implemented Processing Plant
Acquisition is a mixed anti-skip investment, not a cash shortcut.

Hard gates:
- Industrial Workshop owned;
- Recovery Rig owned;
- Z8 mastered;
- Worker #4 hired;
- complete mixed late-game recipe and 1 Port Power Assembly.

Runtime baseline:
- cash: 1,200,000;
- structural storage target shown in Plant state/UI: 150,000 kg;
- 2 independent Plant production lines;
- first line recipe: 50 Alloy Scrap -> 40 Alloy Billet in 300 sec;
- both Plant lines may run concurrently while the existing garage/workshop and Industrial Workshop continue independently;
- Plant production advances online and offline;
- three Plant-scale Contract Board offers become eligible only after actual Plant ownership.

## Save V10
Pack E introduces persistent frontier/Plant state, so runtime schema is **Save V10**.

Migration rules:
- V9 and all earlier supported saves retain existing progression/inventory/infrastructure;
- missing Pack E state normalizes to an empty/unowned default;
- no XP, talent, worker, queue or economy reset;
- signature discovery remains true after the consumed assembly is spent on the Plant.

## Verification already implemented
Permanent gates now include:
- `scripts/content-pack-e-smoke.ts` — deterministic Pack E domain proof;
- `models/content_pack_e_v1.py` — structural Z7 -> Z8 / Plant proof;
- `scripts/browser-pack-e-smoke.ts` — V9->V10 migration, Z8 selection, worker mastery gate, Plant acquisition, dual-line production and reload persistence;
- existing browser suites updated to expect current Save V10 runtime while retaining literal V9 fixtures where migration is intentionally tested;
- CI packages Save V10 RC and a Content Pack E manual-review candidate.

## Guardrails preserved
1. Player personally opens/masters Z8; workers never earn mastery or first discovery.
2. No new generic raw/component family was added merely to enlarge the content pack.
3. Recovery Rig remains the late mobile buffer; Cart remains the local active collector.
4. Processing chains remain shallow/readable.
5. Full Driver/Technician/Foreman fleet redesign, full Tier III, production-art overhaul and monetization remain separate packages.

Status: **IMPLEMENTATION COMPLETE / EXACT-HEAD FULL REGRESSION + ARTIFACT VALIDATION PENDING**.
