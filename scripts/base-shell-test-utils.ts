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
  await page.waitForSelector('#baseShellNav');
  await page.evaluate(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.refresh?.());
  await page.waitForFunction(()=>(globalThis as any).__SALVAGE_BASE_SHELL__?.getStage?.()!=null);

  const button=page.locator(`[data-base-surface="${surface}"]`);
  if(await button.count()===0)throw new Error(`Base Shell surface not found: ${surface}`);
  if(await button.isHidden())throw new Error(`Base Shell surface unavailable for current business stage: ${surface}`);

  await page.evaluate((id)=>(globalThis as any).__SALVAGE_BASE_SHELL__.open(id),surface);
  await page.waitForSelector(`[data-base-pane="${surface}"]:not([hidden])`);
}
