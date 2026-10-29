import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const write=(path,content)=>fs.writeFileSync(path,content,'utf8');
function replaceOnce(source,needle,replacement,label){
  const index=source.indexOf(needle);
  if(index<0)throw new Error(`Missing anchor for ${label}`);
  if(source.indexOf(needle,index+needle.length)>=0)throw new Error(`Ambiguous anchor for ${label}`);
  return source.slice(0,index)+replacement+source.slice(index+needle.length);
}

// 1) Early V3-B pile parents must read as piles, not as one refrigerator/compressor.
{
  const path='src/zone_content.ts';
  let text=read(path);
  text=replaceOnce(text,
    "    large_appliance:[v('Стиральная машина','washer','motor','hydraulic'),v('Холодильник','fridge','motor'),v('Кухонная плита','oven','electronics'),v('Водонагреватель','boiler','hydraulic')]",
    "    large_appliance:[v('Куча бытового лома','washer','motor','hydraulic'),v('Куча техники и кабеля','fridge','motor'),v('Кухонный завал','oven','electronics'),v('Куча металлолома','boiler','hydraulic')]",
    'Z1 pile labels');
  text=replaceOnce(text,
    "    large_appliance:[v('Большой компрессор','compressor','motor','pump'),v('Насосная станция','pump','pump','hydraulic'),v('Бензогенератор','generator','motor','electronics'),v('Старый котёл','boiler','hydraulic')]",
    "    large_appliance:[v('Куча гаражного лома','compressor','motor','pump'),v('Завал насосов и труб','pump','pump','hydraulic'),v('Куча генераторов и проводки','generator','motor','electronics'),v('Котельный лом','boiler','hydraulic')]",
    'Z2 pile labels');
  write(path,text);
}

// 2) Make the active field read as a place and give V3-B pile parents a unique, low/wide silhouette.
{
  const path='src/field_view.ts';
  let text=read(path);
  const placeIdentity=`function drawPlaceIdentity(ctx:CanvasRenderingContext2D,width:number,height:number,camera:CameraView,zone:ZoneId){
  const sx=(x:number)=>x-camera.x+camera.shakeX,sy=(y:number)=>y-camera.y+camera.shakeY;
  ctx.save();ctx.globalAlpha=.92;
  if(zone==='z1'){
    // A readable neighbourhood-edge scrapyard: road, fenced yard, skip/container row and a small workshop landmark.
    const x=sx(170),y=sy(150),w=690,h=430;
    ctx.fillStyle='#151b18aa';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#78857b88';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
    ctx.fillStyle='#37433dcc';ctx.fillRect(sx(205),sy(185),200,92);ctx.fillStyle='#b07343';ctx.fillRect(sx(230),sy(210),52,40);ctx.fillStyle='#68736d';ctx.fillRect(sx(300),sy(210),74,40);
    ctx.fillStyle='#242b28';ctx.fillRect(sx(620),sy(185),190,76);ctx.fillStyle='#5f756e';ctx.fillRect(sx(642),sy(204),58,44);ctx.fillRect(sx(716),sy(204),70,44);
    ctx.fillStyle='#c89c50';ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.fillText('СТАРАЯ СВАЛКА',sx(198),sy(138));
    ctx.fillStyle='#93a09a';ctx.font='700 10px system-ui';ctx.fillText('двор приёмки',sx(198),sy(292));ctx.fillText('мастерская',sx(625),sy(279));
    ctx.strokeStyle='#55625c88';ctx.lineWidth=6;line(ctx,sx(188),sy(330),sx(832),sy(330));
    for(let xx=245;xx<805;xx+=112){ctx.fillStyle=xx%224?'#6f5945':'#4c6260';rr(ctx,sx(xx)-34,sy(365)-18,68,36,4);ctx.fill()}
  }else if(zone==='z2'){
    // Garage alley with recognizable service bays instead of an abstract empty plane.
    ctx.fillStyle='#202729dd';ctx.fillRect(sx(120),sy(120),860,250);ctx.strokeStyle='#59656a';ctx.lineWidth=4;ctx.strokeRect(sx(120),sy(120),860,250);
    for(let i=0;i<4;i++){const bx=sx(170+i*190),by=sy(162);ctx.fillStyle='#303a3e';ctx.fillRect(bx,by,148,145);ctx.fillStyle='#657178';ctx.fillRect(bx+14,by+34,120,92);ctx.fillStyle='#1b2224';for(let yy=by+47;yy<by+116;yy+=18)ctx.fillRect(bx+18,yy,112,4)}
    ctx.fillStyle='#c89c50';ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.fillText('ГАРАЖНЫЙ КВАРТАЛ',sx(135),sy(102));
    ctx.fillStyle='#8d999e';ctx.font='700 10px system-ui';ctx.fillText('сервисные боксы',sx(142),sy(392));
  }else{
    // Later zones keep a strong industrial horizon/landmark strip so every map reads as a location.
    const labels:Record<string,string>={z3:'СКЛАД БЫТОВОЙ ТЕХНИКИ',z4:'АВТОРАЗБОР',z5:'ПРОМЗОНА',z6:'ЗАБРОШЕННЫЙ ЗАВОД',z7:'ТЯЖЁЛЫЙ ПАРК',z8:'ПОРТОВЫЙ ТЕРМИНАЛ'};
    ctx.fillStyle='#1c2321bb';ctx.fillRect(sx(120),sy(120),820,110);ctx.strokeStyle='#55635e88';ctx.lineWidth=3;ctx.strokeRect(sx(120),sy(120),820,110);
    for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#566861':'#755f48';ctx.fillRect(sx(155+i*150),sy(155),112,54)}
    ctx.fillStyle='#c89c50';ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.fillText(labels[zone]??'ПРОМЫШЛЕННАЯ ЗОНА',sx(135),sy(105));
  }
  ctx.restore();
}

`;
  text=replaceOnce(text,'function drawScrapStack(ctx:CanvasRenderingContext2D,d:Decor){',placeIdentity+'function drawScrapStack(ctx:CanvasRenderingContext2D,d:Decor){','place identity helper');

  const pileRenderer=`function isEarlyScrapPile(t:SalvageTarget,zone:ZoneId){return t.classId==='large_appliance'&&(zone==='z1'||zone==='z2')}
function drawReadablePile(ctx:CanvasRenderingContext2D,t:SalvageTarget,zone:ZoneId,hp:number){
  const spread=hp>.72?0:hp>.35?7:15,flip=t.variant%2?1:-1;
  targetShadow(ctx,72,12);
  ctx.save();ctx.translate(0,5);ctx.globalAlpha=.98;
  // Broad base of sheet metal / timber makes the silhouette read as a heap rather than one appliance.
  ctx.fillStyle='#3d4742';ctx.fillRect(-68-spread*.3,12,136+spread*.6,18);
  ctx.fillStyle='#76634a';ctx.save();ctx.rotate(-.12*flip);ctx.fillRect(-58,-2,70,16);ctx.restore();
  // Refrigerator / cabinet body.
  ctx.save();ctx.translate(-27-spread*.25,-18-spread*.08);ctx.rotate(-.12*flip);ctx.fillStyle='#a7aea8';rr(ctx,-19,-29,38,58,5);ctx.fill();ctx.fillStyle='#59635f';ctx.fillRect(-14,-18,28,4);ctx.strokeStyle='#454d49';ctx.lineWidth=2;line(ctx,0,-25,0,24);ctx.restore();
  // Tyre and wheel/frame chunk.
  ctx.strokeStyle='#171d1b';ctx.lineWidth=10;ctx.beginPath();ctx.arc(31+spread*.35,8,18,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#747d78';ctx.lineWidth=3;ctx.beginPath();ctx.arc(31+spread*.35,8,8,0,Math.PI*2);ctx.stroke();
  // Pipes / rails.
  ctx.strokeStyle='#89938d';ctx.lineWidth=7;line(ctx,-60-spread*.3,-2,48+spread*.35,-29);ctx.strokeStyle='#b26e46';ctx.lineWidth=5;line(ctx,-45,-19,57+spread*.35,-5);
  // Cable coil.
  ctx.strokeStyle='#bd6f43';ctx.lineWidth=6;ctx.beginPath();ctx.arc(8,-22-spread*.12,13,0,Math.PI*1.85);ctx.stroke();
  // Crate/toolbox gives the pile a second recognizable object family.
  ctx.fillStyle=zone==='z1'?'#87664a':'#4f6562';rr(ctx,35+spread*.2,-25,34,24,4);ctx.fill();ctx.strokeStyle='#b49062';ctx.lineWidth=2;line(ctx,40+spread*.2,-20,64+spread*.2,-6);line(ctx,64+spread*.2,-20,40+spread*.2,-6);
  if(hp<.72){ctx.globalAlpha=.75;ctx.fillStyle='#d09a55';ctx.fillRect(-76-spread*.3,29,36,5);ctx.fillRect(28,31,44,5)}
  if(hp<.35){ctx.globalAlpha=.9;ctx.strokeStyle='#e5b36a';ctx.lineWidth=2;line(ctx,-52,-31,-73,-43);line(ctx,45,-34,70,-48)}
  ctx.restore();
  ctx.save();ctx.translate(0,-72-spread*.2);ctx.fillStyle='#0e1512dd';rr(ctx,-54,-12,108,24,4);ctx.fill();ctx.strokeStyle='#7f683d';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#e1bd76';ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(zone==='z1'?'КУЧА ЛОМА':'ГАРАЖНЫЙ ЗАВАЛ',0,0);ctx.restore();
}

`;
  text=replaceOnce(text,'function drawTargetVisual(ctx:CanvasRenderingContext2D,t:SalvageTarget,zone:ZoneId,hp:number){',pileRenderer+'function drawTargetVisual(ctx:CanvasRenderingContext2D,t:SalvageTarget,zone:ZoneId,hp:number){','pile renderer');
  text=replaceOnce(text,
    "function drawTargetVisual(ctx:CanvasRenderingContext2D,t:SalvageTarget,zone:ZoneId,hp:number){\n  const artSize=targetArtSize(t);",
    "function drawTargetVisual(ctx:CanvasRenderingContext2D,t:SalvageTarget,zone:ZoneId,hp:number){\n  if(isEarlyScrapPile(t,zone)){drawReadablePile(ctx,t,zone,hp);return}\n  const artSize=targetArtSize(t);",
    'pile visual routing');
  text=replaceOnce(text,
    "function targetVisualRadius(t:SalvageTarget,zone:ZoneId){\n  const d=getTargetClass(t.classId),legacy=isNestedSalvage(t,zone)?d.radius+18:t.classId==='large_appliance'?d.radius+4:d.radius;",
    "function targetVisualRadius(t:SalvageTarget,zone:ZoneId){\n  if(isEarlyScrapPile(t,zone))return 78;\n  const d=getTargetClass(t.classId),legacy=isNestedSalvage(t,zone)?d.radius+18:t.classId==='large_appliance'?d.radius+4:d.radius;",
    'pile visual radius');
  text=replaceOnce(text,
    'syncBreakVisuals(targets,zone);advanceBreakVisuals();drawGround(ctx,width,height,camera,zone);',
    'syncBreakVisuals(targets,zone);advanceBreakVisuals();drawGround(ctx,width,height,camera,zone);drawPlaceIdentity(ctx,width,height,camera,zone);',
    'place identity render call');
  write(path,text);
}

// 3) Replace the radial/PoE-like talent web with five explicit directed tracks.
{
  const path='src/v3_a_clarity.css';
  let text=read(path);
  const start=text.indexOf('.v3TalentTree{');
  const end=text.indexOf('\n\n.zoneGrid.v3ZoneFog',start);
  if(start<0||end<0)throw new Error('Talent CSS section anchors not found');
  const talentCss=`.v3TalentTree{display:block!important;position:relative;padding:10px!important}.v3TalentTreeRoot{position:relative;display:grid;grid-template-columns:repeat(5,minmax(165px,1fr));gap:14px;padding:22px;border:1px solid #303a3f;background:linear-gradient(180deg,#20272a 0,#171d20 28%,#13181b 100%);overflow:auto}.v3TalentTreeRoot:before{content:"";position:absolute;left:5%;right:5%;top:202px;height:2px;background:linear-gradient(90deg,transparent,#465157 8%,#465157 92%,transparent);opacity:.65;pointer-events:none}.v3TalentCore{grid-column:1/-1;position:relative;width:min(560px,100%);min-height:118px;margin:0 auto 28px;border:1px solid #8c7446;background:#20272a;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:16px 22px;z-index:2;box-shadow:0 14px 34px #0006;pointer-events:none}.v3TalentCore:after{content:"5 НАПРАВЛЕНИЙ РАЗВИТИЯ";position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);padding:4px 10px;background:#171d20;color:#7f8c91;font-size:9px;letter-spacing:.16em;white-space:nowrap}.v3TalentCore small{letter-spacing:.12em;color:#929da2}.v3TalentCore b{font-size:22px;margin:6px 0;color:#e4c17b}.v3TalentCore span{font-size:12px}.v3TalentCore em{font-style:normal;color:#7f8c91;font-size:10px;margin-top:8px}.v3TalentBranch{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;min-width:0;z-index:4;text-align:left!important;border:1px solid #333e43;background:#181f22;padding:12px 10px 10px}.v3TalentBranch:before{display:block;margin:-12px -10px 10px;padding:7px 10px;border-bottom:1px solid #3c474c;background:#20282b;color:#8d999e;font-size:9px;letter-spacing:.14em}.v3TalentBranch[data-v3-branch="salvage"]:before{content:"01 · ЛИЧНАЯ СИЛА"}.v3TalentBranch[data-v3-branch="logistics"]:before{content:"02 · ПЕРЕВОЗКА"}.v3TalentBranch[data-v3-branch="workshop"]:before{content:"03 · ПРОИЗВОДСТВО"}.v3TalentBranch[data-v3-branch="automation"]:before{content:"04 · ПЕРСОНАЛ / АВТОМАТИЗАЦИЯ"}.v3TalentBranch[data-v3-branch="trade"]:before{content:"05 · БИЗНЕС / ТОРГОВЛЯ"}.v3TalentBranch header{min-height:58px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #303a3f}.v3TalentBranch header strong{display:block;font-size:14px;color:#d5dadd}.v3TalentBranch header small{display:block;color:#879398;font-size:10px;line-height:1.3;margin-top:4px}.v3TalentSpoke{display:flex;flex-direction:column;align-items:stretch;gap:0}.v3TalentLink{width:2px;height:14px;background:#5e676b;display:block;margin:0 auto;flex:0 0 14px}.v3TalentNode{appearance:none;color:inherit;font:inherit;background:#1d2528;border:1px solid #485258;border-radius:3px;padding:9px;display:flex;gap:8px;align-items:flex-start;text-align:left;width:100%;min-width:0;max-width:none;min-height:82px;position:relative;z-index:5}.v3TalentNode>span{display:grid;place-items:center;flex:0 0 26px;height:26px;border:1px solid #58636a;font-size:11px;font-weight:800}.v3TalentNode b{display:block;font-size:11px}.v3TalentNode small{display:block;color:#8d999e;font-size:9px;line-height:1.3;margin-top:3px}.v3TalentNode em{display:block;color:#c0a15f;font-size:9px;font-style:normal;margin-top:5px}.v3TalentNode.available{border-color:#a27e3d;cursor:pointer;box-shadow:inset 3px 0 #a27e3d}.v3TalentNode.available:hover{background:#272b27}.v3TalentNode.unlocked{border-color:#546c77;background:#1c2a30;box-shadow:inset 3px 0 #617f8d}.v3TalentNode.unknown{justify-content:center;align-items:center;flex-direction:column;text-align:center;border-style:dashed;opacity:.48;min-height:68px}.v3TalentNode.unknown>span{font-size:15px}.v3TalentNode.unknown small{margin:0}.v3TalentNode:disabled{cursor:default}
`;
  text=text.slice(0,start)+talentCss+text.slice(end);

  const mapStart=text.indexOf('.zoneGrid.v3ZoneFog{');
  const mapEnd=text.indexOf('\n\n.pcTiming',mapStart);
  if(mapStart<0||mapEnd<0)throw new Error('Map fog CSS anchors not found');
  const mapCss=`.zoneGrid.v3ZoneFog{position:relative;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;padding:22px}.zoneGrid.v3ZoneFog:before{content:"";position:absolute;left:5%;right:5%;top:50%;height:8px;transform:translateY(-50%);background:repeating-linear-gradient(90deg,#3b4448 0 28px,#232a2d 28px 44px);border:1px solid #4d575c;opacity:.65;z-index:0}.zoneGrid.v3ZoneFog .zoneCard{position:relative;z-index:1;box-shadow:0 12px 28px #0007}.zoneGrid.v3ZoneFog .zoneCard:after{content:"";position:absolute;left:50%;bottom:-15px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);background:#9a7d46;border:2px solid #171d20}.v3UnknownZone{display:flex!important;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:250px;border-style:dashed!important;background:radial-gradient(circle,#20272a,#151a1d)!important}.v3UnknownZone h3{font-size:54px;margin:8px 0;color:#777f83}.v3UnknownZone p{max-width:220px;color:#858f93}.v3UnknownRoute{font-size:28px;letter-spacing:.35em;color:#8f7442;margin:6px 0 12px}
`;
  text=text.slice(0,mapStart)+mapCss+text.slice(mapEnd);
  text=text.replace('@media(max-width:980px){.v3OverviewGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.v3TalentTree{min-height:auto}.v3TalentTreeRoot{min-height:0;padding:18px}.v3TalentTreeRoot:before{display:none}.v3TalentCore,.v3TalentBranch{position:static!important;transform:none!important;width:auto;margin-bottom:12px;pointer-events:auto}.v3TalentCore{min-height:0}.v3TalentSpoke{justify-content:flex-start!important}.v3TalentNode{max-width:none;flex:1 1 150px}.v3NowCard{grid-template-columns:1fr}.v3NowCard div{grid-template-columns:1fr 1fr}}',
    '@media(max-width:980px){.v3OverviewGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.v3TalentTreeRoot{grid-template-columns:repeat(2,minmax(0,1fr));padding:18px}.v3TalentTreeRoot:before{display:none}.v3TalentCore{grid-column:1/-1;width:100%;min-height:0;pointer-events:auto}.v3TalentBranch:last-child{grid-column:1/-1}.v3NowCard{grid-template-columns:1fr}.v3NowCard div{grid-template-columns:1fr 1fr}}');
  text=text.replace('@media(max-width:620px){.v3AOverviewHead{display:grid}.v3AOverviewHead>div:last-child{border-left:0;border-top:1px solid #3a4448;padding:10px 0 0}.v3OverviewGrid{grid-template-columns:1fr}.v3NowCard div{grid-template-columns:1fr}.v3NowCard em{grid-column:1}.v3TalentTreeRoot{padding:10px}.v3TalentNode{flex-basis:100%}.v3ReviewPresetGrid{grid-template-columns:1fr}}',
    '@media(max-width:620px){.v3AOverviewHead{display:grid}.v3AOverviewHead>div:last-child{border-left:0;border-top:1px solid #3a4448;padding:10px 0 0}.v3OverviewGrid{grid-template-columns:1fr}.v3NowCard div{grid-template-columns:1fr}.v3NowCard em{grid-column:1}.v3TalentTreeRoot{grid-template-columns:1fr;padding:10px}.v3TalentCore,.v3TalentBranch:last-child{grid-column:1}.v3TalentCore:after{white-space:normal;width:100%;text-align:center}.zoneGrid.v3ZoneFog{grid-template-columns:1fr;padding:10px}.zoneGrid.v3ZoneFog:before{display:none}.v3ReviewPresetGrid{grid-template-columns:1fr}}');
  write(path,text);
}

// 4) Owner-review instructions should explicitly target the corrected visual semantics.
{
  const path='review/README_V3B.txt';
  let text=read(path);
  if(!text.includes('V3-B.1 VISUAL READABILITY')){
    text += `\n\nV3-B.1 VISUAL READABILITY — что проверить:\n- Z1/Z2: крупная составная цель должна читаться именно как КУЧА/ЗАВАЛ из нескольких узнаваемых предметов, а не как один холодильник.\n- После разрушения кучи дочерние цели должны выглядеть логичным продолжением исходного завала.\n- Фон первой карты должен читаться как реальное место: дорога, огороженная свалка/двор, мастерская/гаражные боксы и ориентиры.\n- Развитие: пять веток должны читаться как пять направленных дорожек сверху вниз, без ощущения круговой паутины/PoE.\n- Карта зон должна читаться как последовательный маршрут с понятным следующим фронтиром.\n`;
    write(path,text);
  }
}

write('docs/V3_B1_VISUAL_READABILITY_FOLLOWUP.md',`# V3-B.1 — Visual Readability / World Identity follow-up\n\nStatus: owner-feedback corrective pass inside V3-B.\n\n## Owner feedback being closed\n\n1. Early composite targets did not read as scrap piles: a refrigerator/large appliance appeared to split for no obvious visual reason.\n2. The V3-A radial talent presentation read as a web/constellation rather than a directed development tree.\n3. The active map still felt like an abstract plane rather than a recognizable place with roads, yards, fences, workshops and zone identity.\n4. Salvage should use recognizable object silhouettes rather than generic abstract shapes wherever possible.\n\n## Corrective contract\n\n- Z1/Z2 V3-B pile parents receive explicit pile semantics in labels and a unique broad multi-object silhouette.\n- The pile silhouette contains several recognizable object families (cabinet/appliance body, tyre, pipes, cable coil, crate/toolbox) and visibly loosens as HP falls.\n- Z1 receives a fenced scrapyard / intake yard / workshop composition; Z2 receives a garage-alley/service-bay composition; later zones keep a stronger industrial landmark strip.\n- Talent presentation becomes five explicit directed tracks. The central era summary remains, but there is no radial ring or PoE-like web composition.\n- Zone fog keeps future content hidden while the visible cards are connected as one route.\n\n## Non-goals\n\nThis pass does not retune economy, add talent ranks/respec, implement business ascension, Production Lines, P6 or monetization. Those remain later Progression Reframe increments.\n`);

console.log('V3-B.1 visual readability patch applied');
