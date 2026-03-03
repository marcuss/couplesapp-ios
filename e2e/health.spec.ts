import { test, expect } from '@playwright/test';

test('app loads and shows login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL('/login');
});
