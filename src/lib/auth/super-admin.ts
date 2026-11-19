import 'server-only';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SuperAdminContext {
  readonly userId: string;
  readonly email: string;
}

/**
 * Verifies that the current authenticated user matches `process.env.SUPER_ADMIN_EMAIL`.
 * Uses `supabase.auth.getUser()` (never `getSession()`) and triggers `notFound()` on failure
 * so `/admin` does not leak existence to unauthorized visitors.
 */
export async function requireSuperAdminOrNotFound(): Promise<SuperAdminContext> {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    notFound();
  }

  if (user.email.trim().toLowerCase() !== configuredEmail) {
    notFound();
  }

  return {
    userId: user.id,
    email: user.email,
  };
}

/**
 * Strict guard for Super Admin Server Actions (throws instead of rendering 404).
 */
export async function requireSuperAdminForAction(): Promise<SuperAdminContext> {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) {
    throw new Error('SUPER_ADMIN_NOT_CONFIGURED');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || user.email.trim().toLowerCase() !== configuredEmail) {
    throw new Error('UNAUTHORIZED_SUPER_ADMIN');
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
