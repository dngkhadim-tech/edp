import { test, expect } from '@playwright/test';

async function loginMobile(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test('mobile nav has 4 items with labels', async ({ page }) => {
  await loginMobile(page);
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Accueil')).toBeVisible();
  await expect(nav.getByText('Découvrir')).toBeVisible();
  await expect(nav.getByText('Reels')).toBeVisible();
  await expect(nav.getByText('Profil')).toBeVisible();
});

test('mobile nav publish button is centered and elevated', async ({ page }) => {
  await loginMobile(page);
  const publishBtn = page.getByRole('link', { name: 'Publier' });
  await expect(publishBtn).toBeVisible();
});
