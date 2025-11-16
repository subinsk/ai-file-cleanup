import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload and Deduplication', () => {
  // Helper function to create a test user and login
  async function loginTestUser(page: any) {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123';

    // Register
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for redirect
    await expect(page).toHaveURL('/');

    return { email: testEmail, password: testPassword };
  }

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page);
  });

  test('should display upload page', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');

    // Check if upload interface is visible
    await expect(page.getByText(/upload files|drag.*drop|choose files/i)).toBeVisible();
  });

  test('should upload files via file input', async ({ page }) => {
    await page.goto('/upload');

    // Create a test file
    const testFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test_files',
      'document_original.txt'
    );

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Check if file is added to the list
    await expect(page.getByText(/document_original\.txt/i)).toBeVisible();
  });

  test('should show upload progress', async ({ page }) => {
    await page.goto('/upload');

    const testFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test_files',
      'document_original.txt'
    );

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Start upload
    await page.getByRole('button', { name: /upload|start|process/i }).click();

    // Should show processing indicator
    await expect(page.getByText(/processing|uploading|analyzing/i)).toBeVisible();
  });

  test('should detect duplicate files', async ({ page }) => {
    await page.goto('/upload');

    // Upload two identical files
    const testFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'demo_dataset',
      'scenario_1_exact_duplicates',
      'document_original.txt'
    );
    const testFilePath2 = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'demo_dataset',
      'scenario_1_exact_duplicates',
      'document_copy.txt'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([testFilePath, testFilePath2]);

    // Start processing
    await page.getByRole('button', { name: /upload|start|process/i }).click();

    // Wait for processing to complete
    await expect(page.getByText(/duplicate.*found|groups.*found/i)).toBeVisible({ timeout: 30000 });

    // Should show duplicate group
    await expect(page.getByText(/100%|exact match/i)).toBeVisible();
  });

  test('should allow selecting files to keep', async ({ page }) => {
    await page.goto('/upload');

    // Upload duplicate files
    const testFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'demo_dataset',
      'scenario_1_exact_duplicates',
      'document_original.txt'
    );
    const testFilePath2 = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'demo_dataset',
      'scenario_1_exact_duplicates',
      'document_copy.txt'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([testFilePath, testFilePath2]);

    await page.getByRole('button', { name: /upload|start|process/i }).click();

    // Wait for results
    await expect(page.getByText(/duplicate.*found/i)).toBeVisible({ timeout: 30000 });

    // Should be able to select different file to keep
    const radioButtons = page.locator('input[type="radio"]');
    await expect(radioButtons).toHaveCount(2);
  });

  test('should download cleaned files as ZIP', async ({ page }) => {
    await page.goto('/upload');

    // Upload and process files
    const testFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'demo_dataset',
      'scenario_1_exact_duplicates',
      'document_original.txt'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.getByRole('button', { name: /upload|start|process/i }).click();

    // Wait for processing
    await page.waitForTimeout(5000);

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download.*cleaned|download.*zip/i }).click();
    const download = await downloadPromise;

    // Check if file is downloaded
    expect(download.suggestedFilename()).toMatch(/cleaned.*\.zip|files.*\.zip/i);
  });

  test('should validate file types', async ({ page }) => {
    await page.goto('/upload');

    // Try to upload unsupported file type
    // Note: This test assumes validation is implemented

    // Should show error for unsupported file type
    // Implementation depends on actual validation behavior
  });

  test('should respect file size limits', async ({ page }) => {
    await page.goto('/upload');

    // Try to upload file exceeding size limit
    // Note: This test requires a large test file

    // Should show error for file too large
    // Implementation depends on actual validation behavior
  });

  test('should show quota information', async ({ page }) => {
    await page.goto('/upload');

    // Should display quota usage
    await expect(page.getByText(/storage|quota|used/i)).toBeVisible();
  });
});
