#!/usr/bin/env python3
"""Worker route / storage calibration for Arcade Incremental mid/late design v1."""
import argparse,csv,os

ZONE_BULK={
    "Z1":522.0,"Z2":465.0,"Z3":698.0,"Z4":845.0,
    "Z5":1090.0,"Z6":1315.0,"Z7":1555.0,"Z8":1905.0
}

ROUTES=[
    # name, zone, vehicle/buffer kg, worker ratio of active bulk, delivery downtime minutes
    ("basic_route_kit","Z1",150.0,.20,20.0),
    ("spare_van","Z3",400.0,.30,15.0),
    ("truck_route","Z5",1000.0,.38,12.0),
    ("recovery_route","Z7",1800.0,.45,15.0),
]

BASES=[
    # name, storage kg, (zone, ratio) assigned representative routes
    ("equipped_garage",2000.0,[("Z1",.20)]),
    ("full_garage",4000.0,[("Z1",.20),("Z2",.20)]),
    ("hangar",12000.0,[("Z1",.30),("Z2",.30),("Z3",.30)]),
    ("salvage_yard",30000.0,[("Z1",.38),("Z2",.38),("Z3",.38),("Z4",.38),("Z5",.38)]),
    ("industrial_workshop",60000.0,[("Z1",.45),("Z2",.45),("Z3",.45),("Z4",.45),("Z5",.45),("Z6",.45),("Z7",.45)]),
    ("processing_plant",150000.0,[("Z1",.50),("Z2",.50),("Z3",.50),("Z4",.50),("Z5",.50),("Z6",.50),("Z7",.50),("Z8",.50),("Z7",.50),("Z8",.50)]),
]

def route_metrics(zone,capacity,ratio,downtime_min,driver=False):
    raw=ZONE_BULK[zone]*ratio
    fill_h=capacity/raw
    downtime_h=(downtime_min*(.35 if driver else 1.0))/60.0
    effective=raw*fill_h/(fill_h+downtime_h)
    return raw,fill_h*60,effective

def base_metrics(storage,routes):
    total=sum(ZONE_BULK[z]*ratio for z,ratio in routes)
    return total, storage/total if total else 999.0

def write(out_dir):
    os.makedirs(out_dir,exist_ok=True)
    with open(os.path.join(out_dir,"worker_route_throughput_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        w.writerow(["route","zone","buffer_kg","nominal_worker_kg_h","fill_min","delivery_downtime_min","effective_kg_h_no_driver","effective_kg_h_with_driver","driver_gain_pct"])
        for name,z,cap,ratio,down in ROUTES:
            raw,fill,eff=route_metrics(z,cap,ratio,down,False)
            _,_,effd=route_metrics(z,cap,ratio,down,True)
            w.writerow([name,z,f"{cap:.0f}",f"{raw:.1f}",f"{fill:.1f}",f"{down:.0f}",f"{eff:.1f}",f"{effd:.1f}",f"{(effd/eff-1)*100:.1f}"])
    with open(os.path.join(out_dir,"base_storage_fill_v0.csv"),"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        w.writerow(["base","bulk_storage_kg","representative_worker_routes","nominal_inbound_kg_h","hours_to_fill_if_no_processing"])
        for name,storage,routes in BASES:
            inbound,fill=base_metrics(storage,routes)
            w.writerow([name,f"{storage:.0f}",len(routes),f"{inbound:.1f}",f"{fill:.1f}"])

def check():
    fills=[]
    for name,storage,routes in BASES:
        _,fill=base_metrics(storage,routes)
        fills.append(fill)
        assert fill>=18.0,(name,fill)
    assert fills[-1]>=20.0
    for name,z,cap,ratio,down in ROUTES:
        raw,fill,eff=route_metrics(z,cap,ratio,down,False)
        _,_,effd=route_metrics(z,cap,ratio,down,True)
        assert eff < raw
        assert effd > eff
        assert 60 <= fill <= 180,(name,fill)

def main():
    p=argparse.ArgumentParser();p.add_argument("--out-dir",default="docs/proofs");p.add_argument("--check",action="store_true")
    a=p.parse_args();write(a.out_dir)
    if a.check:
        check();print("worker route/storage calibration: PASS")
if __name__=="__main__":main()
