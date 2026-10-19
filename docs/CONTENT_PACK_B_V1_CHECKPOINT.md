# Content Pack B V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Tracked by Issue #13.

## Base

Starts from `main` after merged Platform / Release Foundation V1.

## Proof target

`Z3 mastered -> Z4 Auto Salvage -> active Gearbox/Generator discovery -> Hangar -> Truck -> former Van becomes worker-route infrastructure -> second crew slot -> Wide Swing active`

## Locked implementation boundaries

- Z4 is a new active frontier, not merely higher prices.
- Hand Cart remains local collection in every zone.
- Truck becomes the player's larger mobile depot; it does not replace cart movement.
- After Truck, the old Van becomes assignable infrastructure for worker routes.
- Workers remain support: no zone mastery and no first discovery of component families.
- Gearbox and Generator/Alternator require active first discovery with pity/fallback-compatible counters.
- Hangar and Truck must consume workshop-produced materials/modules so cash cannot skip the production network.
- Existing Z1-Z3 gameplay/save/platform boundaries must remain compatible.
- No Z5+ production content in this pack.
- No Yandex Console access is required.

## Planned runtime additions

1. Extend zone model with Z4 Auto Salvage.
2. Extend component model with Gearbox + Generator/Alternator.
3. Add Hangar state / acquisition gate.
4. Add Truck state / cargo buffer / purchase-conversion gate.
5. Promote Van to worker-route infrastructure after Truck acquisition.
6. Add second worker/crew capacity baseline.
7. Add processed/module inventory required by Hangar and Truck milestones.
8. Activate first Tier-II Salvage mechanic: Wide Swing / two-target dismantling.
9. Add domain smoke and headless browser proof.
10. Persist final proof/results in this document before merge.

## Delivery rule

Keep the PR Draft until build, all regressions, Pack B smoke and Pack B browser proof are green. No manual owner package is produced during implementation.