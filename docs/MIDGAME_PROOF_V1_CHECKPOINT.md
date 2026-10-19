# Midgame Proof V1 — Delivery Checkpoint

Status: **INTERNALLY GREEN / READY TO MERGE WITHOUT OWNER MANUAL GATE**

Base: `main` @ `e09791c7120e90c669cb5413dde8c78b6e0092da`

Validated head: `c1ade0d55d04440a191da40da5bf446655c1146f`

## Goal proven

The long-term game model now has one coherent playable bridge from accepted Early Game into the first automated old-zone loop:

`Z1 active -> unlock/select Z2 -> active mastery -> unlock/select Z3 -> Van as field buffer -> hire first worker -> assign worker to mastered Z1 -> passive Z1 supply while player pushes Z3`

## Implemented runtime

### Save V4
- accepted V3 saves migrate forward;
- early XP/economy/equipment/machines are preserved;
- previous active Z1 effort becomes bounded Z1 mastery rather than being discarded;
- zone, Van and worker state persist across reload.

### Zones / frontier
- Z1 Old Junkyard;
- Z2 Garage/Backyards;
- Z3 Appliance Yard;
- functional zone selector from field/garage;
- per-zone target mixes, toughness and yield multipliers;
- active-only mastery meter;
- Z2 requires early progression/press;
- Z3 requires Z2 mastery + wire/progression gates;
- changing zone refreshes the field while ordinary garage visits still preserve the current field.

### New component proof
- Z2 can actively discover Pump;
- Z3 can actively discover Compressor;
- pity rules live in the domain runtime;
- discovery is active-only.

### Van
- explicit 70k + material/component preparation recipe;
- 400 kg field buffer;
- Hand Cart remains the local collector;
- cart may unload into Van repeatedly without returning home;
- representative 75 kg cart supports five full unloads (375 kg) plus a partial sixth before Van is full;
- Van unloads to garage storage on return.

### First worker
- gated after Van and mastered Z1;
- 35k first hire;
- Basic Route Kit concept remains the first passive route;
- may be assigned only to mastered zones;
- returns old-zone bulk plus already-discovered early components at reduced rates;
- does not add mastery or discover new component families;
- worker state persists.

### Offline
- accepted player offline loop remains separate;
- first worker route adds its own old-zone return to storage/report;
- worker supply does not advance frontier mastery.

## Acceptance automation

GitHub Actions run `39227501083` passed on validated head `c1ade0d55d04440a191da40da5bf446655c1146f`.

Passed checks:
- TypeScript typecheck + Vite production build;
- deterministic accepted gameplay smoke;
- accepted early-game systems smoke;
- dedicated midgame domain smoke;
- XP/mastery pacing proof;
- Mid/Late mechanics structural proof;
- accepted early-game headless Chromium flow;
- new headless Chromium midgame flow;
- distributable packaging.

The Chromium midgame flow verifies:
1. V3 -> V4 save migration and inherited Z1 mastery;
2. Z2/Z3 unlock gating in rendered UI;
3. Z3 selection;
4. Van purchase and persistence;
5. first-worker hire/assignment to mastered Z1 and persistence;
6. offline worker supply while Z2 mastery remains untouched.

Artifact:
- name: `arcade-incremental-midgame-proof-v1`;
- artifact id: `12173983789`;
- digest: `sha256:56fd83e14256f390adf4bc05fd584827e607bf52020a1bef47f507ce53086246`.

## Hard rules preserved
- Garage remains freely enterable at any time.
- Zone mastery is active-only.
- Workers cannot discover components or master zones.
- First worker is after Van and does not take the player's Van.
- Van does not replace the Hand Cart.
- Existing Early Game systems remain green.
- Production visual polish remains deferred until this mechanics proof is merged.

## Explicitly not in this proof
- final production art;
- Hangar/Truck/Z4+ runtime;
- full Tier II runtime/UI;
- Driver/Operator/Foreman roles beyond the first Scavenger proof;
- Yandex SDK/ads.

## Delivery decision

The owner explicitly requested sequential pipeline assembly without manual verification between stages. Therefore this proof may merge on internal green status; no owner-facing ZIP is required at this gate.
