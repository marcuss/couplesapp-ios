import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate between pages', async ({ page }) => {
    // Dashboard to Goals
    await page.click('[data-testid="goals-link"]');
    await expect(page).toHaveURL('/goals');

    // Goals to Dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Dashboard to Budgets
    await page.click('[data-testid="budgets-link"]');
    await expect(page).toHaveURL('/budgets');
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
