import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

    // If logged in and trying to access auth pages, redirect to home
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // If not logged in and trying to access protected pages
    if (!isAuthPage && !isAuth) {
      // Allow access to public pages
      const publicPages = ['/', '/download'];
      if (!publicPages.includes(req.nextUrl.pathname)) {
        let from = req.nextUrl.pathname;
        if (req.nextUrl.search) {
          from += req.nextUrl.search;
        }

        return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(from)}`, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function above
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
};
