# Manual Review Prep V1 — Delivery Checkpoint

Status: **IMPLEMENTATION COMPLETE / ORDINARY CI + REVIEW ARTIFACT GATE PENDING**

Tracked by Issue #21.

Base: `main` @ `f0ea107c8742d12687bae23e25f64d8bbe90d11d` after merged Workshop Queue UX V1.

## Goal

Prepare the current internally-green game for the first deliberate owner target run from a truly fresh save without adding another gameplay/content package.

## Delivered

- refreshed README so repository status matches the implemented game;
- canonical `docs/MANUAL_TARGET_RUN_V1.md` with owner path, review questions and feedback format;
- dedicated review bundle source under `review/`;
- `START_REVIEW.bat` one-click Windows launcher;
- fixed review origin `http://127.0.0.1:41971` so review localStorage is isolated from ordinary dev/preview origins;
- deterministic seed `owner-review-v1` for reproducible human feedback;
- `review-start.html` clears only the dedicated review origin and redirects to the game without a destructive reset query;
- normal reload after redirect therefore preserves the current review run;
- `BUILD_INFO.txt` is generated during CI packaging with exact commit/run identity;
- separate manual-review artifact is packaged alongside the ordinary RC;
- dedicated Chromium proof validates fresh review state, reload safety and preservation of a normal save on another origin;
- Yandex readiness documentation refreshed to the current Save V8 baseline.

## Target owner path

`salvage -> level/mastery -> physical upgrade -> garage -> contract/partial sale -> build first press -> queue/timer/offline -> processing batch -> next visible goal`

The owner verdict should focus on:
- pacing;
- clarity of the next useful action;
- motivation of the next milestone;
- friction / accidental resource spending;
- Workshop Queue UX under normal play;
- obvious readability blockers only.

Production-art quality is not the gate in this run.

## Packaging contract

Ordinary CI must produce both:

1. `arcade-incremental-release-candidate-v6` — ordinary static RC;
2. `arcade-incremental-manual-review-v1` — owner review ZIP with:
   - `dist/`;
   - `dist/review-start.html`;
   - `START_REVIEW.bat`;
   - `README_REVIEW.txt`;
   - `MANUAL_TARGET_RUN_V1.md`;
   - `BUILD_INFO.txt`.

## Automated review safety proof

`smoke:browser:manual-review` starts the same build on two distinct localhost ports and verifies:
- a normal origin can retain a real Save V8 with non-zero progression;
- the review origin begins with canonical fresh state;
- review fresh-start redirect removes reset semantics before gameplay;
- review reload preserves the run;
- the normal origin still contains its original progression after the review fresh start.

## Final gate

Before merge, the exact PR head must pass the ordinary CI suite including:
- build/typecheck;
- all Early/Mid/Pack A-D regressions;
- Workshop Queue domain/browser proof;
- Manual Review isolation proof;
- platform/responsive proof;
- release manifest;
- ordinary RC v6 packaging;
- manual-review-v1 packaging and artifact upload.

No product-code or documentation changes are planned after that exact-head gate unless CI reveals a concrete defect.

## Guardrails

- no new zones, machines, workers, talents or recipes;
- no balance tuning before owner evidence;
- no production visual overhaul;
- no Yandex Console, ads, IAP or backend;
- do not destroy a normal save when entering review mode;
- no work counts as delivered until committed/pushed and ordinary CI is green.
