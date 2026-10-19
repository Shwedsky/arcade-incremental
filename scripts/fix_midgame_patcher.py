from pathlib import Path
p=Path(__file__).with_name('apply_midgame_integration.py')
s=p.read_text(encoding='utf-8')
old='sub(r"interface SaveStateV3\\{[^\\n]*\\n[^\\n]*\\n[^\\n]*\\n\\}",'
new='sub(r"interface SaveStateV3\\{[\\s\\S]*?\\n\\}",'
if old not in s:
    raise SystemExit('old save interface matcher not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('patcher matcher fixed')
