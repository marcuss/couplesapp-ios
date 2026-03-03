import { test, expect } from '@playwright/test';

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/events');
  });

  test('should display events page', async ({ page }) => {
    await expect(page).toHaveURL('/events');
    await expect(page.locator('h1')).toContainText('Events');
  });

  test('should show empty state when no events', async ({ page }) => {
    await expect(page.locator('text=No events yet')).toBeVisible();
  });
});
