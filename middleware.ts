import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

// Security key for Command Center access
const VALID_KEYS = ['alia']; // Add more keys as needed

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Routes that never require a key
  const isPublicRoute = pathname.startsWith('/login') ||
                        pathname.startsWith('/signup') ||
                        pathname.startsWith('/auth') ||
                        pathname.startsWith('/_next') ||
                        pathname.startsWith('/api/') && !pathname.startsWith('/api/airtable');

  if (isPublicRoute) {
    return await updateSession(request);
  }

  // Check for security key
  const key = searchParams.get('key');
  const keyFromCookie = request.cookies.get('handld_key')?.value;

  const hasValidKey = (key && VALID_KEYS.includes(key)) ||
                      (keyFromCookie && VALID_KEYS.includes(keyFromCookie));

  // Invalid key in URL
  if (key && !VALID_KEYS.includes(key)) {
    return new NextResponse('Unauthorized - invalid key', { status: 401 });
  }

  // No key at all - unauthorized
  if (!hasValidKey) {
    return new NextResponse('Unauthorized - access commandcenter.handldhome.com?key=alia', { status: 401 });
  }

  // Valid key - proceed with session update and persist cookie
  const response = await updateSession(request);
  if (key) {
    response.cookies.set('handld_key', key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });
  }
  return response;
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
