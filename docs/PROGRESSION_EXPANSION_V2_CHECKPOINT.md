# Progression Expansion V2 — checkpoint

Tracked by Issue #36.

Base main: `0060e5b1158327527780db28a176ee60936a554d`.

## Goal
Remove the current level-10/mastery ceiling and establish a coherent, milestone-gated Tier-II progression foundation before Z8 / Processing Plant.

## Delivery sequence
1. deterministic XP/mastery model;
2. lock the first coherent Tier-II tranche across all five branches;
3. runtime talent/tier/milestone contracts;
4. Save V9-compatible UI/runtime integration;
5. Chromium proof + all existing regressions + exact-head artifact.

## Guardrails
- no XP/talent reset for existing saves;
- old talent IDs remain valid;
- no pure-XP bypass of missing Van/Worker/Hangar milestones;
- specialization must remain meaningful;
- do not implement all Tier III / 115 final points in this package;
- no Z8/Processing Plant content in this branch.

Status: model/design implementation started.
