# Platform / Release Foundation V1

Status: **IMPLEMENTATION STARTED / NO OWNER MANUAL GATE**

Base: `main` after Content Pack A.

Current external blocker: publication through Yandex Games Console is intentionally deferred until the owner reports that РСЯ / Console access is available again. This track must not depend on Console access.

## Goal

Make the current browser game release-ready at the code/package boundary while preserving local development and all accepted gameplay.

## Current Yandex requirements used for this foundation

Checked against official Yandex Games SDK documentation on 2026-10-19:

- SDK connection / initialization: https://yandex.com/dev/games/doc/en/sdk/sdk-about
- Game Ready + gameplay markup: https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- Player data / cloud save: https://yandex.com/dev/games/doc/en/sdk/sdk-player
- SDK requirement checklist: https://yandex.com/dev/games/doc/en/requirements/1/19

Relevant contract:
- SDK must initialize before SDK-dependent calls;
- `ysdk.features.LoadingAPI?.ready()` should be sent only after the game is genuinely interactive;
- `GameplayAPI.start()` / `stop()` should follow actual gameplay/menu/focus state;
- player cloud data is available through `player.getData()` / `player.setData()`;
- local development must remain functional when Yandex SDK does not exist.

## Scope

### 1. Platform adapter
A narrow application-owned adapter will isolate Yandex SDK calls from gameplay code.

Required behavior:
- `local` mode when `YaGames` is unavailable;
- `yandex` mode when SDK is present;
- initialize without blocking local gameplay forever;
- Game Ready signal;
- gameplay start / stop markup;
- pause/resume/focus integration;
- cloud-save boundary;
- diagnostics when SDK methods fail;
- no direct ad implementation in V1.

### 2. Save safety
Current Save V4 remains the game schema.

Storage layer gains:
- primary save;
- previous-good backup;
- temporary write slot;
- corrupt-primary fallback to backup;
- explicit clear of all slots for clean tests;
- bounded payload checks;
- no silent overwrite of a valid newer local save with an older cloud copy.

Cloud sync in V1 is conservative:
- remote key contains the complete game save payload + timestamp/schema metadata;
- newest valid snapshot wins only after validation;
- local save remains authoritative when platform/cloud is unavailable;
- sync failures never block the game.

### 3. Runtime diagnostics
Provide a bounded, non-network diagnostics buffer for:
- boot/platform mode;
- save recovery;
- cloud-sync result;
- JS errors / unhandled promise rejection;
- gameplay state transitions;
- simple frame-time health summary.

This creates a later telemetry boundary without introducing analytics/vendor dependencies now.

### 4. Responsive/performance guardrails
Automated browser checks must include at least:
- desktop viewport;
- narrow mobile viewport;
- landscape/mobile-ish viewport;
- no horizontal document overflow from production UI;
- game canvas remains non-zero and visible;
- key overlays/garage/zone/talent screens remain operable;
- bounded DOM/runtime diagnostics;
- no new request to external SDK in local mode.

### 5. Release packaging / moderation readiness
CI produces a dedicated release-candidate web archive and machine-readable manifest containing:
- package name/version;
- commit SHA at CI time when available;
- expected entrypoint;
- required files;
- game-ready/gameplay-markup integration state;
- current blocker statement;
- checks performed.

## Non-goals

- no Yandex Console upload while account access is blocked;
- no advertisements or rewarded-ad economy yet;
- no in-app purchases;
- no leaderboard design;
- no forced login;
- no replacement of the existing game save schema;
- no gameplay/balance redesign.

## Acceptance

Before merge:
- all existing gameplay/content/model/browser CI remains green;
- dedicated platform unit smoke is green;
- dedicated platform browser smoke verifies local fallback, ready/gameplay transitions and responsive layouts;
- save recovery smoke proves corrupt-primary -> backup recovery;
- cloud merge policy is deterministic and tested without requiring the real SDK;
- release package/manifest are produced in CI;
- documentation records exact external actions still blocked by Console access.
