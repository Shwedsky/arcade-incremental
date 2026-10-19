#!/usr/bin/env python3
"""Sensitivity sweep for the mid/late structural pacing model."""
import csv, os, copy, argparse
import mid_late_progression_sim_v0 as model

SCENARIOS=[
    ("baseline",1.0,1.0),
    ("late_costs_minus_25pct",.75,1.0),
    ("late_costs_plus_25pct",1.25,1.0),
    ("worker_eff_minus_25pct",1.0,.75),
    ("worker_eff_plus_25pct",1.0,1.25),
]
PROFILES=["continuous_active","30m_day_once"]
MILESTONES=["hangar","truck","salvage_yard","industrial_workshop","processing_plant"]

def run(out_dir:str):
    os.makedirs(out_dir,exist_ok=True)
    base_m=copy.deepcopy(model.MILESTONES)
    base_crew=model.crew_bulk_ratio
    rows=[]
    try:
        for scenario,cost_mult,worker_mult in SCENARIOS:
            model.MILESTONES=[
                (name,earliest,cost*(cost_mult if name in {"truck","salvage_yard","industrial_workshop","processing_plant"} else 1.0),prereqs)
                for name,earliest,cost,prereqs in base_m
            ]
            model.crew_bulk_ratio=lambda owned,wm=worker_mult: min(.75,base_crew(owned)*wm)
            for profile in PROFILES:
                st,start=model.simulate(model.PROFILES[profile])
                row=[scenario,profile]
                for milestone in MILESTONES:
                    wall,active,progress=st.milestones[milestone]
                    row += [f"{progress:.3f}",f"{(wall-start)/1440.0:.3f}"]
                rows.append(row)
    finally:
        model.MILESTONES=base_m
        model.crew_bulk_ratio=base_crew

    path=os.path.join(out_dir,"mid_late_sensitivity_v0.csv")
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        header=["scenario","profile"]
        for milestone in MILESTONES:
            header += [f"{milestone}_progress_h",f"{milestone}_calendar_day"]
        w.writerow(header);w.writerows(rows)

    # Structural sensitivity guardrail: even +25% late costs should not push the all-active
    # Plant beyond the broad 180h late-game target.
    plus=[r for r in rows if r[0]=="late_costs_plus_25pct" and r[1]=="continuous_active"][0]
    plant_progress=float(plus[-2])
    assert plant_progress <= 180.0,plant_progress

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--out-dir",default="docs/proofs")
    args=p.parse_args();run(args.out_dir);print("mid/late sensitivity sweep: PASS")
