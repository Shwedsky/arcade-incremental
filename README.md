# Arcade Incremental

Long-term browser arcade/incremental game about scavenging, dismantling, recycling and growing from one person with a hand cart into an industrial salvage business.

## Current status

**Playable manual-review candidate. Core progression is implemented through Z7 / Industrial Workshop and Workshop Queue UX V1.**

Current playable systems include:
- top-down active scavenging with automatic dismantling, drops and magnet pickup;
- garage/home, contracts, partial selling and persistent local/cloud-ready saves;
- physical tool/cart upgrades plus XP/mastery talent branches;
- timed machine construction, upgrades and processing;
- deterministic reorderable workshop scheduler with batch processing and offline continuation;
- zones Z1-Z7 with mastery/frontier gates;
- Van -> Truck -> Recovery Rig logistics progression;
- workers, mastered-zone passive routes and Operator roles;
- Hangar, Salvage Yard and Industrial Workshop milestones;
- Pack A-D regression coverage and dedicated Chromium acceptance;
- static release-candidate packaging and Yandex SDK adapter boundary.

The next product gate is **Manual Target Run V1** from a fresh save. It evaluates early-session pacing, clarity, motivation and queue/economy UX before further balance tuning, production visual work or another large content pack.

See:
- `docs/MANUAL_TARGET_RUN_V1.md` — owner review instructions and feedback checklist;
- `docs/WORKSHOP_QUEUE_UX_V1_CHECKPOINT.md` — current workshop scheduler semantics;
- `docs/CONTENT_PACK_D_V1_CHECKPOINT.md` — current late implemented frontier;
- `docs/MID_LATE_MODEL_V0.md` — structural pacing model;
- `docs/YANDEX_RELEASE_READINESS_V1.md` — platform/publication boundary.

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

Manual Review Prep V1 produces a separate artifact named:

`arcade-incremental-manual-review-v1`

It contains a Windows `START_REVIEW.bat`, isolated fresh-save entry page, exact `BUILD_INFO.txt` and the review checklist. The dedicated review server uses `127.0.0.1:41971` so browser storage is separated from ordinary dev/preview origins.

## Product direction

Long-term progression remains:

`Hand Cart -> working Garage -> Van -> first Worker -> Hangar -> Truck -> Salvage Yard -> Recovery Rig -> Industrial Workshop -> later Processing Plant`

Z8 / Port Terminal, final Processing Plant closure, monetization and production-art expansion are intentionally downstream of the current manual product-feel gate.

## Repository evidence policy

Important product decisions, visual baselines, mathematical models, simulation outputs, implementation proof and owner-review gates should be committed to this repository instead of existing only in chat history.
