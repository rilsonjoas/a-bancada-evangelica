import { test, expect } from '@playwright/test';

test('hub /temas lista os temas com pautas', async ({ page }) => {
  await page.goto('/temas', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Votações por tema');
  await expect(page.getByText('Meio ambiente e energia')).toBeVisible({ timeout: 15000 });
});

test('página de tema mostra hero + cards de pautas + SEO no title', async ({ page }) => {
  await page.goto('/temas/meio-ambiente-energia', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Meio ambiente e energia', {
    timeout: 15000,
  });
  await expect(page.getByText('PL 2159/2021', { exact: false }).first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page).toHaveTitle(/Meio ambiente e energia/);
});

test('/votacoes (Pautas-Chave) oferece atalho Navegue por tema', async ({ page }) => {
  await page.goto('/votacoes', { waitUntil: 'domcontentloaded' });
  // Aba de Pautas-Chave via click real (Radix Tabs — click sintético não troca)
  await page.getByRole('tab', { name: 'Pautas-Chave' }).click();
  await expect(page.getByRole('link', { name: /Meio ambiente e energia/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('link', { name: /Meio ambiente e energia/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Meio ambiente e energia');
});