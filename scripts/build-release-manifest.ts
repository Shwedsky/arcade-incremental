import fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json' with { type:'json' };

const dist=path.resolve('dist');
if(!fs.existsSync(path.join(dist,'index.html')))throw new Error('dist/index.html missing; run build first');
const assets=fs.existsSync(path.join(dist,'assets'))?fs.readdirSync(path.join(dist,'assets')).sort():[];
if(!assets.some(x=>x.endsWith('.js')))throw new Error('release package has no JS bundle');
if(!assets.some(x=>x.endsWith('.css')))throw new Error('release package has no CSS bundle');
const files=fs.readdirSync(dist,{recursive:true}).map(String).sort();
const manifest={
  format:1,
  package:pkg.name,
  version:pkg.version,
  commit:process.env.GITHUB_SHA??'local',
  builtAt:new Date().toISOString(),
  entrypoint:'index.html',
  platform:{target:'yandex-games',sdkAdapter:true,gameReady:true,gameplayMarkup:true,cloudBoundary:true,ads:false,iap:false,leaderboards:false},
  save:{schema:4,resilientLocal:true,cloudMergePolicy:'newest-valid-snapshot'},
  blocker:'Yandex Games Console publication remains deferred until owner confirms РСЯ / Console access is available.',
  checks:['typecheck','gameplay-smoke','early-smoke','midgame-smoke','visual-smoke','content-smoke','save-safety-smoke','platform-smoke','responsive-browser-smoke'],
  files
};
fs.writeFileSync(path.join(dist,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
console.log('release manifest: PASS');
