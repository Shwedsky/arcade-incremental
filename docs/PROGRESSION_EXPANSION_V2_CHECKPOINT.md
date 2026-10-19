# Progression Expansion V2 — checkpoint

Tracked by Issue #36.

Base main: `0060e5b1158327527780db28a176ee60936a554d`.

## Goal
Remove the current level-10/mastery ceiling and establish a coherent, milestone-gated Tier-II progression foundation before Z8 / Processing Plant.

## Delivered implementation
- legacy levels 1-10 preserved exactly; progression extended through level 30;
- mastery-point accounting now uses explicit per-node `pointCost`;
- separate user-facing Tier I / Tier II metadata;
- milestone-gated Tier-II root in all five permanent branches;
- `salvage_8` Wide Swing retained and now correctly gated by Van;
- `logistics_8` Van Packing added with real 400 -> 500 kg field-buffer capacity;
- `workshop_8` Heavy Fabrication retained and gated by Hangar;
- `automation_8` Operator retained and gated by Salvage Yard;
- `trade_8` Contract Choice added with two real Contract Board V2 offers;
- `automation_4` Night Shift activated with 30% offline efficiency;
- `trade_4` Copper Specialist activated with +8% copper / clean-copper sale value;
- existing Save V9 talent IDs remain valid and require no schema reset;
- deterministic model, domain smoke and Chromium acceptance added;
- existing deterministic smoke updated to enforce the new Tier-II milestone semantics rather than the old level-only exceptions.

## Validation state
Runtime integration is complete. Full exact-head CI and review-artifact validation are pending on the current branch head.

## Guardrails preserved
- no XP/talent reset for existing saves;
- old talent IDs remain valid;
- no pure-XP bypass of missing Van/Worker/Hangar/Yard milestones;
- specialization remains meaningful;
- no full Tier III / 115-point completion in this package;
- no Z8/Processing Plant content in this branch.
