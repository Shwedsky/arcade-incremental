# Visual Production Foundation V1

Status: **IMPLEMENTATION STARTED / NO MANUAL OWNER GATE**

Base: `main` @ `959ed0df41f9b57699bdd396638e51b82faf5685`

Source of truth: `docs/VISUAL_BASELINE.md` (owner approved).

## Goal

Turn the approved concept direction into a reusable production rendering system without changing accepted mechanics.

This pass is a **foundation**, not the final art-complete game.

## Required proof

### Field
- Z1/Z2/Z3 must read as distinct places before reading labels;
- targets use clearer silhouettes and pseudo-depth rather than flat debug shapes;
- density remains high;
- selected target stays readable;
- destruction/pickup VFX remain the highest visual priority;
- common resources, copper and rare-component moments remain visually distinct;
- player + cart remain simple, readable and cheap to animate.

### Garage
- garage reads as a roofless physical workshop rather than a flat list of cards;
- machines occupy recognizable floor positions;
- installed vs locked footprint is visible physically;
- storage/bench/press/future machines remain readable;
- current functional inspector/requirements are preserved.

### Midgame objects
- Van has a recognizable field/base representation;
- Worker is readable as a worker/route object without detailed character animation;
- zone selector receives theme cues but remains functional UI.

## Reuse rules

Visual implementation is code-driven and reusable:
- zone palettes/theme tokens;
- target silhouette renderer by target class;
- common shadow/highlight/depth rules;
- common destruction/pickup particles;
- common machine-floor visual language;
- no one-off final illustration embedded into logic.

## Non-goals
- no expensive realistic 3D;
- no anatomy/facial animation;
- no Z4+ production art yet;
- no mechanics rebalance;
- no Yandex/platform work in this pass.

## Acceptance

Before merge:
- TypeScript build green;
- all accepted gameplay/domain/model/browser tests remain green;
- visual-render smoke verifies all Z1-Z3 themes/target classes have rendering metadata;
- no save schema change purely for art;
- screenshots/art review is intentionally deferred because owner requested no manual gates between pipelines.
