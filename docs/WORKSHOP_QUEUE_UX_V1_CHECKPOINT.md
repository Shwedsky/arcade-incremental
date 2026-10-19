# Workshop Queue UX V1 — Delivery Checkpoint

Status: **IMPLEMENTED / INTERNALLY GREEN — FINAL CLEAN-HEAD GATE PENDING**

Tracked by Issue #19.

Base: `main` @ `cea86509c98ebe22ba86f7ab034ca825383dec2e` after merged Content Pack D V1.

## Delivered owner UX

The workshop is now a deterministic user-controlled production scheduler instead of a single-fire action list.

Delivered:
- raw and processed sale quantity selection with synchronized slider + numeric input;
- live payout preview, per-resource `MAX`, and retained `Продать всё` shortcut;
- processing batch count selection with synchronized slider + numeric input (`1..100` stacks);
- one logical queue action per batch instead of one card per stack;
- explicit `Выполняется` and `В очереди` sections;
- waiting batch count editing;
- waiting action removal;
- drag-and-drop reorder plus `↑ / ↓` fallback for touch/mobile;
- active action locked from reorder;
- explicit active cancellation modal: `Да, прервать` / `Нет, оставить`;
- completed batch outputs survive partial cancellation;
- current unfinished batch stack and future unstarted stacks are discarded on confirmed active cancellation;
- current build/upgrade cancellation discards progress and does not refund committed inputs;
- next eligible queued action starts immediately after cancellation;
- Save V8 persistence and migration from accepted Save V7 and older supported saves;
- identical online/offline scheduler advancement;
- Pack D Industrial Workshop continues to provide the extra workshop execution slot;
- one physical machine cannot execute two actions simultaneously even when multiple workshop slots are unlocked.

## Canonical owner scenario — proven

With one available workshop slot:

`equipment upgrade -> press metal ×10 -> clean copper ×10`

The dedicated Chromium acceptance proves:
- the upgrade runs first;
- press ×10 and copper ×10 wait in explicit user order;
- a batch keeps its slot between stacks;
- waiting batches can be reordered with drag-and-drop and `↑ / ↓`;
- waiting batch count can be edited and survives reload;
- after four press stacks finish, cancelling the active press batch preserves the four completed outputs;
- the next copper batch starts immediately;
- active upgrade cancellation requires confirmation and a requeued upgrade restarts from zero;
- offline catch-up can cross multiple queued logical actions without real-time waits.

## Scheduler semantics

### Logical actions and slots

- `N` workshop slots means at most `N` logical actions may execute concurrently.
- A processing batch occupies one slot until completed, blocked or cancelled.
- A blocked batch preserves completed output and its requested count.
- A blocked action does not monopolize a free slot when a later eligible action can run.
- Waiting order is explicit and persisted.
- The same physical machine cannot occupy two active slots at once; a different machine may use the other slot.

### Resource commitment

- Processing input is committed per stack when that stack starts.
- Enqueueing ×10 does not reserve ten stacks up front.
- If the next stack lacks material, the batch becomes blocked rather than losing completed work.
- One-shot build/upgrade/equipment inputs are committed when the action actually starts.
- Confirmed cancellation of an already-started one-shot action does not refund committed inputs.

### Cancellation

Waiting actions may be removed directly.

Active actions require the confirmation modal:
- `Нет, оставить` leaves the action untouched;
- `Да, прервать` cancels the active execution.

For an active batch:
- all previously completed stacks remain;
- the current unfinished stack is cancelled;
- unstarted remainder is removed;
- scheduler advances to the next eligible action.

## Partial sale UX

The raw and processed sale dialogs now support independent per-resource quantities.

Each row shows:
- owned amount;
- current effective ₽/kg;
- synchronized slider + numeric input;
- live payout for the selected quantity;
- `MAX` for that resource.

The footer shows total selected payout and provides:
- `Продать выбранное`;
- `Продать всё`.

This lets the player keep material for planned upgrades while selling only surplus.

## Save V8 / migration

Save V8 persists `WorkshopSchedulerState` instead of using `WorkshopJob[]` as the execution engine.

Legacy V7 running workshop jobs migrate without double-consuming already committed inputs. Existing V2-V7 supported save paths remain covered by the current migration chain.

A legacy `jobs` projection remains only as compatibility/test presentation while the scheduler is the source of truth.

## Automated proof

Internally green implementation head before this documentation finalization:
`efbd283862564d734369c6ef309b627eb1bd536f`

GitHub Actions run `39259495762` passed the complete code/browser gate:
- TypeScript + Vite build;
- deterministic gameplay / Early / Midgame / Visual regressions;
- Workshop scheduler domain smoke;
- Workshop V7 migration smoke;
- Pack A / B / C / D domain tests;
- save/platform safety;
- progression + Mid/Late structural models;
- existing Early browser progression regression;
- Midgame browser regression;
- Pack B / C / D browser proofs;
- dedicated Workshop Queue desktop/mobile browser proof;
- platform/responsive browser proof;
- release manifest;
- RC v5 packaging and upload.

### Dedicated Workshop Queue browser proof

It validates:
1. exact partial raw sale and retained unsold stock;
2. `upgrade -> press ×10 -> copper ×10`;
3. desktop drag-and-drop reorder;
4. `↑ / ↓` reorder fallback;
5. waiting batch count edits;
6. Save V8 reload persistence;
7. four completed press stacks retained after active batch cancellation;
8. immediate transition to next queued batch;
9. `Нет, оставить` preserves active upgrade;
10. `Да, прервать` cancels upgrade without refund or completion;
11. requeued upgrade restarts with full duration;
12. offline completion across multiple queue actions;
13. exactly two concurrent actions with two slots;
14. same-machine parallel execution is blocked while another machine may use the second slot;
15. mobile/touch partial sale and arrow reorder.

## RC v5 from internally green implementation head

Artifact: `arcade-incremental-release-candidate-v5`

- artifact id: `12190205612`
- size: `61,986 bytes`
- digest: `sha256:c366ab085c4f95ed5bfab1211f1ed161da4b8cbeaafbe9146016556807e6ebc7`
- source head: `efbd283862564d734369c6ef309b627eb1bd536f`

A final ordinary CI run is required on the exact documentation-finalized clean head before merge. No product code changes are planned after that gate.

## Guardrails preserved

- no recipe/economy rebalance;
- no worker auto-crafting;
- no server requirement;
- no fuel/logistics changes;
- Pack A-D progression remains regression-covered;
- Pack D Industrial Workshop remains the source of its extra workshop capacity;
- no new content frontier;
- no owner manual gate during implementation;
- temporary one-shot integration scripts/workflows were removed before final validation.
