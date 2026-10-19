# Human Feedback Fix Pack V3 checkpoint

Issue: #28
Branch: `fix/human-feedback-v3`
Base: `c5fb290f0a3952f08ac922c2bf6af1ba46c92c66`

Scope is intentionally limited to current manual-review bugs:

1. Component discovery persists across zone exit/re-entry and Save V8 reload.
2. Z2 garage/background facades are anchored to world/parallax space instead of the viewport.

Out of scope:
- zone value/reward progression and worker/economy redesign (#26);
- contract-board variety (#29);
- production visual overhaul.

Delivery gate: focused deterministic/browser proof -> full exact-head CI -> unique verified review ZIP -> exact-head merge.
