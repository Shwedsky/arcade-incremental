# Manual Target Run V1

Status: **OWNER REVIEW PACKAGE — FIRST TARGETED PRODUCT RUN**

This is the first deliberate owner run after Pack A-D and Workshop Queue UX V1 were integrated and internally validated.

The purpose is not to judge final art. The purpose is to learn whether the early game is understandable, motivating and paced well enough before we tune numbers or build the next large content/visual package.

## Build contract

Use only the dedicated `arcade-incremental-manual-review-v1` artifact produced by the final green CI for Manual Review Prep V1.

The bundle contains:
- `dist/` — the static game build;
- `START_REVIEW.bat` — Windows launch shortcut;
- `BUILD_INFO.txt` — exact source commit and CI metadata;
- `README_REVIEW.txt` — minimal launch notes.

The launcher uses a dedicated review origin:

`http://127.0.0.1:41971`

That port/origin is intentionally separate from ordinary Vite dev/preview ports, so review localStorage is isolated from normal local saves.

Every new launch through `START_REVIEW.bat` first opens `review-start.html`, which clears only the dedicated review origin and then redirects to the actual game URL without a reset query parameter. Reloading the game afterwards therefore does **not** reset the run.

## Owner launch

1. Unzip the manual-review artifact into any normal folder.
2. Double-click `START_REVIEW.bat`.
3. Leave the small server console open while playing.
4. Browser opens automatically on a deterministic fresh run.
5. Close the server console when finished.

If the launcher cannot find Python 3, it prints a short error instead of silently failing.

## Deterministic review seed

Owner review V1 uses:

`owner-review-v1`

This is deliberate. If something feels wrong, automated/manual reproduction can use the same field sequence.

Do not change the seed during this target run.

## Target path

Play naturally from a fresh save. Do not use debug/test helpers and do not try to speed-run later content.

The target product path is:

`salvage -> first level/mastery choice -> physical equipment upgrade -> garage -> contract / partial sale -> build first press -> queue / timer -> processing batch -> next visible goal`

The run is successful as a review even if you stop before the press when the game becomes confusing, boring or obviously too grindy. That stopping point is useful evidence.

## What to evaluate

### 1. First 5-10 minutes

Watch for:
- whether moving/breaking/collecting is immediately understandable;
- whether returning home feels natural;
- whether resources and rare components read clearly enough;
- whether the game gives you a useful next goal without outside instructions.

### 2. First progression choice

When level/mastery/equipment progression appears:
- is it obvious what changed;
- is the choice meaningful or decorative;
- do you know whether to spend or save resources;
- does the next upgrade feel close enough to pursue.

### 3. Garage / economy

Test normal decisions, not every button:
- keep some stock;
- sell only part of a resource using the new quantity controls;
- inspect a locked/available machine;
- look at a contract;
- decide what you personally want to pursue next.

Key question: does the garage feel like a useful base or like an admin screen?

### 4. Workshop Queue

During normal progression, deliberately use the new queue:
- enqueue a real upgrade/build;
- add a processing batch with more than one stack when available;
- inspect active vs waiting work;
- edit/reorder waiting work if the situation naturally allows it;
- optionally cancel waiting work;
- only test active cancellation if you understand what you are sacrificing.

We already have exhaustive automated proofs. Here the question is whether the controls are understandable and pleasant without knowing the implementation.

### 5. Pause / offline feel

At a convenient timed job:
- leave the page/game for a meaningful short interval, or close and reopen the review build without starting a new fresh run;
- verify that returning makes sense and workshop/offline results are understandable.

Do **not** double-click `START_REVIEW.bat` for this check because the launcher intentionally starts a new fresh review. Keep the same server session and reload/reopen the already-running game URL instead.

### 6. End of target run

Once the press has been built/used and you understand the next visible loop, stop. Do not grind toward Van/Z4/Z7 in this review.

We are testing the first-session product spine, not 80 hours of progression.

## Feedback format

Free-form feedback is welcome, but the most useful notes follow this compact shape:

- **Where:** what screen/milestone you were at.
- **What I tried:** your intended action.
- **What happened:** what the game actually did/showed.
- **Expected:** what you thought would happen.
- **Severity:** blocker / annoying / polish / idea.
- **Pacing:** too fast / good / too slow, when relevant.

Screenshots are especially useful for unclear UI states.

## Review questions to answer at the end

1. Did you ever stop knowing what the next useful action was?
2. Did you ever feel forced to wait/grind without an interesting short-term objective?
3. Was there a moment where spending/selling resources felt like a trap because requirements were unclear?
4. Did the new partial-sale controls feel useful or like unnecessary friction?
5. Did Workshop Queue feel like planning or like administration?
6. Did you want to make "one more run" after returning from the garage?
7. Which moment was the most satisfying?
8. Which moment was the most boring or confusing?

## Not part of this verdict

Do not block the run on:
- prototype/scaffolding art quality;
- missing Z8 / Port Terminal;
- missing final Processing Plant;
- advertisements / monetization;
- Yandex Console integration verification;
- final economy values for 10-100 hour progression.

Those are deliberately downstream of this product-feel gate.
