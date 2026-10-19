# Workshop Queue UX V1 — Delivery Checkpoint

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Tracked by Issue #19.

Base: `main` @ `cea86509c98ebe22ba86f7ab034ca825383dec2e` after merged Content Pack D V1.

## Owner-driven goal

Replace single-fire workshop interaction with a deterministic user-controlled production scheduler while preserving all accepted recipes, Pack A-D progression and offline behavior.

Primary UX additions requested by the owner:

1. choose how much raw/processed material to sell;
2. choose how many processing stacks to enqueue;
3. keep multiple logical actions in an explicit ordered queue;
4. execute only as many logical actions concurrently as unlocked workshop slots allow;
5. continue the exact same queue offline;
6. remove/edit/reorder waiting actions;
7. protect the currently running action from accidental reorder/delete;
8. require explicit confirmation before cancelling a current destructive action;
9. preserve already completed stacks when cancelling the rest of a processing batch.

## Canonical example

With one available workshop slot:

`equipment upgrade -> press metal ×10 -> clean copper ×10`

Expected behavior:

- the upgrade starts first;
- metal does not start until the upgrade finishes;
- the metal logical action performs stack 1..10 sequentially;
- once metal finishes, copper starts;
- if the player leaves the game, the same sequence advances offline;
- cancelling copper after 4 completed stacks keeps those four outputs and deletes only the unfinished remainder;
- waiting metal/copper actions may be reordered, but the running upgrade cannot be dragged beneath them.

## Locked scheduler semantics

### Logical action vs active execution

The queue stores **logical actions**, not one card per physical processing stack.

A processing batch action owns:
- stable action ID;
- recipe/machine identity;
- requested stack count;
- completed stack count;
- remaining stack count derived from requested/completed/current state;
- status;
- stable order/priority;
- current stack start/end timestamps only while active;
- block reason when the next stack cannot start.

Build/upgrade/equipment actions remain one-shot logical actions but use the same scheduler envelope.

### Slot semantics

- `N` workshop slots means at most `N` logical actions may be active simultaneously;
- one processing batch occupies one slot while its current stack is active;
- after a stack completes, that logical batch continues its next stack before yielding the slot, unless it becomes blocked/cancelled/completed;
- waiting actions remain in user-defined order;
- if an active action completes and a slot becomes free, the earliest eligible waiting action starts;
- a blocked action does not destroy progress; scheduler may advance another eligible waiting action into a free slot.

### Resource commitment

- processing inputs are committed per stack when that stack actually starts;
- completed outputs are permanent;
- enqueueing `×10` does not reserve all ten stacks up front;
- if the next stack lacks input, the action becomes `blocked` with its completed count preserved;
- when resources later become available, blocked work may become startable again according to queue order.

### Waiting edits

A waiting or blocked action may:
- be removed;
- have requested batch count changed, but never below already completed stacks;
- move up/down in waiting order;
- be drag-reordered in UI;
- use `↑` / `↓` as a touch/keyboard-safe fallback.

Every edit persists immediately.

### Active action safety

An active action:
- cannot be reordered;
- cannot silently change its current stack;
- requires explicit confirmation for destructive cancellation;
- uses owner copy: `Да, прервать` / `Нет, оставить`;
- cancelling active build/upgrade means current progress is discarded and no completion is granted;
- already completed batch stacks remain permanent;
- if a batch currently has a stack in progress, cancelling the active batch cancels that current stack plus all future unstarted stacks, but never rolls back prior completed stacks.

## Sale quantity UX

Raw and processed selling must support:
- synchronized range slider + numeric input;
- owned-stock clamp;
- sensible numeric precision;
- live payout preview;
- `MAX / Всё` shortcut;
- explicit sale action for the selected quantity.

No backend/server is introduced.

## Save / offline requirements

- scheduler becomes persisted deterministic local state;
- migration starts from accepted Save V7;
- online tick and offline catch-up must call the same scheduler advancement semantics;
- a long absence may finish multiple stacks and multiple logical actions;
- reload preserves active timestamps, completed batch counts, waiting order, edited counts and blocked state;
- slot-count changes must never duplicate/skip work.

## Dedicated acceptance target

Chromium proof must demonstrate:

1. enqueue `upgrade -> press ×10 -> copper ×10`;
2. exact one-slot sequential order;
3. partial batch completion;
4. cancelling remaining batch preserves completed output;
5. edit waiting batch count;
6. reorder two waiting actions;
7. active action cannot be reordered;
8. active upgrade cancellation requires confirmation and grants no completion;
9. reload preserves queue/order/counts;
10. offline catch-up crosses multiple logical actions;
11. two-slot workshop runs exactly two logical actions concurrently;
12. sale slider/input synchronization and partial sale;
13. mobile/touch-safe queue controls.

## Delivery pipeline

1. scheduler domain contract + deterministic tests;
2. Save V8 migration;
3. runtime replacement of legacy `WorkshopJob[]` orchestration;
4. batch processing controls;
5. queue edit/remove/reorder/cancel UI;
6. partial-sale controls;
7. shared online/offline advancement proof;
8. Chromium desktop/mobile acceptance;
9. RC artifact + clean-head internal-green merge.

## Guardrails

- no recipe/economy rebalance unless scheduler correctness strictly requires it;
- no worker auto-crafting;
- no server requirement;
- no fuel/logistics changes;
- Pack A-D progression stays regression-covered;
- Pack D Industrial Workshop remains the source of its extra workshop capacity;
- no new content frontier in this package;
- no owner manual gate during implementation;
- no work counts as delivered until committed/pushed and the ordinary CI is green.
