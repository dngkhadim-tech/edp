import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Établissements', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('naviguer vers la page d\'un établissement', async ({ page }) => {
    await page.goto('/explore');
    await page.locator('article a').first().click();
    await expect(page.url()).toContain('/establishment/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('page établissement affiche la note et les avis', async ({ page }) => {
    await page.goto('/explore');
    await page.locator('article a').first().click();
    await expect(page.locator('[data-testid="rating"], text=avis')).toBeVisible({ timeout: 10000 });
  });

  test('bouton réserver est visible', async ({ page }) => {
    await page.goto('/explore');
    await page.locator('article a').first().click();
    await expect(page.getByText('Réserver')).toBeVisible({ timeout: 10000 });
  });

  test('formulaire de réservation s\'ouvre au clic', async ({ page }) => {
    await page.goto('/explore');
    await page.locator('article a').first().click();
    await page.waitForTimeout(1000);
    const reserveBtn = page.getByText('Réserver').first();
    await reserveBtn.click();
    await expect(page.getByText('Confirmer')).toBeVisible({ timeout: 5000 });
  });
});
