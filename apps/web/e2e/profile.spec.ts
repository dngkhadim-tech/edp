import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Profil utilisateur', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche les stats (posts, abonnés, abonnements)', async ({ page }) => {
    await page.goto('/profile/demo');
    await expect(page.getByText('posts')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('abonnés')).toBeVisible();
    await expect(page.getByText('abonnements')).toBeVisible();
  });

  test('affiche les tabs de grille', async ({ page }) => {
    await page.goto('/profile/demo');
    await expect(page.getByRole('tab', { name: 'Publications' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: 'Reels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sauvegardés' })).toBeVisible();
  });

  test('le bouton Modifier le profil est visible sur son propre profil', async ({ page }) => {
    await page.goto('/profile/demo');
    await expect(page.getByText('Modifier le profil')).toBeVisible({ timeout: 8000 });
  });

  test('le header sticky affiche le username', async ({ page }) => {
    await page.goto('/profile/demo');
    await expect(page.getByText('@demo')).toBeVisible({ timeout: 8000 });
  });
});
