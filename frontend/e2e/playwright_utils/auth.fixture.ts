import { test as base, expect, Page } from '@playwright/test';
import { testUserCredentials } from './config';

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Fixture that provides an authenticated page
 * Automatically logs in before each test
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for email input to be visible
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill in credentials
    await emailInput.fill(testUserCredentials.email);
    
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(testUserCredentials.password);

    // Click login button
    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    await loginButton.click();

    // Wait for navigation to complete (redirect to dashboard or home)
    await page.waitForURL(/\/(dashboard|cards|rewards)/, { timeout: 10000 });

    // Use the authenticated page in the test
    await use(page);

    // Cleanup: logout if needed
    // You can add logout logic here if your app has a logout button
  },
});

export { expect };
