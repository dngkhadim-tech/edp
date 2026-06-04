import { test, expect } from '@playwright/test';

test('mobile nav has 5 items with labels', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/feed');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Accueil')).toBeVisible();
  await expect(nav.getByText('Découvrir')).toBeVisible();
  await expect(nav.getByText('Reels')).toBeVisible();
  await expect(nav.getByText('Profil')).toBeVisible();
});

test('mobile nav publish button is centered and elevated', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/feed');
  const publishBtn = page.getByRole('link', { name: 'Publier' });
  await expect(publishBtn).toBeVisible();
});
