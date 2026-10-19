# Content Pack C V1 — Delivery Checkpoint

Status: **IMPLEMENTATION COMPLETE / FINAL CI GATE**

Tracked by Issue #15.

## Base

Started from `main` after merged Content Pack B V1 (`92cd2bbb1a086ed19e23a53351afdd3c26e8bf8f`).

## Proven progression bridge

`Z4 mastered -> Z5 Industrial Zone -> active Industrial Controller discovery -> Z6 Abandoned Factory -> active Heavy Hydraulic Cylinder discovery -> alloy processing / heavy fabrication -> Salvage Yard -> third worker -> Scavenger or Operator -> deeper Tier-II Workshop/Automation`

## Delivered runtime

### Z5 / Z6 frontier
- Z5 `Промышленная зона` and Z6 `Заброшенный завод` are real selectable frontier zones.
- Each zone has its own target/source composition, HP/yield/mastery profile and visual theme.
- Z5 requires the accepted Pack B progression: mastered Z4 + Hangar + Truck.
- Z6 requires mastered Z5 plus active first discovery of Industrial Controller.
- Workers still cannot earn mastery or first-discover component families.

### Pack C resources and components
- Alloy Scrap is collected actively in Z5/Z6 and shares the existing Truck mobile-depot capacity rather than bypassing logistics.
- Alloy Billet is manufactured from Alloy Scrap (`25 -> 18`) in a timed industrial production cell.
- Industrial Controller uses active Z5 eligible-source discovery with pity by 12 eligible targets.
- Heavy Hydraulic Cylinder uses active Z6 eligible-source discovery with pity by 10 eligible targets.
- Z6 remains a secondary source of already-known controllers without replacing the Z5 discovery gate.

### Heavy production
- Timed Pack C production cell supports:
  - Alloy Billet;
  - Hydraulic Power module;
  - Heavy Frame.
- Heavy module recipes consume already-established processed materials/components plus Pack C industrial discoveries.
- Production persists through Save V6 and completes by wall clock/offline progression.
- Chains remain deliberately shallow; this pack does not become a factory spreadsheet.

### Salvage Yard
- Salvage Yard is a real milestone, not a cash-only unlock.
- It requires cash plus metal, Clean Copper, Steel Blank, Alloy Billet, Control modules, Hydraulic Power modules and Heavy Frames.
- Z6 mastery is required, so passive economy cannot skip the frontier.
- Unlocking the Yard adds the third crew slot and the heavy-production/crew layer targeted by this pack.

### Third worker / Operator
- Worker #3 unlocks after Salvage Yard and costs 85,000.
- The worker occupies one role at a time:
  - `Scavenger` on a mastered zone; or
  - `Operator` in the industrial production cell.
- Operator therefore has a real opportunity cost: assigning it stops that worker's passive field collection.
- Operator reduces industrial cell cycle duration to ×0.75.

### Tier-II runtime
Pack B's accepted `Широкий замах` remains the Salvage Tier-II mechanic.

Pack C adds only justified system-backed nodes rather than filler:
- `workshop_8 — Тяжёлая фабрикация`: industrial Pack C cycle ×0.90;
- `automation_8 — Оператор ячейки`: unlocks assigning Worker #3 as Operator.

When both are active, a 240-second Alloy Billet base cycle is expected to run in 162 seconds (`240 × 0.90 × 0.75`). Dedicated Chromium acceptance asserts this exact runtime relationship.

## Persistence

Save schema is now V6.

Migration rules preserve accepted progression:
- V5 -> V6 keeps all Pack B state and initializes Pack C safely;
- older V4/V3/V2 migration paths continue forward without wiping early/mid progression;
- Pack C materials, industrial discoveries/pity, modules, Yard, production job and Worker #3 role/assignment persist.

## Automated acceptance

The final branch CI is required to pass all of the following before merge:
- TypeScript typecheck + Vite production build;
- deterministic gameplay smoke;
- Early Game systems smoke;
- Midgame domain smoke;
- Visual Foundation smoke;
- Content Pack A regression;
- Content Pack B domain regression;
- Content Pack C domain smoke;
- Save safety smoke;
- Platform adapter smoke;
- progression pacing proof;
- Mid/Late structural proof;
- Chromium progression regression;
- Chromium Midgame regression;
- Chromium Pack B regression under Save V6;
- dedicated Chromium Pack C acceptance;
- platform/responsive Chromium proof;
- release manifest;
- `arcade-incremental-release-candidate-v3` package artifact.

Dedicated Pack C Chromium proof covers:
1. V5 -> V6 migration while preserving Hangar/Truck;
2. Z5 available after Pack B prerequisites;
3. Z6 blocked without active Controller discovery;
4. Z6 selectable after its real gates;
5. Salvage Yard acquisition;
6. third-worker hire;
7. Operator assignment gated by the Tier-II Automation talent;
8. Workshop ×0.90 + Operator ×0.75 combining to exactly 162 seconds on the Alloy cycle;
9. Pack C state and an in-flight industrial job surviving reload.

## Guardrails preserved

- Hand Cart remains the local active collector.
- Truck remains the mobile field depot and now also carries Pack C alloy within its same capacity.
- Workers cannot earn zone mastery or first-discover component families.
- Active frontier play remains required for Z5/Z6 discoveries and Yard progression.
- No Z7/Z8, Recovery Rig or final Processing Plant in Pack C.
- No ads, IAP, leaderboards or Yandex Console dependency in this pack.
- No manual owner gate is required between implementation stages.

## Delivery decision

Implementation and integration are complete. Temporary one-shot integration workflows/scripts were removed after the runtime was safely committed. Merge is allowed only after the ordinary final PR CI on the cleaned branch is fully green.
