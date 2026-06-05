import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Paramètres', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche la page paramètres', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Paramètres')).toBeVisible({ timeout: 8000 });
  });

  test('affiche les sections Profil et Notifications', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Profil')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test('affiche la section Confidentialité', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Confidentialité')).toBeVisible({ timeout: 8000 });
  });

  test('affiche la section Danger (suppression compte)', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Danger')).toBeVisible({ timeout: 8000 });
  });
});
