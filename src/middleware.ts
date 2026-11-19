import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_DASHBOARD_PREFIXES = [
  '/dashboard',
  '/agenda',
  '/importer',
  '/team',
  '/billing',
  '/onboarding',
] as const;

const AUTH_ROUTES = ['/login', '/signup'] as const;

function isProtectedDashboardPath(pathname: string): boolean {
  return PROTECTED_DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Next.js 15 Edge Middleware for BookGrid (`bookgrid.app`)
 * SECURITY RULE: Always validates JWT via `await supabase.auth.getUser()`,
 * never trusting `getSession()` on the server.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session and verify user authenticity with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const isAuthorizedAdmin =
    Boolean(superAdminEmail) &&
    Boolean(user?.email) &&
    user?.email?.trim().toLowerCase() === superAdminEmail;

  if (isAdminPath(pathname)) {
    if (!isAuthorizedAdmin) {
      const notFoundUrl = request.nextUrl.clone();
      notFoundUrl.pathname = '/_not-found';
      return NextResponse.rewrite(notFoundUrl, { status: 404 });
    }
  }

  if (isProtectedDashboardPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && user) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = isAuthorizedAdmin ? '/admin' : '/agenda';
    targetUrl.search = '';
    return NextResponse.redirect(targetUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
