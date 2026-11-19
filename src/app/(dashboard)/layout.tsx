import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { readonly children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    redirect('/signup');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 md:pb-10">
      <DashboardNav businessName={tenant.business_name} slug={tenant.slug} />
      <main className="max-w-5xl mx-auto px-4 pt-6">{children}</main>
    </div>
  );
}
