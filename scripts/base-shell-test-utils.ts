import type {Page} from 'playwright';

export type BaseSurface='overview'|'production'|'storage'|'contracts'|'crew'|'logistics';

/**
 * Existing browser regressions were written before the base was split into
 * stage-aware surfaces. They should keep testing their gameplay concern rather
 * than depending on every panel being visible at once. The dedicated Base Shell
 * browser smoke tests the actual tab UX; legacy suites use this helper to move
 * to the surface that owns the control they are about to exercise.
 */
export async function openBaseSurface(page:Page,surface:BaseSurface){
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.());
  const available=await page.locator(`[data-base-surface="${surface}"]`).count();
  if(!available)throw new Error(`Base Shell surface not found: ${surface}`);
  const hidden=await page.locator(`[data-base-surface="${surface}"]`).isHidden();
  if(hidden)throw new Error(`Base Shell surface unavailable for current business stage: ${surface}`);
  await page.evaluate((id)=>(globalThis as any).__SALVAGE_BASE_SHELL__.open(id),surface);
  await page.waitForFunction((id)=>!(document.querySelector<HTMLElement>(`[data-base-pane="${id}"]`)?.hidden),surface);
}
