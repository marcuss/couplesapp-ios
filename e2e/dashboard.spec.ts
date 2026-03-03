import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard with welcome message', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should navigate to goals page', async ({ page }) => {
    await page.click('[data-testid="goals-link"]');
    await expect(page).toHaveURL('/goals');
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.click('[data-testid="budgets-link"]');
    await expect(page).toHaveURL('/budgets');
  });

  test('should navigate to events page', async ({ page }) => {
    await page.click('[data-testid="events-link"]');
    await expect(page).toHaveURL('/events');
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.click('[data-testid="tasks-link"]');
    await expect(page).toHaveURL('/tasks');
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.click('[data-testid="profile-link"]');
    await expect(page).toHaveURL('/profile');
  });
});
