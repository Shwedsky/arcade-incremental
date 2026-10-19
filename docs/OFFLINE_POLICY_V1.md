# Offline Policy V1

Status: **LOCKED MECHANIC BASELINE / PRE-VISUAL**

## Early offline remains unchanged

Keep the accepted Early Game rule:
- player-character passive salvage begins at minute 1;
- base efficiency ~20% of active-equivalent collection;
- base cap ~2 hours per continuous absence;
- Automation talents may improve efficiency/cap.

Do not replace this with a daily-energy system before real retention telemetry exists.

## Repeated check-ins

The structural model shows that several short sessions can collect more total offline progress than one same-total-time session because the cap applies per continuous absence.

V1 treats this as **intentional check-in reward**, not an exploit, with guardrails:
- one absence must be at least 10 minutes to generate passive player salvage;
- reopening/closing immediately does not create a reward;
- the 2h cap is per continuous absence;
- no hidden daily hard cap;
- UI should never pressure the player to return at an exact alarm time.

If telemetry later shows pathological reopen behavior, move to a rolling buffer in a separate balance change.

## Workers use a different model

Workers are not copies of the 20% player-offline rule.

A worker route simulates:
`collect -> route buffer/vehicle -> delivery downtime -> base storage -> continue`.

Workers may continue through a much longer real-time absence until one of these blocks them:
- remote buffer/vehicle is full and delivery cannot proceed;
- base storage is full;
- required input/storage for an Operator is blocked;
- route maximum unattended shift is reached.

Representative unattended shift caps:
- first worker / Basic Route: 8h;
- Hangar network: 12h;
- Industrial Workshop: 18h;
- Processing Plant network: 24h.

These are network caps, not multipliers on frontier progression.

## Offline report

Return report separates sources:
1. `Пассивная вылазка игрока` — accepted 20%/cap system;
2. `Рабочие маршруты` — per-zone deliveries/components;
3. `Мастерская` — completed processing/fabrication jobs;
4. `Остановки` — exact bottleneck and how long it blocked production.

Examples:
- `Z1 route stopped 2h 14m: remote buffer full`;
- `Hangar storage full: 1h 08m lost`;
- `Operator Cell 2 stopped: no Clean Copper`.

The report should create the next upgrade target rather than hide lost time.

## No frontier progress offline

Neither player passive salvage nor workers may:
- increase zone mastery;
- discover a new component family;
- unlock a new zone;
- satisfy active-only signature salvage requirements.

Progression-hour models may use offline-equivalent time for broad economy pacing, but actual frontier/mastery gates remain active-only.

## Offline fabrication

Persisted workshop jobs use wall-clock time and may complete while closed.

Rules:
- ingredients are committed at job start;
- completion is deterministic from timestamps;
- auto-repeat requires Auto-feed/Operator rules;
- stock targets and reserves are respected offline;
- completed output goes to storage and can block further cycles if storage is full.

## Monetization guardrail

Rewarded ads may later double a return report or skip a bounded timer, but core offline functionality is not designed around ads and must remain usable without them.
