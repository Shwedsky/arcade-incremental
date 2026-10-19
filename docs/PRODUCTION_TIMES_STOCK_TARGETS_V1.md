# Production Times & Stock Targets V1

Status: **LOCKED MECHANIC BASELINE / PRE-VISUAL**

## Principle

Processing exists to create construction inputs that cannot be picked up directly from a map.

The player should understand a short chain:

`salvage -> processed material -> fabricated module -> major upgrade`

No required construction path should exceed roughly three transformation levels.

## Existing early processes

These stay compatible with Early Game V0:

| Station | Input | Output | Base cycle |
|---|---|---|---:|
| Small Press | 10 kg metal | 10 kg briquette | 30 s |
| Wire Stripper | 5 kg copper | 5 kg clean copper | 38 s |
| Plastic Shredder | 10 kg plastic | 10 kg granulate | 42 s |

Higher station level increases useful batch size and/or speed; Workshop talents may improve yield.

## Mid-game furnace / material processes

| Process | Input | Output | Base cycle |
|---|---|---|---:|
| Steel Blank | 25 kg briquette/metal feed | 20 kg steel blank | 150 s |
| Aluminium Billet | 20 kg aluminium | 16 kg aluminium billet | 180 s |
| Alloy Billet | 25 kg alloy scrap | 18 kg alloy billet | 240 s |

Exact losses remain balanceable. The gameplay purpose is that these outputs cannot be salvaged as generic ready-to-use construction stock.

## Fabricated module families

### Drive Module
Purpose: powered transport and machine drives.

Baseline recipe:
- 12 kg Steel Blank;
- 3 kg Clean Copper;
- Electric Motor x1;
- Bearing x2;
- fabrication: ~6 min.

### Control Module
Purpose: vehicle/station control, automation and electrical systems.

Baseline recipe:
- 4 kg Steel Blank;
- 4 kg Clean Copper;
- 3 kg Plastic Granulate;
- Electronic Module x2;
- fabrication: ~7 min.

### Hydraulic Power Module
Purpose: presses, lifts, yard machinery.

Baseline recipe:
- 10 kg Steel Blank;
- Hydraulic Unit x1;
- Pump x1;
- fabrication: ~8 min.

### Structural Machine Frame
Purpose: major station/base construction.

Baseline recipe:
- 35 kg Steel Blank;
- 10 kg Aluminium Billet;
- Bearing x2;
- fabrication: ~10 min.

## Late upgraded modules

Late recipes reuse a lower module plus one new frontier component. They do not add another long crafting tree.

### Industrial Drive
- Drive Module x1;
- Gearbox x1;
- 8 kg Alloy Billet;
- 4 kg Clean Copper;
- ~12 min.

### Industrial Control
- Control Module x1;
- Industrial Controller x1;
- 5 kg Clean Copper;
- ~14 min.

### Heavy Hydraulic Module
- Hydraulic Power Module x1;
- Heavy Hydraulic Cylinder x1;
- 10 kg Alloy Billet;
- ~14 min.

### Heavy Structural Frame
- Structural Machine Frame x1;
- 20 kg Alloy Billet;
- 10 kg Aluminium Billet;
- ~16 min.

This is the maximum intended mandatory depth.

## Representative milestone use

### Van era
Van itself may be bought as a chassis/vehicle, but field preparation consumes player-produced material:
- cash/chassis cost;
- Clean Copper;
- metal/briquette;
- one Motor / Electronics set.

No furnace-only material is required before furnace is reasonably obtainable.

### Hangar
Hangar fit-out requires fabricated modules, making Workshop progression meaningful:
- Drive Modules;
- Control Modules;
- Structural Machine Frame;
- cash/property cost.

### Truck
Requires:
- purchased/recovered chassis;
- Drive Modules;
- Control Module;
- Structural Frame;
- Gearbox family component.

### Salvage Yard
Requires several Structural Frames + Hydraulic Power Modules plus large cash/material investment.

### Industrial Workshop / Processing Plant
Use Industrial Drive / Control / Heavy Hydraulic / Heavy Frame families.

Therefore money can accelerate acquisition but cannot completely bypass the production network.

## Queue philosophy

Keep queue management readable:
- Garage: 1 base slot, 2 with current Tier-I Workshop talent;
- Hangar: 2 physical cells baseline;
- Salvage Yard: 3 cells;
- Industrial Workshop: 4 cells;
- Plant: 6 cells.

A `cell` is a production lane, not one queue per visible machine. Related machines can be linked later.

## Operator effect

One Operator assigned to a cell:
- cycle duration ×0.75;
- automatically restarts configured recipe;
- respects stock targets/reserves;
- does not create ingredients or ignore station prerequisites.

## Stock targets — late Automation

The current early Auto-feed behavior is simple: repeat while stock exists.

Tier-III `Smart Processing` adds explicit stock targets.

For each processed/module output, player may set:
- `Minimum reserve` — do not consume this input below the configured amount;
- `Target stock` — stop producing when output reaches this amount;
- `Priority` — Low / Normal / High among recipes sharing a cell.

Example:
- keep at least 30 kg raw copper;
- target 25 kg Clean Copper;
- do not convert the last copper needed for a contract.

## Default behavior

Players who never configure stock targets still get safe defaults:
- reserve 20% of each common raw material;
- stop common processed stock at approximately one current milestone-recipe worth plus 25%;
- do not auto-consume the final copy of a rare component;
- no automatic fabrication of expensive modules unless a target is explicitly enabled.

This prevents automation from silently eating a component the player was saving.

## Construction clarity

Every milestone/upgrade card must show:
1. raw materials;
2. processed materials;
3. fabricated modules;
4. components;
5. cash;
6. station prerequisite;
7. where each missing family comes from.

A processed output without a visible future use is considered a design bug.
