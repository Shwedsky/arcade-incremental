# Visual Rebuild V2

Issue: #55

## Why this exists

The previous visual pass improved composition and correctness, but the owner rejected the visual quality because the hero surfaces still read as technical placeholders: primitive character rendering, abstract salvage targets, dashboard-like base scenes and decorative piles that do not feel destructible.

This document is the art-production contract. Green CI alone is not acceptance.

## Product target

A coherent stylized 2D industrial-salvage game that remains practical for the current browser stack, Yandex Games delivery and a later iOS/Android wrapper.

We are not targeting realtime 3D or AAA rendering. We are targeting recognisable 2D objects, authored scenes, clear damage states and a consistent industrial art language.

## Quality bar

A hero screen fails review when its first visual impression is dominated by CSS rectangles, generic cards, debug shapes or repeated geometry.

The player should identify major objects and business stages before reading labels.

## Sprint 1 — character + active field

### Character
- recognisable scavenger silhouette;
- industrial workwear / backpack / hand tool;
- idle, move and attack visual states;
- readable at phone scale;
- facing direction must remain clear.

### Salvage families
Small:
- cable coil;
- loose scrap bundle / panels;
- small appliance.

Medium:
- generator / motor unit;
- cabinet / damaged machine frame;
- equipment carcass.

Large:
- industrial machine;
- vehicle / appliance body;
- compressed mixed-scrap mass.

Composite targets:
- minimum two hero families;
- intact / opened / near-destroyed art states;
- visible internal pieces;
- actual break event leaves temporary debris instead of the whole target simply disappearing.

### Economy rule
Visual child debris is reward-neutral by default. If child pieces later become interactive, the parent reward budget must be split between them rather than duplicated.

## Sprint 2 — base scene replacement

Replace technical scene composition with authored 2D layers for:
- Garage;
- Hangar;
- Salvage Yard;
- Industrial Workshop.

Each scene needs recognisable visual anchors, equipment, storage, transport, people and lighting appropriate to its scale.

## Sprint 3 — UI / art integration

- reduce dashboard feel;
- unify HUD/panels with illustrated scenes;
- remove false-interactive decoration;
- tune typography, spacing and contrast;
- author phone layouts deliberately.

## Asset approach

Preferred formats:
- SVG for crisp scalable illustrated objects and icons;
- compressed WebP/PNG for larger painted backgrounds if/when needed;
- small atlases where they reduce requests without complicating authoring.

Runtime rules:
- cache/preload artwork;
- no per-frame DOM creation;
- bounded particles/debris;
- Canvas hitboxes remain gameplay-owned and independent of image alpha;
- support reduced motion;
- graceful fallback only during asset loading, not as the intended visual result.

## Sprint 1 acceptance

Before moving to base art:
- the character no longer reads as a capsule/rectangle construction;
- every canonical target class has a recognisable illustrated presentation;
- large targets have three materially different damage states;
- breaking a large/composite target produces visible temporary debris;
- no extra XP/resources/mastery/components are created by the art path;
- target selection / hit clarity still works on desktop and phone;
- existing gameplay/save/browser regression remains green.
