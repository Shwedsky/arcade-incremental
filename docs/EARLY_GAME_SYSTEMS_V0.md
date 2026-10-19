# Early Game Systems V0

Status: **IMPLEMENTED / INTERNAL ACCEPTANCE**

This document locks the systems that were required before the next owner-facing build. Visual replacement remains a later pass.

## Intended early loop

`salvage field -> XP/level -> talent choice -> physical upgrade -> home/garage -> contract/sale -> timed fabrication -> timed processing -> return to same field -> offline return`

The garage is home, not a fail/return screen. The player may enter it at any time.

## Physical equipment progression

Talents do not replace equipment. Tool and cart have their own persisted levels and fabrication costs.

### Tool
| Level | Name | Effect | Gate | Fabrication |
|---|---|---|---|---|
| 1 | Старый ломик | x1.00 power | Start | — |
| 2 | Усиленная монтировка | x1.22 power | Player level 2 | 25 metal + 600 cash, 2 min |
| 3 | Аккумуляторный резак | x1.50 power | Player level 4 | 60 metal + motor + 2,000 cash, 5 min |
| 4 | Гидроножницы | x1.82 power | Player level 6 | 120 metal + hydraulic + electronics + 5,500 cash, 10 min |

### Cart
| Level | Name | Base capacity | Gate | Fabrication |
|---|---|---:|---|---|
| 1 | Ручная тележка | 40 kg | Start | — |
| 2 | Усиленная тележка | 55 kg | Player level 2 | 35 metal + 900 cash, 2 min |
| 3 | Грузовая тележка | 75 kg | Player level 4 | 80 metal + 2 bearings + 2,500 cash, 5 min |
| 4 | Моторизированная тележка | 100 kg | Player level 6 | 140 metal + motor + electronics + 6,500 cash, 10 min |

Logistics talents add capacity/movement on top of these physical upgrades.

## Workshop queue

Base workshop has **1 active slot**. `Workshop -> Parallel work` unlocks slot 2.

Queue jobs persist in local save and use absolute start/end timestamps. Therefore they continue:
- while the player is on the salvage field;
- while the player is in other garage screens;
- while the browser/game is closed.

Resources and cash are committed when the job starts. The result is granted only when the timer finishes.

`Workshop -> Calibration` speeds fabrication/processing by 15%.

### Machine timing baseline
- Small hydraulic press build: 12 min base.
- Wire stripper build: 18 min base.
- Plastic shredder build: 25 min base.
- Machine upgrades also use timed queue jobs.

Buying a ready-made machine remains the fast/expensive alternative and installs immediately.

## Timed processing

Processing is no longer an immediate button result.

Baseline level-1 batches:
- press: 10 kg metal -> briquettes, about 30 sec;
- wire stripper: 5 kg copper -> clean copper, about 38 sec;
- plastic shredder: 10 kg plastic -> granulate, about 42 sec.

Higher machine levels increase batch size and shorten cycle time. Workshop yield talents affect output.

`Automation -> Auto-feed` can start another identical processing batch after completion while raw stock and a queue slot remain available. This also works while returning from offline time.

## Contracts

V0 rotates three readable early contracts:
1. **Пункт приёма: железо** — 30 kg metal -> 420 cash + 20 XP.
2. **Ремонтная мастерская** — metal + one bearing -> cash + XP.
3. **Электромонтажники** — copper + plastic -> cash + XP.

Contract completion consumes the requested stock and gives cash + XP. The player must choose between selling immediately, reserving materials for machines, or reserving them for a contract.

Contract resource quantities scale gently with completed orders. Discrete components remain whole-item requirements: e.g. one bearing never silently becomes two because of a fractional multiplier.

`Trade -> Urgent orders` increases difficulty/reward without introducing fractional component requirements.

## Offline interaction

On startup the runtime first resolves all elapsed workshop jobs, then applies the approved passive salvage baseline (20% efficiency, 2h cap before talents). The offline report separately shows:
- materials gathered while away;
- fabrication/upgrade/processing jobs that completed.

## Persistence

Save schema V3 persists:
- XP / level-derived mastery;
- talents;
- storage / components / processed materials / cash;
- installed machines and machine levels;
- tool/cart levels;
- active workshop jobs with timestamps;
- contract rotation/progress;
- last-seen timestamp.

Existing V2 saves migrate to V3 with starter equipment levels and empty queue/contract state.

## Automated acceptance

The internal suite covers:
- equipment level definitions and monotonic power/capacity;
- queue slots and workshop speed talents;
- auto-feed and urgent-contract unlocks;
- first press fabrication timing;
- timed processing math;
- contract rotation/reward scaling;
- whole-component contract requirements;
- real Chromium interaction for tool fabrication, press fabrication, press processing, contract completion, offline job completion, save reload, and two-slot workshop.

Human feel still overrides these numbers. The owner test should tune pacing, not re-open the basic system architecture unless the loop itself feels wrong.
