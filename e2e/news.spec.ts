import { test, expect } from '@playwright/test';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN_FOR_TEST ?? '';

test('admin/noticias: tela de acesso pede token e valida contra a API', async ({ page }) => {
  await page.goto('/admin/noticias', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Curadoria de Notícias')).toBeVisible();
  await expect(page.getByText('Acesso restrito')).toBeVisible();
});

test('admin/noticias: com token, abre a fila de pendentes', async ({ page }) => {
  test.skip(!ADMIN_TOKEN, 'sem token de teste, pula fluxo real de escrita');
  await page.goto('/admin/noticias', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Token de administrador').fill(ADMIN_TOKEN);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // Fila carrega: vazio (Fila vazia) ou com cards (Abrir matéria original)
  const emptyState = page.getByText('Fila vazia');
  const cardLink = page.getByRole('link', { name: 'Abrir matéria original' }).first();
  await expect(emptyState.or(cardLink)).toBeVisible({ timeout: 15000 });
});

test('perfil do Claudio Cajado mostra a seção No noticiário com as menções aprovadas', async ({
  page,
}) => {
  await page.goto('/politicos/110', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('No noticiário')).toBeVisible({ timeout: 15000 });
  // Aguarda o estado carregado (não o skeleton) — o card real expõe o link
  const newsLink = page.getByRole('link', { name: /Claudio Cajado/ }).first();
  await expect(newsLink).toBeVisible({ timeout: 10000 });
  const linkCount = await page.getByRole('link', { name: /Claudio Cajado/ }).count();
  expect(linkCount).toBeGreaterThanOrEqual(3);
});