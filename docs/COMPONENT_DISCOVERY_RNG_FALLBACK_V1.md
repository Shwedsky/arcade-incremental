# Component Discovery & RNG Fallback V1

Status: **LOCKED MECHANIC BASELINE / PRE-VISUAL**

## Goal

Rare components should feel exciting without allowing mandatory progression to be blocked by bad RNG.

Every component family therefore has three layers:
1. recognizable eligible source targets;
2. hidden pity protection after its recipe/need is revealed;
3. expensive broker/shop fallback for mandatory progression.

## Discovery rule

A component family becomes **field-discovered** only when the player personally recovers it in active play.

Workers may recover a component only after that family is field-discovered.

Buying one from a broker may unblock a recipe, but it does **not** count as field discovery and therefore does not enable worker recovery of that family.

## Pity counters

Pity counts eligible targets after the first meaningful need for that family is visible to the player.

| Family | First main source | Guaranteed by |
|---|---|---:|
| Bearing | Z1 bike/fan/mechanical | existing early guardrail |
| Hydraulic Unit | Z1/Z2 medium appliance/jack | existing early guardrail |
| Pump | Z2 pumps/washers/service equipment | 8 eligible targets |
| Compressor | Z3 fridge/AC/compressor targets | 10 eligible targets |
| Gearbox | Z4 drivetrain/vehicle assemblies | 8 eligible targets |
| Generator/Alternator | Z4/Z5 engines/electrical machinery | 10 eligible targets |
| Industrial Controller | Z5/Z6 control cabinets/CNC/electrical cells | 12 eligible targets |
| Heavy Hydraulic Cylinder | Z6/Z7 heavy machinery/hydraulic assemblies | 10 eligible targets |

The guarantee should be delivered by an eligible target, not silently added to inventory, so the player still experiences the drop moment.

## Broker fallback

For a component required by a currently visible major milestone:
- special order becomes available when the pity counter reaches roughly 60% of its guarantee threshold;
- price is intentionally premium, roughly 3–5x expected active salvage value of finding it;
- delivery may take 5–20 minutes depending on tier;
- buying does not unlock passive worker recovery until the component is later found actively.

The fallback is insurance, not the optimal acquisition path.

## First-copy protection

Automation and contracts must not consume the last copy of a newly discovered mandatory component by default.

Until the player owns at least two copies or explicitly disables protection:
- Auto-feed cannot consume the last copy;
- stock-target automation reserves one;
- optional contracts cannot request the only copy;
- sale-all actions exclude it unless explicitly confirmed.

## Component source readability

When a recipe needs a missing component, UI must state a real source category, for example:
- `Gearbox — drivetrain targets in Auto Salvage`;
- `Compressor — refrigerators / AC / compressor units in Appliance Yard`;
- `Controller — industrial control cabinets in Industrial Zone/Factory`.

No hidden wiki requirement.

## Worker component recovery

Workers recover known components at reduced rates.

Rules:
- family must be actively discovered;
- assigned zone must contain eligible sources;
- worker rare-component efficiency remains below active targeted hunting;
- worker pity does not trigger first discovery or guaranteed mandatory first copy;
- passive component output may be further limited by route specialization later.

## Signature items

Some late premium/intact salvage may be intentionally active-only.

Examples:
- complete industrial controller cabinet;
- intact heavy drive assembly;
- contract-specific serialized machine core.

These are not used as generic mandatory recipe components unless an alternate guaranteed path exists.

## RNG telemetry contract

When telemetry exists, record per component family:
- eligible targets destroyed before first drop;
- pity-triggered first drops;
- broker fallback purchases;
- active vs worker copies acquired;
- time from recipe reveal to first usable copy.

Any mandatory family with frequent broker use is a balance failure, not successful monetization/friction.
