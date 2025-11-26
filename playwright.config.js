// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * LOGIC:
 * 1. If running in CI (GitHub Actions), use the Vercel Preview URL passed in via env vars.
 * 2. If running locally, default to http://localhost:3000.
 */
const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: baseURL,

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  /* ONLY run this locally. In CI, we use the Vercel URL directly. */
  webServer: isCI ? undefined : {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000, // Increased timeout for Next 16/React 19 cold starts
  },
});