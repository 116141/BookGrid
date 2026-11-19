import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupportedCurrency } from '@/schemas/env.schema';
import { ImporterClient } from '@/components/dashboard/ImporterClient';

export const dynamic = 'force-dynamic';

export default async function ImporterPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('currency')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    redirect('/signup');
  }

  const todayIso = new Date().toISOString().split('T')[0] ?? '2026-11-18';

  return (
    <ImporterClient
      currency={tenant.currency as SupportedCurrency}
      defaultDate={todayIso}
    />
  );
}
