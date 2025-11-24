import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Use server-side env var (API_URL) or fallback to NEXT_PUBLIC_API_URL for client compatibility
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
          console.log(`[NextAuth] Using API URL: ${API_URL}`);
          console.log(`[NextAuth] NODE_ENV: ${process.env.NODE_ENV}`);
          console.log(`[NextAuth] API_URL env: ${process.env.API_URL}`);
          console.log(`[NextAuth] NEXT_PUBLIC_API_URL env: ${process.env.NEXT_PUBLIC_API_URL}`);

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
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
            };
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
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
        }
        return session;
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error);
        // Return session even if token is missing to prevent 500 error
        return session;
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
