import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Check if login form is visible
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Check if registration form is visible
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.getByRole('button', { name: /log in/i }).click();

    // Check for validation errors
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    // Fill out registration form
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill('TestPassword123');
    await page.getByLabel(/name/i).fill('Test User');

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Should redirect to home page after successful registration
    await expect(page).toHaveURL('/');

    // User should be logged in
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should login with existing user', async ({ page }) => {
    // First create a user
    await page.goto('/register');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for redirect
    await expect(page).toHaveURL('/');

    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Now login with same credentials
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should be logged in
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123');
    await page.getByRole('button', { name: /log in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials|login failed/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');

    // Try with weak password
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('weak');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Should show password validation error
    await expect(
      page.getByText(/password.*8 characters|password.*uppercase|password.*digit/i)
    ).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/register');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill('TestPassword123');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL('/');

    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login');

    // User info should not be visible
    await expect(page.getByText(/test user/i)).not.toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
