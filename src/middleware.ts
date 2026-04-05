import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/register'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    // If already logged in and hitting login/register, redirect to dashboard
    if (pathname === '/login' || pathname === '/register') {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // For all other paths (dashboard, api/graphql), require auth
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('[MIDDLEWARE] Critical: NEXTAUTH_SECRET is missing!');
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  if (!token) {
    console.log(`[MIDDLEWARE] Access denied for path: ${pathname}. No token found.`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-Based Access Control
  const role = token.role || 'USER';

  // Protect administrative routes
  if (pathname.startsWith('/dashboard/users') && role === 'USER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }



  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - .svg, .png, .ico, .json files (public assets)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
