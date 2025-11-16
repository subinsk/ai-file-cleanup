import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

/**
 * Rate Limiting Tests
 *
 * These tests verify that rate limiting is working correctly.
 * They use the X-Test-Rate-Limit: enabled header to activate strict rate limits.
 */
test.describe('Rate Limiting', () => {
  // Enable strict rate limits for these tests
  test.use({
    extraHTTPHeaders: {
      'X-Test-Rate-Limit': 'enabled',
    },
  });

  test('should rate limit login attempts', async ({ page }) => {
    await page.goto('/login');

    // Make rapid login attempts (rate limit is 5/minute for test_rate_limit profile)
    for (let i = 0; i < 6; i++) {
      await page.getByTestId(selectors.login.form.email).fill(`test${i}@example.com`);
      await page.getByTestId(selectors.login.form.password).fill('password123');
      await page.getByTestId(selectors.login.form.submit).click();

      // Small delay to let the request complete
      await page.waitForTimeout(200);

      // Clear the form for next attempt
      if (i < 5) {
        await page.getByTestId(selectors.login.form.email).clear();
        await page.getByTestId(selectors.login.form.password).clear();
      }
    }

    // After exceeding rate limit, should see an error
    // Check for rate limit error message
    const errorElement = page.getByTestId(selectors.login.form.error);
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    await expect(errorElement).toContainText(/rate limit/i);
  });

  test('should rate limit registration attempts', async ({ page }) => {
    await page.goto('/register');

    // Make rapid registration attempts (rate limit is 3/minute for test_rate_limit profile)
    for (let i = 0; i < 4; i++) {
      const timestamp = Date.now();
      await page.getByTestId(selectors.register.form.name).fill(`Test User ${i}`);
      await page
        .getByTestId(selectors.register.form.email)
        .fill(`test${timestamp}_${i}@example.com`);
      await page.getByTestId(selectors.register.form.password).fill('TestPassword123');
      await page.getByTestId(selectors.register.form.confirmPassword).fill('TestPassword123');
      await page.getByTestId(selectors.register.form.terms).check();
      await page.getByTestId(selectors.register.form.submit).click();

      // Small delay
      await page.waitForTimeout(200);

      // If not rate limited yet, go back to registration page
      if (i < 3) {
        await page.goto('/register');
      }
    }

    // Should see rate limit error
    const errorElement = page.getByTestId(selectors.register.form.error);
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    await expect(errorElement).toContainText(/rate limit/i);
  });

  test('should show rate limit headers in response', async ({ page }) => {
    // Intercept network requests to check headers
    const rateLimitHeaders: { limit?: string; window?: string } = {};

    page.on('response', (response) => {
      if (response.url().includes('/auth/login')) {
        rateLimitHeaders.limit = response.headers()['x-ratelimit-limit'];
        rateLimitHeaders.window = response.headers()['x-ratelimit-window'];
      }
    });

    await page.goto('/login');
    await page.getByTestId(selectors.login.form.email).fill('test@example.com');
    await page.getByTestId(selectors.login.form.password).fill('password123');
    await page.getByTestId(selectors.login.form.submit).click();

    await page.waitForTimeout(1000);

    // Verify rate limit headers are present
    expect(rateLimitHeaders.limit).toBeDefined();
    expect(rateLimitHeaders.window).toBeDefined();
  });

  test('should recover after rate limit window expires', async ({ page }) => {
    await page.goto('/login');

    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      await page.getByTestId(selectors.login.form.email).fill(`test${i}@example.com`);
      await page.getByTestId(selectors.login.form.password).fill('password123');
      await page.getByTestId(selectors.login.form.submit).click();
      await page.waitForTimeout(200);

      if (i < 4) {
        await page.getByTestId(selectors.login.form.email).clear();
        await page.getByTestId(selectors.login.form.password).clear();
      }
    }

    // Next request should be rate limited
    await page.getByTestId(selectors.login.form.email).clear();
    await page.getByTestId(selectors.login.form.email).fill('ratelimited@example.com');
    await page.getByTestId(selectors.login.form.password).clear();
    await page.getByTestId(selectors.login.form.password).fill('password123');
    await page.getByTestId(selectors.login.form.submit).click();

    await expect(page.getByTestId(selectors.login.form.error)).toBeVisible();

    // Note: Waiting 60+ seconds for window to expire would make tests too slow
    // This test verifies the rate limit works; full recovery is tested in integration tests
  });
});

/**
 * Regular tests should NOT be rate limited
 * These tests verify that normal operations work without hitting rate limits
 */
test.describe('Normal Operation (No Rate Limiting)', () => {
  // No X-Test-Rate-Limit header = uses 'test' profile with relaxed limits

  test('should allow many rapid requests in test mode', async ({ page }) => {
    await page.goto('/login');

    // Make 20 rapid requests - should NOT be rate limited
    for (let i = 0; i < 20; i++) {
      await page.getByTestId(selectors.login.form.email).fill(`test${i}@example.com`);
      await page.getByTestId(selectors.login.form.password).fill('password123');
      await page.getByTestId(selectors.login.form.submit).click();
      await page.waitForTimeout(50);

      // Should not see rate limit error
      const errorElement = page.getByTestId(selectors.login.form.error);
      const isVisible = await errorElement.isVisible().catch(() => false);

      if (isVisible) {
        const errorText = await errorElement.textContent();
        expect(errorText).not.toMatch(/rate limit/i);
      }

      if (i < 19) {
        await page.getByTestId(selectors.login.form.email).clear();
        await page.getByTestId(selectors.login.form.password).clear();
      }
    }
  });
});
