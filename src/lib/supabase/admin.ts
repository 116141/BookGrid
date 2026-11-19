import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-Only Admin Supabase Client (Bypasses RLS)
 * SECURITY GUARDRAIL: Restricted strictly to cryptographically verified payment webhooks
 * (`/api/webhooks/payments`). Never import in UI components or public routes.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY in server environment');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
