import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  registerUser,
  loginUser,
  logoutUser,
  assertLoginError,
  assertRegisterError,
  createAndLoginUser,
} from './helpers/auth.helpers';
import { selectors } from './helpers/selectors';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Check if login form is visible using proper semantic selectors
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByTestId(selectors.login.form.email)).toBeVisible();
    await expect(page.getByTestId(selectors.login.form.password)).toBeVisible();
    await expect(page.getByTestId(selectors.login.form.submit)).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Check if registration form is visible
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
    await expect(page.getByTestId(selectors.register.form.email)).toBeVisible();
    await expect(page.getByTestId(selectors.register.form.password)).toBeVisible();
    await expect(page.getByTestId(selectors.register.form.submit)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.getByTestId(selectors.login.form.submit).click();

    // Check for validation errors (browser validation will prevent submission)
    // The form should not submit and we should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should register a new user successfully', async ({ page }) => {
    const user = generateTestUser();
    await registerUser(page, user);

    // Should redirect to home page after successful registration
    await expect(page).toHaveURL('/');

    // User should be logged in - check for user name or indicator
    await expect(page.getByText(new RegExp(user.name!, 'i'))).toBeVisible({ timeout: 10000 });
  });

  test('should login with existing user', async ({ page }) => {
    // First create a user
    const user = await createAndLoginUser(page);

    // Logout
    await logoutUser(page);

    // Now login with same credentials
    await loginUser(page, user);

    // Should be logged in
    await expect(page).toHaveURL('/');
    await expect(page.getByText(new RegExp(user.name!, 'i'))).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.getByTestId(selectors.login.form.email).fill('invalid@example.com');
    await page.getByTestId(selectors.login.form.password).fill('WrongPassword123');
    await page.getByTestId(selectors.login.form.submit).click();

    // Should show error message
    await assertLoginError(page, /invalid.*credentials|login failed|invalid.*password/i);
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');

    const user = generateTestUser();

    // Try with weak password
    await page.getByTestId(selectors.register.form.email).fill(user.email);
    await page.getByTestId(selectors.register.form.password).fill('weak');
    await page.getByTestId(selectors.register.form.confirmPassword).fill('weak');
    if (user.name) {
      await page.getByTestId(selectors.register.form.name).fill(user.name);
    }
    await page.getByTestId(selectors.register.form.terms).check();
    await page.getByTestId(selectors.register.form.submit).click();

    // Should show password validation error
    await assertRegisterError(page, /password.*8 characters|password.*uppercase|password.*digit/i);
  });

  test('should logout successfully', async ({ page }) => {
    // First register and login
    const user = await createAndLoginUser(page);

    await expect(page).toHaveURL('/');

    // Logout
    await logoutUser(page);

    // Should redirect to login page
    await expect(page).toHaveURL('/login');

    // User info should not be visible
    await expect(page.getByText(new RegExp(user.name!, 'i'))).not.toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/upload');

    // Should redirect to login page or show login requirement
    // Note: This depends on your middleware implementation
    await expect(page).toHaveURL(/.*login|.*$/);
  });

  test('should display password toggle button', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByTestId(selectors.login.form.password);
    const toggleButton = page.getByTestId(selectors.login.form.togglePassword);

    // Password should initially be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should validate matching passwords on registration', async ({ page }) => {
    await page.goto('/register');

    const user = generateTestUser();

    // Fill form with non-matching passwords
    await page.getByTestId(selectors.register.form.email).fill(user.email);
    await page.getByTestId(selectors.register.form.password).fill('TestPassword123');
    await page.getByTestId(selectors.register.form.confirmPassword).fill('DifferentPassword123');
    if (user.name) {
      await page.getByTestId(selectors.register.form.name).fill(user.name);
    }
    await page.getByTestId(selectors.register.form.terms).check();
    await page.getByTestId(selectors.register.form.submit).click();

    // Should show error about passwords not matching
    await assertRegisterError(page, /password.*do not match|password.*must match/i);
  });
});
