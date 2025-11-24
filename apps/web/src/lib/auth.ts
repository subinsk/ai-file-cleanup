import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Use NEXT_PUBLIC_API_URL (available on both client and server in Next.js)
// Fallback to localhost for local development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[NextAuth] Missing credentials');
          return null;
        }

        try {
          // Log API URL for debugging
          // eslint-disable-next-line no-console
          console.log(`[NextAuth] Using API URL: ${API_URL} (NODE_ENV: ${process.env.NODE_ENV})`);

          // Call your Python API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[NextAuth] Login failed: ${response.status} - ${errorText}`);
            return null;
          }

          const data = await response.json();

          if (data.user) {
            // Ensure all required fields are present
            const user = {
              id: String(data.user.id || ''),
              email: String(data.user.email || ''),
              name: data.user.name || null,
            };

            // Validate required fields
            if (!user.id || !user.email) {
              console.error('[NextAuth] Missing required user fields:', user);
              return null;
            }

            return user;
          }

          console.error('[NextAuth] No user data in response:', data);
          return null;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('[NextAuth] Request timeout - API may be unreachable from server');
          } else {
            console.error('[NextAuth] Auth error:', error);
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page instead of default error page
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        // Ensure token exists
        if (!token) {
          console.error('[NextAuth] JWT callback: token is missing');
          return { id: '', email: '', name: null } as typeof token;
        }

        if (user) {
          // Persist user data to token on sign in
          token.id = String(user.id || '');
          token.email = String(user.email || '');
          token.name = user.name || null;
        }

        // Ensure token always has required fields
        if (!token.id && !token.email) {
          console.warn('[NextAuth] JWT callback: token missing id and email');
        }

        // Always return token, even if user is undefined (subsequent calls)
        return token;
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error);
        // Return empty token object if error occurs
        return (token || { id: '', email: '', name: null }) as typeof token;
      }
    },
    async session({ session, token }) {
      try {
        // Always ensure session exists
        if (!session) {
          console.error('[NextAuth] Session callback: session is missing');
          return {
            user: { id: '', email: '', name: null },
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }

        // Always ensure session.user exists
        if (!session.user) {
          console.error('[NextAuth] Session callback: session.user is missing');
          session.user = { id: '', email: '', name: null };
        }

        // If token exists and has data, populate session from token
        if (token) {
          if (token.id) {
            session.user.id = String(token.id);
          }
          if (token.email) {
            session.user.email = String(token.email);
          }
          if (token.name !== undefined) {
            session.user.name = token.name as string | null;
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('[NextAuth] Session callback: token is missing');
          // If token is missing but session exists, ensure user has at least empty values
          if (!session.user.id) session.user.id = '';
          if (!session.user.email) session.user.email = '';
        }

        // Ensure session has expires field
        if (!session.expires) {
          session.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        return session;
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error);
        // Always return a valid session object to prevent 500 error
        return {
          user: { id: '', email: '', name: null },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[NextAuth] WARNING: NEXTAUTH_SECRET is not set. NextAuth will not work properly.');
}

if (!API_URL || API_URL.includes('localhost')) {
  console.warn(
    `[NextAuth] WARNING: API_URL is set to ${API_URL}. This may not work in production.`
  );
}
