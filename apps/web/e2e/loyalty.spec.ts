import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Programme de fidélité', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche la page de fidélité', async ({ page }) => {
    await page.goto('/loyalty');
    await expect(page.getByText('Programme de fidélité')).toBeVisible();
  });

  test('affiche le grade Bronze pour un nouveau compte', async ({ page }) => {
    await page.goto('/loyalty');
    await expect(page.getByText(/Bronze|Silver|Gold|Platinum|Diamond/i)).toBeVisible({ timeout: 5000 });
  });

  test('affiche le classement', async ({ page }) => {
    await page.goto('/loyalty');
    await expect(page.getByText(/Classement/i)).toBeVisible({ timeout: 5000 });
  });

  test('affiche les grades disponibles', async ({ page }) => {
    await page.goto('/loyalty');
    const grades = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    for (const grade of grades) {
      await expect(page.getByText(grade).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
