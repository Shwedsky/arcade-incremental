# Manual Review — P0/P1 Foundation

Purpose: owner review of the first Product Roadmap V2 implementation slice.

This review is **not** a balance review of every late-game recipe and is **not** the final Hangar visual pass.

## 1. Fresh / Starter Garage

Use a fresh save.

Check:
- Base opens on **Обзор**;
- business stage reads `Стартовый гараж`;
- visible tabs are `Обзор / Производство / Склад / Контракты / Развитие`;
- `Персонал` and `Логистика` are not shown yet;
- Production still contains the existing machines/equipment/queue;
- Storage still contains the existing raw/processed/components inventory;
- Contracts still work;
- Development opens the existing talent screen;
- leaving the base and returning does not break the active field loop.

Owner verdict question: does the base already feel easier to understand than the old one-screen Garage?

## 2. Equipped Garage

Build/acquire at least one machine beyond the initial workbench or use DEV review shortcuts.

Check:
- Overview changes to `Рабочий гараж`;
- stage rail shows progress from Starter Garage;
- machine count and current level are believable;
- the next milestone messaging points toward transport/workforce rather than another random card.

## 3. Workforce Garage

Use DEV/current progression to reach Van + first worker.

Check:
- stage becomes `Гараж с бригадой`;
- **Персонал** and **Логистика** appear as separate tabs;
- worker cards remain functional;
- Van/transport controls remain functional;
- moving between Crew/Logistics no longer requires scanning the full Garage page.

Owner verdict question: does this feel like a new layer of the same game rather than extra clutter?

## 4. Hangar state

Use DEV/milestone progression to acquire Hangar.

Check:
- base title changes to `Ангар`;
- Overview clearly calls it an operational base;
- stage rail reflects the Hangar milestone;
- existing Hangar/Truck mechanics remain reachable;
- the visual difference is noticeable as a **foundation**, but judge final Hangar art only in P3.

Important: this package deliberately does not claim the final Hangar transformation is complete.

## 5. Processing Plant state

Use `Plant ready` / `Открыть всё` as needed.

Check:
- highest business stage resolves to `Перерабатывающий завод`;
- Plant baseline remains reachable in Production/Logistics context;
- Overview reports Plant lines and shows that this is the current top stage;
- no lower missing flag accidentally demotes the stage.

## 6. Navigation / regression

Across at least two stages:
- open Production -> click existing machine/upgrade controls;
- open Storage -> verify values update after gameplay/action;
- open Contracts -> interact with current contract flow;
- open Development -> buy a reachable talent if possible;
- open Zone map from the header and return;
- return to field and back to base.

No existing feature should require a duplicate new implementation.

## 7. What feedback matters most now

Please judge:
- whether the business stage is immediately understandable;
- whether the tab grouping feels natural;
- which tab names/groupings feel wrong;
- whether Overview contains useful information or noise;
- whether the transition `Garage -> workforce -> Hangar` now reads more clearly;
- what still prevents Hangar from feeling like a genuine new place.

Do **not** spend time yet on final colors/art polish or exact Plant line balance; those belong to later roadmap packages.
