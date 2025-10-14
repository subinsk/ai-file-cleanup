/* eslint-disable no-console */
/**
 * Development utilities for testing and debugging
 */

export const devTools = {
  /**
   * Clear all app data (auth, license, scan state)
   * Useful for testing the full flow from scratch
   */
  clearAllData() {
    localStorage.clear();
    console.log('✅ All app data cleared. Reload the app to start fresh.');
  },

  /**
   * Clear only auth data (keeps license)
   */
  clearAuth() {
    localStorage.removeItem('user');
    console.log('✅ Auth data cleared. Reload the app.');
  },

  /**
   * Clear only license data (keeps auth)
   */
  clearLicense() {
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('licenseValid');
    console.log('✅ License data cleared. Reload the app.');
  },

  /**
   * Show current app state
   */
  showState() {
    console.log('Current App State:', {
      user: localStorage.getItem('user'),
      licenseKey: localStorage.getItem('licenseKey'),
      licenseValid: localStorage.getItem('licenseValid'),
    });
  },

  /**
   * Set mock authenticated state for testing
   */
  setMockAuth() {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    console.log('✅ Mock auth set. Reload the app.');
  },

  /**
   * Set mock license for testing
   */
  setMockLicense() {
    localStorage.setItem('licenseKey', 'TEST-LICENSE-KEY');
    localStorage.setItem('licenseValid', 'true');
    console.log('✅ Mock license set. Reload the app.');
  },
};

// Expose to window in development
if (import.meta.env.DEV) {
  (window as Window & { devTools: typeof devTools }).devTools = devTools;
  console.log('🛠️ Dev tools available: window.devTools');
  console.log('  - devTools.clearAllData()');
  console.log('  - devTools.clearAuth()');
  console.log('  - devTools.clearLicense()');
  console.log('  - devTools.showState()');
  console.log('  - devTools.setMockAuth()');
  console.log('  - devTools.setMockLicense()');
}
