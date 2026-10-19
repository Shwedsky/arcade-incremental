# Yandex Games Release Readiness V1

Status: **LOCAL / CODE-SIDE READINESS TRACK**

Last checked against public Yandex Games documentation: 2026-10-19.

## External blocker

Do not attempt publication yet. Access to the Yandex Games Console remains blocked for the owner by the current РСЯ registration/access situation.

When access returns, continue from the current release candidate. Do not rebuild the game from scratch just to begin submission.

## Code-side checklist

### SDK
- [x] application-owned SDK adapter boundary;
- [x] local fallback when SDK is unavailable;
- [x] safe SDK initialization failure path;
- [x] `LoadingAPI.ready()` integration point;
- [x] gameplay start/stop integration point;
- [x] platform pause/resume boundary;
- [x] no gameplay code depends directly on global `ysdk`;
- [ ] verify with Yandex debug panel after Console access returns.

### Saves
- [x] Save V4 remains canonical game schema;
- [x] primary / backup / temp resilient local slots;
- [x] recovery from corrupt primary;
- [x] cloud snapshot validation and newest-valid merge policy;
- [x] Yandex Player getData/setData adapter boundary;
- [ ] enable/test real account cloud synchronization after Console access returns;
- [ ] test anonymous -> authorized account-selection behavior in Yandex environment.

### Gameplay state / focus
- [x] app can mark gameplay active only while actual field play is active;
- [x] garage/menu/talent flows have stop boundary;
- [x] platform pause blocks active simulation through the app integration;
- [ ] verify ad pause/resume after ad monetization is intentionally designed later.

### Responsive / browser
- [x] desktop browser acceptance automated;
- [x] narrow portrait browser acceptance automated;
- [x] landscape/mobile-ish acceptance automated;
- [x] no required external server for game runtime;
- [x] production build is static archive-friendly.

### Release artifact
- [x] production `dist/` package;
- [x] `release-manifest.json` generated in CI;
- [x] commit/build metadata in manifest;
- [x] package contains entrypoint + JS + CSS;
- [x] all gameplay/model/platform tests run before packaging;
- [ ] upload archive in Console after external blocker is resolved;
- [ ] fill final title/description/icons/screenshots/age tags in Console;
- [ ] run Yandex debug panel / moderation checklist on hosted candidate.

## Current intentional exclusions

- advertisements and rewarded ads;
- purchases;
- leaderboard;
- forced authorization;
- remote analytics vendor;
- own backend/server.

They are not required to prove the current gameplay/product loop and should not be added before retention/economy review.

## Official references

- SDK connection: https://yandex.com/dev/games/doc/en/sdk/sdk-about
- Game Ready / gameplay markup: https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- Player data: https://yandex.com/dev/games/doc/en/sdk/sdk-player
- SDK requirement 1.19: https://yandex.com/dev/games/doc/en/requirements/1/19
- General requirements: https://yandex.com/dev/games/doc/en/concepts/requirements
