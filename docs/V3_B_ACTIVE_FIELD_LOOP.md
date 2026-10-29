# Progression Reframe V3-B — Active Field Loop

Status: implementation checkpoint / owner-testable increment.

Base: V3-A head `b874dbb9955c4a3885d7f5a0bc2a69fd7480e66a`.

## Goal

Turn the field from a passive "stand near scrap until it disappears" interaction into a readable active loop that communicates power, cargo and return-to-base progression.

The V3-B owner slice must make this chain explicit:

`approach target -> read HP and player DPS -> deal readable hits/crits -> collect into vehicle cargo -> return to base -> unload -> resources enter storage`

Large salvage piles additionally use:

`parent pile -> break -> child salvage targets -> break children -> cargo`, with one fixed reward budget shared across the whole pile so parent + children can never duplicate rewards.

## In scope

1. Target HP / max HP presentation and player effective DPS presentation.
2. Readable damage events instead of frame-by-frame text spam.
3. Deterministic critical hits with visible crit feedback and preserved average combat math.
4. Explicit expedition cargo separate from base storage.
5. Explicit manual unload action at base; only unload transfers cargo to storage.
6. Storage-capacity-safe unload: overflow remains in cargo.
7. Real salvage piles that break into real child salvage targets.
8. Fixed pile reward budget distributed across children exactly once.
9. Deterministic pile respawn so the field does not become permanently empty.
10. DEV/review preset and automated tests covering the complete V3-B loop.

## Product rules / invariants

- No implicit field-to-storage transfer in Garage V3-B.
- Destroying a target fills cargo, not storage.
- Unload is an explicit player action.
- A pile parent grants no second independent reward when children exist.
- Sum of all child rewards equals the pile reward budget (within integer rounding defined by the implementation).
- Crit changes hit shape/feedback but cannot create nondeterministic saves or tests.
- Damage text is aggregated into readable hit events; never one floating number per animation frame.
- HP, DPS and cargo values shown in UI come from canonical gameplay state, not duplicated presentation-only counters.
- Existing V3-A clarity behavior must remain intact.
- No economy retune, talent rank redesign, respec, business ascension, Production Line orchestration or P6 in this increment.

## Owner acceptance

The owner should be able to play a Garage expedition and answer, without external explanation:

- How much HP does this target have?
- How much damage am I doing and when did I crit?
- How full is my cart?
- Are resources already in storage or still in the cart?
- What must I do at base to bank them?
- Why did a large pile split into smaller salvage pieces?
- Can I keep scavenging instead of emptying the whole map forever?

The build is not owner-ready merely because CI is green. It is owner-ready only when the whole loop above is visible and coherent in one packaged review build.
