'use server';

import crypto from 'node:crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkPublicRateLimit } from '@/lib/security/rate-limiter';
import {
  CreateBookingInputSchema,
  PublicBusySlotSchema,
  type CatalogServiceItem,
} from '@/schemas/booking.schema';
import { CreateWaitlistEntryInputSchema } from '@/schemas/waitlist.schema';
import {
  calculateMultiServiceCart,
  computeAvailableTimeSlots,
} from '@/services/availability/slot-calculator';
import type { ActionResult } from './action-result';

export interface PublicBookingConfirmation {
  readonly bookingCode: string;
  readonly totalDurationMinutes: number;
  readonly totalPriceUsd: number;
  readonly totalPriceEur: number;
  readonly selectedServiceNames: readonly string[];
  readonly bookingDate: string;
  readonly bookingTime: string;
}

interface DbServiceRow {
  id: string;
  name: string;
  duration_minutes: number;
  price_usd: number;
  price_eur: number;
}

interface DbBusySlotRow {
  staff_id: string | null;
  booking_date: string;
  booking_time: string;
  total_duration_minutes: number;
}

function mapCatalogServices(rows: readonly DbServiceRow[]): CatalogServiceItem[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    durationMinutes: Number(r.duration_minutes),
    priceUsd: Number(r.price_usd),
    priceEur: Number(r.price_eur),
  }));
}

/**
 * Zero-Trust Server Action for `bookgrid.app/[slug]` Multi-Service Booking.
 * - Rate-limited per IP (max 5 bookings / 15 min)
 * - Recalculates duration and USD/EUR prices strictly on the server
 * - Verifies continuous window availability via `get_public_busy_slots` (no PII leaked)
 */
export async function createPublicBookingAction(
  rawInput: unknown
): Promise<ActionResult<PublicBookingConfirmation>> {
  const rateLimit = await checkPublicRateLimit('public_booking', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      errorCode: 'RATE_LIMITED',
      message: `Too many booking attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = CreateBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, opening_time, closing_time, subscription_status')
    .eq('id', input.tenantId)
    .in('subscription_status', ['trial', 'active'])
    .maybeSingle();

  if (tenantError || !tenant) {
    return {
      ok: false,
      errorCode: 'TENANT_NOT_FOUND',
      message: 'Store is unavailable or inactive.',
    };
  }

  let resolvedStaffName = 'Any Specialist';
  if (input.staffId) {
    const { data: staffRow } = await supabase
      .from('staff_members')
      .select('id, name')
      .eq('id', input.staffId)
      .eq('tenant_id', input.tenantId)
      .eq('active', true)
      .maybeSingle();

    if (!staffRow) {
      return {
        ok: false,
        errorCode: 'INVALID_STAFF',
        message: 'Selected team member is not active for this store.',
      };
    }
    resolvedStaffName = staffRow.name;
  }

  const { data: serviceRows, error: servicesError } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price_usd, price_eur')
    .eq('tenant_id', input.tenantId)
    .eq('active', true)
    .in('id', input.serviceIds);

  if (servicesError || !serviceRows || serviceRows.length === 0) {
    return {
      ok: false,
      errorCode: 'INVALID_SERVICES',
      message: 'Selected services were not found.',
    };
  }

  const catalog = mapCatalogServices(serviceRows as DbServiceRow[]);
  const cart = calculateMultiServiceCart(catalog, input.serviceIds);

  const { data: busyRows, error: busyError } = await supabase.rpc('get_public_busy_slots', {
    p_tenant_id: input.tenantId,
    p_booking_date: input.bookingDate,
  });

  if (busyError) {
    return {
      ok: false,
      errorCode: 'AVAILABILITY_CHECK_FAILED',
      message: 'Could not verify schedule availability.',
    };
  }

  const busySlots = ((busyRows ?? []) as DbBusySlotRow[]).map((row) =>
    PublicBusySlotSchema.parse({
      staffId: row.staff_id,
      bookingDate: String(row.booking_date),
      bookingTime: row.booking_time,
      totalDurationMinutes: Number(row.total_duration_minutes),
    })
  );

  const availableSlots = computeAvailableTimeSlots({
    openingTime: tenant.opening_time,
    closingTime: tenant.closing_time,
    requiredDurationMinutes: cart.totalDurationMinutes,
    targetStaffId: input.staffId,
    busySlots,
  });

  if (!availableSlots.includes(input.bookingTime)) {
    return {
      ok: false,
      errorCode: 'SLOT_UNAVAILABLE',
      message: 'This time window cannot accommodate all selected services. Please choose another time.',
    };
  }

  const bookingCode = `BG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const selectedServiceNames = cart.selectedServices.map((s) => s.name);

  const { error: insertError } = await supabase.from('bookings').insert({
    tenant_id: input.tenantId,
    staff_id: input.staffId,
    staff_name: resolvedStaffName,
    booking_code: bookingCode,
    client_name: input.clientName,
    client_phone: input.clientPhone,
    selected_services_json: selectedServiceNames,
    total_duration_minutes: cart.totalDurationMinutes,
    total_price_usd: cart.totalPriceUsd,
    total_price_eur: cart.totalPriceEur,
    currency: input.currency,
    booking_date: input.bookingDate,
    booking_time: input.bookingTime,
    source: 'public_link',
    status: 'confirmed',
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        ok: false,
        errorCode: 'SLOT_ALREADY_TAKEN',
        message: 'This time slot was just booked by another client. Please select a different time.',
      };
    }
    return {
      ok: false,
      errorCode: 'BOOKING_INSERT_FAILED',
      message: 'Failed to confirm booking.',
    };
  }

  return {
    ok: true,
    data: {
      bookingCode,
      totalDurationMinutes: cart.totalDurationMinutes,
      totalPriceUsd: cart.totalPriceUsd,
      totalPriceEur: cart.totalPriceEur,
      selectedServiceNames,
      bookingDate: input.bookingDate,
      bookingTime: input.bookingTime,
    },
  };
}

/**
 * Zero-Trust Server Action to join the Smart Waitlist on `bookgrid.app/[slug]`.
 */
export async function joinPublicWaitlistAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly queued: true; readonly totalDurationMinutes: number }>> {
  const rateLimit = await checkPublicRateLimit('public_waitlist', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      errorCode: 'RATE_LIMITED',
      message: `Too many waitlist requests. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = CreateWaitlistEntryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: serviceRows, error: servicesError } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price_usd, price_eur')
    .eq('tenant_id', input.tenantId)
    .eq('active', true)
    .in('id', input.serviceIds);

  if (servicesError || !serviceRows || serviceRows.length === 0) {
    return {
      ok: false,
      errorCode: 'INVALID_SERVICES',
      message: 'Selected services are invalid.',
    };
  }

  const catalog = mapCatalogServices(serviceRows as DbServiceRow[]);
  const cart = calculateMultiServiceCart(catalog, input.serviceIds);

  const { error: insertError } = await supabase.from('waitlist_entries').insert({
    tenant_id: input.tenantId,
    client_name: input.clientName,
    client_phone: input.clientPhone,
    desired_date: input.desiredDate,
    desired_services_json: cart.selectedServices.map((s) => s.name),
    total_duration_minutes: cart.totalDurationMinutes,
    total_price_usd: cart.totalPriceUsd,
    total_price_eur: cart.totalPriceEur,
    preferred_time_window: input.preferredTimeWindow,
    status: 'waiting',
  });

  if (insertError) {
    return {
      ok: false,
      errorCode: 'WAITLIST_INSERT_FAILED',
      message: 'Unable to join waitlist at this time.',
    };
  }

  return {
    ok: true,
    data: {
      queued: true,
      totalDurationMinutes: cart.totalDurationMinutes,
    },
  };
}

/**
 * Fetches real-time available time slots for a given tenant, date, staff member,
 * and total multi-service duration without exposing any client PII.
 */
export async function getPublicAvailabilityAction(rawInput: {
  tenantId: string;
  bookingDate: string;
  staffId: string | null;
  totalDurationMinutes: number;
}): Promise<ActionResult<{ readonly availableSlots: readonly string[] }>> {
  const supabase = await createSupabaseServerClient();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, opening_time, closing_time, subscription_status')
    .eq('id', rawInput.tenantId)
    .in('subscription_status', ['trial', 'active'])
    .maybeSingle();

  if (tenantError || !tenant) {
    return { ok: false, errorCode: 'TENANT_NOT_FOUND', message: 'Store unavailable.' };
  }

  const { data: busyRows, error: busyError } = await supabase.rpc('get_public_busy_slots', {
    p_tenant_id: rawInput.tenantId,
    p_booking_date: rawInput.bookingDate,
  });

  if (busyError) {
    return {
      ok: false,
      errorCode: 'AVAILABILITY_ERROR',
      message: 'Could not load available slots.',
    };
  }

  const busySlots = ((busyRows ?? []) as DbBusySlotRow[]).map((row) =>
    PublicBusySlotSchema.parse({
      staffId: row.staff_id,
      bookingDate: String(row.booking_date),
      bookingTime: row.booking_time,
      totalDurationMinutes: Number(row.total_duration_minutes),
    })
  );

  const availableSlots = computeAvailableTimeSlots({
    openingTime: tenant.opening_time,
    closingTime: tenant.closing_time,
    requiredDurationMinutes: Math.max(5, rawInput.totalDurationMinutes),
    targetStaffId: rawInput.staffId,
    busySlots,
  });

  return {
    ok: true,
    data: { availableSlots },
  };
}
