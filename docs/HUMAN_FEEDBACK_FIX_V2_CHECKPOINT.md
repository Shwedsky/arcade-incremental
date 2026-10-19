# Human Feedback Fix Pack V2 — checkpoint

Issue: #25
Branch: `fix/human-feedback-v2`
Base main: `d59e0a7e5c3b1ece0bab3a1dc38030f41b02bcf7`

## Scope

1. Immediate resource reservation/escrow for queued actions so player-facing available stock excludes queued commitments before execution begins.
2. Fix batch stack quantity controls (slider, arrows, numeric input) snapping back to `1`.
3. Rename field return action to `На базу`.
4. Add local/manual-review-only developer panel for fast QA of resources, XP/levels, zones/mastery, buildings/vehicles/workers, queue progression, timers and reset/snapshot operations.

## Non-goals

- no worker economy redesign in this branch;
- no building recipe rebalance in this branch;
- no new zones/content frontier;
- no production visual pass.

Worker benchmark/zone medal/offline fatigue and processed-material progression are tracked separately in #26 and will be modelled before runtime implementation.

## Delivery

Domain semantics and deterministic tests first, then runtime/UI integration, browser acceptance, exact-head full CI, uniquely named review artifact, verified ZIP handoff, exact-head merge.
