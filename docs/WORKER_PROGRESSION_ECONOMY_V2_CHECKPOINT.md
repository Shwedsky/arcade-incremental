# Worker & Progression Economy V2 — model checkpoint

Issue: #26
Branch: `design/worker-progression-economy-v2-model`
Base: `317952a52647bd2bbfc63cd97f735c45c525a33f`

This PR is the deterministic design/model stage only. Runtime changes come in a separate PR after the model is green.

Required outputs:
1. worker throughput derived from demonstrated active-zone benchmark;
2. weak / average / strong benchmark examples and bounded worker share;
3. 2-hour offline shift/fatigue and repeated-login abuse guard;
4. Van vs no-Van route bonus without making the Van a worker-hire gate;
5. zone full-clear medal and online respawn rules;
6. explicit Z1-Z3 active value/min and XP/min curve, including visible-drop rounding;
7. progressive processed-material recipe ladder through Processing Plant;
8. Save V8 migration impact assessment.

Guardrails:
- active frontier owns mastery and first discovery;
- automation cannot outrun active frontier;
- old zones become useful passive supply without replacing active play;
- no recurring wage tax;
- production chains remain shallow and readable.
