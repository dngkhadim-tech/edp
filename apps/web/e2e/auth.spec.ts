import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('affiche la page de connexion', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('VEYA')).toBeVisible();
    await expect(page.getByText('Bienvenue')).toBeVisible();
    await expect(page.getByPlaceholder('vous@exemple.com')).toBeVisible();
  });

  test('connexion avec identifiants invalides affiche une erreur', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/identifiant|connexion échouée/i)).toBeVisible({ timeout: 5000 });
  });

  test('connexion réussie redirige vers le feed', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@edp.app');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/feed', { timeout: 10000 });
    await expect(page.url()).toContain('/feed');
  });

  test('inscription avec un nouveau compte', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'E2E');
    await page.fill('input[name="username"]', `test_e2e_${timestamp}`);
    await page.fill('input[type="email"]', `test_${timestamp}@e2e.com`);
    await page.fill('input[type="password"]', 'TestPassword@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/feed', { timeout: 10000 });
    await expect(page.url()).toContain('/feed');
  });

  test('lien vers inscription visible sur la page de connexion', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText("Créer un compte")).toBeVisible();
    await page.click("text=Créer un compte");
    await expect(page.url()).toContain('/register');
  });
});
