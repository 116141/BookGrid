import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Megaphone } from 'lucide-react';
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

  const { data: activeAnnouncement } = await supabase
    .from('system_announcements')
    .select('title, message, tone')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const bannerStyle =
    activeAnnouncement?.tone === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : activeAnnouncement?.tone === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : 'bg-slate-100 border-[#EAE6F5] text-[#1B1340]';

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#0C0C14] pb-20 md:pb-10 md:pl-64">
      <DashboardNav businessName={tenant.business_name} slug={tenant.slug} />
      {activeAnnouncement && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div
            className={`rounded-xl border px-4 py-2.5 text-xs flex items-start gap-2.5 ${bannerStyle}`}
          >
            <Megaphone className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <span className="font-bold mr-1.5">{activeAnnouncement.title}:</span>
              <span>{activeAnnouncement.message}</span>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">{children}</main>
    </div>
  );
}
