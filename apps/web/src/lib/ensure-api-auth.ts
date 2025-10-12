import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
let isAuthenticating = false;

/**
 * Ensures the user is authenticated with the Python API
 * This sets the access_token cookie needed for API calls
 */
export async function ensureApiAuthentication(): Promise<boolean> {
  // Prevent multiple simultaneous auth attempts
  if (isAuthenticating) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return ensureApiAuthentication();
  }

  try {
    isAuthenticating = true;

    // Check if we have a NextAuth session
    const session = await getSession();

    if (!session?.user?.email) {
      return false;
    }

    // Try to access a protected endpoint to see if we need to re-authenticate
    const testResponse = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    });

    // If already authenticated with API, we're good
    if (testResponse.ok) {
      return true;
    }

    // Need to re-authenticate with Python API
    // Note: We can't re-login without the password, so this is a limitation
    // The user will need to login again if their API session expires
    return false;
  } catch (error) {
    console.error('Error checking API authentication:', error);
    return false;
  } finally {
    isAuthenticating = false;
  }
}
