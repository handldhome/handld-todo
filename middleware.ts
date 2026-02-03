import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Security key for Command Center access
const VALID_KEYS = ['alia']; // Add more keys as needed

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check for security key on protected routes (Command Center and API)
  // Allow auth routes, static files, and login/signup without key
  const isProtectedRoute = pathname === '/' ||
                           pathname.startsWith('/api/airtable') ||
                           pathname.startsWith('/inbox') ||
                           pathname.startsWith('/all') ||
                           pathname.startsWith('/starred') ||
                           pathname.startsWith('/today') ||
                           pathname.startsWith('/completed') ||
                           pathname.startsWith('/list');

  if (isProtectedRoute) {
    const key = searchParams.get('key');

    // Check if key is in cookie (for subsequent requests)
    const keyFromCookie = request.cookies.get('handld_key')?.value;

    if (!key && !keyFromCookie) {
      // No key provided - return unauthorized
      return new NextResponse('Unauthorized - key required', { status: 401 });
    }

    if (key && !VALID_KEYS.includes(key)) {
      // Invalid key
      return new NextResponse('Unauthorized - invalid key', { status: 401 });
    }

    // If key is in URL, set cookie and continue
    if (key && VALID_KEYS.includes(key)) {
      const response = await updateSession(request);
      response.cookies.set('handld_key', key, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // Key from cookie is valid, continue
    if (keyFromCookie && VALID_KEYS.includes(keyFromCookie)) {
      return await updateSession(request);
    }

    return new NextResponse('Unauthorized', { status: 401 });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav)$).*)',
  ],
};
