import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingFormClient } from '@/components/auth/OnboardingFormClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (existingTenant) {
    redirect('/agenda');
  }

  return <OnboardingFormClient userEmail={user.email ?? 'merchant'} />;
}
