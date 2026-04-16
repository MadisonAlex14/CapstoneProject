# E2E Testing with Playwright

This folder contains end-to-end tests for the CapstoneProject frontend using Playwright.

## Setup

### 1. Install Playwright and dependencies

```bash
npm install
```

This will install `@playwright/test` and `dotenv` which are needed for environment variable loading.

### 2. Install browsers

```bash
npx playwright install
```

### 3. Configure environment variables

Open the example environment file and fill in your credentials, then change the file name to .env.local

**Note:** The `.env.local` file at the root of the frontend directory will be automatically loaded by:
- The Next.js dev server
- Playwright tests (via `dotenv` package)

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests for a specific file
```bash
npx playwright test e2e/cards.spec.ts
```

### Run tests in a specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests with headed browser (see the browser)
```bash
npx playwright test --headed
```

## View Test Report

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Test Structure

- `cards.spec.ts` - Tests for the cards page functionality
- `*.spec.ts` - Other test files follow the naming convention

## Using Environment Variables in Tests

The `config.ts` file provides helper functions to access environment variables:

```typescript
import { supabaseConfig, testUserCredentials, getEnvVar } from './config';

test('example with environment variables', async ({ page }) => {
  // Access Supabase config
  console.log('Supabase URL:', supabaseConfig.url);
  console.log('Has Anon Key:', !!supabaseConfig.anonKey);
  
  // Access test credentials
  console.log('Test Email:', testUserCredentials.email);
  
  // Get any custom environment variable
  const customVar = getEnvVar('CUSTOM_VAR', 'default-value');
});
```

Available environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `TEST_USER_EMAIL` - Optional test user email for authentication tests
- `TEST_USER_PASSWORD` - Optional test user password
- `TEST_API_TOKEN` - Optional API token for backend testing

## Key Commands in Tests

Common Playwright commands used in these tests:

- `page.goto(url)` - Navigate to a URL
- `page.locator(selector)` - Find elements on the page
- `expect(element).toBeVisible()` - Assert element is visible
- `expect(element).toContainText(text)` - Assert element contains text
- `element.click()` - Click an element
- `page.fill(selector, text)` - Fill in a text input

## Configuration

Test configuration is defined in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Test directory: `./e2e`
- Browsers: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Auto-start dev server on test run

## What to make your tests do
- These are meant to be a combination of smoke tests and end to end tests.
- Smoke Tests
  - short tests for crucial components to validate functionality (i.e. login.spec.ts just checks that login is working right)
- e2e Tests
  - testing an entire path of user actions. i.e. as a user I login, go to cards page, validate my cards load, add a card, edit the card, and delete the card...