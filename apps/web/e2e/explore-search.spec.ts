import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Explore page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/explore');
  });

  test('affiche le header "Découvrir"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Découvrir' })).toBeVisible();
  });

  test('la barre de recherche est présente', async ({ page }) => {
    await expect(
      page.getByPlaceholder('Rechercher restaurant, hôtel, ville…'),
    ).toBeVisible();
  });

  test('les pills de filtre sont visibles', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Tout' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restaurant' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hôtel' })).toBeVisible();
  });

  test('cliquer sur une pill active la sélection', async ({ page }) => {
    const pill = page.getByRole('button', { name: 'Restaurant' });
    await pill.click();
    await expect(pill).toHaveClass(/bg-primary/);
  });

  test('une recherche sans résultat affiche le texte empty state', async ({ page }) => {
    await page.fill(
      'input[placeholder="Rechercher restaurant, hôtel, ville…"]',
      'xxxxxxxxxzzznotfound999',
    );
    await page.waitForTimeout(500);
    await expect(page.getByText(/Aucun résultat pour/)).toBeVisible({
      timeout: 8000,
    });
  });
});

test.describe('Search page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.removeItem('edp_recent_searches'));
    await page.goto('/search');
  });

  test('affiche la barre de recherche auto-focusée', async ({ page }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('affiche le message empty state sans requête', async ({ page }) => {
    await expect(
      page.getByText('Trouvez des personnes et des lieux'),
    ).toBeVisible();
  });

  test('les tabs apparaissent après recherche', async ({ page }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await input.fill('Paris');
    await page.waitForTimeout(600);
    await expect(page.getByRole('tab', { name: /Établissements/ })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('tab', { name: /Utilisateurs/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test('une recherche est sauvegardée dans les recherches récentes', async ({ page }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await input.fill('Paris');
    await page.waitForTimeout(600);
    await input.clear();
    await page.waitForTimeout(400);
    await expect(page.getByText('Paris')).toBeVisible({ timeout: 5000 });
  });

  test('une recherche récente peut être supprimée avec ×', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('edp_recent_searches', JSON.stringify(['Lyon']));
    });
    await page.reload();
    await expect(page.getByText('Lyon')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Supprimer "Lyon"' }).click();
    await expect(page.getByText('Lyon')).not.toBeVisible();
  });
});
