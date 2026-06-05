import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Messages list (/messages)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/messages');
  });

  test('affiche le titre Messages', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  });

  test('affiche le champ de recherche', async ({ page }) => {
    await expect(page.getByPlaceholder('Rechercher une conversation')).toBeVisible();
  });

  test('le champ de recherche filtre les conversations', async ({ page }) => {
    await page.fill('[placeholder="Rechercher une conversation"]', 'zzz_inexistant_zzz');
    await expect(page.getByText('Aucune conversation')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Conversation page (/messages/[userId])', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('la conversation affiche le bouton retour vers /messages', async ({ page }) => {
    await page.goto('/messages/some-user-id');
    const backLink = page.locator('a[href="/messages"]');
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });

  test('la zone de saisie est visible en bas', async ({ page }) => {
    await page.goto('/messages/some-user-id');
    await expect(page.getByPlaceholder('Votre message...')).toBeVisible({ timeout: 5000 });
  });

  test('le bouton Envoyer est présent', async ({ page }) => {
    await page.goto('/messages/some-user-id');
    await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible({ timeout: 5000 });
  });
});
