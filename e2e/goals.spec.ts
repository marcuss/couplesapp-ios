import { test, expect } from '@playwright/test';

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/goals');
  });

  test('should display goals page', async ({ page }) => {
    await expect(page).toHaveURL('/goals');
    await expect(page.locator('h1')).toContainText('Goals');
  });

  test('should show empty state when no goals', async ({ page }) => {
    await expect(page.locator('text=No goals yet')).toBeVisible();
  });
});
