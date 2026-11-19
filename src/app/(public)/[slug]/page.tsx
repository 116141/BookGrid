import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isTenantSubscriptionActive } from '@/lib/billing/subscription-guard';
import type { SupportedCurrency } from '@/schemas/env.schema';
import { PublicBusySlotSchema, type CatalogServiceItem } from '@/schemas/booking.schema';
import { TenantSlugParamSchema } from '@/schemas/tenant.schema';
import { computeAvailableTimeSlots } from '@/services/availability/slot-calculator';
import {
  PublicBookingClient,
  type PublicStaffOption,
} from '@/components/public/PublicBookingClient';

export const dynamic = 'force-dynamic';

interface PublicStorePageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function PublicStoreBookingPage({ params }: PublicStorePageProps) {
  const rawParams = await params;
  const parsedSlug = TenantSlugParamSchema.safeParse(rawParams);

  if (!parsedSlug.success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select(
      'id, slug, business_name, city, whatsapp_phone, currency, opening_time, closing_time, subscription_status, trial_ends_at'
    )
    .eq('slug', parsedSlug.data.slug)
    .in('subscription_status', ['trial', 'active', 'vip'])
    .maybeSingle();

  if (!tenant) {
    notFound();
  }

  if (!isTenantSubscriptionActive(tenant)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-2 shadow-sm">
          <h1 className="text-lg font-bold">{tenant.business_name}</h1>
          <p className="text-sm text-slate-600">
            Online booking for this studio is temporarily paused. Please contact the business
            directly.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: serviceRows }, { data: staffRows }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_minutes, price_usd, price_eur')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('staff_members')
      .select('id, name, role')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('created_at', { ascending: true }),
  ]);

  const services: CatalogServiceItem[] = (serviceRows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: Number(s.duration_minutes),
    priceUsd: Number(s.price_usd),
    priceEur: Number(s.price_eur),
  }));

  const staffMembers: PublicStaffOption[] = (staffRows ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
  }));

  const todayIso = new Date().toISOString().split('T')[0] ?? '2026-11-18';
  const { data: busyRows } = await supabase.rpc('get_public_busy_slots', {
    p_tenant_id: tenant.id,
    p_booking_date: todayIso,
  });

  const busySlots = (busyRows ?? []).map((row: {
    staff_id: string | null;
    booking_date: string;
    booking_time: string;
    total_duration_minutes: number;
  }) =>
    PublicBusySlotSchema.parse({
      staffId: row.staff_id,
      bookingDate: String(row.booking_date),
      bookingTime: row.booking_time,
      totalDurationMinutes: Number(row.total_duration_minutes),
    })
  );

  const initialDuration = services[0]?.durationMinutes ?? 30;
  const initialAvailableSlots = computeAvailableTimeSlots({
    openingTime: tenant.opening_time,
    closingTime: tenant.closing_time,
    requiredDurationMinutes: initialDuration,
    targetStaffId: null,
    busySlots,
  });

  return (
    <PublicBookingClient
      tenant={{
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.business_name,
        city: tenant.city,
        whatsappPhone: tenant.whatsapp_phone,
        currency: tenant.currency as SupportedCurrency,
      }}
      services={services}
      staffMembers={staffMembers}
      initialDate={todayIso}
      initialAvailableSlots={initialAvailableSlots}
    />
  );
}
