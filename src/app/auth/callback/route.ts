import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Validates `next` redirect parameter to prevent Open Redirect (OWASP A01).
 * Accepts only safe relative paths starting with `/` (rejecting `//evil.com` or `/\evil.com`).
 */
function sanitizeRelativeNextPath(rawNext: string | null, fallback = '/agenda'): string {
  if (!rawNext) {
    return fallback;
  }
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  return trimmed;
}

/**
 * Google OAuth Callback Route (`/auth/callback`)
 * Exchanges the temporary authorization `code` for a verified Supabase session,
 * checks if the merchant already owns a `tenants` record, and routes to `/agenda`
 * or `/onboarding`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const safeNext = sanitizeRelativeNextPath(searchParams.get('next'), '/agenda');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }

  // Strictly verify authenticated user via Supabase Auth server
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=unauthorized`);
  }

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!existingTenant) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
