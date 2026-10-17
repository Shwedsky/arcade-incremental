# Human Review — Playable Salvage V0

Status: **FIRST OWNER FEEL TEST COMPLETED / ITERATION IN PROGRESS**

## Test scope
Owner played approximately 3–4 full hand-cart runs of the first browser playable slice.

## Human verdict

### What already works
- The basic gameplay loop is understandable without explanation:
  - dismantle junk;
  - collect resource drops;
  - fill the hand cart;
  - return to the garage.
- The active mechanic itself is accepted as the correct foundation to continue iterating.

### What did not yet work
1. **Visual feedback is still too prototype-like.**
   The mechanic is readable, but not yet at the approved concept's level of satisfying destruction / growing numbers / arcade reward.
2. **The garage lacks purpose/readability.**
   After unloading, the player did not understand how machines are unlocked or why the current resources/components matter.
3. **Locked machines read as decoration rather than goals.**
   The game must explicitly answer:
   - what the machine does;
   - what exact recipe it needs;
   - how much the player already owns;
   - which requirements are missing;
   - where each missing part can be found;
   - optional ready-made shop price.

## Iteration applied after the review

### Field / visual pass
- More dressed arcade environment instead of a bare green test field.
- Stronger item silhouettes and color separation.
- Break sparks, screen impact, richer resource bursts and stronger magnetic pickup presentation.
- Rare component callout now explains why the component matters.
- Persistent **Next Goal: Small Compactor Press** card shows live progress while scavenging.

### Garage progression pass
- Machines are clickable.
- The first press is explicitly marked as the current progression goal.
- Selected-machine inspector contains:
  - description / output;
  - build recipe;
  - owned vs required values;
  - source hint for every missing requirement;
  - ready-made Buy shortcut price;
  - locked/installed state.
- First press has an actual prototype Build/Install action once the recipe is complete.
- The prototype uses a small starting cash amount only to allow the recipe interaction to be tested; the full sell/contract cash loop remains out of scope.

## First press prototype recipe
- metal: 100 kg;
- bearings: 2;
- hydraulic unit: 1;
- cash / consumables: 2,500;
- ready-made shortcut preview: 24,000.

The recipe remains subject to later balance simulation/human tuning.

## Still deliberately out of scope
- actual press processing queue / briquette production;
- sell flow and contract flow;
- talent tree / Combo;
- workers;
- offline progression;
- full persistence;
- Yandex SDK;
- production art.

## Next owner acceptance question
The next human test should answer two things:
1. Is the active dismantle/loot presentation now sufficiently satisfying to keep playing several carts?
2. After the first garage visit, can the player immediately explain what the Small Compactor Press needs and where to obtain the missing parts?

Do not expand scope further until those two questions pass.