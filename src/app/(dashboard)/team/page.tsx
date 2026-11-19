import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isTenantSubscriptionActive } from '@/lib/billing/subscription-guard';
import {
  TeamClient,
  type TeamServiceRow,
  type TeamStaffRow,
} from '@/components/dashboard/TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, subscription_status, trial_ends_at')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    redirect('/signup');
  }

  if (!isTenantSubscriptionActive(tenant)) {
    redirect('/billing?expired=1');
  }

  const [{ data: staffRows }, { data: serviceRows }] = await Promise.all([
    supabase
      .from('staff_members')
      .select('id, name, role, active')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('services')
      .select('id, name, duration_minutes, price_usd, price_eur')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('created_at', { ascending: true }),
  ]);

  const initialStaff: TeamStaffRow[] = (staffRows ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    active: Boolean(m.active),
  }));

  const initialServices: TeamServiceRow[] = (serviceRows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: Number(s.duration_minutes),
    priceUsd: Number(s.price_usd),
    priceEur: Number(s.price_eur),
  }));

  return <TeamClient initialStaff={initialStaff} initialServices={initialServices} />;
}
