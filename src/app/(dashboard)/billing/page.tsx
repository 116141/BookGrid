import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupportedCurrency } from '@/schemas/env.schema';
import { BillingClient } from '@/components/dashboard/BillingClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, currency, subscription_status, trial_ends_at, payment_provider')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    redirect('/signup');
  }

  return (
    <BillingClient
      tenantId={tenant.id}
      businessName={tenant.business_name}
      defaultCurrency={tenant.currency as SupportedCurrency}
      subscriptionStatus={tenant.subscription_status}
      trialEndsAt={String(tenant.trial_ends_at)}
      paymentProvider={tenant.payment_provider}
    />
  );
}
