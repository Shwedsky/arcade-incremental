#!/usr/bin/env python3
from pathlib import Path

p=Path(__file__).with_name('apply_pack_b_integration.py')
text=p.read_text(encoding='utf-8')
old='sub(r"function saveGame\\(\\)\\{const state:SaveStateV4=.*?\\}","""function saveGame(){const state:SaveStateV5='
new='sub(r"function saveGame\\(\\)\\{[^\\n]*\\}","""function saveGame(){const state:SaveStateV5='
if old not in text:
    if new in text:
        print('Pack B save matcher already fixed')
        raise SystemExit(0)
    raise SystemExit('Pack B save matcher anchor not found')
text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')
print('Pack B save matcher fixed')
