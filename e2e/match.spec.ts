import { test, expect } from '@playwright/test';

test.describe('Match Eleitor (/match)', () => {
  test('quiz flui até o resultado e atualiza o title (SEO)', async ({ page }) => {
    await page.goto('/match', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem vota como você?');
    await expect(page).toHaveTitle(/Quem vota como você/);

    await expect(page.getByText('Pergunta 1 de 5')).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Pergunta ${i + 1} de 5`)).toBeVisible();
      await page.getByRole('button', { name: /Concordo/ }).click();
    }

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Parlamentares mais próximos de você',
      { timeout: 15000 }
    );
    await expect(page.getByText(/parlamentares avaliados/)).toBeVisible();
    // Concordando com tudo, o 1º card é o 1º do ranking oficial
    const cards = page.getByRole('listitem');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    await expect(cards.first()).toContainText('Afinidade com você');
  });

  test('botão Refazer recomeça o quiz', async ({ page }) => {
    await page.goto('/match', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Concordo/ }).click();
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Parlamentares mais próximos de você',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /Refazer o teste/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem vota como você?');
    await expect(page.getByText('Pergunta 1 de 5')).toBeVisible();
  });

  test('link do footer leva ao /match', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Quem vota como você?' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem vota como você?');
  });

  test('CTA do hero leva ao /match', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Descubra quem vota como você' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem vota como você?');
  });
});