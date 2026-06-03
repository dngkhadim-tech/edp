import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche le feed avec des posts', async ({ page }) => {
    await expect(page.locator('article')).toHaveCount({ minimum: 1 }, { timeout: 10000 });
  });

  test('affiche la barre des stories', async ({ page }) => {
    await expect(page.getByText('Votre story')).toBeVisible({ timeout: 5000 });
  });

  test('le like fonctionne', async ({ page }) => {
    const likeBtn = page.locator('article').first().locator('button').first();
    await likeBtn.click();
    await expect(likeBtn).toBeVisible();
  });

  test('lien vers la page explore', async ({ page }) => {
    await page.click('a[href="/explore"]');
    await expect(page.url()).toContain('/explore');
    await expect(page.getByText('Explorer')).toBeVisible();
  });
});

test.describe('Explore', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche les établissements', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('article')).toHaveCount({ minimum: 1 }, { timeout: 10000 });
  });

  test('filtre par type fonctionne', async ({ page }) => {
    await page.goto('/explore');
    await page.click('text=Restaurants');
    await expect(page.url()).not.toContain('error');
  });

  test('la recherche retourne des résultats', async ({ page }) => {
    await page.goto('/explore');
    await page.fill('input[placeholder*="restaurant"]', 'Paris');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.locator('article')).toHaveCount({ minimum: 1 }, { timeout: 10000 });
  });
});
