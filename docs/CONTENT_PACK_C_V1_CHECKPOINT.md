# Content Pack C V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Tracked by Issue #15.

## Base

Starts from `main` after merged Content Pack B V1 (`92cd2bbb1a086ed19e23a53351afdd3c26e8bf8f`).

## Proof target

`Z4 mastered -> Z5 Industrial Zone -> Z6 Abandoned Factory -> new industrial discoveries -> Salvage Yard -> larger crew/processing -> Operator becomes useful -> deeper Tier-II progression`

## Locked boundaries

- Z5/Z6 introduce new source composition and industrial resources, not just more HP.
- Hand Cart remains the local active collector; Truck remains the mobile field depot.
- Workers can only operate mastered zones and cannot earn mastery or first-discover component families.
- Alloy scrap must have concrete map sources and feed Alloy Billet / milestone recipes.
- Industrial Controller and Heavy Hydraulic Cylinder require active first discovery with anti-RNG protection.
- Salvage Yard must consume manufactured outputs/modules so it cannot be skipped with cash alone.
- Operator must affect a real production cell/queue rather than exist as a passive percentage label.
- Tier-II additions extend the existing five branches without resetting or duplicating Tier-I.
- Production chains stay shallow: generally no more than 2–3 transformations from field material to milestone input.
- Existing Early/Mid/Visual/Pack A/Pack B/Platform contracts remain regression-covered.
- No Z7/Z8, Recovery Rig or final Processing Plant in this pack.
- No Yandex Console access is required.

## Planned delivery blocks

1. Extend frontier runtime and visual/content matrices with Z5/Z6.
2. Add alloy scrap + Alloy Billet.
3. Add Industrial Controller + Heavy Hydraulic Cylinder discovery/pity.
4. Add Hydraulic Power / heavy fabrication production sinks.
5. Add Salvage Yard milestone and new base/crew capacity state.
6. Make Operator a real assignable production role with measurable cycle effect.
7. Activate the next justified Tier-II nodes in Salvage/Logistics/Workshop/Automation/Trade.
8. Add Save migration.
9. Add Pack C domain + Chromium proof while preserving all previous regressions.
10. Produce a new RC artifact and finalize this document before merge.

## Delivery rule

Keep the PR Draft until build, all old regressions, Pack C domain/model checks and Pack C browser acceptance are green. No manual owner package is produced during implementation.