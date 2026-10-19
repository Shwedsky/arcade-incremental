import fs from 'node:fs';

function replaceOnce(text,oldValue,newValue,label){
  if(!text.includes(oldValue))throw new Error(`missing anchor: ${label}`);
  return text.replace(oldValue,newValue);
}

// Midgame: let the Logistics Tier-II root alter actual Van capacity without changing legacy callers.
{
  const path='src/midgame.ts';let s=fs.readFileSync(path,'utf8');
  s=replaceOnce(s,
    `export function vanRemaining(van:VanState):number{return Math.max(0,VAN_CAPACITY_KG-vanWeight(van))}`,
    `export function vanRemaining(van:VanState,capacityKg=VAN_CAPACITY_KG):number{return Math.max(0,capacityKg-vanWeight(van))}`,
    'vanRemaining');
  s=replaceOnce(s,
    `export function transferCartToVan(van:VanState,haul:Record<ResourceKind,number>,components:Record<ComponentKind,number>,midComponents:Record<MidComponentKind,number>):CartTransferResult{\n  if(!van.owned)return{movedKg:0,remainingKg:haul.metal+haul.copper+haul.plastic};\n  const weight=haul.metal+haul.copper+haul.plastic,remaining=vanRemaining(van),factor=weight<=0?0:Math.min(1,remaining/weight);`,
    `export function transferCartToVan(van:VanState,haul:Record<ResourceKind,number>,components:Record<ComponentKind,number>,midComponents:Record<MidComponentKind,number>,capacityKg=VAN_CAPACITY_KG):CartTransferResult{\n  if(!van.owned)return{movedKg:0,remainingKg:haul.metal+haul.copper+haul.plastic};\n  const weight=haul.metal+haul.copper+haul.plastic,remaining=vanRemaining(van,capacityKg),factor=weight<=0?0:Math.min(1,remaining/weight);`,
    'transferCartToVan');
  fs.writeFileSync(path,s);
}

// Contract Board: derive a stable second offer from the same staged pool; no parallel contract state machine.
{
  const path='src/contract_board_v2.ts';let s=fs.readFileSync(path,'utf8');
  const old=`export function activeBoardContract(state:ContractState,ctx:ContractBoardContext):ContractBoardDef{\n  const eligible=eligibleBoardContracts(ctx);\n  if(!eligible.length)return CONTRACT_BOARD_V2[0];\n  const s=boardState(state),current=s.currentId&&eligible.find(def=>def.id===s.currentId);\n  if(current)return current;\n  const recentIds=(s.recentIds??[]).slice(-4),recentSignatures=(s.recentSignatures??[]).slice(-3);\n  let candidates=eligible.filter(def=>!recentIds.includes(def.id)&&!recentSignatures.includes(contractSignature(def)));\n  if(!candidates.length)candidates=eligible.filter(def=>!recentIds.includes(def.id));\n  if(!candidates.length)candidates=eligible;\n  const pointer=Math.max(0,state.index)+Math.max(0,state.completed)*3;\n  const selected=candidates[pointer%candidates.length];\n  s.currentId=selected.id;\n  return selected;\n}\n`;
  const next=`export function boardContractOffers(state:ContractState,ctx:ContractBoardContext,count=1):ContractBoardDef[]{\n  const eligible=eligibleBoardContracts(ctx);\n  if(!eligible.length)return[CONTRACT_BOARD_V2[0]];\n  const s=boardState(state),recentIds=(s.recentIds??[]).slice(-4),recentSignatures=(s.recentSignatures??[]).slice(-3),pointer=Math.max(0,state.index)+Math.max(0,state.completed)*3;\n  let first=s.currentId&&eligible.find(def=>def.id===s.currentId);\n  if(!first){\n    let candidates=eligible.filter(def=>!recentIds.includes(def.id)&&!recentSignatures.includes(contractSignature(def)));\n    if(!candidates.length)candidates=eligible.filter(def=>!recentIds.includes(def.id));\n    if(!candidates.length)candidates=eligible;\n    first=candidates[pointer%candidates.length];s.currentId=first.id;\n  }\n  const offers=[first];\n  if(count<=1)return offers;\n  const firstSig=contractSignature(first);\n  let extras=eligible.filter(def=>def.id!==first!.id&&!recentIds.includes(def.id)&&!recentSignatures.includes(contractSignature(def))&&contractSignature(def)!==firstSig);\n  if(!extras.length)extras=eligible.filter(def=>def.id!==first!.id&&!recentIds.includes(def.id)&&contractSignature(def)!==firstSig);\n  if(!extras.length)extras=eligible.filter(def=>def.id!==first!.id);\n  let offset=1;\n  while(offers.length<Math.min(Math.max(1,count),eligible.length)&&extras.length){const idx=(pointer+offset)%extras.length;offers.push(extras.splice(idx,1)[0]);offset+=2}\n  return offers;\n}\n\nexport function activeBoardContract(state:ContractState,ctx:ContractBoardContext):ContractBoardDef{return boardContractOffers(state,ctx,1)[0]}\n`;
  s=replaceOnce(s,old,next,'activeBoardContract');
  fs.writeFileSync(path,s);
}

// Main integration: tier UI/gates, real Van Packing, specialist copper price, two-offer trade root.
{
  const path='src/main.ts';let s=fs.readFileSync(path,'utf8');
  s=replaceOnce(s,`import './sale_controls.css';`,`import './sale_controls.css';\nimport './progression_expansion_v2.css';`,'css import');
  s=replaceOnce(s,
    `  BRANCHES, TALENTS, canUnlockTalent, deriveEffects, earnedMasteryPoints,\n  levelForXp, xpForComponent, xpForTarget, xpWindow,\n  type BranchId, type TalentId`,
    `  BRANCHES, TALENTS, canUnlockTalent, deriveEffects, earnedMasteryPoints, spentMasteryPoints,\n  levelForXp, xpForComponent, xpForTarget, xpWindow,\n  type BranchId, type TalentId, type TalentMilestone`,
    'progression imports');
  s=replaceOnce(s,
    `  activeBoardContract,advanceBoardContract,contractBoardPoolStats,contractFamilyLabel,isDiscreteContractNeed,`,
    `  activeBoardContract,boardContractOffers,advanceBoardContract,contractBoardPoolStats,contractFamilyLabel,isDiscreteContractNeed,`,
    'contract imports');
  s=replaceOnce(s,
    `const level=()=>levelForXp(xp),effects=()=>deriveEffects(talents),capacity=()=>cartBaseCapacity(equipmentLevels.cart)+effects().capacityBonus,masteryAvailable=()=>earnedMasteryPoints(level())-talents.size;`,
    `const level=()=>levelForXp(xp),effects=()=>deriveEffects(talents),capacity=()=>cartBaseCapacity(equipmentLevels.cart)+effects().capacityBonus,masteryAvailable=()=>earnedMasteryPoints(level())-spentMasteryPoints(talents),activeVanCapacity=()=>VAN_CAPACITY_KG+effects().vanCapacityBonus;`,
    'progression helpers');
  s=replaceOnce(s,
    `const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});`,
    `const zoneContext=()=>({level:level(),installed,mastery:midgame.mastery});\nfunction talentMilestones():ReadonlySet<TalentMilestone>{const result=new Set<TalentMilestone>();if(midgame.van.owned)result.add('van');if(midgame.worker.hired)result.add('first_worker');if(packB.hangarOwned)result.add('hangar');if(packC.salvageYardOwned)result.add('salvage_yard');if(packD.industrialWorkshopOwned)result.add('industrial_workshop');return result}`,
    'talent milestones');

  const oldRender=`function renderContract(){const ctx=contractContext(),def=activeBoardContract(contractState,ctx),pool=contractBoardPoolStats(ctx),needMult=contractNeedMultiplier(),rewardMult=contractScale(contractState,effects().urgentContracts),needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult})),ready=needs.every(n=>contractOwned(n)+1e-9>=n.amount),cashReward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);$('contractPanel').innerHTML=\`<div class="contractHead"><div><small>\${effects().urgentContracts?'СРОЧНЫЙ · ':''}\${contractFamilyLabel(def.family)} · \${pool.eligible} доступно</small><h2>\${def.name}</h2></div><strong>\${money(cashReward)} · \${xpReward} XP</strong></div><p>\${def.description}</p><div class="contractNeeds">\${needs.map(n=>{const own=contractOwned(n),ok=own+1e-9>=n.amount;return\`<span class="\${ok?'ok':'missing'}">\${ok?'✓':'●'} \${n.label}: <b>\${own.toFixed(isDiscreteContractNeed(n)?0:1)} / \${n.amount.toFixed(isDiscreteContractNeed(n)?0:1)}</b></span>\`}).join('')}</div><button id="completeContract" \${ready?'':'disabled'}>\${ready?'Сдать заказ':'Собери заказ'}</button><small>Доска учитывает открытые технологии и не повторяет недавние типы заказов. Контракты — бонус к экономике, а не замена обычной продаже.</small>\`}`;
  const newRender=`function renderContract(){const ctx=contractContext(),pool=contractBoardPoolStats(ctx),offers=boardContractOffers(contractState,ctx,effects().contractChoices),needMult=contractNeedMultiplier(),rewardMult=contractScale(contractState,effects().urgentContracts);$('contractPanel').innerHTML=\`<div class="contractHead"><div><small>ДОСКА ЗАКАЗОВ · \${pool.eligible} доступно</small><h2>\${offers.length>1?'Выбери заказ':'Текущий заказ'}</h2></div></div><div class="contractOffers \${offers.length>1?'two':''}">\${offers.map((def,index)=>{const needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult})),ready=needs.every(n=>contractOwned(n)+1e-9>=n.amount),cashReward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);return\`<article class="contractOffer" data-contract-offer="\${def.id}"><div class="contractHead"><div><small>\${effects().urgentContracts?'СРОЧНЫЙ · ':''}\${contractFamilyLabel(def.family)}</small><h2>\${def.name}</h2></div><strong>\${money(cashReward)} · \${xpReward} XP</strong></div><p>\${def.description}</p><div class="contractNeeds">\${needs.map(n=>{const own=contractOwned(n),ok=own+1e-9>=n.amount;return\`<span class="\${ok?'ok':'missing'}">\${ok?'✓':'●'} \${n.label}: <b>\${own.toFixed(isDiscreteContractNeed(n)?0:1)} / \${n.amount.toFixed(isDiscreteContractNeed(n)?0:1)}</b></span>\`}).join('')}</div><button \${index===0?'id="completeContract" ':''}data-contract-submit="\${def.id}" \${ready?'':'disabled'}>\${ready?'Сдать этот заказ':'Собери заказ'}</button></article>\`}).join('')}</div><small>Недавние типы не повторяются. Второй выбор открывается в Tier II ветки Торговли.</small>\`}`;
  s=replaceOnce(s,oldRender,newRender,'contract render');

  const oldComplete=`function completeContract(){const ctx=contractContext(),def=activeBoardContract(contractState,ctx),needMult=contractNeedMultiplier(),needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult}));if(!needs.every(n=>contractOwned(n)+1e-9>=n.amount))return;for(const n of needs)consumeContractNeed(n,n.amount);const rewardMult=contractScale(contractState,effects().urgentContracts),reward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);cash+=reward;advanceBoardContract(contractState,def);gainXp(xpReward);showToast(\`Контракт закрыт: +\${money(reward)}, +\${xpReward} XP\`);saveGame();renderGarage()}`;
  const newComplete=`function completeContract(contractId?:string){const ctx=contractContext(),offers=boardContractOffers(contractState,ctx,effects().contractChoices),def=(contractId?offers.find(x=>x.id===contractId):undefined)??activeBoardContract(contractState,ctx),needMult=contractNeedMultiplier(),needs=def.needs.map(n=>({...n,amount:isDiscreteContractNeed(n)?n.amount:n.amount*needMult}));if(!needs.every(n=>contractOwned(n)+1e-9>=n.amount))return;for(const n of needs)consumeContractNeed(n,n.amount);const rewardMult=contractScale(contractState,effects().urgentContracts),reward=def.cashReward*rewardMult,xpReward=Math.round(def.xpReward*rewardMult);cash+=reward;advanceBoardContract(contractState,def);gainXp(xpReward);showToast(\`Контракт закрыт: +\${money(reward)}, +\${xpReward} XP\`);saveGame();renderGarage()}`;
  s=replaceOnce(s,oldComplete,newComplete,'contract complete');

  s=s.replaceAll(`vanRemaining(midgame.van)`,`vanRemaining(midgame.van,activeVanCapacity())`);
  s=s.replaceAll(`:VAN_CAPACITY_KG`,`:activeVanCapacity()`);
  s=replaceOnce(s,`transferCartToVan(midgame.van,haul,comps,midHaul)`,`transferCartToVan(midgame.van,haul,comps,midHaul,activeVanCapacity())`,'van transfer');
  s=s.replaceAll(`\${VAN_CAPACITY_KG} кг`,`\${activeVanCapacity()} кг`);
  s=s.replaceAll(` / \${VAN_CAPACITY_KG} кг`,` / \${activeVanCapacity()} кг`);

  s=s.replaceAll(`storage.copper*BASE_SALE.copper`,`storage.copper*BASE_SALE.copper*effects().copperSaleMultiplier`);
  s=s.replaceAll(`processed.cleanCopper*PROCESSED_SALE.cleanCopper`,`processed.cleanCopper*PROCESSED_SALE.cleanCopper*effects().copperSaleMultiplier`);
  s=replaceOnce(s,
    `function saleBasePrice(mode:'raw'|'processed',key:string){return mode==='raw'?BASE_SALE[key as ResourceKind]:PROCESSED_SALE[key as ProcessKind]}`,
    `function saleBasePrice(mode:'raw'|'processed',key:string){const base=mode==='raw'?BASE_SALE[key as ResourceKind]:PROCESSED_SALE[key as ProcessKind];return base*((key==='copper'||key==='cleanCopper')?effects().copperSaleMultiplier:1)}`,
    'sale price');

  const oldTalents=`function renderTalents(){const points=masteryAvailable();$('talentSummary').textContent=\`Уровень \${level()} · свободных очков: \${points}. Изучено: \${talents.size}.\`;talentBranchesEl.innerHTML=(Object.keys(BRANCHES) as BranchId[]).map(branch=>{const meta=BRANCHES[branch],nodes=TALENTS.filter(t=>t.branch===branch).map(t=>{const unlocked=talents.has(t.id),check=canUnlockTalent(t,level(),talents),available=!unlocked&&points>0&&check.ok;return\`<button class="talentNode \${unlocked?'unlocked':available?'available':'locked'}" data-talent="\${t.id}" \${available?'':'disabled'}><span>\${t.tier}</span><div><b>\${t.name}</b><small>\${t.description}</small><em>\${unlocked?'✓ Изучено':check.reason??(points?'Можно изучить':'Нужно очко мастерства')}</em></div></button>\`}).join('');return\`<section class="talentBranch"><header><span>\${meta.icon}</span><div><h2>\${meta.name}</h2><p>\${meta.fantasy}</p></div></header>\${nodes}</section>\`}).join('')}`;
  const newTalents=`function renderTalents(){const points=masteryAvailable(),milestones=talentMilestones();$('talentSummary').textContent=\`Уровень \${level()} · свободных очков: \${points}. Потрачено: \${spentMasteryPoints(talents)}.\`;talentBranchesEl.innerHTML=(Object.keys(BRANCHES) as BranchId[]).map(branch=>{const meta=BRANCHES[branch],nodes=TALENTS.filter(t=>t.branch===branch).map(t=>{const unlocked=talents.has(t.id),check=canUnlockTalent(t,level(),talents,milestones),available=!unlocked&&points>=t.pointCost&&check.ok,tierLabel=t.progressionTier===1?\`I · \${t.tier}\`:\`II · \${Math.max(1,t.tier-7)}\`;return\`<button class="talentNode tier\${t.progressionTier} \${unlocked?'unlocked':available?'available':'locked'}" data-talent="\${t.id}" \${available?'':'disabled'}><span>\${tierLabel}</span><div><b>\${t.name}</b><i class="talentTierTag">Tier \${t.progressionTier===1?'I':'II'} · <span class="talentCost">\${t.pointCost} оч.</span></i><small>\${t.description}</small><em>\${unlocked?'✓ Изучено':check.reason??(points>=t.pointCost?'Можно изучить':\`Нужно очков: \${t.pointCost}\`)}</em></div></button>\`}).join('');return\`<section class="talentBranch"><header><span>\${meta.icon}</span><div><h2>\${meta.name}</h2><p>\${meta.fantasy}</p></div></header>\${nodes}</section>\`}).join('')}`;
  s=replaceOnce(s,oldTalents,newTalents,'talent render');
  s=replaceOnce(s,
    `if(!def||masteryAvailable()<1||!canUnlockTalent(def,level(),talents).ok)return;talents.add(id);`,
    `if(!def||masteryAvailable()<def.pointCost||!canUnlockTalent(def,level(),talents,talentMilestones()).ok)return;talents.add(id);`,
    'talent purchase');
  s=replaceOnce(s,`else if(target.closest('#completeContract'))completeContract();else if(target.closest('#buyVan'))`, `else if(target.closest('[data-contract-submit]'))completeContract(target.closest<HTMLElement>('[data-contract-submit]')?.dataset.contractSubmit);else if(target.closest('#buyVan'))`,'contract click');

  fs.writeFileSync(path,s);
}

console.log('Progression Expansion V2 runtime integration applied');
