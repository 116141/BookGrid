import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface AdminOverviewStats {
  readonly mrrUsd: number;
  readonly mrrEur: number;
  readonly totalTenants: number;
  readonly trialTenants: number;
  readonly activeTenants: number;
  readonly totalBookings: number;
  readonly newLast7Days: number;
  readonly newLast30Days: number;
  readonly recentTenants: readonly AdminTenantSummary[];
  readonly topTenants: readonly AdminTenantSummary[];
}

export interface AdminTenantSummary {
  readonly id: string;
  readonly slug: string;
  readonly businessName: string;
  readonly ownerId: string;
  readonly ownerEmail: string;
  readonly currency: string;
  readonly subscriptionStatus: string;
  readonly trialEndsAt: string;
  readonly createdAt: string;
  readonly staffCount: number;
  readonly bookingCount: number;
}

export interface AdminTenantDetails {
  readonly tenantId: string;
  readonly services: readonly {
    readonly id: string;
    readonly name: string;
    readonly durationMinutes: number;
    readonly priceUsd: number;
    readonly priceEur: number;
    readonly active: boolean;
  }[];
  readonly staff: readonly {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly active: boolean;
  }[];
  readonly recentBookings: readonly {
    readonly id: string;
    readonly bookingCode: string;
    readonly clientName: string;
    readonly bookingDate: string;
    readonly bookingTime: string;
    readonly status: string;
  }[];
}

export interface AdminPaymentEventRow {
  readonly id: string;
  readonly eventId: string;
  readonly provider: string;
  readonly eventType: string;
  readonly tenantId: string | null;
  readonly currency: string;
  readonly amount: number;
  readonly createdAt: string;
}

export interface SystemAnnouncementRow {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly tone: 'info' | 'warning' | 'success';
  readonly isActive: boolean;
  readonly createdByEmail: string;
  readonly createdAt: string;
}

async function fetchOwnerEmailMap(): Promise<Map<string, string>> {
  const admin = createSupabaseAdminClient();
  const map = new Map<string, string>();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const user of data?.users ?? []) {
    if (user.id && user.email) {
      map.set(user.id, user.email);
    }
  }
  return map;
}

export async function getAdminTenantsList(): Promise<AdminTenantSummary[]> {
  const admin = createSupabaseAdminClient();
  const [ownerMap, tenantsRes, staffRes, bookingsRes] = await Promise.all([
    fetchOwnerEmailMap(),
    admin
      .from('tenants')
      .select('id, slug, business_name, owner_id, currency, subscription_status, trial_ends_at, created_at')
      .order('created_at', { ascending: false }),
    admin.from('staff_members').select('tenant_id'),
    admin.from('bookings').select('tenant_id'),
  ]);

  const staffCounts = new Map<string, number>();
  for (const row of staffRes.data ?? []) {
    staffCounts.set(row.tenant_id, (staffCounts.get(row.tenant_id) ?? 0) + 1);
  }

  const bookingCounts = new Map<string, number>();
  for (const row of bookingsRes.data ?? []) {
    bookingCounts.set(row.tenant_id, (bookingCounts.get(row.tenant_id) ?? 0) + 1);
  }

  return (tenantsRes.data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    businessName: t.business_name,
    ownerId: t.owner_id,
    ownerEmail: ownerMap.get(t.owner_id) ?? 'unknown',
    currency: t.currency,
    subscriptionStatus: t.subscription_status,
    trialEndsAt: String(t.trial_ends_at),
    createdAt: String(t.created_at),
    staffCount: staffCounts.get(t.id) ?? 0,
    bookingCount: bookingCounts.get(t.id) ?? 0,
  }));
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const tenants = await getAdminTenantsList();
  const now = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  let mrrUsd = 0;
  let mrrEur = 0;
  let trialTenants = 0;
  let activeTenants = 0;
  let totalBookings = 0;
  let newLast7Days = 0;
  let newLast30Days = 0;

  for (const t of tenants) {
    totalBookings += t.bookingCount;
    const createdMs = new Date(t.createdAt).getTime();
    if (Number.isFinite(createdMs)) {
      if (now - createdMs <= ms7d) newLast7Days += 1;
      if (now - createdMs <= ms30d) newLast30Days += 1;
    }
    if (t.subscriptionStatus === 'trial') {
      trialTenants += 1;
    } else if (t.subscriptionStatus === 'active') {
      activeTenants += 1;
      if (t.currency === 'EUR') {
        mrrEur += 25;
      } else {
        mrrUsd += 29;
      }
    }
  }

  const topTenants = [...tenants]
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 6);

  return {
    mrrUsd,
    mrrEur,
    totalTenants: tenants.length,
    trialTenants,
    activeTenants,
    totalBookings,
    newLast7Days,
    newLast30Days,
    recentTenants: tenants.slice(0, 6),
    topTenants,
  };
}

export async function getAdminTenantDetails(tenantId: string): Promise<AdminTenantDetails> {
  const admin = createSupabaseAdminClient();
  const [servicesRes, staffRes, bookingsRes] = await Promise.all([
    admin
      .from('services')
      .select('id, name, duration_minutes, price_usd, price_eur, active')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true }),
    admin
      .from('staff_members')
      .select('id, name, role, active')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true }),
    admin
      .from('bookings')
      .select('id, booking_code, client_name, booking_date, booking_time, status')
      .eq('tenant_id', tenantId)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .limit(10),
  ]);

  return {
    tenantId,
    services: (servicesRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: Number(s.duration_minutes),
      priceUsd: Number(s.price_usd),
      priceEur: Number(s.price_eur),
      active: Boolean(s.active),
    })),
    staff: (staffRes.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      active: Boolean(m.active),
    })),
    recentBookings: (bookingsRes.data ?? []).map((b) => ({
      id: b.id,
      bookingCode: b.booking_code,
      clientName: b.client_name,
      bookingDate: String(b.booking_date),
      bookingTime: String(b.booking_time).slice(0, 5),
      status: b.status,
    })),
  };
}

export async function getAdminPaymentEvents(): Promise<AdminPaymentEventRow[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('payment_webhook_events')
    .select('id, event_id, provider, event_type, tenant_id, currency, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    provider: row.provider,
    eventType: row.event_type,
    tenantId: row.tenant_id,
    currency: row.currency,
    amount: Number(row.amount),
    createdAt: String(row.created_at),
  }));
}

export async function getSystemAnnouncements(): Promise<{
  readonly rows: SystemAnnouncementRow[];
  readonly migrationMissing: boolean;
}> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('system_announcements')
    .select('id, title, message, tone, is_active, created_by_email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { rows: [], migrationMissing: true };
  }

  return {
    migrationMissing: false,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      tone: row.tone as 'info' | 'warning' | 'success',
      isActive: Boolean(row.is_active),
      createdByEmail: row.created_by_email,
      createdAt: String(row.created_at),
    })),
  };
}

export async function recordAdminAuditLog(params: {
  readonly adminEmail: string;
  readonly action: string;
  readonly targetTenantId?: string | null;
  readonly details?: Record<string, unknown>;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from('admin_audit_logs').insert({
    admin_email: params.adminEmail,
    action: params.action,
    target_tenant_id: params.targetTenantId ?? null,
    details_json: params.details ?? {},
  });
}
