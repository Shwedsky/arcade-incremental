# Content Pack A — Z1/Z2/Z3 Production Slice V1

Status: **COMPLETE / INTERNALLY GREEN / READY TO MERGE**

Base: merged Visual Production Foundation V1.

## Goal

Turn the proven Z1–Z3 systems into a more content-complete production slice without changing the resource taxonomy or progression architecture.

## Delivered

### Zone-specific physical content
The six proven gameplay target classes remain the balance/runtime classes, but every class now has multiple named/content variants for every early zone.

- **Z1 — Old Junkyard:** sheets, pipes, cable coils, bicycles, fans, vacuums, microwaves, washers, fridges and other household junk.
- **Z2 — Garages / Backyards:** tools, wiring harnesses, pumps, garage fans, compressor blocks, welders, generators, pump stations and workshop equipment.
- **Z3 — Appliance Yard:** appliance panels/wiring, microwaves, vacuums, washers, dishwashers, dryers, ovens, fridges and freezers.

Runtime target names come from `src/zone_content.ts`, while `src/content_visual.ts` overlays recognizable content details on the existing balance-class silhouettes.

### Component source consistency
- Pump sources are represented by visible Z2 pump/compressor/workshop targets.
- Compressor sources are represented by visible Z3 fridge/freezer and other compressor-rich large-appliance targets.
- No new raw-resource family was introduced to make this work.

### Garage growth presentation
Garage presentation now derives directly from accepted progression state:
1. `starter` — mostly empty / hand-work garage;
2. `press` — first real machine;
3. `copper` — wire/copper processing present;
4. `processing` — fuller equipped garage;
5. `crew` — Van / first Worker era.

The growth stage changes floor language, milestone text and presentation but does not create another progression/save system.

### Van / Worker continuity
The physical Van and Worker presentation from Visual Foundation remains integrated, and the crew-stage garage now visibly reads as transport + team rather than only extra management cards.

## Source architecture
- `src/zone_content.ts` — object names, content variants, source tags, garage growth mapping;
- `src/content_visual.ts` — lightweight reusable visual details;
- `src/content_pack_a.css` — garage growth and zone-card content presentation;
- `scripts/content-pack-a-smoke.ts` — content coverage proof.

## Automated acceptance
Final tested runtime head before this documentation checkpoint:
`19e5794ff17a935594e9e20748495863f415f808`

GitHub Actions run `39234809337` passed:
- TypeScript typecheck + production build;
- deterministic gameplay smoke;
- early-game systems smoke;
- midgame domain smoke;
- Visual Foundation smoke;
- Content Pack A coverage smoke;
- progression pacing proof;
- Mid/Late structural proof;
- accepted early-game Chromium flow;
- Midgame Proof Chromium flow;
- package artifact upload.

Artifact:
- `arcade-incremental-content-pack-a-v1`;
- id `12177559047`;
- digest `sha256:89f1f3c560b2992a2dacab814998b6013a6696f69fa05fd01c5e2b8b394d55a1`.

## Guardrails preserved
- no Z4+ production content;
- no new save schema;
- no economy/mechanic rebalance;
- no resource-taxonomy explosion;
- no manual owner gate between sequential pipelines.

## Next development pipeline
The early/mid production slice is now structurally complete enough to move into **Platform / Release Foundation** while the deeper Z4+ content waves remain gated behind later gameplay expansion.
