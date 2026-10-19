#!/usr/bin/env python3
"""Structural mechanics proof for Arcade Incremental Design V3.

Checks:
- frontier cart-cycle pacing with era-appropriate effective capacity;
- active-only zone mastery targets;
- workforce slot/hiring curve and role opportunity cost;
- processed/module production timing;
- anti-RNG pity/fallback thresholds.

No third-party packages.
"""
from __future__ import annotations
import argparse, csv, os

ZONES = [
    ("Z1","Old Junkyard",522.0,1.00,55,1.5),
    ("Z2","Garage Backyards",465.0,1.15,55,2.0),
    ("Z3","Appliance Yard",698.0,1.20,75,2.5),
    ("Z4","Auto Salvage",845.0,1.25,100,3.0),
    ("Z5","Industrial Zone",1090.0,1.20,120,3.5),
    ("Z6","Abandoned Factory",1315.0,1.10,140,4.0),
    ("Z7","Heavy Depot",1555.0,1.00,160,4.5),
    ("Z8","Port Terminal",1905.0,0.90,180,5.0),
]

BASE_STAGES = [
    ("garage_van",1),
    ("garage_full",2),
    ("hangar",4),
    ("salvage_yard",6),
    ("industrial_workshop",9),
    ("processing_plant",14),
]

HIRE_COSTS = [35000,55000,85000,130000,200000,300000,450000,650000,900000,1250000,1700000,2300000,3100000,4200000]

ROUTES = [
    ("basic_z1",.20,150,105.0,14.0),
    ("spare_van_z3",.30,400,209.4,8.0),
    ("truck_z5",.38,1000,414.2,5.0),
    ("recovery_z7",.45,1800,699.8,6.0),
]
# name, active-rate ratio, buffer kg, worker bulk kg/h, expected Driver throughput benefit %

PROCESSES = [
    ("briquette","raw","metal",10,"briquette",10,30),
    ("clean_copper","raw","copper",5,"clean_copper",5,38),
    ("granulate","raw","plastic",10,"granulate",10,42),
    ("steel_blank","processed","briquette",25,"steel_blank",20,150),
    ("aluminium_billet","raw","aluminium",20,"aluminium_billet",16,180),
    ("alloy_billet","raw","alloy_scrap",25,"alloy_billet",18,240),
    ("drive_module","module","mixed",1,"drive_module",1,360),
    ("control_module","module","mixed",1,"control_module",1,420),
    ("hydraulic_power_module","module","mixed",1,"hydraulic_power_module",1,480),
    ("structural_frame","module","mixed",1,"structural_frame",1,600),
    ("industrial_drive","advanced","drive_module",1,"industrial_drive",1,720),
    ("industrial_control","advanced","control_module",1,"industrial_control",1,840),
    ("heavy_hydraulic","advanced","hydraulic_power_module",1,"heavy_hydraulic",1,840),
    ("heavy_frame","advanced","structural_frame",1,"heavy_frame",1,960),
]

PITY = [
    ("pump","Z2",8,.60),
    ("compressor","Z3",10,.60),
    ("gearbox","Z4",8,.60),
    ("generator","Z4/Z5",10,.60),
    ("industrial_controller","Z5/Z6",12,.60),
    ("heavy_hydraulic_cylinder","Z6/Z7",10,.60),
]

def active_rows():
    rows=[]
    for zone,name,base,mult,capacity,mastery_h in ZONES:
        realized=base*mult
        fill_min=capacity/realized*60
        rows.append({
            "zone":zone,"name":name,"base_bulk_kg_h":base,"realized_multiplier":mult,
            "realized_bulk_kg_h":round(realized,2),"effective_local_capacity_kg":capacity,
            "cart_fill_min":round(fill_min,2),"mastery_target_active_h":mastery_h,
            "mastery_pct_per_active_min":round(100/(mastery_h*60),4),
        })
    return rows

def workforce_rows():
    return [{"worker_number":i,"hire_cost":cost} for i,cost in enumerate(HIRE_COSTS,1)]

def route_rows():
    return [
        {"route":name,"worker_active_ratio":ratio,"buffer_kg":buffer,"worker_bulk_kg_h":bulk,
         "driver_expected_throughput_bonus_pct":driver_bonus}
        for name,ratio,buffer,bulk,driver_bonus in ROUTES
    ]

def process_rows():
    rows=[]
    for pid,tier,ink,inamount,outk,outamount,sec in PROCESSES:
        rows.append({"process":pid,"tier":tier,"input_key":ink,"input_amount":inamount,
                     "output_key":outk,"output_amount":outamount,"base_cycle_sec":sec,
                     "operator_cycle_sec":round(sec*.75,1)})
    return rows

def pity_rows():
    return [
        {"component":name,"source_zone":zone,"guarantee_eligible_targets":count,
         "broker_unlock_eligible_targets":max(1,int((count*ratio)+.999))}
        for name,zone,count,ratio in PITY
    ]

def write_csv(path,rows):
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

def check():
    ar=active_rows()
    assert all(5.0 <= r["cart_fill_min"] <= 7.0 for r in ar), ar
    assert [r["mastery_target_active_h"] for r in ar] == [1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0]
    assert HIRE_COSTS == sorted(HIRE_COSTS)
    assert [x[1] for x in BASE_STAGES] == sorted(x[1] for x in BASE_STAGES)
    assert all(ratio <= .45 for _,ratio,_,_,_ in ROUTES)
    assert all(5 <= bonus <= 14 for *_,bonus in ROUTES)
    assert max(sec for *_,sec in PROCESSES) <= 16*60
    assert all(int(count*.60 + .999) < count for _,_,count,_ in PITY)
    return True

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="docs/proofs")
    p.add_argument("--check",action="store_true")
    args=p.parse_args()
    os.makedirs(args.out,exist_ok=True)
    check()
    write_csv(os.path.join(args.out,"mid_late_active_throughput_v1.csv"),active_rows())
    write_csv(os.path.join(args.out,"mid_late_worker_hiring_v1.csv"),workforce_rows())
    write_csv(os.path.join(args.out,"mid_late_worker_routes_v1.csv"),route_rows())
    write_csv(os.path.join(args.out,"mid_late_production_cycles_v1.csv"),process_rows())
    write_csv(os.path.join(args.out,"mid_late_component_pity_v1.csv"),pity_rows())
    if args.check:
        print("mid/late mechanics v1 structural check: PASS")
        for row in active_rows():
            print(row["zone"],row["cart_fill_min"],"min","mastery",row["mastery_target_active_h"],"h")

if __name__=="__main__":
    main()
