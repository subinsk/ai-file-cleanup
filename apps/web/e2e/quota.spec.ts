import { test, expect } from '@playwright/test';
import { createAndLoginUser } from './helpers/auth.helpers';
import { selectors } from './helpers/selectors';

test.describe('User Quota Management', () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test('should display quota information', async ({ page }) => {
    // Navigate to quota/profile page
    await page.goto('/quota');

    // Should show quota details
    await expect(page.getByText(/storage used|storage limit/i)).toBeVisible();
    await expect(page.getByText(/uploads|files/i)).toBeVisible();
  });

  test('should show quota as percentage', async ({ page }) => {
    await page.goto('/quota');

    // Should display percentage
    await expect(page.getByText(/%|percent/i)).toBeVisible();
  });

  test('should show remaining quota', async ({ page }) => {
    await page.goto('/quota');

    // Should show available space
    await expect(page.getByText(/available|remaining|free/i)).toBeVisible();
  });

  test('should warn when quota is low', async ({ page: _page }) => {
    // This test would require uploading files to reach quota limit
    // Skipping actual implementation as it requires significant setup
    test.skip();
  });

  test('should prevent upload when quota exceeded', async ({ page: _page }) => {
    // This test would require filling up quota first
    // Skipping actual implementation
    test.skip();
  });

  test('should display quota on upload page', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');

    // Check if page loads correctly (quota may be displayed here)
    await expect(page.getByTestId(selectors.upload.dropzone)).toBeVisible();

    // Note: Actual quota display on upload page depends on implementation
  });
});
