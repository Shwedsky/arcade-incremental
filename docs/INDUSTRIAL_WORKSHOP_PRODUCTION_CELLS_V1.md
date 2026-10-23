# P5 — Industrial Workshop & Production Cells V1

Status: **ACTIVE STACKED IMPLEMENTATION CHECKPOINT**

Issue: #49
Stacked baseline: validated P4 head `c6406a2e288bf8dceae3fedef8c5a9a062e571fe`
Temporary PR base while P4 is unmerged: `feature/salvage-yard-fleet-network-v1`

## Product promise

> I am no longer only recycling scrap. I manufacture industrial outputs from a supply network.

P5 converts the existing Industrial Workshop milestone from mostly-owned mechanics into a readable production business stage. The player should think in a small number of industrial cells, staff assignments, reserved inputs, output priorities and bottlenecks — not in belts, wires or dozens of tiny machines.

## Constraints inherited from the roadmap

- Preserve the active frontier loop; no Z9+.
- Workforce V3 remains the only worker authority.
- Fleet/Routes V3 remains the only route/vehicle authority.
- Save V10 remains compatible; no reset.
- No new generic resource family unless a concrete current-chain gap proves unavoidable.
- Do not redesign Processing Plant V2 in P5.
- Do not introduce conveyor/power-layout simulation.
- Existing Yard/Hangar/Contract/Talent/Workshop behavior must remain compatible.

## Implementation slices

### P5-A — Industrial Workshop scene + production read model

Deliver a stage-specific Industrial Workshop Overview and a canonical production-cell read model.

Initial visible cell families:
1. **Refining Cell** — turns late raw/industrial input into purposeful processed feedstock.
2. **Fabrication Cell** — creates modules/components used by upgrades/orders/heavy work.
3. **Heavy Assembly Cell** — consumes higher-tier feedstock/modules and represents large industrial output.

Inspection/sorting should initially be represented as capability/readiness inside these cells unless a separate fourth cell creates a clearly better decision. Avoid creating a fourth surface only to satisfy taxonomy.

Each cell read model must expose:
- id + label + family;
- unlocked/available state;
- selected plan/recipe;
- input requirements and currently free/reserved amounts;
- output amount/family;
- base duration and effective duration/throughput;
- assigned worker, role and staffing effect;
- status (`idle`, `ready`, `running`, `blocked`, `complete` or equivalent);
- explicit bottleneck text/code;
- remaining time/progress where running.

### P5-B — Production execution + reservations + parallelism

Create a small canonical Production Cells V1 runtime rather than extending legacy one-off UI actions.

Requirements:
- at least two cells can run simultaneously;
- starting a cell atomically reserves/consumes its inputs according to one clear rule;
- another cell cannot double-spend the same stock;
- completion happens once across live tick/reload/offline paths;
- cell runtime is persisted inside Save V10-compatible state;
- old late-game fields remain migration inputs/compatibility mirrors only where necessary.

Prefer reservation-at-start for industrial cells if it makes restart/offline behavior deterministic. If queue-time reservation is used instead, expose it clearly and reuse the existing reservation helpers rather than inventing a second hidden reservation model.

### P5-C — Staffing differentiation

Use canonical Workforce V3 workers.

Role behavior for P5:
- **Operator** — improves throughput / effective cycle time on operational cells;
- **Technician** — improves fabrication/heavy-assembly efficiency or unlocks advanced plan capability;
- **Logistician** — improves industrial input availability/handling or removes a defined inbound handling penalty; never creates materials from nothing;
- **Scavenger** — remains strongest on supply routes and receives no fake production bonus.

Assignment rules:
- one worker cannot simultaneously own a route and a production cell;
- assigning to a cell detaches the previous canonical route/production assignment using Workforce V3 state;
- UI must show before/after production effect on the same screen;
- avoid numbered/special worker semantics.

### P5-D — Heavy identity + persistence/offline/responsive hardening

Recovery Rig must gain one measurable industrial reason to exist beyond capacity. Preferred first implementation: a heavy industrial supply/assembly plan gains a clearly labeled throughput/readiness advantage when a free/assigned Recovery Rig supports the heavy cell or the required heavy inbound route.

Guardrails:
- no magical teleport capacity;
- no new vehicle state outside Fleet V3;
- the same Rig cannot support two mutually exclusive jobs at once;
- mobile UI must remain readable.

Offline acceptance must prove:
- running cells progress through the normal startup/offline pipeline;
- completion is not duplicated;
- blocked cells report their real bottleneck;
- route/storage pressure and production input pressure remain causally connected.

## First-pass industrial plans

P5 should reuse current material families and late recipes wherever possible. Exact recipes are chosen only after auditing existing `industrial_chain_v1`, Pack B-D inventories and contract sinks.

Target plan structure:
- Refining: common late industrial feedstock with at least two downstream sinks;
- Fabrication: module/component output used by Heavy Assembly and at least one upgrade/order sink;
- Heavy Assembly: high-value industrial output/order item, not another generic raw resource.

The implementation must not reintroduce the old problem of one intermediate existing for one button only.

## UI / scene acceptance

Industrial Workshop Overview must read as a new business stage relative to Yard:
- enclosed/covered industrial production area or a strong heavy-workshop extension;
- distinct refining/fabrication/heavy assembly zones;
- staff positions/readiness visible;
- input/output staging visible;
- current production state reflected in the scene, not only in cards.

Production surface must answer without opening multiple tabs:
- what is running;
- what it consumes;
- what it produces;
- who is assigned;
- when it completes;
- what is blocking the next cycle;
- what changes if a different worker/vehicle is assigned.

## Automated gate

P5 is not complete until dedicated domain/browser acceptance proves:
1. Industrial Workshop is structurally/visually distinct from Salvage Yard and Hangar.
2. At least two production cells run in parallel.
3. Input reservation prevents double-spend.
4. Operator and Technician assignments cause measurable real changes.
5. Bottlenecks name actual missing input/staff/capacity conditions.
6. Recovery Rig provides one measurable heavy-industrial advantage.
7. Save V10 reload/offline progression completes each cell exactly once.
8. Existing P0-P4/Core Rebuild/Owner Feedback regressions remain green.
9. Desktop and phone-sized production management remain usable.

Manual owner testing remains deferred to the later combined product slice unless explicitly requested earlier.
