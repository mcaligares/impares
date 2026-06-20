import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { authEnabled } from '@/lib/auth';
import { authConfig } from '@/config/auth.config';
import { routesConfig } from '@/config/routes.config';

export async function middleware(request: NextRequest) {
  if (!authEnabled) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith(routesConfig.dashboard);
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = authConfig.redirects.unauthenticated;
    return NextResponse.redirect(url);
  }

  const isAuthRoute = pathname === routesConfig.login || pathname === routesConfig.register;
  if (isAuthRoute && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = authConfig.redirects.afterLogin;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
