import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke test de boot (CEPT2-6): carrega as rotas principais contra o BUILD
 * local (vite preview) e falha se qualquer pageerror ocorrer. É a cobertura
 * que teria pego o incidente TDZ (tela-branca 2026-08-23 e 2026-09-16 passou
 * por typecheck + testes + build — erro só aparecia em runtime no browser).
 *
 * Roda no CI após `pnpm build` + `pnpm preview`; o spec usa E2E_BOOT_URL
 * explicitamente (não o baseURL da config, que aponta para produção).
 */

const BOOT_URL = process.env.E2E_BOOT_URL ?? 'http://localhost:4173';

async function assertCleanBoot(page: Page) {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(`pageerror: ${err.message}`));

  await page.goto(`${BOOT_URL}/`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1_000);

  expect(pageErrors, 'pageerror detectado no boot da home').toEqual([]);
  expect(await page.locator('body').isVisible()).toBe(true);
}

test.describe('Boot smoke (CI) — build local sem pageerror', () => {
  test('home boota sem erro de runtime', async ({ page }) => {
    await assertCleanBoot(page);
  });

  test('rotas principais bootam sem erro de runtime', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));

    for (const path of ['metodologia', 'comparacao', 'grupos', 'sobre']) {
      await page.goto(`${BOOT_URL}/${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(800);
      const dedup = [...new Set(errs)];
      expect(dedup, `pageerror ao visitar /${path}`).toEqual([]);
    }
  });
});