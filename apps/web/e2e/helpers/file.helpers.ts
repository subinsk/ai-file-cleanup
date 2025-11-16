import { Page, expect } from '@playwright/test';
import path from 'path';
import { selectors } from './selectors';

/**
 * Get path to test file
 */
export function getTestFilePath(relativePath: string): string {
  // Assuming tests run from apps/web directory
  return path.join(__dirname, '..', '..', '..', relativePath);
}

/**
 * Common test file paths
 */
export const testFiles = {
  documentOriginal: getTestFilePath('test_files/document_original.txt'),
  documentCopy: getTestFilePath('demo_dataset/scenario_1_exact_duplicates/document_copy.txt'),
  documentDuplicate: getTestFilePath(
    'demo_dataset/scenario_1_exact_duplicates/document_original.txt'
  ),
  dataOriginal: getTestFilePath('demo_dataset/scenario_1_exact_duplicates/data_original.csv'),
} as const;

/**
 * Upload files via file input
 */
export async function uploadFiles(page: Page, filePaths: string | string[]): Promise<void> {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

  // Find the file input within the dropzone
  const fileInput = page.getByTestId(selectors.upload.dropzoneInput);
  await fileInput.setInputFiles(paths);
}

/**
 * Navigate to upload page and wait for it to load
 */
export async function goToUploadPage(page: Page): Promise<void> {
  await page.goto('/upload');
  await expect(page.getByTestId(selectors.upload.dropzone)).toBeVisible();
}

/**
 * Upload files and start processing
 */
export async function uploadAndProcess(page: Page, filePaths: string | string[]): Promise<void> {
  await goToUploadPage(page);
  await uploadFiles(page, filePaths);

  // Click upload/process button
  const submitButton = page.getByTestId(selectors.upload.submitButton);
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
}

/**
 * Wait for upload to complete
 */
export async function waitForUploadComplete(page: Page, timeout = 30000): Promise<void> {
  await expect(page.getByTestId(selectors.upload.complete)).toBeVisible({ timeout });
}

/**
 * Wait for processing to complete and navigate to review page
 */
export async function waitForProcessingComplete(page: Page, timeout = 30000): Promise<void> {
  // Wait for redirect to review page
  await expect(page).toHaveURL(/\/review\//, { timeout });
}

/**
 * Assert upload shows error
 */
export async function assertUploadError(page: Page, errorPattern?: RegExp): Promise<void> {
  const errorElement = page.getByTestId(selectors.upload.error);
  await expect(errorElement).toBeVisible();

  if (errorPattern) {
    await expect(errorElement).toContainText(errorPattern);
  }
}

/**
 * Assert upload shows progress
 */
export async function assertUploadInProgress(page: Page): Promise<void> {
  await expect(page.getByTestId(selectors.upload.progress)).toBeVisible();
}

/**
 * Download cleaned files as ZIP
 */
export async function downloadCleanedFiles(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent('download');

  // Find and click download button
  const downloadButton = page.getByRole('button', { name: /download.*cleaned|download.*zip/i });
  await downloadButton.click();

  const download = await downloadPromise;
  return download.suggestedFilename();
}

/**
 * Assert duplicate groups are displayed
 */
export async function assertDuplicatesFound(page: Page): Promise<void> {
  // Wait for duplicate detection results
  await expect(page.getByText(/duplicate.*found|groups.*found/i)).toBeVisible({ timeout: 30000 });
}

/**
 * Select file to keep in duplicate group
 */
export async function selectFileToKeep(
  page: Page,
  groupIndex: number,
  fileIndex: number
): Promise<void> {
  const radioButtons = page.locator('input[type="radio"]');
  const targetButton = radioButtons.nth(groupIndex * 2 + fileIndex); // Assuming 2 files per group
  await targetButton.check();
}

/**
 * Get number of duplicate groups found
 */
export async function getDuplicateGroupCount(page: Page): Promise<number> {
  const groups = page.locator('[data-testid*="duplicate-group"]');
  return await groups.count();
}
