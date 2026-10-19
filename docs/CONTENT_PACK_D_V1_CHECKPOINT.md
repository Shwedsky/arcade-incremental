# Content Pack D V1 — Implementation Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Tracked by Issue #17.

Base: `main` @ `34ce67e3e7899adc9f72d67cdd0857d20f2bfc13` after merged Content Pack C V1.

## Goal

Build the next coherent frontier/industry bridge without reopening accepted Early Game, Midgame or Content Packs A/B/C.

Target progression:

`Salvage Yard + mastered Z6 -> Z7 Heavy Depot -> active heavy-recovery progression -> Recovery Rig / Heavy Hauler -> Industrial Workshop -> mature heavy fabrication / crew network -> Tier-III readiness`

## Pack D scope

### Z7 Heavy Depot
- real selectable frontier after Pack C progression;
- construction/heavy-equipment identity rather than another HP-only zone;
- recognizable heavy target/source families;
- active-only mastery and first discoveries;
- higher alloy/heavy-component density using the existing broad resource/component taxonomy;
- no new raw-resource family unless a concrete sink proves necessary.

### Recovery Rig / Heavy Hauler
- player logistics tier after Truck;
- large mobile field buffer for Z7 heavy recovery;
- does not replace local Hand Cart collection;
- old Truck remains useful as worker-route infrastructure after player upgrade;
- no fuel micromanagement.

### Industrial Workshop
- real base milestone after Salvage Yard;
- expanded production-cell capacity rather than a cosmetic garage rename;
- consumes Pack B/C processed materials/modules and industrial components;
- supports mature heavy fabrication and additional Operator allocation;
- remains shallow/legible: no conveyor-factory spreadsheet gameplay.

### Crew / automation
- expand worker/Operator capacity only where Industrial Workshop physically supports it;
- preserve explicit opportunity cost between field Scavengers and production Operators;
- workers can only operate mastered zones and already-discovered component families;
- no worker mastery or first discovery.

### Talents
- activate only Tier-II / first Tier-III nodes backed by real Pack D systems;
- do not add filler percentage nodes only to increase tree size;
- preserve existing `Широкий замах`, `Тяжёлая фабрикация` and `Оператор ячейки` behavior.

## Explicit non-goals

- no Z8 Port / Container Terminal;
- no final Processing Plant;
- no final late-game economy closure;
- no ads / IAP / leaderboards;
- no Yandex Console dependency;
- no manual owner gate during implementation.

## Delivery pipeline

1. **Domain/runtime proof**
   - Z7 profile/content;
   - Recovery Rig model;
   - Industrial Workshop acquisition/production model;
   - crew/role model;
   - deterministic smoke + structural invariants.

2. **Runtime integration**
   - Save migration;
   - frontier gates;
   - active Z7 loop;
   - Rig logistics;
   - Workshop/production UI;
   - crew/Operator integration;
   - persistence/offline behavior.

3. **Regression**
   - all existing Early/Mid/Pack A/B/C tests remain green;
   - progression and Mid/Late structural models remain coherent.

4. **Dedicated Chromium Pack D proof**
   - prior-save migration;
   - Z7 gate;
   - active frontier path;
   - Recovery Rig acquisition/use;
   - Industrial Workshop acquisition;
   - crew/production role behavior;
   - persistence after reload.

5. **Release candidate**
   - release manifest;
   - Pack D RC artifact;
   - merge only after full ordinary CI is green.

## Hard invariants

- player personally pushes every new frontier;
- worker automation consumes mastered content only;
- active targeted recovery remains better for required rare/heavy components;
- old vehicles retain post-upgrade value;
- Hand Cart remains local collection tool;
- late production does not eliminate reason to enter active zones;
- no work is considered delivered until committed and pushed to GitHub.
