import { test, expect } from './playwright_utils/auth.fixture';

test.describe('Delete all cards', () => {
  test('login > navigate to cards > delete every card if present', async ({ authenticatedPage }) => {
    // Navigate to the cards page
    await authenticatedPage.goto('/cards');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(5000);

    const cardGrid = authenticatedPage.locator('[class*="CardGrid"]');

    // If there's an explicit empty state, nothing to do
    // const emptyState = authenticatedPage.locator('text=No cards added yet');
    // if (await emptyState.isVisible().catch(() => false)) {
    //   test.info().annotations.push({ type: 'info', description: 'No cards found - nothing to delete' });
    //   return;
    // }

    // If card grid isn't present, still try to find delete buttons on the page
    const scope = (await cardGrid.isVisible().catch(() => false)) ? cardGrid : authenticatedPage;

    // Loop and delete visible cards by opening each card's menu and clicking the Delete action.
    // The UI uses a per-card menu (⋯) that reveals the Delete button; deletion shows a browser confirm dialog.
    const maxDeletes = 50;
    let deletes = 0;

    // Helper to get current visible card boxes
    const getCardBoxes = () => authenticatedPage.locator('[class*="CardGrid"] > div').filter({ has: authenticatedPage.locator('h2') });

    while (deletes < maxDeletes) {
      const boxes = getCardBoxes();
      const boxCount = await boxes.count();
      if (!boxCount) break;

      // Operate on the first visible card box each iteration
      const box = boxes.first();

      // Open the per-card menu (button with aria-label starting with "Open menu for")
      const menuButton = box.locator('button[aria-label^="Open menu for"]').first();
      // Capture identifying info for this card so we can assert it's removed after deletion
      const cardName = (await box.locator('h2').first().innerText()).trim().replace(/\s+/g, ' ');
      const last4Raw = (await box.locator('[class*="CardNumber"]').first().innerText().catch(() => '')).trim();
      const last4Match = last4Raw.match(/\d{2,4}/);
      const last4 = last4Match ? last4Match[0] : '';
      if (await menuButton.count()) {
        await menuButton.click();

        // Wait for the dropdown to appear and click the Delete action inside this card box
        const deleteAction = box.locator('button', { hasText: 'Delete' }).first();

        // Handle confirm dialog that the app uses (window.confirm)
        authenticatedPage.once('dialog', async (dialog) => {
          await dialog.accept();
        });

        if (await deleteAction.count()) {
          await deleteAction.click();
        } else {
          // If no Delete action is present, close menu and break
          await authenticatedPage.keyboard.press('Escape');
          break;
        }

        // Wait for UI to reflect deletion
        // Wait until the deleted card's identifying text is removed from the DOM
        if (last4) {
          await authenticatedPage.waitForSelector(`text=${last4}`, { state: 'detached', timeout: 5000 }).catch(() => {});
          // also ensure no card name remains
          await authenticatedPage.waitForSelector(`text=${cardName}`, { state: 'detached', timeout: 5000 }).catch(() => {});
        } else {
          await authenticatedPage.waitForSelector(`text=${cardName}`, { state: 'detached', timeout: 5000 }).catch(() => {});
        }

        await authenticatedPage.waitForLoadState('networkidle');
        await authenticatedPage.waitForTimeout(300);
        deletes += 1;
        continue;
      }

      // If no menu button found, try a fallback: look for any Delete button on the page
      const fallbackDelete = authenticatedPage.locator('button', { hasText: 'Delete' }).first();
      if (await fallbackDelete.count()) {
        authenticatedPage.once('dialog', async (dialog) => await dialog.accept());
        await fallbackDelete.click();
        await authenticatedPage.waitForLoadState('networkidle');
        await authenticatedPage.waitForTimeout(300);
        deletes += 1;
        continue;
      }

      break;
    }

    // Final assertion: ensure there are no card boxes left OR the empty state is shown.
    const emptyStateVisible = await authenticatedPage.locator('text=No cards added yet').isVisible().catch(() => false);
    if (emptyStateVisible) {
      expect(emptyStateVisible).toBe(true);
    } else {
      // Count card boxes directly (each card renders as a child div of CardGrid)
      const remainingCards = await authenticatedPage.locator('[class*="CardGrid"] > div').count();
      expect(remainingCards).toBe(0);
    }
  });
});
