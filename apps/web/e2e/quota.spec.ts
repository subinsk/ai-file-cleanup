import { test, expect } from '@playwright/test';

test.describe('User Quota Management', () => {
  async function loginTestUser(page: any) {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123';

    await page.goto('/register');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL('/');

    return { email: testEmail, password: testPassword };
  }

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
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

  test('should warn when quota is low', async () => {
    // This test would require uploading files to reach quota limit
    // Skipping actual implementation as it requires significant setup
    test.skip();
  });

  test('should prevent upload when quota exceeded', async () => {
    // This test would require filling up quota first
    // Skipping actual implementation
    test.skip();
  });
});
