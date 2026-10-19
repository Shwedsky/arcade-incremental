from pathlib import Path


def patch(path: str, old: str, new: str, label: str) -> None:
    p=Path(path); text=p.read_text(encoding='utf-8'); count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected one match, got {count}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Once ZoneId includes z8, the first-worker legacy fallback must be total over ZoneId.
patch('src/midgame.ts',
"  z6:{metal:164,copper:13,plastic:6},\n  z7:{metal:188,copper:14,plastic:5}\n};",
"  z6:{metal:164,copper:13,plastic:6},\n  z7:{metal:188,copper:14,plastic:5},\n  z8:{metal:210,copper:16,plastic:4}\n};",
'midgame z8 legacy rate')

# Crew #3 remains a Scavenger/Operator, but a mature Scavenger may work any mastered frontier through Z8.
patch('src/content_pack_c.ts',
"export type PackCCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6';",
"export type PackCCrewZoneId='z1'|'z2'|'z3'|'z4'|'z5'|'z6'|'z7'|'z8';",
'crew3 zone union')
patch('src/content_pack_c.ts',
"  z4:{metal:132,copper:12,plastic:10},z5:{metal:162,copper:14,plastic:8},z6:{metal:178,copper:15,plastic:6}\n};",
"  z4:{metal:132,copper:12,plastic:10},z5:{metal:162,copper:14,plastic:8},z6:{metal:178,copper:15,plastic:6},\n  z7:{metal:205,copper:16,plastic:5},z8:{metal:232,copper:18,plastic:4}\n};",
'crew3 z7 z8 rates')

print('Pack E worker zone integration fixed')
