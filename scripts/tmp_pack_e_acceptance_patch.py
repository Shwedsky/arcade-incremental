from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    Path(path).write_text(text,encoding='utf-8')


def once(text: str, old: str, new: str, label: str) -> str:
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected one match, got {count}')
    return text.replace(old,new,1)

# Package script.
p='package.json'; t=read(p)
t=once(t,'    "smoke:browser:packd": "tsx scripts/browser-pack-d-smoke.ts",','    "smoke:browser:packd": "tsx scripts/browser-pack-d-smoke.ts",\n    "smoke:browser:packe": "tsx scripts/browser-pack-e-smoke.ts",','package pack e browser')
write(p,t)

# Existing browser gates should expect the current runtime schema after loading/migration.
# Intentionally DO NOT rewrite fixture `v:9` values: they prove migration.
changed=[]
for path in sorted(Path('scripts').glob('browser-*.ts')):
    if path.name=='browser-pack-e-smoke.ts': continue
    text=path.read_text(encoding='utf-8'); old=text
    text=text.replace('saveVersion===9','saveVersion===10')
    text=text.replace('saveVersion === 9','saveVersion === 10')
    text=re.sub(r'(saveVersion\s*,\s*)9([),])',r'\g<1>10\2',text)
    if text!=old:
        path.write_text(text,encoding='utf-8');changed.append(str(path))

# CI: domain/model/browser gates + V10 Pack E artifacts.
p='.github/workflows/ci.yml'; t=read(p)
t=once(t,'      - name: Content Pack D domain smoke\n        run: npm run smoke:packd','      - name: Content Pack D domain smoke\n        run: npm run smoke:packd\n      - name: Content Pack E domain smoke\n        run: npm run smoke:packe','ci pack e domain')
t=once(t,'      - name: Worker / progression economy V2 model proof\n        run: python models/worker_progression_economy_v2.py --check','      - name: Worker / progression economy V2 model proof\n        run: python models/worker_progression_economy_v2.py --check\n      - name: Content Pack E structural proof\n        run: python models/content_pack_e_v1.py','ci pack e model')
t=once(t,'      - name: Headless browser Content Pack D proof\n        run: npm run smoke:browser:packd','      - name: Headless browser Content Pack D proof\n        run: npm run smoke:browser:packd\n      - name: Headless browser Content Pack E proof\n        run: npm run smoke:browser:packe','ci pack e browser')
t=t.replace('Worker Economy V2 Save V9 + worker route browser proof','Worker Economy V2 Save V10 + worker route browser proof')
t=t.replace('arcade-incremental-release-candidate-v9.zip','arcade-incremental-release-candidate-v10.zip')
t=t.replace('arcade-incremental-release-candidate-v9','arcade-incremental-release-candidate-v10')
old_review="""      - name: Package Progression Expansion V2 manual review candidate
        run: |
          SHORT_SHA="${GITHUB_SHA:0:8}"
          REVIEW_DIR="manual-review-v1-progression-expansion-v2"
          REVIEW_ZIP="arcade-incremental-manual-review-v1-progression-v2-run${GITHUB_RUN_NUMBER}-${SHORT_SHA}.zip"
          rm -rf "$REVIEW_DIR"
          mkdir -p "$REVIEW_DIR/dist"
          cp -r dist/. "$REVIEW_DIR/dist/"
          cp review/review-start.html "$REVIEW_DIR/dist/review-start.html"
          cp review/START_REVIEW.bat "$REVIEW_DIR/START_REVIEW.bat"
          cp review/README_REVIEW.txt "$REVIEW_DIR/README_REVIEW.txt"
          cp docs/MANUAL_TARGET_RUN_V1.md "$REVIEW_DIR/MANUAL_TARGET_RUN_V1.md"
          cp docs/PROGRESSION_EXPANSION_V2_MODEL.md "$REVIEW_DIR/PROGRESSION_EXPANSION_V2_MODEL.md"
          printf 'Manual Review - Progression Expansion V2\\ncommit=%s\\nrun=%s\\nsave=V9\\nseed=owner-review-v1\\norigin=http://127.0.0.1:41971\\nfeatures=level30,tier2-roots,milestone-gates,van-packing,contract-choice,automation4,trade4,contract-board-v2,worker-economy-v2\\n' "$GITHUB_SHA" "$GITHUB_RUN_ID" > "$REVIEW_DIR/BUILD_INFO.txt"
          zip -r "$REVIEW_ZIP" "$REVIEW_DIR"
          echo "REVIEW_ZIP=$REVIEW_ZIP" >> "$GITHUB_ENV""" 
new_review="""      - name: Package Content Pack E manual review candidate
        run: |
          SHORT_SHA="${GITHUB_SHA:0:8}"
          REVIEW_DIR="manual-review-v1-content-pack-e"
          REVIEW_ZIP="arcade-incremental-manual-review-v1-content-pack-e-run${GITHUB_RUN_NUMBER}-${SHORT_SHA}.zip"
          rm -rf "$REVIEW_DIR"
          mkdir -p "$REVIEW_DIR/dist"
          cp -r dist/. "$REVIEW_DIR/dist/"
          cp review/review-start.html "$REVIEW_DIR/dist/review-start.html"
          cp review/START_REVIEW.bat "$REVIEW_DIR/START_REVIEW.bat"
          cp review/README_REVIEW.txt "$REVIEW_DIR/README_REVIEW.txt"
          cp docs/MANUAL_TARGET_RUN_V1.md "$REVIEW_DIR/MANUAL_TARGET_RUN_V1.md"
          cp docs/CONTENT_PACK_E_V1_MODEL.md "$REVIEW_DIR/CONTENT_PACK_E_V1_MODEL.md"
          printf 'Manual Review - Content Pack E V1\\ncommit=%s\\nrun=%s\\nsave=V10\\nseed=owner-review-v1\\norigin=http://127.0.0.1:41971\\nfeatures=z8-port-terminal,port-power-signature,processing-plant,plant-lines,plant-contracts,save-v10,level30,tier2-roots,worker-economy-v2\\n' "$GITHUB_SHA" "$GITHUB_RUN_ID" > "$REVIEW_DIR/BUILD_INFO.txt"
          zip -r "$REVIEW_ZIP" "$REVIEW_DIR"
          echo "REVIEW_ZIP=$REVIEW_ZIP" >> "$GITHUB_ENV"""
t=once(t,old_review,new_review,'ci Pack E review package')
t=once(t,'          name: arcade-incremental-manual-review-v1-progression-v2-run-${{ github.run_number }}','          name: arcade-incremental-manual-review-v1-content-pack-e-run-${{ github.run_number }}','ci review artifact name')
write(p,t)

print('Updated runtime Save V10 expectations:', ', '.join(changed) or 'none')
print('Pack E acceptance/CI patch prepared')
