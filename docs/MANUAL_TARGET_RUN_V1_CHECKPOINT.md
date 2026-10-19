# Manual Review Prep V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE UNTIL PACKAGE IS READY**

Tracked by Issue #21.

Base: `main` @ `f0ea107c8742d12687bae23e25f64d8bbe90d11d` after merged Workshop Queue UX V1.

## Goal

Prepare the current internally-green game for the first deliberate owner target run from a truly fresh save without adding another gameplay/content package.

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

## Delivery plan

1. refresh stale repository status documentation;
2. add canonical `docs/MANUAL_TARGET_RUN_V1.md`;
3. add a safe/reproducible fresh-save review launch path;
4. identify review build/version in the UI or launch output;
5. add automated proof for fresh-review mode;
6. preserve all existing gameplay/content/browser regressions;
7. ordinary CI + review RC;
8. exact-head merge;
9. owner gets one short launch instruction and one feedback checklist.

## Guardrails

- no new zones, machines, workers, talents or recipes;
- no balance tuning before owner evidence;
- no production visual overhaul;
- no Yandex Console, ads, IAP or backend;
- do not destroy a normal save when entering review mode accidentally;
- no work counts as delivered until committed/pushed and ordinary CI is green.
