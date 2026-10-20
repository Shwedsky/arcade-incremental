# Arcade Incremental

Long-term browser arcade/incremental game about scavenging, dismantling, recycling and growing from one person with a hand cart into an industrial salvage business.

## Current status

**Playable integrated Save V10 baseline. The mechanical spine is implemented through Z8 / Processing Plant, but owner review confirms that the visible/base-management experience is still around the Garage -> workforce -> early Hangar transition.**

Current playable systems include:
- top-down active scavenging with automatic dismantling, drops and magnet pickup;
- garage/base, staged contracts, partial selling and resilient local/cloud-ready saves;
- physical tool/cart upgrades plus five XP/mastery talent branches;
- level progression through 30 with first coherent Tier-II milestone roots;
- timed machine construction, upgrades and processing;
- deterministic reorderable workshop scheduler with batch processing and offline continuation;
- zones Z1-Z8 with frontier/mastery/active-discovery gates;
- mastered-zone full-clear medals and online respawn;
- Van -> Truck -> Recovery Rig logistics progression;
- benchmark-derived workers, two-hour shifts, mastered-zone passive routes and Operator roles;
- Hangar, Salvage Yard and Industrial Workshop mechanical milestones;
- Processing Plant baseline with two independent industrial lines;
- processed-material / fabricated-module recipe ladder;
- Contract Board V2 with staged eligibility and repetition protection;
- Pack A-E regression coverage and dedicated Chromium acceptance;
- static release-candidate packaging and Yandex SDK adapter boundary.

The project has deliberately stopped treating mechanical breadth as equivalent to finished progression. The next production work focuses on visible business evolution, base UX, workforce/fleet depth and mathematically coherent talents before adding more frontier breadth.

See:
- `docs/PRODUCT_ROADMAP_V2.md` — **current forward product roadmap and package order**;
- `docs/ROADMAP_IMPLEMENTATION_AUDIT_V1.md` — historical implementation audit before Progression V2 / Pack E;
- `docs/PROGRESSION_EXPANSION_V2_CHECKPOINT.md` — current level-30 / Tier-II foundation;
- `docs/CONTENT_PACK_E_V1_CHECKPOINT.md` — current Z8 / Processing Plant mechanical baseline;
- `docs/WORKER_PROGRESSION_ECONOMY_V2_MODEL.md` — benchmark worker and zone-value model;
- `docs/WORKSHOP_QUEUE_UX_V1_CHECKPOINT.md` — workshop scheduler semantics;
- `docs/YANDEX_RELEASE_READINESS_V1.md` — platform/publication boundary; some wording is historical.

## Local development

```bash
npm install
npm run dev
```

Production validation/build:

```bash
npm run build
```

The ordinary GitHub Actions pipeline runs deterministic/domain tests, Chromium regressions, responsive/platform proofs and packages release candidates.

## Manual review package

Current feature pipelines produce uniquely named review artifacts containing:
- a Windows `START_REVIEW.bat`;
- isolated fresh-save entry page;
- `BUILD_INFO.txt`;
- current review checklist;
- localhost-only DEV presets for milestone/late-game review.

The dedicated review server uses `127.0.0.1:41971` so browser storage is separated from ordinary dev/preview origins.

## Product direction

The long-term player/business evolution is now framed as:

`Active Scavenger -> Working Garage -> Van/Workers -> Hangar Operator -> Salvage Network -> Industrial Workshop -> Processing Plant`

The active dismantling/frontier loop remains the heartbeat at every stage. Mastered work is increasingly automated around it rather than replacing it.

The next roadmap order is:

`P0 Architecture + Economy/Talent Model V3 -> P1 Garage/Active V2 -> P2 Workforce & Van V3 -> P3 Hangar Transformation -> P4 Salvage Yard/Fleet Network -> P5 Industrial Workshop/Production Cells -> P6 Processing Plant V2 -> P7 production polish/platform/monetization`

New major work should follow `docs/PRODUCT_ROADMAP_V2.md` rather than stale historical issue text.

## Repository evidence policy

Important product decisions, visual baselines, mathematical models, simulation outputs, implementation proof and owner-review gates should be committed to this repository instead of existing only in chat history.
