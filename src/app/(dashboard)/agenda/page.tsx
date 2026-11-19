import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupportedCurrency } from '@/schemas/env.schema';
import { AgendaClient, type DashboardBookingRow } from '@/components/dashboard/AgendaClient';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name, currency')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    redirect('/signup');
  }

  const { data: rows } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, client_name, client_phone, staff_name, selected_services_json, total_duration_minutes, total_price_usd, total_price_eur, booking_date, booking_time, status'
    )
    .eq('tenant_id', tenant.id)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  const initialBookings: DashboardBookingRow[] = (rows ?? []).map((b) => ({
    id: b.id,
    bookingCode: b.booking_code,
    clientName: b.client_name,
    clientPhone: b.client_phone,
    staffName: b.staff_name,
    servicesSummary: Array.isArray(b.selected_services_json)
      ? b.selected_services_json.map(String).join(' + ')
      : String(b.selected_services_json),
    totalDurationMinutes: Number(b.total_duration_minutes),
    totalPriceUsd: Number(b.total_price_usd),
    totalPriceEur: Number(b.total_price_eur),
    bookingDate: String(b.booking_date),
    bookingTime: b.booking_time,
    status: b.status,
  }));

  return (
    <AgendaClient
      slug={tenant.slug}
      businessName={tenant.business_name}
      currency={tenant.currency as SupportedCurrency}
      initialBookings={initialBookings}
    />
  );
}
