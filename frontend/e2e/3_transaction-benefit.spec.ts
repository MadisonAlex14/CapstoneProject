import { test, expect, Page } from '@playwright/test';
import { supabaseConfig } from './playwright_utils/config';
import { testUserCredentials } from './playwright_utils/config';

/**
 * Test suite for transaction-benefit workflow
 * Tests logging transactions from the benefits page and validating that benefits are applied
 * 
 * Workflow:
 * 1. Navigate to benefits page
 * 2. Click "Log Usage" button on a benefit
 * 3. Gets routed to /transactions/new with pre-selected card and merchant dropdown
 * 4. Fill in transaction details
 * 5. Submit and confirm benefit modal
 * 6. Navigate back to benefits page
 * 7. Validate that the usage was logged in the history
 */
test.describe('Transaction Benefit Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(testUserCredentials.email);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(testUserCredentials.password);

    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    await loginButton.click();

    await page.waitForURL(/\/(dashboard|cards|rewards)/, { timeout: 10000 });
  });

  // Helper: Find benefit row and click "Log Usage" button
  async function navigateToBenefitTransaction(
    page: Page,
    cardNamePattern: string,
    benefitNamePattern?: string
  ): Promise<void> {
    await page.goto('/benefits');
    await page.waitForLoadState('networkidle');

    // Find the row containing the card name pattern (e.g., 'Amex', 'Chase', 'Citi')
    // and optionally filter by benefit name pattern (e.g., 'dining', 'uber', 'hotel')
    let benefitRow = page.locator('table tbody tr').filter({ has: page.locator(`text=/${cardNamePattern}/`) });
    
    if (benefitNamePattern) {
      benefitRow = benefitRow.filter({ has: page.locator(`text=/${benefitNamePattern}/i`) });
    }
    
    benefitRow = benefitRow.first();
    await expect(benefitRow).toBeVisible({ timeout: 5000 });

    // Click the "Log Usage" button in that row
    const logUsageButton = benefitRow.locator('button', { hasText: 'Log Usage' });
    await logUsageButton.click();

    // Should be redirected to /transactions/new with query params
    await page.waitForURL(/\/transactions\/new\?/, { timeout: 5000 });
  }

  // Helper: Fill in transaction form and submit
  async function fillAndSubmitTransaction(
    page: Page,
    merchant: string,
    amount: string
  ): Promise<void> {
    await page.waitForLoadState('networkidle');

    // Find and interact with the merchant field
    // The merchant field is likely a text input that opens a dropdown when clicked
    const merchantLabel = page.locator('label').filter({ hasText: /merchant|Merchant/i }).first();
    await expect(merchantLabel).toBeVisible({ timeout: 5000 });
    
    // Find the input associated with this label (usually the next input)
    const merchantInput = merchantLabel.locator('..').locator('input[type="text"], input:not([type="date"]):not([type="number"])').first();
    
    if (await merchantInput.isVisible()) {
      await merchantInput.click();
      await merchantInput.fill(merchant);
      await page.waitForTimeout(500);
      
      // Look for dropdown option containing the merchant name
      const option = page.locator(`[role="option"], li, div`).filter({ hasText: new RegExp(merchant, 'i') }).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    await page.waitForTimeout(300);

    // Fill in transaction date (today)
    const transactionDateInput = page.locator('input[type="date"]').first();
    const today = new Date().toISOString().split('T')[0];
    await transactionDateInput.fill(today);

    // Select MCC category - use 'restaurant' as a safe default
    const mccInput = page.locator('input[placeholder*="Search by MCC"]');
    if (await mccInput.isVisible()) {
      await mccInput.fill('restaurant');
      await page.waitForTimeout(600);
      const mccResultItem = page.locator('li').first();
      try {
        await mccResultItem.click({ timeout: 5000 });
      } catch (e) {
        // If li doesn't work, try clicking text
        const anyMccResult = page.locator('text="restaurant"').first();
        await anyMccResult.click();
      }
    }

    await page.waitForTimeout(300);

    // Fill in amount
    const amountInputs = page.locator('input[type="number"]');
    const amountCount = await amountInputs.count();
    
    // Amount input is typically one of the number inputs
    // Use the first one that is empty or visible
    if (amountCount > 0) {
      const amountInput = amountInputs.first();
      await amountInput.fill(amount);
    }

    await page.waitForTimeout(300);

    // Submit transaction
    const submitButton = page.locator('button').filter({ hasText: 'Add Transaction' }).first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
  }

  // Helper: Confirm benefit in modal
  async function confirmBenefitModal(page: Page): Promise<void> {
    // Wait for any modal/dialog to appear with benefit-related text
    const benefitText = page.locator('body').filter({ hasText: /benefits|detected|credit|reward/i }).first();
    await expect(benefitText).toBeVisible({ timeout: 5000 });

    // Click the "Log Benefits" button
    const logBenefitsButton = page.locator('button').filter({ hasText: /log benefits|confirm|apply/i }).first();
    await expect(logBenefitsButton).toBeVisible({ timeout: 5000 });
    await logBenefitsButton.click();
    await page.waitForTimeout(2000);

    // Wait for navigation back to benefits or transactions page
    await page.waitForURL(/\/(transactions|benefits)/, { timeout: 10000 });
  }

  // Helper: Navigate back to benefits and find the logged entry
  async function validateBenefitLogged(
    page: Page,
    cardNamePattern: string,
    expectedAmount: string,
    merchant: string,
    benefitNamePattern?: string
  ): Promise<void> {
    await page.goto('/benefits');
    await page.waitForLoadState('networkidle');

    // Find the benefit row using card name pattern (e.g., 'Amex', 'Chase', 'Citi')
    // and optionally filter by benefit name pattern (e.g., 'dining', 'uber', 'hotel')
    let benefitRow = page.locator('table tbody tr').filter({ has: page.locator(`text=/${cardNamePattern}/`) });
    
    if (benefitNamePattern) {
      benefitRow = benefitRow.filter({ has: page.locator(`text=/${benefitNamePattern}/i`) });
    }
    
    benefitRow = benefitRow.first();
    await expect(benefitRow).toBeVisible({ timeout: 5000 });

    // Click to expand history
    await benefitRow.click();
    await page.waitForTimeout(300);

    // Look for the history section - it should be in the next tr with expanded content
    const expandedRow = benefitRow.locator('xpath=following-sibling::tr[1]');
    await expect(expandedRow).toBeVisible({ timeout: 5000 });

    // Find the history table within the expanded row
    const historyTable = expandedRow.locator('table').first();
    
    // Find the row with our logged transaction
    const historyRow = historyTable.locator('tbody tr').filter({ 
      has: page.locator(`text=${merchant}`)
    }).first();

    await expect(historyRow).toBeVisible({ timeout: 5000 });

    // Verify the merchant
    await expect(historyRow).toContainText(merchant, { timeout: 5000 });

    // Verify the amount (as currency)
    const amountCell = historyRow.locator('td').nth(2); // Amount column
    await expect(amountCell).toContainText(expectedAmount, { timeout: 5000 });
  }

  test.describe('Amex Gold - Monthly Dining Credit ($10/month)', () => {
    test('should log $15 Grubhub transaction with $10 cap and apply benefit', async ({ page }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await navigateToBenefitTransaction(page, 'Amex', 'dining');
      await fillAndSubmitTransaction(page, 'Grubhub', '15.00');
      await confirmBenefitModal(page);
      await validateBenefitLogged(page, 'Amex', '$10', 'Grubhub', 'dining');
    });
  });

  test.describe('Amex Gold - Monthly Uber Cash ($10/month)', () => {
    test('should log $12 Uber Eats transaction with $10 cap and apply benefit', async ({ page }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await navigateToBenefitTransaction(page, 'Amex', 'uber');
      await fillAndSubmitTransaction(page, 'Uber Eats', '12.00');
      await confirmBenefitModal(page);
      await validateBenefitLogged(page, 'Amex', '$10', 'Uber Eats', 'uber');
    });
  });

  test.describe('Chase Sapphire Preferred - Annual Hotel Credit ($50/year)', () => {
    test('should log $120 Chase Travel transaction with $50 cap and apply benefit', async ({ page }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await navigateToBenefitTransaction(page, 'Chase', 'hotel');
      await fillAndSubmitTransaction(page, 'Chase Travel', '120.00');
      await confirmBenefitModal(page);
      await validateBenefitLogged(page, 'Chase', '$50', 'Chase Travel', 'hotel');
    });
  });
});