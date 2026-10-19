# Visual Production Foundation V1

Status: **COMPLETE / INTERNALLY GREEN / READY TO MERGE**

Base: accepted Early Game V0 + locked Design V3 + merged Midgame Proof V1.

Source of truth: `docs/VISUAL_BASELINE.md` (owner approved).

## Goal

Turn the approved concept direction into a reusable production rendering system without changing accepted mechanics.

This pass is a **foundation**, not the final art-complete game.

## Delivered foundation

### Field rendering
- Z1 / Z2 / Z3 now use distinct visual themes before reading labels;
- reusable zone palette metadata lives in `src/visual_theme.ts`;
- common salvage classes have dedicated pseudo-depth silhouettes instead of flat debug geometry;
- target shadows, highlights, selected-target ring and damage cracks share one visual language;
- common metal / copper / plastic pickups remain visually distinct;
- break sparks are directional streaks rather than only dots;
- simple player + hand-cart rendering remains cheap and readable;
- owned Van is physically represented in the field with a load meter;
- worker silhouette appears when revisiting the zone currently assigned to that worker.

### Garage / workshop
- roofless garage presentation is strengthened without replacing functional DOM/UI;
- machine grid reads as a marked workshop floor;
- installed and locked machine positions are visually different;
- workbench, press, wire stripper and plastic shredder receive recognizable code-driven silhouettes;
- selected machine retains a strong physical highlight;
- Van / Worker management cards now carry visual presence in addition to text/status.

### Zone selection
- Z1 / Z2 / Z3 cards receive distinct theme bands and accents;
- current/mastered/locked state remains functionally unchanged.

### Reuse architecture
Production rendering remains code-driven:
- `src/visual_theme.ts` — zone / target / machine visual metadata;
- `src/field_view.ts` — shared field renderer;
- `src/visual_foundation.css` — workshop, zone, Van/Worker and reward presentation overrides;
- `scripts/visual-smoke.ts` — structural visual metadata coverage.

No save schema or economy rule changed for this art pass.

## Visual guardrails

- no expensive realistic 3D;
- no anatomy/facial-animation dependency;
- no final Z4+ production art;
- no mechanic rebalance;
- visual budget remains focused on destruction, drop motion, value readability, rare-component moments and visible base growth.

## Automated acceptance

Final tested runtime head before this documentation-only checkpoint:
`eac5a7ddf1da71f3562dd7a7b19cc5aa24168ce0`

GitHub Actions run `39233675937` passed:
- TypeScript typecheck + production build;
- deterministic gameplay smoke;
- early-game systems smoke;
- midgame domain smoke;
- dedicated visual foundation smoke;
- progression pacing proof;
- Mid/Late structural proof;
- accepted early-game Chromium flow;
- Midgame Proof Chromium flow;
- package artifact upload.

Artifact:
- `arcade-incremental-visual-foundation-v1`;
- id `12177003179`;
- digest `sha256:8fc99598a8c87c66b0a1ed4151511bc07230e116ebaaa8dd2f0a262192a11508`.

## Acceptance rule

Owner requested no manual gates between current development pipelines. Therefore this foundation is accepted internally on green automated regression and is ready to merge. A later production-visual human review can tune look/feel without reopening the proven mechanics.

## Next pipeline

**Content Pack A / production slice**:
- make Z1-Z3 content composition visibly distinct using the new foundation;
- strengthen object-set variety without exploding the resource taxonomy;
- make Garage growth more visible across early/mid milestones;
- integrate Van / first Worker into that content pass;
- preserve the already-green gameplay, mastery and economy systems.
