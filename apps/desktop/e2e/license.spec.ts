import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';

test.describe('Desktop App - License Activation', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Get first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should display license activation screen on first launch', async () => {
    // Check if license activation screen is visible
    await expect(window.locator('text=License Activation')).toBeVisible();
    await expect(window.locator('input[placeholder*="license" i]')).toBeVisible();
    await expect(window.locator('button:has-text("Activate")')).toBeVisible();
  });

  test('should validate license key format', async () => {
    // Try invalid license key
    await window.fill('input[placeholder*="license" i]', 'invalid-key');
    await window.click('button:has-text("Activate")');

    // Should show validation error
    await expect(window.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should activate with valid license key', async () => {
    // Mock API call or use test license key
    const testLicenseKey = 'test-valid-license-key-12345';

    // Fill in license key
    await window.fill('input[placeholder*="license" i]', testLicenseKey);
    await window.click('button:has-text("Activate")');

    // Wait for activation
    await window.waitForTimeout(2000);

    // Should show success message or redirect to main screen
    const activated = await window.locator('text=/activated|success|welcome/i').isVisible();
    expect(activated).toBeTruthy();
  });

  test('should remember license key on restart', async () => {
    // Activate with valid key
    const testLicenseKey = 'test-valid-license-key-12345';
    await window.fill('input[placeholder*="license" i]', testLicenseKey);
    await window.click('button:has-text("Activate")');

    // Close and reopen
    await electronApp.close();

    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();

    // Should not show license activation screen
    const hasLicenseScreen = await window
      .locator('text=License Activation')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasLicenseScreen).toBeFalsy();
  });
});

test.describe('Desktop App - File Scanning', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    // Launch with activated license (mock)
    electronApp = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MOCK_LICENSE: 'activated',
      },
    });

    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should allow selecting directory for scanning', async () => {
    // Click select directory button
    await window.click('button:has-text("Select Directory")');

    // Note: File dialog interaction is tricky in Electron tests
    // May need to mock or use test directory path directly
  });

  test('should scan directory and list files', async () => {
    // Assuming we can set test directory programmatically
    // or via IPC communication

    // Trigger scan
    await window.click('button:has-text("Scan")');

    // Wait for scanning to complete
    await window.waitForSelector('text=/found|files|scanning complete/i', { timeout: 10000 });

    // Should display file list
    const fileList = window.locator('[data-testid="file-list"]');
    await expect(fileList).toBeVisible();
  });

  test('should find duplicate files', async () => {
    // Set test directory with known duplicates
    // Trigger scan and duplicate detection

    await window.click('button:has-text("Find Duplicates")');

    // Wait for processing
    await window.waitForSelector('text=/duplicates found|groups/i', { timeout: 15000 });

    // Should show duplicate groups
    const duplicateGroups = window.locator('[data-testid="duplicate-group"]');
    const count = await duplicateGroups.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow selecting files to keep', async () => {
    // After finding duplicates
    // Check if radio buttons or checkboxes are available

    const selectors = window.locator('input[type="radio"], input[type="checkbox"]');
    const count = await selectors.count();
    expect(count).toBeGreaterThan(0);

    // Select a file
    await selectors.first().click();
    await expect(selectors.first()).toBeChecked();
  });

  test('should move duplicates to trash', async () => {
    // After selecting files to keep
    await window.click('button:has-text("Move to Trash")');

    // Confirm action
    await window.click('button:has-text("Confirm")');

    // Wait for operation
    await window.waitForSelector('text=/moved|success|completed/i', { timeout: 10000 });

    // Should show success message
    await expect(window.locator('text=/moved to trash|success/i')).toBeVisible();
  });

  test('should display space savings', async () => {
    // After processing duplicates
    const spaceSavings = window.locator('text=/saved|freed|MB|GB/i');
    await expect(spaceSavings).toBeVisible();
  });
});

test.describe('Desktop App - Settings', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should open settings menu', async () => {
    // Click settings icon/menu
    await window
      .click('[data-testid="settings-button"]')
      .catch(() => window.click('button:has-text("Settings")'));

    // Should show settings panel
    await expect(window.locator('text=/settings|preferences/i')).toBeVisible();
  });

  test('should allow changing API endpoint', async () => {
    // Open settings
    await window.click('button:has-text("Settings")');

    // Find API URL input
    const apiInput = window.locator('input[name="api-url"], input[placeholder*="API"]');
    await apiInput.fill('http://localhost:3001');

    // Save settings
    await window.click('button:has-text("Save")');

    // Should show success
    await expect(window.locator('text=/saved|success/i')).toBeVisible();
  });

  test('should allow changing similarity threshold', async () => {
    await window.click('button:has-text("Settings")');

    // Find similarity slider or input
    const slider = window.locator('input[type="range"], input[name="similarity"]');
    await slider.fill('90');

    await window.click('button:has-text("Save")');
    await expect(window.locator('text=/saved/i')).toBeVisible();
  });
});

test.describe('Desktop App - Error Handling', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should handle API connection failure gracefully', async () => {
    // Set invalid API endpoint
    // Try to perform operation

    // Should show error message
    await expect(window.locator('text=/connection|error|failed/i')).toBeVisible();
  });

  test('should handle permission denied errors', async () => {
    // Try to access restricted directory
    // Should show permission error
    // Note: This may require OS-specific testing
  });

  test('should handle empty directory', async () => {
    // Scan empty directory
    // Should show appropriate message

    await expect(window.locator('text=/no files|empty/i')).toBeVisible();
  });
});
