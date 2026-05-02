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

Open the example environment file and fill in your credentials, then change the file name to .env.local.

You'll need to add the following values:

- TEST_USER_EMAIL
- TEST_USER_PASSWORD

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
npm run test:e2e:headed
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