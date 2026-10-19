#!/usr/bin/env python3
from pathlib import Path

changed=[]
for p in sorted(Path('scripts').glob('browser-*-smoke.ts')):
    s=p.read_text(encoding='utf-8')
    n=s.replace('saveVersion,7','saveVersion,8')
    n=n.replace('Save V7','Save V8')
    n=n.replace('mid-v7','mid-v8')
    n=n.replace('__arcade_midgame_v7_','__arcade_midgame_v8_')
    if n!=s:
        p.write_text(n,encoding='utf-8')
        changed.append(str(p))
print('Save V8 browser expectations updated:', ', '.join(changed) if changed else 'none')
