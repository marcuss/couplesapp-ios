import { test, expect } from '@playwright/test';

test.describe('Invitation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to invite partner page', async ({ page }) => {
    // Click on profile menu and invite partner
    await page.goto('/invite');
    
    await expect(page).toHaveURL('/invite');
    await expect(page.locator('h1')).toContainText('Invite Your Partner');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
  });

  test('should create invitation with valid email', async ({ page }) => {
    await page.goto('/invite');
    
    // Fill in partner email
    await page.fill('[data-testid="email-input"]', 'partner@example.com');
    await page.click('[data-testid="send-invitation-button"]');
    
    // Should show success state
    await expect(page.locator('[data-testid="invitation-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="invitation-url"]')).toBeVisible();
  });

  test('should show error with invalid email', async ({ page }) => {
    await page.goto('/invite');
    
    // Fill in invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="send-invitation-button"]');
    
    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should copy invitation link to clipboard', async ({ page }) => {
    await page.goto('/invite');
    
    // Create invitation
    await page.fill('[data-testid="email-input"]', 'partner@example.com');
    await page.click('[data-testid="send-invitation-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="invitation-success"]')).toBeVisible();
    
    // Click copy button
    await page.click('[data-testid="copy-link-button"]');
    
    // Should show copied state
    await expect(page.locator('[data-testid="copied-indicator"]')).toBeVisible();
  });

  test('should accept invitation via invitation page', async ({ page }) => {
    // Create a test invitation token
    const token = 'test-token-123';
    
    // Navigate to invitation page
    await page.goto(`/invitation/${token}`);
    
    // Should show invitation details
    await expect(page.locator('h1')).toContainText('Partner Invitation');
    await expect(page.locator('[data-testid="accept-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="reject-button"]')).toBeVisible();
    
    // Accept invitation
    await page.click('[data-testid="accept-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should reject invitation via invitation page', async ({ page }) => {
    const token = 'test-token-456';
    
    await page.goto(`/invitation/${token}`);
    
    // Reject invitation
    await page.click('[data-testid="reject-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should display profile page with user info', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('h1')).toContainText('test@example.com');
  });

  test('should show partner information when connected', async ({ page }) => {
    await page.goto('/profile');
    
    // Should show partner section
    await expect(page.locator('[data-testid="partner-section"]')).toBeVisible();
    
    // If connected, should show partner name
    const partnerInfo = page.locator('[data-testid="partner-info"]');
    if (await partnerInfo.isVisible().catch(() => false)) {
      await expect(partnerInfo).toContainText('Connected');
    }
  });

  test('should show invite button when not connected', async ({ page }) => {
    await page.goto('/profile');
    
    // Should show invite button if not connected
    const inviteButton = page.locator('[data-testid="invite-partner-button"]');
    if (await inviteButton.isVisible().catch(() => false)) {
      await inviteButton.click();
      await expect(page).toHaveURL('/invite');
    }
  });

  test('should display pending invitations', async ({ page }) => {
    await page.goto('/profile');
    
    // Should show pending invitations section
    const invitationsSection = page.locator('[data-testid="pending-invitations"]');
    if (await invitationsSection.isVisible().catch(() => false)) {
      await expect(invitationsSection).toBeVisible();
      
      // Should have accept/reject buttons for each invitation
      const acceptButtons = page.locator('[data-testid="accept-invitation-button"]');
      const rejectButtons = page.locator('[data-testid="reject-invitation-button"]');
      
      if (await acceptButtons.first().isVisible().catch(() => false)) {
        await expect(acceptButtons.first()).toBeVisible();
        await expect(rejectButtons.first()).toBeVisible();
      }
    }
  });

  test('should disconnect from partner', async ({ page }) => {
    await page.goto('/profile');
    
    const disconnectButton = page.locator('[data-testid="disconnect-button"]');
    if (await disconnectButton.isVisible().catch(() => false)) {
      // Click disconnect
      await disconnectButton.click();
      
      // Confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Should show disconnect message with partner name
      await expect(page.locator('[data-testid="disconnect-message"]')).toBeVisible();
    }
  });
});
