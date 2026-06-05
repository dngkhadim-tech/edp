import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
  });

  test('affiche le titre Notifications', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });

  test('affiche le bouton Tout marquer lu', async ({ page }) => {
    await expect(page.getByText('Tout marquer lu')).toBeVisible();
  });

  test('affiche les tabs Toutes et Non lues', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Toutes/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Non lues/ })).toBeVisible();
  });

  test('tab Non lues est cliquable', async ({ page }) => {
    await page.getByRole('tab', { name: /Non lues/ }).click();
    await expect(page.getByRole('tab', { name: /Non lues/ })).toHaveAttribute('data-state', 'active');
  });

  test('le bouton Tout marquer lu envoie la requête PATCH', async ({ page }) => {
    let patchCalled = false;
    await page.route('**/notifications/read-all', (route) => {
      patchCalled = true;
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await page.getByText('Tout marquer lu').click();
    await page.waitForTimeout(500);
    expect(patchCalled).toBe(true);
  });
});
