# Roadmap Implementation Audit V1

Status: **CURRENT SOURCE OF TRUTH AFTER CONTRACT BOARD V2**

Audited main: `52275a4886ad2b581d2492be72b57514f8d3d439`.

This document reconciles the older design baselines with the actual merged runtime after:
- Packs A-D;
- Workshop Queue UX V1;
- Human Feedback V1-V3;
- Worker & Progression Economy V2;
- Contract Board V2;
- Save V9.

Legend:
- **IMPLEMENTED** — present in runtime and protected by current automated acceptance.
- **PARTIAL** — useful runtime exists, but the design promise is materially broader.
- **NOT IMPLEMENTED** — still design-only / absent from runtime.
- **SUPERSEDED** — older design decision intentionally replaced by later owner feedback/runtime.

## Executive result

The project is no longer an early prototype. The core active loop and the main mechanical spine are implemented through **Z7 / Industrial Workshop**, including Save V9, queue scheduling, worker routes, transport progression, staged materials/components, processing/fabrication and a broad contract board.

The largest remaining product gaps are concentrated in four areas:

1. **Progression depth** — runtime player level stops at 10 and only part of the designed talent tree is active.
2. **Final macro tier** — Z8 / Port Terminal and Processing Plant do not exist in runtime.
3. **Business/fleet depth** — Driver/Technician/Foreman, worker ranks, general fleet/route buffering and late storage bottlenecks are not complete.
4. **Production visual/base evolution** — mechanics advanced much faster than the physical presentation of Hangar/Yard/Industrial Workshop and field art.

Therefore the next large implementation should **not** be monetization and should not blindly add another map before progression depth is fixed.

---

# Implementation matrix

## 1. Core active loop

| Area | Status | Current runtime |
|---|---|---|
| Top-down movement + automatic dismantle | IMPLEMENTED | Core playable loop, Chromium-covered. |
| Dense breakable field / resource bursts / magnet pickup | IMPLEMENTED | Active from Z1 onward. |
| Cart capacity + physical upgrades | IMPLEMENTED | 40 -> 55 -> 75 -> 100 kg equipment ladder. |
| Return home whenever desired | IMPLEMENTED | `На базу`; no forced fill gate. |
| Sell / keep / process choice | IMPLEMENTED | Partial selling + resource reservations. |
| Combo / active rhythm | IMPLEMENTED | Salvage branch runtime. |
| Multi-target dismantling | IMPLEMENTED | `Широкий замах` second target at reduced power. |
| Premium intact extraction vs smash decision | NOT IMPLEMENTED | Still design-only. |
| Multi-stage industrial targets | NOT IMPLEMENTED | Current heavier zones mainly scale composition/HP/yield. |

## 2. Zones / frontier

| Area | Status | Current runtime |
|---|---|---|
| Z1 Old Junkyard | IMPLEMENTED | Active/mastery/content. |
| Z2 Garages / Backyards | IMPLEMENTED | Pump family, corrected value/XP curve, world-space backdrop. |
| Z3 Appliance Yard | IMPLEMENTED | Compressor family. |
| Z4 Auto Salvage | IMPLEMENTED | Aluminium + Gearbox/Generator. |
| Z5 Industrial Zone | IMPLEMENTED | Alloy + Industrial Controller. |
| Z6 Abandoned Factory | IMPLEMENTED | Heavy Hydraulic Cylinder. |
| Z7 Heavy Depot / `Тяжёлый парк` | IMPLEMENTED | Recovery Assembly + Recovery Rig era. |
| Z8 Port / Container Terminal | **NOT IMPLEMENTED** | Design/model only. |
| Active-only mastery | IMPLEMENTED | Workers cannot master frontier content. |
| Active-only first discovery | IMPLEMENTED | Persistent discovery + worker discovery guard. |
| Mastered-zone full-clear medal | IMPLEMENTED | Durable Save V9 state. |
| Online respawn after full-clear medal | IMPLEMENTED | Old mastered zone can refill while cart has capacity. |
| Strong zone-specific mechanical identity | PARTIAL | Content/source tables/themes differ; later unique salvage interactions are still thin. |

## 3. Base ladder

| Base stage | Status | Current runtime |
|---|---|---|
| Starter / Equipped Garage | IMPLEMENTED | Machines, storage UI, queue, contracts, equipment. |
| Full Garage pressure | PARTIAL | Progression exists, but physical 8/8-space pressure is not a strong systemic gate. |
| Hangar | PARTIAL | Acquisition/recipe/progression gate exists; not yet a truly separate production-quality base scene with full bay/storage/crew systems. |
| Salvage Yard | PARTIAL | Mechanical milestone + production functionality exists; physical yard/storage/vehicle staging promise is incomplete. |
| Industrial Workshop | PARTIAL | Acquisition + additional production capacity/cells exist; presentation/staffing depth is incomplete. |
| Processing Plant | **NOT IMPLEMENTED** | Final base tier remains design/model only. |

Key conclusion: later base stages currently work more as **mechanical progression states** than the full visible business transformation promised by Design V3.

## 4. Transport

| Area | Status | Current runtime |
|---|---|---|
| Hand Cart | IMPLEMENTED | Core local collector. |
| Van | IMPLEMENTED | 400 kg mobile buffer. |
| Truck | IMPLEMENTED | 1000 kg logistics tier. |
| Recovery Rig | IMPLEMENTED | 1800 kg late mobile buffer. |
| Old transport retains value | PARTIAL | Worker-route reuse exists in limited form; full multi-vehicle fleet system is not present. |
| Van assigned to worker route | IMPLEMENTED | Worker Economy V2 optional efficiency boost. |
| Cargo rack / component locker / quick unload / magnetic unload | NOT IMPLEMENTED as full module ladder | Design-only or folded into simpler runtime behavior. |
| Light/heavy winch target gating | NOT IMPLEMENTED | Heavy target access is not yet a full transport-module mechanic. |
| General vehicle-per-worker/route assignment | PARTIAL | Not a complete fleet dispatch system. |

## 5. Workers / automation

| Area | Status | Current runtime |
|---|---|---|
| First worker without Van gate | **IMPLEMENTED / SUPERSEDES OLD DESIGN** | Owner feedback intentionally replaced the old `Van required first` rule. |
| Scavenger old-zone automation | IMPLEMENTED | Mastered-zone only. |
| Benchmark-derived output | IMPLEMENTED | Based on demonstrated active performance with bounded efficiency. |
| Two-hour worker shift/fatigue | IMPLEMENTED | Dispatch refresh action, Save V9. |
| Known-component passive recovery | IMPLEMENTED | No first discovery. |
| Additional workers | IMPLEMENTED | Worker #2, #3, #4 milestones exist. |
| Machine Operator | IMPLEMENTED | Industrial production role supported for later workers. |
| Driver / Logistician role | NOT IMPLEMENTED | Design-only. |
| Technician role | NOT IMPLEMENTED | Design-only. |
| Foreman / crew grouping | NOT IMPLEMENTED | Design-only. |
| Worker rank/training 1-5 | NOT IMPLEMENTED | No full rank progression. |
| Route storage / explicit bottleneck reporting | PARTIAL | Offline reports exist, but full remote/base storage network is not implemented. |
| Fleet-wide worker/vehicle assignment | PARTIAL | Van route bonus exists; general network still missing. |

## 6. Materials / components / production

### Resource taxonomy

| Layer | Status |
|---|---|
| Metal / Copper / Plastic | IMPLEMENTED |
| Aluminium Scrap | IMPLEMENTED |
| Alloy Scrap | IMPLEMENTED |
| Bearings / Motor / Hydraulic Unit / Electronics | IMPLEMENTED |
| Pump / Compressor | IMPLEMENTED |
| Gearbox / Generator | IMPLEMENTED |
| Industrial Controller / Heavy Hydraulic Cylinder | IMPLEMENTED |
| Compact Briquettes / Clean Copper / Plastic Granulate | IMPLEMENTED |
| Steel Blank / Aluminium Billet / Alloy Billet | IMPLEMENTED |
| Drive / Control / structural / hydraulic-heavy module families | IMPLEMENTED mechanically |
| Recovery Assembly signature item | IMPLEMENTED |

The intended broad component-family cap is therefore effectively present already; Z8 does **not** need a gratuitous new generic component family.

### Production equipment

| Machine/system | Status |
|---|---|
| Workbench | IMPLEMENTED |
| Small Press | IMPLEMENTED |
| Wire Stripper | IMPLEMENTED |
| Plastic Shredder | IMPLEMENTED |
| Batch/offline/reorderable scheduler | IMPLEMENTED |
| Pack B/C refinement/fabrication | IMPLEMENTED mechanically |
| Industrial production cells | PARTIAL / IMPLEMENTED CORE |
| Parts / Inspection Bench as distinct system | NOT IMPLEMENTED |
| Furnace as distinct physical machine | NOT IMPLEMENTED; outputs exist through simplified production path |
| Sorting Conveyor | NOT IMPLEMENTED |
| Heavy Fabrication Station as distinct physical system | NOT IMPLEMENTED; advanced modules exist via simplified fabrication |
| Plant-scale configurable lines | NOT IMPLEMENTED |

Conclusion: the material ladder is far ahead of the **physical machine/base presentation** used to produce it.

## 7. Recipes / anti-skip progression

| Area | Status |
|---|---|
| Major milestones consume processed materials | IMPLEMENTED / IMPROVED | Worker Economy V2 revised Hangar/Yard/Workshop recipes. |
| Truck / Rig depend on advanced modules/components | IMPLEMENTED |
| Raw metal no longer universal answer | IMPLEMENTED directionally |
| Processing Plant recipe/gates | NOT IMPLEMENTED |
| Full Buy-vs-Build system for every later station | PARTIAL |

## 8. Talent / level progression

This is the largest structural gap discovered by the audit.

Current runtime definitions: **38 nodes**, but only **24 are runtime-enabled**.

Runtime-enabled shape:
- Salvage: Tier-I path through node 7 + `Широкий замах`;
- Logistics: nodes 1-4;
- Workshop: nodes 1-4 + `Тяжёлая фабрикация`;
- Automation: nodes 1-3 + `Оператор ячейки`;
- Trade: nodes 1-3.

Current player XP table ends at **level 10**, yielding at most **9 normal mastery points** from the current level model.

Design V3 expects:
- complete Tier I foundations;
- Tier II through Van/worker/Hangar era;
- Tier III through Yard/Workshop/Plant era;
- long-tail specialization far beyond 10 levels.

Classification:

| Area | Status |
|---|---|
| Tier I UI/definitions | PARTIAL |
| Tier I actual runtime mechanics | PARTIAL (24/38 total definitions currently runtime-enabled including three later nodes) |
| Tier II | VERY PARTIAL — only three isolated runtime extensions exist |
| Tier III | NOT IMPLEMENTED |
| Level/mastery curve beyond level 10 | **NOT IMPLEMENTED / HARD CAP** |
| Milestone-based tier gates | NOT IMPLEMENTED as a complete framework |
| 2-point capstones | NOT IMPLEMENTED |

**Roadmap consequence:** adding Z8/Plant before fixing progression depth would create more content on top of a player-growth system that already stops too early.

## 9. Component RNG safety

| Area | Status |
|---|---|
| Recognizable source targets | IMPLEMENTED |
| Early pity protection | IMPLEMENTED |
| Pump/Compressor pity | IMPLEMENTED |
| Gearbox/Generator pity | IMPLEMENTED |
| Controller/Cylinder pity | IMPLEMENTED |
| Recovery Assembly pity | IMPLEMENTED |
| Premium broker/shop fallback | **NOT IMPLEMENTED** |
| Generic first-copy protection against optional consumption | **NOT IMPLEMENTED as a complete rule** |
| Source hints | IMPLEMENTED / PARTIAL depending surface |

Pity makes current mandatory progression viable, but broker insurance and first-copy safety from the locked design remain unfinished.

## 10. Contracts / Trade

| Area | Status |
|---|---|
| Small early contract loop | SUPERSEDED |
| Contract Board V2 staged pool | IMPLEMENTED |
| Raw / processed / component / industrial families | IMPLEMENTED |
| Progression/capability eligibility | IMPLEMENTED |
| Recent-history repeat protection | IMPLEMENTED |
| Save V9 repeat history | IMPLEMENTED |
| Multiple simultaneous contract choices | NOT IMPLEMENTED |
| Player reroll/decline economy | NOT IMPLEMENTED |
| Preferred buyers / market specialization | NOT IMPLEMENTED |
| Plant-scale / route-capability contracts | NOT IMPLEMENTED |

## 11. Offline / saves / platform

| Area | Status |
|---|---|
| Offline baseline | IMPLEMENTED |
| Queue completion offline | IMPLEMENTED |
| Worker offline shifts | IMPLEMENTED |
| Resilient local save / backup/temp recovery | IMPLEMENTED |
| Save schema | IMPLEMENTED at **V9** |
| Platform adapter local/Yandex boundary | IMPLEMENTED |
| Responsive browser acceptance | IMPLEMENTED |
| Release ZIP / manifest | IMPLEMENTED |
| Real Yandex Console publication | EXTERNAL / DEFERRED |
| Real-account cloud-sync validation | DEFERRED |
| Ads / rewarded ads | NOT IMPLEMENTED intentionally |
| IAP | NOT IMPLEMENTED intentionally |
| Leaderboards | NOT IMPLEMENTED intentionally |

`PLATFORM_RELEASE_FOUNDATION_V1.md` still mentions Save V4 in places and is documentation-stale; runtime is Save V9.

## 12. Visual production

| Area | Status |
|---|---|
| Code-driven field/target visual foundation | IMPLEMENTED |
| Distinct zone themes/content silhouettes | IMPLEMENTED through current packs, but quality is prototype/stylized |
| Destruction / pickup / rare feedback | IMPLEMENTED foundation |
| Production-quality final art | NOT IMPLEMENTED |
| Strong visual identity for Z4-Z7 | PARTIAL |
| Truly distinct Hangar/Yard/Industrial Workshop scenes | NOT IMPLEMENTED / PARTIAL foundations only |
| Visible large-scale business growth | PARTIAL |
| Final UI/art polish | NOT IMPLEMENTED |

Owner manual feedback explicitly keeps graphics as a future major pass. This should happen before external/public testing, but it should not block finishing the mechanical progression foundation first.

---

# Superseded design decisions

The following old statements must no longer be treated as source of truth:

1. **`First worker is always after Van`** — superseded by owner feedback and Worker Economy V2. First worker may be hired after the mastered-zone/cash gate without Van; Van becomes an optional route efficiency upgrade.
2. **Flat worker throughput** — superseded by benchmark-derived worker output and bounded 2h shifts.
3. **Three-contract rotating board** — superseded by Contract Board V2 staged pool/repeat protection.
4. **Save V4/V8 as current schema** — superseded by Save V9.
5. **Manual Target Run V1 is still the next product gate** — stale. It has already produced several fix/improvement cycles.

---

# Stale repository items

## Old open issues

- **#1 Design v0** — historical, superseded by later design/runtime.
- **#3 Design v2** — historical locked baseline, but several decisions were later superseded; should be closed as superseded after this audit is merged.
- **#4 Economy simulation v0** — requested simulation/model work now exists in committed Python/runtime proofs; should be closed as completed/superseded by newer models.

Keep the issue bodies for history; do not delete them.

## Documentation debt

- README next-gate text still points to the first Manual Target Run.
- `PLATFORM_RELEASE_FOUNDATION_V1.md` still refers to Save V4.
- some Pack checkpoint statuses describe pre-merge validation states.
- old worker docs still state the first-worker Van gate.

Do not rewrite old historical design documents destructively. This audit becomes the correction layer; update only current-facing README/status docs where confusion matters.

---

# Prioritized production roadmap from current main

## P1 — Progression Expansion V2

**Do this next.**

Why:
- current level/mastery progression hard-stops at 10;
- player feedback already identified long waits between meaningful perk/content beats;
- Z5-Z8/Plant content without deeper character/business progression would feel increasingly flat;
- Tier II/III mechanics are already designed, so this is not speculative feature invention.

Scope recommendation:
1. extend level/XP/mastery progression into mid/late game with deterministic pacing model;
2. finish currently defined Tier-I nodes that are still non-runtime where their systems already exist;
3. implement a coherent Tier-II first tranche across all five branches, not isolated node 8 exceptions;
4. add milestone-based tier gates (Van / Worker / Hangar etc.);
5. preserve specialization — do not hand out enough points to buy everything immediately;
6. add UI to clearly distinguish tiers and locked milestone requirements;
7. migrate current talent saves without reset.

Do **not** attempt all 115 final points/Tier III in one PR. Establish the expandable runtime model first.

## P2 — Content Pack E: Z8 + Processing Plant closure

After progression runtime can grow beyond level 10:
- Z8 Port / Container Terminal;
- no unnecessary new generic component family unless gameplay proves a need;
- heavy/port target composition using existing late components and signature salvage;
- Processing Plant acquisition and anti-skip recipe;
- plant-scale storage/production-line baseline;
- Plant/Z8 mastery/frontier/worker rules;
- late large contracts hooks.

## P3 — Workforce & Fleet V3

- Driver/Logistician;
- Technician;
- Foreman/crew grouping;
- worker ranks/training;
- general vehicle-to-route assignments;
- remote/base storage buffers and visible bottleneck reasons;
- old Van/Truck/Rig as a real fleet.

## P4 — Economy Safety / Production Equipment completion

Can be split around P2/P3 as needed:
- broker fallback for mandatory components;
- generic first-copy protection;
- Parts/Inspection Bench;
- Furnace / Sorting Conveyor / Heavy Fabrication as explicit physical systems where they add gameplay rather than duplicate hidden formulas;
- stock-target automation.

## P5 — Production Visual / Base Evolution pass

Before broader external testing:
- production-quality Z1-Z8 environment/target art;
- stronger destruction/rare-drop effects;
- truly distinct Garage/Hangar/Yard/Industrial Workshop/Plant scenes;
- vehicle/worker/base visual growth;
- UI cleanup and consistent art language.

## P6 — Platform / monetization / publication

Only after the game itself survives later integrated human review:
- real Yandex account/cloud validation;
- Yandex Console upload/moderation;
- analytics boundary;
- ads/rewarded design;
- IAP if still desired;
- external player cohort.

---

# Next action

Create **Progression Expansion V2** from current main after this audit is merged.

The next runtime package should solve the level-10/mastery ceiling and coherent Tier-II foundation before Content Pack E adds the final frontier/base tier.
