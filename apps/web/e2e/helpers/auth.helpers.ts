import { Page, expect } from '@playwright/test';
import { selectors } from './selectors';

export interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

/**
 * Generate unique test user credentials
 */
export function generateTestUser(prefix = 'test'): UserCredentials {
  const timestamp = Date.now();
  return {
    email: `${prefix}${timestamp}@example.com`,
    password: 'TestPassword123',
    name: 'Test User',
  };
}

/**
 * Register a new user
 */
export async function registerUser(
  page: Page,
  credentials: UserCredentials
): Promise<UserCredentials> {
  await page.goto('/register');

  // Fill out registration form
  if (credentials.name) {
    await page.getByTestId(selectors.register.form.name).fill(credentials.name);
  }
  await page.getByTestId(selectors.register.form.email).fill(credentials.email);
  await page.getByTestId(selectors.register.form.password).fill(credentials.password);
  await page.getByTestId(selectors.register.form.confirmPassword).fill(credentials.password);
  await page.getByTestId(selectors.register.form.terms).check();

  // Submit form
  await page.getByTestId(selectors.register.form.submit).click();

  // Wait for redirect to home page (more flexible URL matching)
  // Registration might redirect to / or another page after successful registration
  await page.waitForURL((url) => !url.includes('/register'), { timeout: 15000 });

  return credentials;
}

/**
 * Login with existing user credentials
 */
export async function loginUser(page: Page, credentials: UserCredentials): Promise<void> {
  await page.goto('/login');

  // Fill out login form
  await page.getByTestId(selectors.login.form.email).fill(credentials.email);
  await page.getByTestId(selectors.login.form.password).fill(credentials.password);

  // Submit form
  await page.getByTestId(selectors.login.form.submit).click();

  // Wait for redirect to home page
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

/**
 * Register and login a new test user (convenience function)
 */
export async function createAndLoginUser(
  page: Page,
  credentials?: Partial<UserCredentials>
): Promise<UserCredentials> {
  const user = {
    ...generateTestUser(),
    ...credentials,
  };

  await registerUser(page, user);
  return user;
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Look for logout/sign out button (may vary by implementation)
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // Wait for redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  }
}

/**
 * Check if user is logged in
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on a non-auth page (not login/register)
  const url = page.url();
  return !url.includes('/login') && !url.includes('/register');
}

/**
 * Assert login form displays validation error
 */
export async function assertLoginError(page: Page, errorPattern?: RegExp): Promise<void> {
  const errorElement = page.getByTestId(selectors.login.form.error);
  await expect(errorElement).toBeVisible();

  if (errorPattern) {
    await expect(errorElement).toContainText(errorPattern);
  }
}

/**
 * Assert registration form displays validation error
 */
export async function assertRegisterError(page: Page, errorPattern?: RegExp): Promise<void> {
  const errorElement = page.getByTestId(selectors.register.form.error);
  await expect(errorElement).toBeVisible();

  if (errorPattern) {
    await expect(errorElement).toContainText(errorPattern);
  }
}
