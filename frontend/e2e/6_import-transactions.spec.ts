import { test, expect } from './playwright_utils/auth.fixture';
import path from 'path';
import { supabaseConfig } from './playwright_utils/config';

// Imports a CSV and verifies imported merchants appear in transactions table
test('Import transactions CSV and verify rows (Amazon, Starbucks, Shell)', async ({ authenticatedPage }) => {
  if (!supabaseConfig.url) {
    test.skip();
  }

  const page = authenticatedPage;

  // Navigate to transactions page and open import flow
  await page.goto('/transactions');
  await page.waitForLoadState('networkidle');

  // Click Import Transactions button
  const importBtn = page.locator('button').filter({ hasText: /Import Transactions|Import/i }).first();
  await importBtn.click();

  // Wait for import page
  await page.waitForURL(/\/transactions\/import/, { timeout: 5000 });

  // Wait for cards to load and click Next to go to upload step
  const nextBtn = page.locator('button').filter({ hasText: /^Next$/i }).first();
  await expect(nextBtn).toBeVisible({ timeout: 5000 });
  // ensure a card is selected (Next is disabled if no card)
  // If Next is disabled, try to select the first available option
  if (await nextBtn.isDisabled()) {
    const select = page.locator('select').first();
    if (await select.count() > 0) {
      const options = select.locator('option');
      if ((await options.count()) > 1) {
        // select second option if first is placeholder
        const opt = options.nth(1);
        const val = await opt.getAttribute('value');
        if (val) await select.selectOption(val);
      } else if ((await options.count()) === 1) {
        const val = await options.nth(0).getAttribute('value');
        if (val) await select.selectOption(val);
      }
    }
  }

  await nextBtn.click();

  // Upload CSV file using the hidden input (it's hidden in the UI; setInputFiles works even if hidden)
  const fileInput = page.locator('#import-file');
  await fileInput.waitFor({ state: 'attached', timeout: 5000 });

  // Path relative to the test runner CWD (frontend folder)
  const csvPath = path.join(process.cwd(), 'e2e', 'playwright_utils', 'transactions-import-test.csv');
  await fileInput.setInputFiles(csvPath);

  // After upload the page should move to preview (step 3)
  await page.waitForSelector('table.CardDashboardTable, table');

  // Click the Import N Transactions button
  const importConfirmBtn = page.locator('button').filter({ hasText: /Import\s+\d+\s+Transaction/i }).first();
  if (await importConfirmBtn.count() === 0) {
    // fallback: find primary button with Import text
    await page.locator('button').filter({ hasText: /Import/i }).first().click();
  } else {
    await importConfirmBtn.click();
  }

  // Wait for navigation back to transactions
  await page.waitForURL('/transactions', { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  // Validate that imported merchants appear in the transactions table
  const table = page.locator('table.CardDashboardTable');
  await expect(table).toBeVisible({ timeout: 5000 });

  const merchants = ['Amazon', 'Starbucks', 'Shell'];
  // Helper to go to first page (click Previous until disabled)
  const goToFirstPage = async () => {
    for (let i = 0; i < 10; i++) {
      const prev = page.locator('button').filter({ hasText: /^Previous$/i }).first();
      if (!(await prev.count())) break;
      if (await prev.isDisabled()) break;
      await prev.click();
      await page.waitForTimeout(300);
    }
  };

  // Helper to find a merchant across pages (click Next until found or exhausted)
  const findMerchantAcrossPages = async (merchantName: string) => {
    // Start from first page for predictable search
    await goToFirstPage();
    for (let p = 0; p < 10; p++) {
      const cell = table.locator(`text=${merchantName}`).first();
      if (await cell.count() > 0) {
        await expect(cell).toBeVisible({ timeout: 5000 });
        return;
      }

      const next = page.locator('button').filter({ hasText: /^Next$/i }).first();
      if (!(await next.count())) break;
      if (await next.isDisabled()) break;
      await next.click();
      await page.waitForTimeout(500);
    }
    // If we get here the merchant wasn't found
    throw new Error(`Imported merchant "${merchantName}" not found in transactions table after paging.`);
  };

  for (const m of merchants) {
    await findMerchantAcrossPages(m);
  }
});
