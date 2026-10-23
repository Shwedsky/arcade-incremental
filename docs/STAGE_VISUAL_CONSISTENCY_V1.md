# Stage Visual Consistency V1 — B3

## Status

Gate B / B3 implementation contract for Issue #54. This pass aligns Garage, Hangar and Salvage Yard with the new Industrial Workshop visual language without changing business-stage rules or runtime ownership.

## Goal

A player should identify the current business scale from the picture before reading the stage title.

The growth ladder must read spatially:

- Garage — cramped personal workshop, one door, bench, shelves, a few machines, little free floor.
- Hangar — clearly larger enclosed operations hall with separate production, dispatch, storage and vehicle areas.
- Salvage Yard — open-air industrial site with bulk scrap field, recovered heavy objects, crew muster and a real vehicle apron.
- Industrial Workshop — the already delivered B1 production hall.

## Rules

- Use the existing canonical workers, fleet and installed machines; do not invent owned equipment.
- Keep the current DOM ownership and business-stage transitions.
- Prefer scene composition, floor markings, silhouettes and scale over explanatory labels.
- Remove the ambiguous `ТЕСНО` visual badge from Garage; crowding should be visible from the scene itself.
- Reuse the same charcoal / steel / muted green / amber material language established by B1.
- No 3D/WebGL dependency.
- Preserve intentional phone layouts.

## Yard composition

The Salvage Yard becomes a deliberate four-zone outdoor scene:

1. bulk scrap field with several differently scaled piles and sorted bins;
2. recovered-object pad for engines, frames and large machines;
3. crew muster area using canonical worker slots;
4. vehicle apron using canonical fleet bays.

Crane, floodlights, loading gate and heavy staging remain environmental anchors, not new mechanics.

## Acceptance

- Garage, Hangar and Yard have visibly different scale and material composition.
- Garage no longer relies on a `ТЕСНО` text badge.
- Yard's existing bulk/recovered/crew/fleet markup is fully styled and spatially readable.
- Hangar reads as a larger hall than Garage and remains responsive.
- Existing Base Shell / Hangar / Salvage Yard / P5 browser acceptances remain green.
- No gameplay, save or economy code changes.
