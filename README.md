# Arcade Incremental

Long-term browser arcade/incremental game about scavenging, dismantling, recycling and growing from one person with a hand cart into an industrial salvage business.

## Current status

**Playable integrated Save V9 baseline. Core mechanical progression is implemented through Z7 / Industrial Workshop, with Workshop Queue UX, Worker Economy V2 and Contract Board V2 merged into `main`.**

Current playable systems include:
- top-down active scavenging with automatic dismantling, drops and magnet pickup;
- garage/base, staged contracts, partial selling and resilient local/cloud-ready saves;
- physical tool/cart upgrades plus XP/mastery talent branches;
- timed machine construction, upgrades and processing;
- deterministic reorderable workshop scheduler with batch processing and offline continuation;
- zones Z1-Z7 with frontier/mastery/active-discovery gates;
- mastered-zone full-clear medals and online respawn;
- Van -> Truck -> Recovery Rig logistics progression;
- benchmark-derived workers, two-hour shifts, mastered-zone passive routes and Operator roles;
- Hangar, Salvage Yard and Industrial Workshop mechanical milestones;
- processed-material / fabricated-module recipe ladder;
- Contract Board V2 with staged eligibility and repetition protection;
- Pack A-D regression coverage and dedicated Chromium acceptance;
- static release-candidate packaging and Yandex SDK adapter boundary.

The first owner manual-review cycle has already produced and closed multiple fix/improvement packs. The current planning source of truth is now the roadmap implementation audit rather than the original first-run checklist.

See:
- `docs/ROADMAP_IMPLEMENTATION_AUDIT_V1.md` — current implemented / partial / missing / superseded matrix and next package order;
- `docs/WORKER_PROGRESSION_ECONOMY_V2_MODEL.md` — benchmark worker and zone-value model;
- `docs/WORKSHOP_QUEUE_UX_V1_CHECKPOINT.md` — workshop scheduler semantics;
- `docs/CONTENT_PACK_D_V1_CHECKPOINT.md` — current implemented late frontier before Z8;
- `docs/MANUAL_TARGET_RUN_V1.md` — historical/current owner-review checklist;
- `docs/YANDEX_RELEASE_READINESS_V1.md` — platform/publication boundary (some schema wording is historical; runtime save is V9).

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
- current review checklist.

The dedicated review server uses `127.0.0.1:41971` so browser storage is separated from ordinary dev/preview origins.

## Product direction

Long-term macro progression remains:

`Hand Cart -> working Garage -> Van/Workers -> Hangar -> Truck -> Salvage Yard -> Recovery Rig -> Industrial Workshop -> Processing Plant`

The audited next order is:

`Progression Expansion V2 -> Content Pack E (Z8 + Processing Plant) -> Workforce/Fleet depth -> production visual/base pass -> platform/monetization/publication`

This order may be refined by integrated human review, but new work should use `ROADMAP_IMPLEMENTATION_AUDIT_V1.md` rather than stale historical issue text.

## Repository evidence policy

Important product decisions, visual baselines, mathematical models, simulation outputs, implementation proof and owner-review gates should be committed to this repository instead of existing only in chat history.
