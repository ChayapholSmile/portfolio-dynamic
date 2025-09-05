import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper function to create a redirect response with anti-caching headers
function createRedirect(url) {
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export function middleware(req) {
  const url = req.nextUrl;
  const { pathname } = url;
  const loginUrl = new URL('/admin/login', req.url);
  const changePasswordUrl = new URL('/admin/change-password', req.url);
  const adminHomeUrl = new URL('/admin', req.url);

  const token = req.cookies.get('session')?.value;

  // 1. No Token: Must go to login page
  if (!token) {
    if (pathname === '/admin/login') {
      return NextResponse.next(); // Already on login page, allow
    }
    return createRedirect(loginUrl); // Not on login page, redirect
  }

  // 2. Has Token: Verify it
  try {
    const decoded = verify(token, JWT_SECRET);

    // 3a. User MUST change password
    if (decoded.mustChangePassword) {
      // If user is not on the change password page, redirect them there.
      if (pathname !== '/admin/change-password') {
        return createRedirect(changePasswordUrl);
      }
    } 
    // 3b. User does NOT need to change password
    else {
      // If user is trying to access login or change password pages, redirect them to admin home.
      if (pathname === '/admin/login' || pathname === '/admin/change-password') {
        return createRedirect(adminHomeUrl);
      }
    }

    // All checks passed for a logged-in user, allow request.
    return NextResponse.next();

  } catch (error) {
    // Token is invalid (expired, malformed, etc.)
    // Redirect to login and clear the invalid cookie.
    const response = createRedirect(loginUrl);
    response.cookies.set('session', '', { maxAge: -1 });
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};

