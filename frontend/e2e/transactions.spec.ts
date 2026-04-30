import { test, expect } from './playwright_utils/auth.fixture';
import { supabaseConfig } from './playwright_utils/config';

// Test data for each card type - uses cards created in cards.spec.ts
// We'll search for the card by type keyword and select the first match
const cardTestData = [
  {
    cardTypeKeyword: 'amex',
    merchant: 'Amex Test Merchant',
    amount: '50.00',
    mcc: 'restaurant',
    note: 'Amex test transaction',
  },
  {
    cardTypeKeyword: 'chase',
    merchant: 'Chase Test Merchant',
    amount: '75.50',
    mcc: 'gas',
    note: 'Chase test transaction',
  },
  {
    cardTypeKeyword: 'citi',
    merchant: 'Citi Test Merchant',
    amount: '100.25',
    mcc: 'grocery',
    note: 'Citi test transaction',
  },
];

test.describe('Transactions - Add Transaction for Each Card', () => {
  cardTestData.forEach(({ cardTypeKeyword, merchant, amount, mcc, note }) => {
    test(`should add transaction for ${cardTypeKeyword}`, async ({ authenticatedPage }) => {
      if (!supabaseConfig.url) {
        test.skip();
      }

      // Navigate to new transaction page
      await authenticatedPage.goto('/transactions/new');
      await authenticatedPage.waitForLoadState('networkidle');

      // Select the card from dropdown - the select already has all options loaded
      const cardSelect = authenticatedPage.locator('select').first();
      
      // Select by the text content of the option
      if (cardTypeKeyword === 'amex') {
        await cardSelect.selectOption('My Amex Card ••••5678');
      } else if (cardTypeKeyword === 'chase') {
        await cardSelect.selectOption('My Chase Card ••••4321');
      } else if (cardTypeKeyword === 'citi') {
        await cardSelect.selectOption('My Citi Card ••••8765');
      }
      
      await authenticatedPage.waitForTimeout(300);

      // Fill in transaction date (today)
      const transactionDateInput = authenticatedPage.locator('input[type="date"]').first();
      const today = new Date().toISOString().split('T')[0];
      await transactionDateInput.fill(today);

      // Fill in merchant name
      const merchantInput = authenticatedPage.locator('input[placeholder*="e.g. Chipotle"]');
      await merchantInput.fill(merchant);

      // Search and select MCC category
      const mccInput = authenticatedPage.locator('input[placeholder*="Search by MCC code"]');
      await mccInput.fill(mcc);
      await authenticatedPage.waitForTimeout(600); // Wait for MCC search results to appear

      // Wait for and click the first MCC result item (li element in the dropdown)
      const mccResultItem = authenticatedPage.locator('li').first();
      try {
        await mccResultItem.click({ timeout: 5000 });
      } catch (e) {
        // If li doesn't exist, try clicking any visible element with the MCC keyword
        const anyMccResult = authenticatedPage.locator(`text="${mcc}"`).first();
        await anyMccResult.click();
      }
      await authenticatedPage.waitForTimeout(300);

      // Fill in amount
      const amountInput = authenticatedPage.locator('input[type="number"]').first();
      await amountInput.fill(amount);

      // Fill in note if available
      const noteInput = authenticatedPage.locator('textarea');
      if (await noteInput.isVisible()) {
        await noteInput.fill(note);
      }

      // Submit transaction
      const submitButton = authenticatedPage.locator('button').filter({ hasText: 'Add Transaction' }).first();
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();

      // Wait for navigation back to transactions page
      await authenticatedPage.waitForURL('/transactions', { timeout: 10000 });
      await authenticatedPage.waitForLoadState('networkidle');

      // Validate transaction appears in table - check merchant
      const transactionTable = authenticatedPage.locator('table.CardDashboardTable');
      await expect(transactionTable).toBeVisible({ timeout: 5000 });

      // Validate merchant is displayed in transaction row
      const merchantCell = transactionTable.locator(`text="${merchant}"`).first();
      await expect(merchantCell).toBeVisible({ timeout: 5000 });

      // Validate amount is displayed in transaction row (as currency format)
      const formattedAmount = `$${parseFloat(amount).toFixed(2)}`;
      const amountCell = transactionTable.locator(`text="${formattedAmount}"`);
      await expect(amountCell.first()).toBeVisible({ timeout: 5000 });

      // Validate card is displayed in transaction row - look for the card type in uppercase (Amex, Chase, Citi)
      const cardTypeUppercase = cardTypeKeyword.charAt(0).toUpperCase() + cardTypeKeyword.slice(1);
      const cardCell = transactionTable.locator(`text=/${cardTypeUppercase}/`);
      await expect(cardCell.first()).toBeVisible({ timeout: 5000 });
    });
  });
});
