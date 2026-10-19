# Human Feedback Fix Pack V1 — Delivery Checkpoint

Status: **IMPLEMENTATION COMPLETE / EXACT-HEAD INTERNAL GREEN REQUIRED**

Tracked by Issue #23.

Base: `main` @ `5459056470600b4e26856fa74b219a2e4658ccd4` after Manual Review Prep V1.

## Owner feedback captured

### P0
- Owner reported that the excursion did not start in Manual Review V1.

The first browser reproduction proved that clicking the garage action did hide the garage, but the original assertion itself incorrectly waited for a hidden element to become visible. The corrected acceptance now verifies the actual product condition: the garage becomes hidden **and the excursion timer advances** after clicking the explicit launch action.

To remove ambiguity for the player, the garage action is normalized to `Начать вылазку · <зона>` and receives stronger visual emphasis.

### P1
Delivered:
- field HUD cards are moved into non-overlapping safe positions;
- normal field HUD is semi-transparent while idle and returns to near-full opacity on hover/focus;
- transient gameplay feedback (target, rare drop, toast, cart-full message) keeps its own visibility animation instead of inheriting passive HUD opacity;
- garage material/component display is replaced with readable discovery slots;
- metal/copper/plastic are visible immediately;
- undiscovered advanced materials/components render as `?` without name spoilers;
- discovered slots expose Russian names and amounts;
- rarity frames use common gray -> uncommon green -> rare blue -> epic purple -> legendary orange;
- garage late-game player-facing terminology is normalized to Russian instead of raw Pack B/C/D English labels;
- mobile HUD receives additional vertical separation.

## Automated acceptance added

Manual-review Chromium proof now checks:
1. fresh isolated review start;
2. field `zone` / `goal` HUD cards do not overlap at desktop review viewport;
3. passive field HUD opacity is below 0.9 and hover restores it above 0.9;
4. known base material card is readable;
5. undiscovered advanced material/component cards remain mystery slots;
6. legendary late component has legendary rarity framing;
7. raw English production labels are not exposed in normal garage UI;
8. launch button explicitly says `Начать вылазку`;
9. launch hides the garage and active excursion time advances;
10. review reload preserves its isolated progress sentinel;
11. ordinary-origin save slots remain untouched.

## Release candidate

CI now packages:
- `arcade-incremental-release-candidate-v7`;
- `arcade-incremental-manual-review-v1-feedback-fix1`.

The owner should resume Manual Target Run V1 only from the new feedback-fix artifact after the exact PR head passes the complete ordinary CI gate and is merged.

## Guardrails

- no economy/progression rebalance;
- no new zones/machines/workers/talents/recipes;
- Save V8 compatibility retained;
- Workshop Queue and Pack A-D regressions retained;
- production-art overhaul remains out of scope;
- no owner manual run resumes until exact-head internal CI is green.
