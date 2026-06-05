import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Réservations', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('affiche la page réservations', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page.getByText('Mes réservations')).toBeVisible({ timeout: 8000 });
  });

  test('affiche les tabs Restaurant et Hôtel', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page.getByText('Restaurant')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Hôtel')).toBeVisible();
  });

  test('affiche un état vide ou des réservations', async ({ page }) => {
    await page.goto('/reservations');
    await page.waitForTimeout(2000);
    const hasReservations = await page.locator('article, [data-testid="reservation-card"]').count();
    const hasEmpty = await page.getByText('Aucune réservation').count();
    expect(hasReservations + hasEmpty).toBeGreaterThan(0);
  });
});
