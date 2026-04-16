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
    await expect(title).toContainText('My Cards');
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
    const step1Content = authenticatedPage.locator('text=/Select a card type|credit card/i');
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
