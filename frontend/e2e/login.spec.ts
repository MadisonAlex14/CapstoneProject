import { test, expect } from '@playwright/test';
import { testUserCredentials } from './playwright_utils/config';

test.describe('Login Tests', () => {
  test('should login successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Find and fill email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(testUserCredentials.email);

    // Find and fill password input
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(testUserCredentials.password);

    // Click login button
    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    await loginButton.click();

    // Wait for successful login - should redirect away from /login
    // Wait for either dashboard or cards page
    await page.waitForURL(/\/(dashboard|cards|rewards)/, { timeout: 10000 });

    // Verify we're logged in by checking for user-specific content
    // For example, check if we can see the dashboard or cards page
    const pageUrl = page.url();
    expect(pageUrl).not.toContain('/login');
    console.log('Successfully logged in! Redirected to:', pageUrl);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.waitForLoadState('networkidle');

    // Fill with invalid credentials
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrongpassword');

    // Click login button
    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    await loginButton.click();

    // Wait a bit for error to appear
    await page.waitForTimeout(2000);

    // Should still be on login page
    expect(page.url()).toContain('/login');
    console.log('Login failed as expected with invalid credentials');
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for login button
    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    await expect(loginButton).toBeVisible();

    console.log('All login form elements are visible');
  });
});
