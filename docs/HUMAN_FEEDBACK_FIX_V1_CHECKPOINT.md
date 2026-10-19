# Human Feedback Fix Pack V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / OWNER RUN BLOCKED BY P0**

Tracked by Issue #23.

Base: `main` @ `5459056470600b4e26856fa74b219a2e4658ccd4` after Manual Review Prep V1.

## Owner feedback captured

### P0
- Excursion does not start in Manual Review V1; owner cannot begin the target run.

### P1
- field HUD elements overlap;
- field HUD obscures salvage/map objects;
- inactive/non-focused HUD should be semi-transparent and return to full opacity on hover/focus/interaction;
- garage resource/component presentation is unclear (`P/C/GB`-style abbreviations are not acceptable player-facing UX);
- basic/common resource families should be visible immediately, while undiscovered advanced families/components should remain mystery slots (`?`) until discovered;
- discovered slots should use stronger rarity framing (common gray -> uncommon green -> rare blue -> epic purple -> legendary orange) without spoiling undiscovered identities;
- normal garage UI must be consistently Russian rather than mixed RU/EN.

## Delivery order

1. reproduce and fix excursion launch blocker;
2. add browser acceptance for garage -> excursion transition;
3. fix field HUD layout overlap;
4. add passive opacity/readability behavior to field HUD;
5. redesign garage resource/component discovery presentation;
6. remove English player-facing labels from normal garage flow;
7. update Manual Review artifact;
8. full existing regression suite + new UX/browser proofs;
9. exact-head merge;
10. owner resumes Manual Target Run V1 from a fresh review build.

## Guardrails

- no economy/progression rebalance;
- no new zones/machines/workers/talents/recipes;
- Save V8 compatibility retained;
- Workshop Queue and Pack A-D regressions retained;
- production-art overhaul remains out of scope;
- owner manual run does not resume until P0 is fixed and internal CI is green.
