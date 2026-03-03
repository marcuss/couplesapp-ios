import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page).toHaveURL('/tasks');
    await expect(page.locator('h1')).toContainText('Tasks');
  });

  test('should show empty state when no tasks', async ({ page }) => {
    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });
});
