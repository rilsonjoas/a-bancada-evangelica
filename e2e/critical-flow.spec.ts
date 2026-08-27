import { test, expect } from '@playwright/test';

test.describe('Fluxo crítico: Ranking → Perfil → Comparação', () => {

  test('home carrega com estatísticas e ranking', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Parlamentares monitorados', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Bancada Evangélica/ })).toBeVisible();
  });

  test('perfil do político carrega com dados', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Parlamentares monitorados', { timeout: 15_000 });

    const detailLink = page.getByRole('link', { name: /Ver detalhes/ }).first();
    await detailLink.click();
    await page.waitForURL(/\/politicos\//, { timeout: 10_000 });

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: 'Desempenho' })).toBeVisible();
  });

  test('comparação carrega', async ({ page }) => {
    await page.goto('/comparacao');
    await expect(page.getByText('Comparar Parlamentares')).toBeVisible({ timeout: 10_000 });
  });

  test('metodologia carrega com seção de transparência', async ({ page }) => {
    await page.goto('/metodologia');
    await expect(page.getByRole('heading', { name: /Metodologia/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Como os votos são selecionados')).toBeVisible();
  });

  test('senadores aparecem no ranking', async ({ page }) => {
    await page.goto('/?house=SENADO');
    await page.waitForSelector('text=Parlamentares monitorados', { timeout: 15_000 });
    await expect(page.getByText('Senado Federal')).toBeVisible();
  });

  test('última atualização visível', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Parlamentares monitorados', { timeout: 15_000 });
    await expect(page.getByText('Dados atualizados em')).toBeVisible({ timeout: 10_000 });
  });

});
