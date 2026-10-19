#!/usr/bin/env python3
"""Expected-value structural pacing model for Arcade Incremental mid/late design v1.

This model is intentionally not a final economy balance. It checks:
- milestone order and target progression-hour bands;
- calendar pacing across session profiles;
- active frontier vs mastered-zone worker relationship;
- transport expedition scale;
- mastery-point pacing for Tier II/III.

No third-party packages required.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Tuple
import argparse, csv, os

PRICES = {"metal":8.0,"copper":60.0,"plastic":5.0,"aluminium":22.0,"alloy":45.0}
ZONE_RATES = {
    "Z1":{"metal":420.0,"copper":27.0,"plastic":75.0,"aluminium":0.0,"alloy":0.0},
    "Z2":{"metal":360.0,"copper":45.0,"plastic":60.0,"aluminium":0.0,"alloy":0.0},
    "Z3":{"metal":520.0,"copper":48.0,"plastic":75.0,"aluminium":55.0,"alloy":0.0},
    "Z4":{"metal":650.0,"copper":40.0,"plastic":35.0,"aluminium":120.0,"alloy":0.0},
    "Z5":{"metal":850.0,"copper":65.0,"plastic":20.0,"aluminium":90.0,"alloy":65.0},
    "Z6":{"metal":1000.0,"copper":75.0,"plastic":10.0,"aluminium":100.0,"alloy":130.0},
    "Z7":{"metal":1200.0,"copper":60.0,"plastic":5.0,"aluminium":110.0,"alloy":180.0},
    "Z8":{"metal":1400.0,"copper":100.0,"plastic":5.0,"aluminium":150.0,"alloy":250.0},
}
ZONE_VALUE = {z:sum(rate[k]*PRICES[k] for k in rate) for z,rate in ZONE_RATES.items()}

# Representative active component events/hour. Only families meaningful to that zone are listed.
COMPONENT_RATES = {
    "Z1":{"bearing":5.0,"motor":2.0,"hydraulic":0.7,"electronics":1.8},
    "Z2":{"bearing":3.0,"motor":3.5,"hydraulic":0.6,"electronics":3.0,"pump":0.8,"compressor":0.5},
    "Z3":{"motor":3.0,"hydraulic":0.8,"electronics":2.5,"pump":0.8,"compressor":1.1},
    "Z4":{"bearing":2.0,"motor":2.5,"hydraulic":0.9,"electronics":1.5,"gearbox":0.6,"generator":0.7},
    "Z5":{"motor":3.0,"hydraulic":1.6,"electronics":1.5,"pump":0.8,"compressor":0.7,"gearbox":0.6,"generator":0.6,"controller":0.35},
    "Z6":{"motor":3.0,"hydraulic":2.0,"gearbox":0.8,"controller":0.6,"heavy_hydraulic":0.35},
    "Z7":{"gearbox":1.1,"generator":1.0,"controller":0.6,"heavy_hydraulic":0.55},
    "Z8":{"gearbox":1.2,"generator":1.2,"controller":0.9,"heavy_hydraulic":0.75},
}

MASTER_REQ_ACTIVE_H = {"Z1":1.5,"Z2":2.0,"Z3":2.5,"Z4":3.0,"Z5":3.5,"Z6":4.0,"Z7":4.5,"Z8":5.0}

# Cash-equivalent investment values are placeholders. progress_h includes active play plus
# base offline-equivalent progress, but worker economic output never adds frontier progress.
MILESTONES = [
    ("van",8.0,70000.0,[]),
    ("worker",12.0,35000.0,["van"]),
    ("garage_full",18.0,90000.0,["worker"]),
    ("hangar",28.0,220000.0,["garage_full"]),
    ("truck",38.0,180000.0,["hangar"]),
    ("salvage_yard",45.0,250000.0,["truck"]),
    ("industrial_workshop",75.0,650000.0,["salvage_yard"]),
    ("processing_plant",120.0,1200000.0,["industrial_workshop"]),
]

TARGET_BANDS = {
    "van":(8,15),
    "worker":(12,20),
    "garage_full":(18,30),
    "hangar":(28,50),
    "truck":(38,65),
    "salvage_yard":(45,80),
    "industrial_workshop":(75,120),
    "processing_plant":(120,180),
}

PROFILES = {
    "continuous_active":[(0,1440)],
    "heavy_3x60":[(8*60,60),(14*60,60),(20*60,60)],
    "60m_day_2x30":[(8*60,30),(20*60,30)],
    "30m_day_once":[(20*60,30)],
    "15m_day_once":[(20*60,15)],
    "offline_heavy_3x5":[(8*60,5),(14*60,5),(20*60,5)],
}

TRANSPORT = [
    ("cart_40","Z1",40.0),
    ("cart_55","Z1",55.0),
    ("cart_75","Z2",75.0),
    ("cart_100","Z2",100.0),
    ("van","Z3",400.0),
    ("truck","Z5",1000.0),
    ("recovery_rig","Z7",1800.0),
]

def stage_zone(owned:set, progress_h:float)->str:
    if "processing_plant" in owned: return "Z8"
    if "industrial_workshop" in owned: return "Z7"
    if "salvage_yard" in owned: return "Z6"
    if "hangar" in owned: return "Z5"
    if "worker" in owned and progress_h >= 15.0: return "Z4"
    if "van" in owned: return "Z3"
    if progress_h >= 4.0: return "Z2"
    return "Z1"

def crew_count(owned:set)->int:
    if "processing_plant" in owned: return 10
    if "industrial_workshop" in owned: return 7
    if "salvage_yard" in owned: return 5
    if "hangar" in owned: return 3
    if "garage_full" in owned: return 2
    if "worker" in owned: return 1
    return 0

def crew_bulk_ratio(owned:set)->float:
    if "processing_plant" in owned: return .50
    if "industrial_workshop" in owned: return .45
    if "salvage_yard" in owned: return .38
    if "hangar" in owned: return .30
    return .20

def worker_offline_cap_h(owned:set)->float:
    if "processing_plant" in owned: return 24.0
    if "industrial_workshop" in owned: return 18.0
    if "hangar" in owned: return 12.0
    if "worker" in owned: return 8.0
    return 0.0

@dataclass
class State:
    progress_h:float=0.0
    active_h:float=0.0
    economic_value:float=0.0
    owned:set=field(default_factory=set)
    milestones:dict=field(default_factory=dict)
    zone_active_h:Dict[str,float]=field(default_factory=lambda:{z:0.0 for z in MASTER_REQ_ACTIVE_H})
    mastered:set=field(default_factory=set)
    wall_min:float=0.0

def auto_buy(st:State)->None:
    changed=True
    while changed:
        changed=False
        for name,earliest,cost,prereqs in MILESTONES:
            if name in st.owned or st.progress_h + 1e-9 < earliest: continue
            if any(p not in st.owned for p in prereqs): continue
            if st.economic_value + 1e-9 < cost: continue
            st.economic_value -= cost
            st.owned.add(name)
            st.milestones[name]=(st.wall_min,st.active_h,st.progress_h)
            changed=True
            break

def apply_worker_value(st:State,hours:float)->None:
    n=crew_count(st.owned)
    if not n or not st.mastered or hours <= 0: return
    zones=sorted(st.mastered)
    ratio=crew_bulk_ratio(st.owned)
    for i in range(n):
        z=zones[i % len(zones)]
        st.economic_value += ZONE_VALUE[z]*.90*ratio*hours

def active_step(st:State,hours:float)->None:
    z=stage_zone(st.owned,st.progress_h)
    st.active_h += hours
    st.progress_h += hours
    st.zone_active_h[z] += hours
    if st.zone_active_h[z] + 1e-9 >= MASTER_REQ_ACTIVE_H[z]:
        st.mastered.add(z)
    st.economic_value += ZONE_VALUE[z]*.90*hours
    apply_worker_value(st,hours)
    auto_buy(st)

def offline_gap(st:State,gap_h:float)->None:
    if gap_h <= 0: return
    # Base character/offline salvage remains the approved 20% with 2h cap.
    counted=min(gap_h,2.0)
    z=stage_zone(st.owned,st.progress_h)
    st.progress_h += counted*.20
    st.economic_value += ZONE_VALUE[z]*.90*counted*.20
    # Workers have a larger route buffer/cap but never add frontier/mastery progress.
    wh=min(gap_h,worker_offline_cap_h(st.owned))
    apply_worker_value(st,wh)
    auto_buy(st)

def simulate(profile:List[Tuple[int,int]], max_days:int=500):
    st=State()
    first_start=profile[0][0]
    last_end=None
    for day in range(max_days):
        for start,duration in profile:
            session_start=day*1440+start
            if last_end is None:
                st.wall_min=session_start
            else:
                st.wall_min=last_end
                offline_gap(st,(session_start-last_end)/60.0)
                st.wall_min=session_start
            auto_buy(st)
            for minute in range(duration):
                st.wall_min=session_start+minute
                active_step(st,1/60.0)
                if "processing_plant" in st.owned:
                    return st,first_start
            last_end=session_start+duration
            st.wall_min=last_end
    return st,first_start

def mastery_points_at(progress_h:float)->int:
    # Reuse the committed early XP proof through ~20.8h, then continue a long-tail cadence.
    if progress_h < 20.8:
        thresholds=[.125,.437,1.871,3.326,5.405,8.107,11.433,15.591,20.788]
        return sum(progress_h+1e-9 >= h for h in thresholds)
    base=9
    post=int((progress_h-20.8)//2.0)
    milestone_bonus=sum(progress_h+1e-9 >= h for h in (28.0,45.0,75.0,120.0))
    return base+post+milestone_bonus

def write_outputs(out_dir:str)->None:
    os.makedirs(out_dir,exist_ok=True)
    milestones=[m[0] for m in MILESTONES]

    with open(os.path.join(out_dir,"mid_late_milestone_profiles_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f); header=["profile"]
        for m in milestones: header += [f"{m}_calendar_day",f"{m}_active_h",f"{m}_progress_h"]
        w.writerow(header)
        for name,schedule in PROFILES.items():
            st,start=simulate(schedule)
            row=[name]
            for m in milestones:
                if m not in st.milestones: row += ["","",""]; continue
                wall,active,progress=st.milestones[m]
                row += [f"{(wall-start)/1440:.3f}",f"{active:.3f}",f"{progress:.3f}"]
            w.writerow(row)

    with open(os.path.join(out_dir,"mid_late_worker_vs_active_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        w.writerow(["zone","active_bulk_kg_h","active_value_h","early_worker_bulk_kg_h_20pct","mature_worker_bulk_kg_h_45pct","representative_component","active_component_h","early_worker_component_h_12pct","mature_worker_component_h_28pct"])
        for z in ZONE_RATES:
            bulk=sum(ZONE_RATES[z].values())
            comps=COMPONENT_RATES[z]
            rep=min(comps,key=lambda k:comps[k])
            ar=comps[rep]
            w.writerow([z,f"{bulk:.1f}",f"{ZONE_VALUE[z]:.0f}",f"{bulk*.20:.1f}",f"{bulk*.45:.1f}",rep,f"{ar:.3f}",f"{ar*.12:.3f}",f"{ar*.28:.3f}"])

    with open(os.path.join(out_dir,"mid_late_transport_expeditions_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        w.writerow(["transport","representative_zone","capacity_kg","zone_bulk_kg_h","estimated_fill_min","equivalent_55kg_cartloads"])
        for name,z,capacity in TRANSPORT:
            bulk=sum(ZONE_RATES[z].values())
            w.writerow([name,z,f"{capacity:.0f}",f"{bulk:.1f}",f"{capacity/bulk*60:.1f}",f"{capacity/55:.2f}"])

    with open(os.path.join(out_dir,"mid_late_talent_pacing_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f); w.writerow(["progress_h","mastery_points_total","notes"])
        for h,note in [(8,"Van band begins"),(15.6,"focused Salvage can approach Wide Swing after Tier I"),(20.8,"early level proof reaches 9 points"),(28,"Hangar/Tier II milestone"),(50,"mid game"),(75,"Industrial Workshop/Tier III gate"),(100,"late-mid"),(120,"Plant gate"),(150,"late game"),(220,"long-tail completion territory")]:
            w.writerow([f"{h:.1f}",mastery_points_at(h),note])

    with open(os.path.join(out_dir,"mid_late_assumptions_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f); w.writerow(["category","key","value","unit_or_note"])
        for z,val in ZONE_VALUE.items(): w.writerow(["zone_value",z,f"{val:.0f}","cash-equivalent gross per active hour"])
        for name,earliest,cost,_ in MILESTONES:
            w.writerow(["milestone",name,f"{earliest:.1f}","min progress h"])
            w.writerow(["milestone_cost",name,f"{cost:.0f}","cash-equivalent placeholder"])
        w.writerow(["offline","base_efficiency","0.20","active-equivalent"])
        w.writerow(["offline","base_cap","2.0","hours per absence"])
        w.writerow(["worker","early_bulk_ratio","0.20","of zone active bulk rate"])
        w.writerow(["worker","mature_bulk_ratio","0.45","representative industrial-workshop crew"])
        w.writerow(["talent","post_20h_point_cadence","2.0","progress hours per point, plus milestone bonuses"])

def check()->None:
    st,_=simulate(PROFILES["continuous_active"])
    last=-1
    for name,_,_,prereqs in MILESTONES:
        assert name in st.milestones,name
        _,_,progress=st.milestones[name]
        lo,hi=TARGET_BANDS[name]
        assert lo-1e-9 <= progress <= hi+1e-9,(name,progress,(lo,hi))
        assert progress >= last
        last=progress
        for p in prereqs:
            assert st.milestones[p][2] <= progress
    assert st.milestones["worker"][2] >= st.milestones["van"][2]
    for comps in COMPONENT_RATES.values():
        for rate in comps.values():
            assert rate*.28 < rate
    fill=[cap/sum(ZONE_RATES[z].values())*60 for _,z,cap in TRANSPORT]
    assert fill[4] > fill[1]
    assert fill[5] > fill[4]
    assert fill[6] > fill[5]
    assert mastery_points_at(150) < 105
    assert mastery_points_at(220) > mastery_points_at(150)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out-dir",default="docs/proofs")
    p.add_argument("--check",action="store_true")
    args=p.parse_args()
    write_outputs(args.out_dir)
    if args.check:
        check()
        print("mid/late progression structural pacing: PASS")

if __name__=="__main__":
    main()
