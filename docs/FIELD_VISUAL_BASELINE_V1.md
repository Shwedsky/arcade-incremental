# Field Visual Baseline V1 — B2

## Status

Gate B / B2 implementation contract for Issue #54. This pass improves the active salvage field without changing progression, reward amounts, target generation semantics, XP, mastery, component chances, Save V10 or zone unlocks.

## Product goal

The active field must stop reading like a flat collection of similarly sized icons. The player should feel a stronger hierarchy of salvage mass:

1. loose scrap and cable;
2. small devices / frames;
3. medium machines;
4. large composite salvage masses.

Late zones should feel denser and heavier than the first zones without becoming visually unreadable.

## Composite / matryoshka proof

The first nested-salvage proof is presentation-led and economy-neutral.

- Large appliances in Z3+ are rendered as composite salvage masses built from the canonical large target plus visible sub-parts.
- Selected late-zone medium appliances may also receive the composite treatment.
- As HP falls, the sub-parts spread outward and more of the inner junk becomes visible, creating a visual feeling that the object is coming apart layer by layer.
- The canonical target remains ONE gameplay target. Destruction still calls the existing reward path exactly once.
- No child object may independently roll resources, XP, mastery, components or rare discoveries in this pass.

This intentionally proves the visual/game-feel direction before a future design decides whether true interactive child targets are worth the added economy and save-state complexity.

## Field density

Decor density increases by zone in a bounded deterministic way. Later industrial zones receive more and larger non-interactive scrap stacks, pallets, barriers and ground clutter.

Decor remains non-interactive and must not alter target spacing, target count, navigation, auto-targeting or reward pacing.

## Visual rules

- large composite targets must have a visibly larger silhouette than ordinary targets;
- sub-parts use the existing visual language (cable coils, appliance shells, frames, plates), not a new incompatible art family;
- damage state should expose more structure rather than only drawing cracks;
- selected-target ring / HP bar must encompass the composite silhouette;
- `scrapstack` decor must read as an actual junk mass rather than one generic rectangle;
- the first zones remain cleaner and lighter so business progression also reads spatially.

## Acceptance

B2 is complete when:

- the field renderer contains a deterministic composite-target path for large salvage;
- composite rendering changes with HP state;
- later zones have a bounded higher decor density than Z1/Z2;
- selection radius follows the composite visual footprint;
- no reward/progression functions are introduced into the renderer;
- existing gameplay, progression, save and browser suites stay green.

## Out of scope

- true independent child-target rewards;
- new resource families;
- target-count increase;
- changing canonical target HP / DPS pacing;
- changing drop tables or component chances;
- new zones;
- P6.
