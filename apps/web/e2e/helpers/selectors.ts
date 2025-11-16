/**
 * Centralized test selectors for E2E tests
 * Follow the naming convention: [page]-[component]-[element]
 */

export const selectors = {
  // Login page
  login: {
    form: {
      email: 'login-form-email',
      password: 'login-form-password',
      togglePassword: 'login-form-toggle-password',
      submit: 'login-form-submit',
      error: 'login-form-error',
    },
  },

  // Register page
  register: {
    form: {
      name: 'register-form-name',
      email: 'register-form-email',
      password: 'register-form-password',
      confirmPassword: 'register-form-confirm-password',
      togglePassword: 'register-form-toggle-password',
      toggleConfirmPassword: 'register-form-toggle-confirm-password',
      terms: 'register-form-terms',
      submit: 'register-form-submit',
      error: 'register-form-error',
    },
  },

  // Upload page
  upload: {
    dropzone: 'upload-dropzone',
    dropzoneInput: 'upload-dropzone-input',
    progress: 'upload-progress',
    complete: 'upload-complete',
    error: 'upload-error',
    submitButton: 'upload-submit-button',
    clearButton: 'upload-clear-button',
  },

  // Review page
  review: {
    duplicateGroup: 'duplicate-group',
    fileCard: 'file-card',
    keepRadio: 'keep-radio',
    downloadButton: 'download-button',
    resultsHeading: 'results-heading',
  },

  // Quota page
  quota: {
    storageUsed: 'quota-storage-used',
    storageLimit: 'quota-storage-limit',
    percentage: 'quota-percentage',
    remaining: 'quota-remaining',
    warningMessage: 'quota-warning',
  },

  // Common elements
  common: {
    header: 'app-header',
    logoutButton: 'logout-button',
    userMenu: 'user-menu',
    loadingSpinner: 'loading-spinner',
  },
} as const;

/**
 * Helper function to get test selector
 * @param path - Dot notation path to selector (e.g., 'login.form.email')
 * @returns data-testid value
 */
export function getSelector(path: string): string {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = selectors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      throw new Error(`Selector not found: ${path}`);
    }
  }

  return value;
}
