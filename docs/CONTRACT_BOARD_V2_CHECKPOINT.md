# Contract Board V2 — implementation checkpoint

Tracked by Issue #29.

Base main: `9a6b85fb6c407130b8c2c808cee6d6142fbd2b7f`.

## Goal
Expand the contract board without turning contracts into the dominant economy or exposing impossible future requirements.

## Locked scope
- larger staged contract template pool;
- contract families unlock only when their resources/components/processing are actually available;
- weighted recent-history repetition protection;
- early board remains simple/readable;
- later raw, processed, component/module and industrial orders;
- payout scaling remains secondary to normal sale/frontier progression;
- Save V9 compatibility/migration preserved;
- deterministic domain proof + browser acceptance + full exact-head CI before merge.

## Out of scope
- Z8 / Processing Plant runtime;
- visual production overhaul;
- ads/IAP/Yandex Console;
- Worker Economy V2 redesign (already merged).

Status: implementation started.
