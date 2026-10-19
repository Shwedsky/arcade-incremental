import fs from 'node:fs';
const path='scripts/smoke.ts';let s=fs.readFileSync(path,'utf8');
function r(a,b,label){if(!s.includes(a))throw new Error(`missing ${label}`);s=s.replace(a,b)}
r(`assert.equal(TALENTS.length, 38, 'Tier I remains 35 nodes plus three justified Tier-II runtime unlocks');\nassert.equal(new Set(TALENTS.map((t) => t.id)).size, 38, 'talent ids must be unique');`,
  `assert.equal(TALENTS.length, 40, 'Progression V2 keeps 35 historical Tier-I definitions plus five coherent Tier-II roots');\nassert.equal(new Set(TALENTS.map((t) => t.id)).size, 40, 'talent ids must be unique');`,'talent count');
r(`assert.equal(canUnlockTalent(wideSwing,10,new Set<TalentId>(['salvage_7'])).ok,true);`,
  `assert.equal(canUnlockTalent(wideSwing,10,new Set<TalentId>(['salvage_7'])).ok,false);\nassert.equal(canUnlockTalent(wideSwing,10,new Set<TalentId>(['salvage_7']),new Set(['van'] as const)).ok,true);`,'wide swing gate');
r(`assert.equal(canUnlockTalent(heavyFab,10,new Set<TalentId>(['workshop_4'])).ok,true);\nassert.equal(canUnlockTalent(operator,10,new Set<TalentId>(['automation_3'])).ok,true);`,
  `assert.equal(canUnlockTalent(heavyFab,12,new Set<TalentId>(['workshop_4'])).ok,false);\nassert.equal(canUnlockTalent(heavyFab,12,new Set<TalentId>(['workshop_4']),new Set(['hangar'] as const)).ok,true);\nassert.equal(canUnlockTalent(operator,12,new Set<TalentId>(['automation_3'])).ok,false);\nassert.equal(canUnlockTalent(operator,12,new Set<TalentId>(['automation_3']),new Set(['salvage_yard'] as const)).ok,true);`,'tier2 gates');
fs.writeFileSync(path,s);console.log('progression smoke compatibility updated');
