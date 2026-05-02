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

  test('should validate cards page UI elements', async ({ authenticatedPage }) => {
    // Check that the page title is visible
    const title = authenticatedPage.locator('h1');
    await expect(title).toContainText('Your Cards');

    // Check that the Add Card button is visible
    const addButton = authenticatedPage.locator('button').filter({ hasText: 'Add Card' }).first();
    await expect(addButton).toBeVisible();

    // Check if empty state message is visible OR card grid is visible
    const emptyState = authenticatedPage.locator('text=No cards added yet');
    const cardGrid = authenticatedPage.locator('[class*="CardGrid"]');
    
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const cardGridVisible = await cardGrid.isVisible().catch(() => false);
    
    // Either empty state or card grid should be visible
    expect(emptyStateVisible || cardGridVisible).toBeTruthy();

    // Test opening the modal
    await addButton.click();
    const modalTitle = authenticatedPage.locator('h2', { hasText: /Add a Card|Edit Card/ });
    await expect(modalTitle).toBeVisible();

    // Test that step 1 content is visible
    const step1Content = authenticatedPage.locator('h3', { hasText: 'Select a card type' });
    await expect(step1Content).toBeVisible({ timeout: 5000 });

    // Test closing the modal
    const overlay = authenticatedPage.locator('[class*="Overlay"]');
    const closeButton = authenticatedPage.locator('button[aria-label="Close add card modal"]');
    await closeButton.click();

    // Modal should not be visible
    await expect(overlay).not.toBeVisible();
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

test.describe('Add Chase Card', () => {
  test('(Add Chase) login > navigate to cards > add Chase card with information filled out', async ({ authenticatedPage }) => {
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

    // Step 1: Select Chase Card Type
    // Wait for card types to load and find the Chase option
    const cardTypeOptions = authenticatedPage.locator('button').filter({ hasText: /Chase/i });
    await expect(cardTypeOptions.first()).toBeVisible({ timeout: 10000 });
    
    // Click the Chase card option
    await cardTypeOptions.first().click();

    // Verify the card type is selected (should have selected state)
    await expect(cardTypeOptions.first()).toHaveClass(/.*Selected.*/);

    // Step 2 should auto-expand after selecting a card type
    // Wait for form inputs to appear - check for the "Last 4 Digits" label as a marker that step 2 is ready
    await expect(authenticatedPage.locator('text=Last 4 Digits')).toBeVisible({ timeout: 5000 });

    // Now fill in the form fields
    // Fill in Card Nickname (optional) - first text input in the form
    const nicknameInput = authenticatedPage.locator('input[type="text"]').first();
    await nicknameInput.fill('My Chase Card');

    // Fill in Last 4 Digits (required) - input with placeholder "1234"
    const last4Input = authenticatedPage.locator('input[placeholder="1234"]');
    await last4Input.fill('4321');

    // Fill in Open Date (required) - first date input
    const openDateInput = authenticatedPage.locator('input[type="date"]').first();
    await openDateInput.fill('2022-06-10');

    // Fill in Expiration Date (required) - second date input
    const expirationDateInput = authenticatedPage.locator('input[type="date"]').nth(1);
    await expirationDateInput.fill('2026-05-31');

    // Fill in Statement Closing Date (required - must be between 1-31)
    const statementClosingSelect = authenticatedPage.locator('select').first();
    await statementClosingSelect.selectOption('20');

    // Step 3: Auto-expands when step 2 is complete
    // Wait for step 3 to expand by checking for the "Current Rewards Balance" label
    await expect(authenticatedPage.locator('text=Current Rewards Balance')).toBeVisible({ timeout: 5000 });

    // Now find and fill the rewards balance input by looking for the input within the expanded section
    // Use a more specific approach: find the input that appears after "Current Rewards Balance" label
    const rewardsInput = authenticatedPage.locator('label:has-text("Current Rewards Balance")').locator('..').locator('input[type="number"]');
    await rewardsInput.fill('5000');

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
    const chaseCardInGrid = authenticatedPage.locator('text=/My Chase Card|Chase/i');
    
    const cardGridVisible = await cardGrid.isVisible().catch(() => false);
    const chaseCardVisible = await chaseCardInGrid.isVisible().catch(() => false);
    
    // At least one should be true (either the grid is visible or the new card is visible)
    expect(cardGridVisible || chaseCardVisible).toBeTruthy();
  });
});

test.describe('Add Citi Card', () => {
  test('(Add Citi) login > navigate to cards > add Citi card with information filled out', async ({ authenticatedPage }) => {
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

    // Step 1: Select Citi Card Type
    // Wait for card types to load and find the Citi option
    const cardTypeOptions = authenticatedPage.locator('button').filter({ hasText: /Citi|Citibank/i });
    await expect(cardTypeOptions.first()).toBeVisible({ timeout: 10000 });
    
    // Click the Citi card option
    await cardTypeOptions.first().click();

    // Verify the card type is selected (should have selected state)
    await expect(cardTypeOptions.first()).toHaveClass(/.*Selected.*/);

    // Step 2 should auto-expand after selecting a card type
    // Wait for form inputs to appear - check for the "Last 4 Digits" label as a marker that step 2 is ready
    await expect(authenticatedPage.locator('text=Last 4 Digits')).toBeVisible({ timeout: 5000 });

    // Now fill in the form fields
    // Fill in Card Nickname (optional) - first text input in the form
    const nicknameInput = authenticatedPage.locator('input[type="text"]').first();
    await nicknameInput.fill('My Citi Card');

    // Fill in Last 4 Digits (required) - input with placeholder "1234"
    const last4Input = authenticatedPage.locator('input[placeholder="1234"]');
    await last4Input.fill('8765');

    // Fill in Open Date (required) - first date input
    const openDateInput = authenticatedPage.locator('input[type="date"]').first();
    await openDateInput.fill('2021-03-20');

    // Fill in Expiration Date (required) - second date input
    const expirationDateInput = authenticatedPage.locator('input[type="date"]').nth(1);
    await expirationDateInput.fill('2025-02-28');

    // Fill in Statement Closing Date (required - must be between 1-31)
    const statementClosingSelect = authenticatedPage.locator('select').first();
    await statementClosingSelect.selectOption('10');

    // Step 3: Auto-expands when step 2 is complete
    // Wait for step 3 to expand by checking for the "Current Rewards Balance" label
    await expect(authenticatedPage.locator('text=Current Rewards Balance')).toBeVisible({ timeout: 5000 });

    // Now find and fill the rewards balance input by looking for the input within the expanded section
    // Use a more specific approach: find the input that appears after "Current Rewards Balance" label
    const rewardsInput = authenticatedPage.locator('label:has-text("Current Rewards Balance")').locator('..').locator('input[type="number"]');
    await rewardsInput.fill('2500');

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
    const citiCardInGrid = authenticatedPage.locator('text=/My Citi Card|Citi/i');
    
    const cardGridVisible = await cardGrid.isVisible().catch(() => false);
    const citiCardVisible = await citiCardInGrid.isVisible().catch(() => false);
    
    // At least one should be true (either the grid is visible or the new card is visible)
    expect(cardGridVisible || citiCardVisible).toBeTruthy();
  });
});
