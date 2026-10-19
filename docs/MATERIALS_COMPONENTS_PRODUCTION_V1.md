# Materials, Components & Production V1

Status: **DESIGN BASELINE FOR REVIEW**

Goal: make every processing machine answer a useful player question: **"What can I build now that I could not build from map loot alone?"**

The economy should grow in depth without becoming a factory-simulator spreadsheet. Routine chains should stay mostly 1–3 processing steps deep.

## Resource taxonomy

There are four economically different categories.

### 1. Raw salvage
Found directly on maps in weight units.

Used for:
- direct sale;
- machine/base construction;
- processing into more valuable/compact materials.

### 2. Salvaged components
Discrete intact parts recovered from recognizable objects.

Used for:
- machine recipes;
- vehicle upgrades;
- fabricated modules;
- contracts.

### 3. Processed materials
**Not normally found ready-made on maps.** Produced at the base.

They justify owning machines by becoming required inputs for advanced equipment and by improving sale/storage efficiency.

### 4. Fabricated modules
Low-volume milestone items assembled at the workbench / heavy fabrication station from processed materials + salvaged components.

These are not bulk currencies. They are construction parts for important upgrades.

## Raw-material progression

### Tier I — from minute 1
- **Ferrous scrap / metal**
- **Copper**
- **Plastic**

These remain useful for the entire game.

### Tier II — Appliance / Auto era
- **Aluminium scrap**

Why it exists:
- visually/source-wise distinct in appliances and vehicle assemblies;
- useful for vehicle bodies, electrical equipment and advanced light frames;
- creates a reason to revisit appliance/auto zones.

### Tier III — Industrial era
- **Alloy scrap**

Represents higher-grade industrial metal families without exploding inventory into stainless/chromium/tool-steel subtypes.

Why it exists:
- advanced machine frames and heavy tools should require something beyond ordinary junk metal;
- comes from industrial machines / heavy equipment;
- feeds late fabricated modules.

### Explicitly excluded unless later proven necessary
- wood;
- glass;
- generic rubber;
- separate dozens of steel grades;
- realistic chemical/fuel resources.

They add inventory noise without enough gameplay value.

## Component progression

The player should actively manage only a modest number of component families at each stage.

### Tier I — 0–8h: four families
1. **Bearing**
2. **Electric Motor**
3. **Hydraulic Unit**
4. **Electronic Module**

These remain foundational throughout the game.

### Tier II — ~4–15h: two new families
5. **Pump**
6. **Compressor**

Introduced with Garage Cooperative / Appliance Yard content.

Immediate desirable uses:
- upgraded wire/plastic processing;
- van modules;
- cooling/pneumatic equipment;
- advanced workbench/fabrication recipes.

### Tier III — ~15–40h: two new families
7. **Gearbox**
8. **Generator / Alternator Unit**

Introduced with Auto Salvage.

Immediate desirable uses:
- powered transport upgrades;
- machine drives;
- higher-tier press/fabrication systems;
- truck / hangar infrastructure.

### Tier IV — ~28–80h: two new families
9. **Industrial Controller**
10. **Heavy Hydraulic Cylinder**

Introduced with Industrial Zone / Abandoned Factory.

Immediate desirable uses:
- production cells;
- heavy tools;
- automated sorting;
- industrial press;
- recovery rig;
- factory equipment.

Ten component families is the intended broad late-game cap for this layer. Add another family only if it has a unique source and several useful recipes.

## Discovery rule

A component family is not globally available just because the zone technically contains it.

The player must manually recover the family once to "discover" it.

After discovery:
- recipes can reference it;
- workers on a mastered source zone may return it passively at reduced rates;
- contracts may request it.

This creates an exploration beat without making future supply permanently manual.

## Processed-material ladder

### Compact Metal Briquette
Machine: Small Hydraulic Press.

Input:
- loose ferrous scrap.

Value:
- more compact storage;
- better sale value;
- later usable as efficient furnace feed.

Purpose:
- first proof that processing beats selling everything raw.

### Clean Copper
Machine: Wire Stripper.

Input:
- copper/cable salvage.

Value:
- higher sale value;
- mandatory electrical/fabrication input.

**Important:** clean copper is not a map drop. This is why the wire stripper matters beyond money.

Used later in:
- control modules;
- powered tool upgrades;
- vehicle electrical systems;
- induction equipment;
- production-line electronics.

### Plastic Granulate
Machine: Plastic Shredder.

Input:
- plastic salvage.

Value:
- higher value / storage efficiency;
- required for housings, insulation and selected fabricated modules.

### Aluminium Billet
Machine path: furnace / metalworking cell.

Input:
- aluminium scrap.

Used for:
- van/truck modules;
- light machine frames;
- electrical housings;
- advanced control/fabrication parts.

### Steel Blank
Machine path: briquette/scrap -> furnace -> metalworking station.

Input:
- ferrous material.

Used for:
- heavy machine frames;
- tool upgrades;
- hangar infrastructure;
- fabricated modules.

This is a later chain; do not require steel blanks during the first garage hours.

### Alloy Billet
Industrial Workshop era.

Input:
- alloy scrap.

Used for:
- heavy cutter components;
- industrial press frames;
- truck/recovery rig parts;
- factory modules.

## Fabricated modules

These give the workbench/fabrication station a strategic purpose. They are **built**, not randomly looted.

### Drive Module
Typical recipe family:
- Electric Motor;
- Gearbox;
- Steel Blank;
- Clean Copper.

Used for:
- advanced machines;
- powered conveyors;
- truck/factory upgrades.

### Control Module
Typical recipe family:
- Electronic Module;
- Industrial Controller in advanced versions;
- Clean Copper;
- Aluminium Billet / Plastic Granulate.

Used for:
- automation upgrades;
- machine control;
- production cells.

### Hydraulic Power Module
Typical recipe family:
- Hydraulic Unit;
- Pump;
- later Heavy Hydraulic Cylinder;
- Steel/Alloy Blank.

Used for:
- press upgrades;
- heavy cutter;
- recovery rig;
- industrial machinery.

### Structural Machine Frame
Typical recipe family:
- multiple Steel Blanks;
- later Alloy Billets;
- Bearings.

Used for:
- Hangar-tier machines;
- sorting line;
- heavy fabrication station;
- factory cells.

These modules should be produced in low counts such as 1–4 per major construction, not hundreds per hour.

## Why the workbench exists

The workbench is **not a money-making processor**.

Its purpose is fabrication and progression:
- tool upgrades;
- cart upgrades;
- machine modules;
- vehicle modules;
- repair/conditioning of some salvaged components;
- milestone construction parts.

Workbench level gates fabrication complexity.

Example progression:
- Workbench I: hand tool / cart improvements;
- Workbench II: van modules, basic Drive/Control modules;
- Workbench III: Hangar machines, truck modules, industrial assemblies;
- Heavy Fabrication Station later takes over truly industrial recipes.

This gives a clear answer to "why upgrade the bench?": **because owning the raw parts is not enough to assemble advanced technology.**

## Machine ladder and long-term purpose

### Manual Workbench
Fabrication / equipment / modules.

### Small Hydraulic Press
Loose metal -> briquettes. Later upgrades improve throughput and feed furnace workflows.

### Wire Stripper
Copper salvage -> clean copper.

### Parts / Inspection Bench
Mid-early machine.

Purpose:
- inspect damaged salvaged components;
- improve chance that premium components are kept intact;
- repair selected damaged components for recipes/contracts.

This station does not create components from nothing.

### Plastic Shredder
Plastic -> granulate.

### Drill Press / Metalworking Bench
Creates simple brackets/frames and later consumes Steel/Aluminium blanks for modules.

### Furnace
Garage/Hangar transition machine.

Outputs:
- Steel Blank;
- Aluminium Billet;
- later Alloy Billet through upgraded industrial version.

### Sorting Conveyor
Hangar era.

Purpose:
- raises worker/base handling throughput;
- feeds multiple processors;
- enables true automation rather than another isolated +income multiplier.

### Heavy Fabrication Station
Salvage Yard / Industrial Workshop era.

Purpose:
- Drive Modules;
- heavy hydraulic modules;
- structural frames;
- truck/recovery/factory construction parts.

### Industrial Processing Cells
Late game.

Replace repeated tiny manual batches with configurable production cells:
- metal line;
- copper/electrical line;
- plastics/light materials line;
- advanced fabrication line.

The player chooses what to prioritize; workers/operators keep lines supplied from mastered zones.

## Buy vs Build at higher tiers

The early rule continues:

**Buy ready-made = fast + expensive. Build = cheaper cash + material/component/module requirements + time.**

But in mid/late game, some milestone equipment should require at least one fabricated module even if bought, so the player cannot completely skip the production system with cash.

Example:
- buy a truck chassis for cash;
- still build/install its salvage winch/control module from your own workshop.

This keeps progression connected.

## Sell / Keep / Process decisions

At every stage, inventory should create meaningful but readable choices.

Raw material can be:
- sold now;
- reserved for a build;
- processed for more value;
- reserved for a contract.

Component can be:
- sold;
- saved for equipment;
- used in a fabricated module;
- delivered to a contract.

Processed material can be:
- sold at a premium;
- consumed by modules;
- stockpiled for a base/vehicle milestone.

The game should never auto-sell rare components by default.

## Factory purpose

The Processing Plant is not merely "garage with bigger numbers".

It exists because by late game the player owns a **network**:
- several mastered zones generating bulk material;
- worker crews;
- assigned vans/trucks;
- industrial storage;
- multiple processing recipes;
- large contracts.

The plant turns old-zone background supply into advanced materials/modules while the player remains on the active frontier.

Late-game active reward remains superior for:
- discovery;
- targeted rare components;
- premium salvage;
- progression gates;
- signature contract items.

## Complexity guardrails

- Common raw resources late game: target ~5 families, not 20.
- Salvaged component families: target ~10 broad families.
- Fabricated modules: target ~4 core families.
- Routine chain depth: mostly <=3 transformations.
- Do not introduce a resource without an immediate useful sink.
- Do not make the player manually repeat 30-second machine batches forever; later automation must absorb old processing chores.