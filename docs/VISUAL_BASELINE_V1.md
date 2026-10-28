# Visual Baseline V1 — Industrial Workshop

## Status

Gate B implementation plan for Issue #54. This pass changes presentation only. P6, progression, economy, Save V10 and production rules are out of scope.

## Product target

Turn the current P5 Industrial Workshop overview from a diagram/dashboard into a readable 2D game place that is achievable with the current browser stack and remains suitable for a later iOS/Android wrapper or port.

The visual target is intentionally not AAA/3D. It must be buildable from layered DOM/CSS/SVG-like shapes, light animation and existing runtime state.

## Composition

The Industrial Workshop overview uses one spatial scene with three levels:

1. Background — hall shell, beams, windows/lights, crane rails and depth.
2. Working plane — three materially different production zones:
   - Подготовка сырья: hopper/sorter, scrap bins and raw-material table;
   - Сборка компонентов: workbench, parts racks and compact machine tools;
   - Тяжёлая сборка: gantry/crane, large assembly platform and heavy support.
3. Foreground — warehouse/staging, loading lane, fleet and crew presence.

The player should understand the three production functions before reading their labels.

## Live state contract

Presentation must reflect canonical runtime state only.

For each production cell show:
- selected production plan;
- READY / RUNNING / BLOCKED state using Russian player-facing copy;
- progress when running;
- assigned worker when present;
- Heavy Assembly Recovery Rig support when actually reserved by an active job.

Fleet cards and crew figures remain sourced from Workforce/Fleet V3. No decorative vehicle may imply an owned vehicle that does not exist.

## Visual language

- dark steel / charcoal environment;
- muted green = ready/healthy;
- amber = active/heavy work;
- rust/orange = blocked/attention;
- pale blue = logistics/route;
- fewer arbitrary panel borders than the current dashboard;
- production status overlays sit on top of an illustrated scene instead of replacing it.

Animation is restrained and CSS-only: conveyor motion, welding pulse, crane/support highlight, active progress. Respect `prefers-reduced-motion`.

## Responsive contract

Desktop: one wide workshop composition with three production zones and a foreground logistics strip.

Phone/tablet: the scene becomes a deliberate vertical composition. Production zones stack as large readable work bays; warehouse/fleet becomes a compact strip. No horizontal accidental overflow and no text smaller than the current accepted management UI baseline.

## Delivery order

### B1 — Industrial Workshop Visual Baseline
- spatial hall shell;
- three differentiated production zones;
- live cell state overlays;
- warehouse/staging strip;
- fleet/crew/heavy-support presence;
- desktop/mobile browser acceptance.

### B2 — Field visual pass
- stronger salvage silhouettes and density;
- first nested-salvage / matryoshka proof using existing target classes where possible.

### B3 — Stage consistency
- bring Garage, Hangar and Salvage Yard toward the same art/material language;
- verify stage scale is readable without relying on labels.

## Acceptance for B1

B1 is complete when automated browser checks prove:
- exactly three visually distinct P5 production zones;
- scene state follows real Production Cells V1 state;
- Heavy Assembly support is shown only when actually reserved;
- owned fleet/crew appear without inventing state;
- desktop and phone scenes fit their viewport;
- management navigation remains unobstructed;
- no gameplay/economy/save behavior changes.
