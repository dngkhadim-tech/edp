import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Post/New — 3-step wizard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/post/new');
  });

  test('affiche le dropzone en step 1', async ({ page }) => {
    await expect(page.getByText('Glissez une photo ou vidéo ici')).toBeVisible();
    await expect(page.getByText('Choisir depuis la galerie')).toBeVisible();
  });

  test('affiche les type pills', async ({ page }) => {
    await expect(page.getByText('Publication')).toBeVisible();
    await expect(page.getByText('Reel')).toBeVisible();
    await expect(page.getByText('Story')).toBeVisible();
  });

  test('le pill actif change au clic', async ({ page }) => {
    const reelBtn = page.getByText('Reel');
    await reelBtn.click();
    await expect(reelBtn).toHaveClass(/bg-primary/);
  });

  test('upload un fichier et passe en step 2', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Choisir depuis la galerie').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Suivant' }).click();
    await expect(page.getByText('Détails')).toBeVisible();
  });

  test('step 2 — textarea caption avec compteur', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Choisir depuis la galerie').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data') });
    await page.getByRole('button', { name: 'Suivant' }).click();
    await expect(page.getByText('0 / 2200')).toBeVisible();
  });

  test('step 2 — retour revient en step 1', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Choisir depuis la galerie').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data') });
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page.getByText('Glissez une photo ou vidéo ici')).toBeVisible();
  });
});
