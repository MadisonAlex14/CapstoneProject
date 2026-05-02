import { test, expect } from './playwright_utils/auth.fixture';
import type { Page } from '@playwright/test';
import { supabaseConfig } from './playwright_utils/config';

/**
 * Test suite for rewards point accumulation
 * Tests logging transactions and validating that rewards points are calculated correctly
 * 
 * Workflow:
 * 1. Navigate to transactions page
 * 2. Add a new transaction with specific merchant and MCC code
 * 3. Validate the rewards points earned
 */
test.describe('Rewards Point Accumulation Tests', () => {
  // Using `authenticatedPage` fixture from auth.fixture for tests (auto login)

  // Helper: Navigate to transactions page and add a new transaction
  async function addRewardTransaction(
    page: Page,
    cardNamePattern: string,
    merchant: string,
    amount: string,
    mccCode: string
  ): Promise<void> {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Click "Add Transaction" or "New Transaction" button
    const addButton = page.locator('button').filter({ hasText: /log/i }).first();
    await addButton.click();
    await page.waitForURL(/\/transactions\/new/, { timeout: 5000 });
    await page.waitForTimeout(2000);

    // Select card from dropdown (if multiple cards exist) — follow the pattern used in transactions.spec.ts
    const cardSelect = page.locator('select').first();
    if (await cardSelect.count() > 0) {
      if (/amex/i.test(cardNamePattern)) {
        await cardSelect.selectOption('My Amex Card ••••5678');
      } else if (/chase/i.test(cardNamePattern)) {
        await cardSelect.selectOption('My Chase Card ••••4321');
      } else if (/citi/i.test(cardNamePattern)) {
        await cardSelect.selectOption('My Citi Card ••••8765');
      }
      await page.waitForTimeout(300);
    }

    // Fill in merchant
    const merchantLabel = page.locator('label').filter({ hasText: /merchant|Merchant/i }).first();
    const merchantInput = merchantLabel.locator('..').locator('input[type="text"], input:not([type="date"]):not([type="number"])').first();
    if (await merchantInput.isVisible()) {
      await merchantInput.click();
      await merchantInput.fill(merchant);
      await page.waitForTimeout(500);
      const option = page.locator(`[role="option"], li, div`).filter({ hasText: new RegExp(merchant, 'i') }).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Fill in transaction date (today)
    const transactionDateInput = page.locator('input[type="date"]').first();
    const today = new Date().toISOString().split('T')[0];
    await transactionDateInput.fill(today);

    // Fill in MCC code
    const mccInput = page.locator('input[placeholder*="Search by MCC"]');
    if (await mccInput.isVisible()) {
      await mccInput.fill(mccCode);
      await page.waitForTimeout(600);
      const mccResultItem = page.locator('li').first();
      try {
        await mccResultItem.click({ timeout: 5000 });
      } catch (e) {
        // If li doesn't work, try clicking text containing MCC code
        const anyMccResult = page.locator(`text="${mccCode}"`).first();
        await anyMccResult.click();
      }
    }

    // Fill in amount
    const amountInputs = page.locator('input[type="number"]');
    if (await amountInputs.count() > 0) {
      const amountInput = amountInputs.first();
      await amountInput.fill(amount);
    }

    await page.waitForTimeout(300);

    // Submit transaction
    const submitButton = page.locator('button').filter({ hasText: 'Add Transaction' }).first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for confirmation
    await page.waitForTimeout(2000);
  }

  // Helper: Navigate to rewards page and validate points earned
  async function validateRewardsEarned(
    page: Page,
    cardNamePattern: string,
    expectedPoints: string
  ): Promise<void> {
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');

    // Find the rewards table and verify the "Raw Balance" column for the card's row
    const rewardsTable = page.locator('table').first();
    await expect(rewardsTable).toBeVisible({ timeout: 5000 });

    // Determine header index for "raw balance"
    const headers = rewardsTable.locator('thead th');
    const headerCount = await headers.count();
    let rawIdx = -1;
    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).innerText()).toLowerCase();
      if (text.includes('raw balance')) {
        rawIdx = i;
        break;
      }
    }

    if (rawIdx === -1) {
      // Fallback: try to find any cell containing the expectedPoints (normalize formatting)
      const anyCell = rewardsTable.locator('tbody td').first();
      await expect(anyCell).toBeVisible({ timeout: 5000 });
      const text = (await anyCell.innerText()).trim();
      const digits = (text.match(/\d[\d,]*/)?.[0] || '').replace(/,/g, '');
      expect(digits).toBe(String(Number(expectedPoints)));
    } else {
      const row = rewardsTable.locator('tbody tr').filter({ has: page.locator(`text=/${cardNamePattern}/i`) }).first();
      await expect(row).toBeVisible({ timeout: 5000 });
      const cell = row.locator('td').nth(rawIdx);
      const rawText = (await cell.innerText()).trim();
      const digits = (rawText.match(/\d[\d,]*/)?.[0] || '').replace(/,/g, '');
      // Compare numeric values (as strings) to avoid formatting differences like commas or suffixes
      expect(digits).toBe(String(Number(expectedPoints)));
    }
  }

  test.describe('Chase Sapphire Preferred - 3x Dining, 2x Airlines', () => {
    test('should earn 300 points on $100 dining transaction at Olive Garden + 5600 from seed and other tests', async ({ authenticatedPage }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await addRewardTransaction(authenticatedPage as Page, 'Chase', 'Olive Garden', '100.00', '5812');
      await validateRewardsEarned(authenticatedPage as Page, 'Chase', '5900');
    });

    test('should earn 100 points on $50 airline transaction at Delta Airlines', async ({ authenticatedPage }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await addRewardTransaction(authenticatedPage as Page, 'Chase', 'Delta Airlines', '50.00', '3003');
      await validateRewardsEarned(authenticatedPage as Page, 'Chase', '6000');
    });
  });

  test.describe('Citi Double Cash - 2% Cashback', () => {
    test('should earn $2.00 cashback on $100 transaction + 2500 from seed and other tests', async ({ authenticatedPage }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await addRewardTransaction(authenticatedPage as Page, 'Citi', 'Target', '100.00', '5411');
      await validateRewardsEarned(authenticatedPage as Page, 'Citi', '2502');
    });
  });

  test.describe('Amex Gold - 4x Dining', () => {
    test('should earn 49800 points on $12450 dining transaction at Chipotle, plus 1108 from seed state and transaction benefits tests', async ({ authenticatedPage }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      await addRewardTransaction(authenticatedPage as Page, 'Amex', 'Chipotle', '12450', '5812');
      await validateRewardsEarned(authenticatedPage as Page, 'Amex', '50908');

    });
  });
});
