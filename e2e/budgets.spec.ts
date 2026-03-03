import { test, expect } from '@playwright/test';

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/budgets');
  });

  test('should display budgets page', async ({ page }) => {
    await expect(page).toHaveURL('/budgets');
    await expect(page.locator('h1')).toContainText('Budgets');
  });

  test('should show empty state when no budgets', async ({ page }) => {
    await expect(page.locator('text=No budgets yet')).toBeVisible();
  });
});
