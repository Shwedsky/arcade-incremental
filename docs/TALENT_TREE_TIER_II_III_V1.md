# Talent Tree Tier II / III V1

Status: **DESIGN BASELINE FOR REVIEW**

The current five branches are permanent. Early-game nodes are **Tier I**, not the final tree.

No respec/reset is required when new tiers unlock.

## Unlock philosophy

Tier unlocks are attached to major progression milestones rather than only player level.

Suggested structure:
- **Tier I** — current Garage-era tree;
- **Tier II** — Van / first worker / Hangar progression;
- **Tier III** — Salvage Yard / Industrial Workshop / Processing Plant progression.

Each tier continues the same rule:

**foundation -> mechanic unlock -> mechanic improvement -> meaningful specialization.**

Avoid long stretches of `+5%` nodes.

## Salvage branch

Fantasy: the player personally becomes absurdly efficient at destroying and extracting value from frontier junk.

### Tier I recap
- dismantle-speed foundations;
- weak points;
- Combo;
- longer Combo;
- larger Combo cap;
- momentum;
- component hunter.

### Tier II — multi-target dismantling

#### 1. Wide Swing
**New mechanic:** the equipped tool can affect a second valid nearby target.

Baseline intent:
- primary target: 100% normal power;
- secondary target: ~55% power;
- automatic target selection in a small secondary cone/radius;
- no extra input required.

This directly implements the desired feeling of breaking two nearby objects at once.

#### 2. Split Force
Secondary target rises to ~75–80% power.

#### 3. Dual Break
Secondary reaches full power or very close to it.

The exact value comes from combat pacing tests.

#### 4. Heavy Weak Points
Large/armoured targets lose part of their effective resistance / tool penalty.

#### 5. Sweep Momentum
Breaking either parallel target refreshes Combo and gives a brief movement/attack rhythm bonus.

#### 6. Salvage Choice
Premium targets expose a simplified `Preserve core` vs `Smash for bulk` mode more efficiently.

#### 7. Zone Predator
On mastered low-tier zones, massively improves clear speed but **not** passive worker income. This is explicitly a player power-fantasy talent.

### Tier III — controlled area destruction

#### 1. Chain Break
Destroying a target sends a fraction of tool power to the nearest small/medium target.

#### 2. Triple Pressure
Under high Combo or a late tool requirement, a third low-power target can be affected.

#### 3. Industrial Cutter Mastery
Large industrial targets dismantle materially faster and lose more stages per active cycle.

#### 4. Component Preservation
Focused intact-component mode loses less bulk yield / takes less extra time.

#### 5. Salvage Storm
Late capstone: sustained high Combo turns dense old-zone content into a spectacular chain-clear state.

Guardrail:
- do not make this a permanent full-screen auto-clear;
- route choice and player movement still matter.

## Logistics branch

Fantasy: stay in the field longer, move value more efficiently, and turn vehicles into a salvage network.

### Tier II — Van / route mechanics

#### 1. Van Packing
More usable van cargo.

#### 2. Quick Unload
Cart -> van transfer is much faster.

#### 3. Component Locker
Rare components no longer compete strongly with bulk cargo / receive dedicated protected storage.

#### 4. Mobile Magnet
Near the van, cart unloading becomes automatic or near-instant.

#### 5. Route Knowledge
Mastered-zone active runs start with better route information / target highlighting for requested resources.

#### 6. Light Winch
Van can support selected medium-heavy salvage targets.

#### 7. Long Haul
Late Van-era capstone that makes long frontier runs efficient until Truck unlock.

### Tier III — Truck / fleet mechanics

#### 1. Fleet Utilization
Vehicles assigned to worker routes gain throughput.

#### 2. Heavy Winch
Truck/recovery rig supports heavier salvage classes.

#### 3. Mobile Workshop Power
Selected field tool/heavy-salvage actions gain efficiency near the vehicle.

#### 4. Route Buffer
Remote crews can hold more output before stopping.

#### 5. Multi-route Logistics
A Driver/Foreman can support more than one compatible worker route.

#### 6. Rapid Dispatch
Vehicle reassignment downtime is reduced.

#### 7. Recovery Network
Late capstone: old vehicles/crews function as a coordinated logistics network instead of isolated assignments.

## Workshop branch

Fantasy: turn recovered junk into technology the map cannot provide directly.

### Tier II — Hangar fabrication

#### 1. Parallel Work
Second workshop slot. Existing prototype direction remains valid.

#### 2. Calibration
Meaningful fabrication/processing speed increase.

#### 3. Material Recovery
Improved yield from processed materials, especially advanced metals.

#### 4. Module Fabrication
Unlocks the first formal fabricated modules: Drive / Control / Hydraulic / Structural families.

#### 5. Precision Bench
Improves damaged-component repair/inspection and premium intact recovery sinks.

#### 6. Furnace Tuning
Improves Steel/Aluminium billet efficiency.

#### 7. Hangar Cell
Capstone: one compatible machine group can act as a linked production cell with less manual queueing.

### Tier III — industrial production

#### 1. Third Production Cell
Expands simultaneous industrial work without creating dozens of manual queues.

#### 2. Alloy Processing
Improves Alloy Billet yield/time.

#### 3. Heavy Fabrication
Unlock/boost late structural and recovery modules.

#### 4. Standardized Frames
Reduces processed-material cost of repeated high-tier construction modules.

#### 5. Industrial Quality
Selected fabricated modules count as higher-quality outputs for contracts/equipment.

#### 6. Continuous Production
Compatible lines automatically continue configured recipes while stocked.

#### 7. Plant Engineer
Capstone: substantial throughput bonus to staffed industrial production cells.

## Automation branch

Fantasy: old work keeps happening while the player pushes new content.

### Tier I recap
- offline efficiency;
- offline cap;
- auto-feed and related early queue systems as they become implemented.

### Tier II — workers and mastered zones

#### 1. Crew Dispatch
Unlocks/strengthens formal worker assignment UI after first worker milestone.

#### 2. Better Routes
Field workers gain bulk yield on mastered zones.

#### 3. Component Sorting
Workers have a better chance to return **already-discovered** component families.

#### 4. Shift Storage
Remote route buffer increases before a route stops due to capacity.

#### 5. Machine Operator
Operators reduce processing downtime between batches.

#### 6. Crew Training
Worker rank gain / training efficiency improves.

#### 7. Self-running Shift
One mastered-zone crew + one production cell can operate through the full offline cap with reduced idle losses.

### Tier III — crew/cell coordination

#### 1. Foreman
Unlocks crew grouping / higher-level management.

#### 2. Route Balancing
Workers prefer base resources that are below configured stock targets.

#### 3. Smart Processing
Production cells choose configured stock targets rather than endlessly overproducing one output.

#### 4. Expanded Offline Cap
Later cap progression becomes meaningful once the network is large.

#### 5. Maintenance Planning
Reduces late production downtime / route inefficiency without adding manual repair chores.

#### 6. Network Dispatcher
One Foreman can coordinate several routes and operators.

#### 7. Autonomous Old World
Capstone: mastered low/mid zones and baseline production are highly self-sufficient, leaving the player's attention on frontier/premium content.

Guardrail:
- this capstone still cannot discover new zones/components for the player.

## Trade branch

Fantasy: turn the same salvage network into a smarter business, not just a flat sell-price bonus.

### Tier II — specialized buyers / contracts

#### 1. Specialist Buyers
Unlock buyers that pay premiums for a material/component family.

#### 2. Contract Choice
Offer multiple contracts rather than exactly one forced request.

#### 3. Rush Orders
Higher-risk/higher-value timed contracts using stock the player chooses to reserve.

#### 4. Vehicle Buyer Network
Better pricing / trade-in economics for transport purchases/upgrades.

#### 5. Industrial Customer
Unlock higher-volume processed-material orders.

#### 6. Contract Reroll
Limited reroll/decline without waiting a long period.

#### 7. Preferred Supplier
Capstone: repeat buyers improve rewards for consistent deliveries without creating a mandatory daily streak.

### Tier III — market strategy

#### 1. Large Contracts
Plant-scale orders become available.

#### 2. Premium Salvage Orders
Contracts request signature/intact items from active frontier play.

#### 3. Material Futures
Limited advance visibility into which material families will receive a temporary premium; no gambling mechanics.

#### 4. Industrial Procurement
Lower cash prices for selected ready-made industrial equipment, while fabricated-module gates remain.

#### 5. Buyer Specialization
Choose a preferred market family for a stronger bonus rather than universal inflation.

#### 6. Logistics Contracts
Some orders reward delivery capacity/crew network rather than only item value.

#### 7. Salvage Empire
Late capstone: stronger large-contract economics and buyer choice, not a universal infinite cash multiplier.

## Cross-branch synergies

Branches should interact naturally without hidden combo formulas.

Examples:
- Salvage multi-target + Logistics long runs = stronger active frontier efficiency;
- Automation field crew + Logistics spare van = productive old-zone route;
- Workshop module fabrication + Trade industrial contracts = profitable processing business;
- Automation operator + Workshop continuous production = low-maintenance old processing;
- Trade specialist buyer can create a reason to revisit an old mastered zone personally.

## Gating by milestones

Suggested Tier II availability requires one or more of:
- Van acquired;
- first worker hired;
- Hangar purchased;
- player level/mastery threshold.

Suggested Tier III requires:
- Salvage Yard or Industrial Workshop;
- Truck/recovery tier;
- multiple zones mastered;
- higher mastery threshold.

Do not unlock all Tier II/III nodes merely because XP was farmed in Z1.

## Mastery-point economy guardrail

The player should not be able to buy every branch immediately.

Later tiers should force meaningful specialization for long stretches while still allowing eventual broad completion if the total game is very long.

Before implementation, simulate:
- points earned vs milestone hours;
- earliest multi-target unlock;
- earliest worker automation upgrades;
- time to first Tier II capstone;
- percentage of tree reasonably owned at 20h / 50h / 100h / 150h.

## Visual/UI implication — deferred

Do not design final tree artwork yet.

Mechanically, the UI will eventually need to communicate:
- Tier I / II / III separation;
- milestone gates;
- prerequisites;
- new-mechanic nodes versus numeric improvements;
- current branch investment.

Final visual layout comes only after the mid/late mechanics and point pacing are modeled.