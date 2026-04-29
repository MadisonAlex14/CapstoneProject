import { test, expect } from './playwright_utils/auth.fixture';
import { supabaseConfig } from './playwright_utils/config';

test.describe('Cards Page', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Verify Supabase is configured
    if (!supabaseConfig.url) {
      test.skip();
    }
    
    // Navigate to the cards page
    await authenticatedPage.goto('/cards');
    
    // Wait for the page to load
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display the cards page header', async ({ authenticatedPage }) => {
    // Check that the page title is visible
    const title = authenticatedPage.locator('h1');
    await expect(title).toContainText('Your Cards');
  });

  test('should display "Add Card" button', async ({ authenticatedPage }) => {
    // Look for the Add Card button - use first() to get the first one in the header
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await expect(addButton).toBeVisible();
  });

  test('should open the add card modal when clicking Add Card', async ({ authenticatedPage }) => {
    // Click the Add Card button in the header (first button)
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await addButton.click();

    // Check that the modal is displayed
    const modalTitle = authenticatedPage.locator('h2', { hasText: /Add a Card|Edit Card/ });
    await expect(modalTitle).toBeVisible();
  });

  test('should close the modal when clicking the close button', async ({ authenticatedPage }) => {
    // Open the modal
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await addButton.click();

    // Wait for modal to appear - use the overlay div which is the parent
    const overlay = authenticatedPage.locator('[class*="Overlay"]');
    await expect(overlay).toBeVisible();

    // Click the close button (the × button with aria-label)
    const closeButton = authenticatedPage.locator('button[aria-label="Close add card modal"]');
    await closeButton.click();

    // Modal should not be visible
    await expect(overlay).not.toBeVisible();
  });
});

test.describe('Card Form Navigation', () => {
  test('should navigate through form steps', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/cards');
    await authenticatedPage.waitForLoadState('networkidle');

    // Open the add card modal
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await addButton.click();

    // Wait for modal overlay to appear
    const overlay = authenticatedPage.locator('[class*="Overlay"]');
    await expect(overlay).toBeVisible();

    // Check that step 1 content is visible (card type selection)
    const step1Content = authenticatedPage.locator('h3', { hasText: 'Select a card type' });
    await expect(step1Content).toBeVisible({ timeout: 5000 });

    // Check that the modal title is shown
    const modalTitle = authenticatedPage.locator('h2', { hasText: /Add a Card|Edit Card/ });
    await expect(modalTitle).toBeVisible();
  });
});

test.describe('Empty State', () => {
  test('should handle empty and populated states', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/cards');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if empty state message is visible OR card grid is visible
    // If user has no cards: empty state message should be visible
    const emptyState = authenticatedPage.locator('text=No cards added yet');
    const cardGrid = authenticatedPage.locator('[class*="CardGrid"]');
    
    // At least one of these should exist
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const cardGridVisible = await cardGrid.isVisible().catch(() => false);
    
    // Either empty state or card grid should be visible
    expect(emptyStateVisible || cardGridVisible).toBeTruthy();
  });
});

test.describe('Add Amex Card', () => {
  test('(Add Amex Card) login > navigate to cards > add Amex card with information filled out', async ({ authenticatedPage }) => {
    // Navigate to the cards page
    await authenticatedPage.goto('/cards');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click the Add Card button to open the modal
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for the modal to appear
    const modal = authenticatedPage.locator('[class*="Modal"]').first();
    await expect(modal).toBeVisible();

    // Verify the modal title is "Add a Card"
    const modalTitle = authenticatedPage.locator('h2', { hasText: 'Add a Card' });
    await expect(modalTitle).toBeVisible();

    // Step 1: Select Amex Card Type
    // Wait for card types to load and find the Amex option
    const cardTypeOptions = authenticatedPage.locator('button').filter({ hasText: /Amex|American Express/i });
    await expect(cardTypeOptions.first()).toBeVisible({ timeout: 10000 });
    
    // Click the Amex card option
    await cardTypeOptions.first().click();

    // Verify the card type is selected (should have selected state)
    await expect(cardTypeOptions.first()).toHaveClass(/.*Selected.*/);

    // Step 2 should auto-expand after selecting a card type
    // Wait for form inputs to appear - check for the "Last 4 Digits" label as a marker that step 2 is ready
    await expect(authenticatedPage.locator('text=Last 4 Digits')).toBeVisible({ timeout: 5000 });

    // Now fill in the form fields
    // Fill in Card Nickname (optional) - first text input in the form
    const nicknameInput = authenticatedPage.locator('input[type="text"]').first();
    await nicknameInput.fill('My Amex Card');

    // Fill in Last 4 Digits (required) - input with placeholder "1234"
    const last4Input = authenticatedPage.locator('input[placeholder="1234"]');
    await last4Input.fill('5678');

    // Fill in Open Date (required) - first date input
    const openDateInput = authenticatedPage.locator('input[type="date"]').first();
    await openDateInput.fill('2023-01-15');

    // Fill in Expiration Date (required) - second date input
    const expirationDateInput = authenticatedPage.locator('input[type="date"]').nth(1);
    await expirationDateInput.fill('2027-12-31');

    // Fill in Statement Closing Date (required - must be between 1-31)
    const statementClosingSelect = authenticatedPage.locator('select').first();
    await statementClosingSelect.selectOption('15');

    // Step 3: Auto-expands when step 2 is complete
    // Wait for step 3 to expand by checking for the "Current Rewards Balance" label
    await expect(authenticatedPage.locator('text=Current Rewards Balance')).toBeVisible({ timeout: 5000 });

    // Now find and fill the rewards balance input by looking for the input within the expanded section
    // Use a more specific approach: find the input that appears after "Current Rewards Balance" label
    const rewardsInput = authenticatedPage.locator('label:has-text("Current Rewards Balance")').locator('..').locator('input[type="number"]');
    await rewardsInput.fill('1000');

    // Submit the form by clicking the "Save Card" button
    const saveButton = authenticatedPage.locator('button:has-text("Save Card")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for the modal to close and verify success
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify the card was added by checking if the page shows the card or empty state is gone
    // Wait for network to idle after form submission
    await authenticatedPage.waitForLoadState('networkidle');

    // Check that either:
    // 1. The newly added card is visible, or
    // 2. The empty state is no longer visible (indicating a card was added)
    const cardGrid = authenticatedPage.locator('[class*="CardGrid"]');
    const amexCardInGrid = authenticatedPage.locator('text=/My Amex Card|Amex|American Express/i');
    
    const cardGridVisible = await cardGrid.isVisible().catch(() => false);
    const amexCardVisible = await amexCardInGrid.isVisible().catch(() => false);
    
    // At least one should be true (either the grid is visible or the new card is visible)
    expect(cardGridVisible || amexCardVisible).toBeTruthy();
  });
});
