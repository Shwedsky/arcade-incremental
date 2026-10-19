import assert from 'node:assert/strict';
import {
  WORKER_SHIFT_HOURS,awardClearMedal,createDefaultWorkerEconomy,dispatchWorkerShifts,
  recordActiveBenchmark,setVanWorker,simulateBenchmarkedWorker,workerParcelFraction
} from '../src/worker_economy_v2.ts';

const HOUR=3_600_000,now=1_900_000_000_000;
const economy=createDefaultWorkerEconomy(now);

const strong={
  durationMs:90_000,destroyed:50,
  resources:{metal:48,copper:6,plastic:8},
  components:{bearing:1,motor:1,hydraulic:0,electronics:1}
};
const recorded=recordActiveBenchmark(economy,'z1',strong,now);
assert.equal(recorded.accepted,true);
assert.equal(recorded.newBest,true);
assert.ok(economy.benchmarks.z1);
assert.equal(workerParcelFraction(1.5,false),.5);

// 10 minutes online = half of the strong benchmark for raw resources.
let gain=simulateBenchmarkedWorker({state:economy,slot:'w1',zone:'z1',lastTick:now,now:now+10*60_000,offline:false,discoveredComponents:['bearing','motor','electronics']});
assert.equal(gain.source,'benchmark');
assert.ok(Math.abs(gain.resources.metal-24)<1e-9);
assert.ok(gain.activeShare<.08,'strong active player must remain much faster than worker');

// Van improves the same route but stays below the 30% active-throughput cap.
setVanWorker(economy,'w1');
gain=simulateBenchmarkedWorker({state:economy,slot:'w1',zone:'z1',lastTick:now,now:now+10*60_000,offline:false,discoveredComponents:['bearing','motor','electronics']});
assert.ok(gain.resources.metal>24);
assert.ok(gain.activeShare<=.30+1e-9);

// Offline work is capped by a refreshable two-hour shift budget and cannot be double-credited.
dispatchWorkerShifts(economy,['w1'],now);
const offline=simulateBenchmarkedWorker({state:economy,slot:'w1',zone:'z1',lastTick:now,now:now+8*HOUR,offline:true,discoveredComponents:['bearing','motor','electronics']});
assert.equal(offline.hours,WORKER_SHIFT_HOURS);
assert.equal(offline.offlineRemainingHours,0);
const relog=simulateBenchmarkedWorker({state:economy,slot:'w1',zone:'z1',lastTick:now+8*HOUR,now:now+8*HOUR+15_000,offline:true,discoveredComponents:['bearing','motor','electronics']});
assert.equal(relog.hours,0,'same exhausted shift cannot pay again after relog');

dispatchWorkerShifts(economy,['w1'],now+8*HOUR+20_000);
const refreshed=simulateBenchmarkedWorker({state:economy,slot:'w1',zone:'z1',lastTick:now+8*HOUR+20_000,now:now+9*HOUR+20_000,offline:true,discoveredComponents:['bearing','motor','electronics']});
assert.equal(refreshed.hours,1);
assert.equal(refreshed.offlineRemainingHours,1);

// Bad/short run cannot overwrite a benchmark.
const oldValue=economy.benchmarks.z1!.valuePerMin;
assert.equal(recordActiveBenchmark(economy,'z1',{...strong,durationMs:30_000},now+1).accepted,false);
assert.equal(economy.benchmarks.z1!.valuePerMin,oldValue);

assert.equal(awardClearMedal(economy,'z1'),true);
assert.equal(awardClearMedal(economy,'z1'),false,'medal is one-time persistent progression');

console.log('worker economy V2 deterministic smoke: PASS');
