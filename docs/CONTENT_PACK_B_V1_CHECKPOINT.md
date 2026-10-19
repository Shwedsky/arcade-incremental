# Content Pack B V1 — Delivery Proof

Status: **COMPLETE / INTERNALLY GREEN / READY TO MERGE**

Tracked by Issue #13.

## Proven progression

`Z3 mastered -> Z4 Auto Salvage -> active Gearbox/Generator discovery -> Hangar -> Truck -> former Van remains useful infrastructure -> second crew slot -> Wide Swing active`

## Delivered

- Z4 Auto Salvage with its own target mix, difficulty/yield profile, visual theme and automotive source catalog.
- Aluminium scrap as a Z4 active resource.
- Gearbox and Generator/Alternator as active-discovery industrial components with pity counters.
- Save V5 with migration from accepted V4/V3/V2 saves.
- Steel Blank and Aluminium Billet processing bridge.
- Drive / Control / Structural module fabrication.
- Hangar milestone consuming cash + processed materials + fabricated modules.
- Truck milestone consuming industrial materials/modules/components; 1,000 kg mobile field buffer.
- Second worker slot after Hangar.
- Existing worker rules preserved: no mastery and no first component discovery.
- First Tier-II Salvage mechanic `Широкий замах`: secondary nearby target receives 55% dismantling power.
- Existing Early/Mid/Platform functionality remains regression-covered.

## Key milestone recipes

Hangar baseline:
- 220,000 cash;
- 400 kg metal;
- 18 clean copper;
- 8 Steel Blank;
- 4 Aluminium Billet;
- 2 Structural Frame;
- 1 Control Module.

Truck baseline:
- 220,000 cash;
- 12 clean copper;
- 10 Steel Blank;
- 6 Aluminium Billet;
- 1 Drive Module;
- 1 Control Module;
- 1 Gearbox;
- 1 Generator/Alternator.

## Automated acceptance

Validated head: `2c9260d00bfc75e28be7d9f1ed859871defdb43c`.

GitHub Actions run `39240814867` passed:
- TypeScript build;
- deterministic gameplay smoke;
- Early-game systems smoke;
- Midgame domain smoke;
- Visual foundation smoke;
- Content Pack A smoke;
- Content Pack B domain smoke;
- save safety smoke;
- platform adapter smoke;
- progression pacing proof;
- Mid/Late mechanics structural proof;
- Early-game Chromium regression;
- Midgame Save V5 Chromium regression;
- Content Pack B Chromium proof;
- platform/responsive browser proof;
- release manifest;
- RC v2 packaging + artifact upload.

Content Pack B Chromium proof verifies:
- V4 save migrates to V5 with safe Pack B defaults;
- Z4 exists and is selectable when its gates are met;
- Hangar acquisition works through its production recipe;
- Truck acquisition works and exposes the 1,000 kg field transport state;
- second worker can be hired and assigned to a mastered old zone;
- Wide Swing is unlockable only after the accepted Salvage chain and persists after reload;
- Hangar/Truck/worker/talent state survives normal reload.

Artifact:
- `arcade-incremental-release-candidate-v2`;
- artifact id `12180987915`;
- digest `sha256:a3eefcff5a06e4bc607e1e1c7a7259e1d938296f7682f9f67404132601fe7646`.

## Guardrails preserved

- Hand Cart remains the active local collector.
- Truck is a mobile depot, not an auto-play replacement.
- Workers cannot earn zone mastery or discover component families first.
- No Z5+ content is implemented here.
- No ads/IAP/leaderboards.
- No Yandex Console dependency; the known external РСЯ/Console blocker remains outside this development gate.

## Next pipeline

Content Pack C: Z5 Industrial Zone + Z6 Abandoned Factory + Salvage Yard + fuller Tier-II industry/automation, still without an owner manual gate until internal proof is green.