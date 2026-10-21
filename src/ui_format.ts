export function formatUiNumber(value:number,maxFractionDigits=1):string{
  if(!Number.isFinite(value))return'0';
  const digits=Math.max(0,Math.min(4,Math.floor(maxFractionDigits)));
  const factor=10**digits;
  const rounded=Math.round((value+Number.EPSILON)*factor)/factor;
  if(Number.isInteger(rounded))return String(rounded);
  return rounded.toFixed(digits).replace(/0+$/,'').replace(/\.$/,'');
}

export function formatXpGain(value:number):string{
  return `+${formatUiNumber(value,1)} XP`;
}
