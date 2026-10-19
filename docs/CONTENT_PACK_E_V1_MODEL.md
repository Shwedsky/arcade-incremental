# Content Pack E V1 — runtime model

Status: **LOCKED NUMERIC BASELINE FOR IMPLEMENTATION**

This is the runtime reconciliation layer between the structural late-game documents and the already-shipped Pack C/D numbers. It deliberately avoids introducing another generic resource family.

## Z8 — Port / Container Terminal

Structural source says Z7 mastery target is ~4.5 active hours and Z8 ~5.0 active hours. Runtime Packs C/D already encode increasing HP, value density and heavy-target share, so V1 continues that curve rather than copying structural kg/hour values directly.

Runtime profile:
- id: `z8`;
- name: `Портовый терминал`;
- minimum player level: **16**;
- prerequisite: Z7 mastered;
- prerequisite: Industrial Workshop operational;
- prerequisite: Recovery Rig owned;
- HP multiplier: **3.85**;
- base yield multiplier: **2.90**;
- mastery target: **14,200 mastery units**;
- target weights: small scrap .02 / cable .04 / small appliance .04 / bike-fan .04 / medium .26 / large .60.

Why these numbers:
- the target mix is heavier than Z7 (.60 large vs .52);
- HP grows materially but not exponentially;
- mastery rises from 12,200 to 14,200 while late Salvage/Tier-II power is now available;
- yield rises ~14%, preserving highest active value density without making Z7 obsolete overnight.

The structural 5h target remains a balance target, not a claim that every build takes exactly five wall-clock hours.

## Z8 advanced outputs

No sixth raw-resource family.

Z8 yields:
- normal metal/copper/plastic through the existing zone multiplier;
- aluminium scrap through recognizable port/vehicle machinery;
- alloy scrap at the best current active rate;
- already-existing industrial components through the normal late discovery tables;
- one signature progression salvage: **Port Power Assembly / Портовая силовая сборка**.

The signature item is not a generic inventory family. It is a rare progression key analogous to Z7 Recovery Assembly.

### Port Power Assembly
- eligible target: large target only;
- base roll: 3.5% per eligible target;
- deterministic pity: **8 eligible large targets**;
- first copy can only be found by active player play;
- workers do not discover it;
- Processing Plant consumes one copy.

## Processing Plant

Cash cost: **1,200,000**.

Recipe V1:
- Metal 720;
- Clean Copper 120;
- Plastic Granulate 100;
- Steel Blank 160;
- Aluminium Billet 72;
- Alloy Billet 260;
- Drive Module 5;
- Control Module 6;
- Hydraulic Power Module 6;
- Heavy Frame 8;
- Industrial Controller 4;
- Heavy Hydraulic Cylinder 4;
- Port Power Assembly 1.

Hard gates:
- Industrial Workshop owned;
- Recovery Rig owned;
- Z8 mastered;
- Worker #4 hired (minimal mature-staffing proof for V1).

This makes Plant an anti-skip culmination of existing processing/fabrication rather than another cash button.

## Plant baseline benefits

V1 intentionally keeps factory management shallow.

Plant owns:
- **150,000 kg structural storage capacity** as the late-scale target exposed in UI/state (hard global storage enforcement is deferred to Workforce/Fleet V3 so existing saves are not suddenly overflow-invalidated);
- **2 industrial line slots**;
- plant line production may run two jobs concurrently;
- first supported line recipe: bulk Alloy Billet, consuming **50 Alloy Scrap -> 40 Alloy Billet** in **300 sec**;
- ordinary Industrial Workshop/garage queues continue to exist; Plant does not replace them;
- Plant adds late Contract Board eligibility hooks.

The bulk Alloy line is intentionally a throughput/yield improvement over the current 25 -> 18 / 240 sec industrial-cell process, but is not a new material chain.

## Contracts

After Processing Plant ownership, Contract Board may expose late industrial offers using current goods, e.g.:
- large Alloy Billet shipment;
- Heavy Frame + Control/Hydraulic module order;
- industrial controller/cylinder refurbishment lot.

No new contract currency and no daily-chore reroll mechanics are introduced in Pack E.

## Save

Pack E has persistent state (signature count/pity, Plant ownership, line jobs), therefore runtime schema becomes **Save V10**.

Migration rule:
- V9 and all earlier supported saves retain every existing field unchanged;
- Pack E state defaults empty/unowned;
- no XP/talent/economy reset.
