'use server';

import crypto from 'node:crypto';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupportedCurrency } from '@/schemas/env.schema';
import {
  MAX_STAFF_INCLUDED_PER_TENANT,
  NO_HTML_TAGS_REGEX,
  ISO_DATE_REGEX,
} from '@/schemas/tenant.schema';
import { WaitlistCandidateSchema } from '@/schemas/waitlist.schema';
import {
  findMatchingWaitlistCandidates,
  type MatchedWaitlistOpportunity,
} from '@/services/waitlist/vacancy-matcher';
import {
  parseAndSanitizeRawSchedule,
  type SanitizedScheduleImportResult,
} from '@/services/ai-importer/schedule-parser';
import type { ActionResult } from './action-result';

interface AuthenticatedTenantContext {
  readonly supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  readonly userId: string;
  readonly tenant: {
    readonly id: string;
    readonly businessName: string;
    readonly currency: SupportedCurrency;
  };
}

/**
 * Verifies user session strictly via `supabase.auth.getUser()` (OWASP A01 / Supabase SSR Rule)
 * and resolves the authenticated merchant's owned tenant.
 */
async function requireAuthenticatedTenant(): Promise<AuthenticatedTenantContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, business_name, currency')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (tenantError || !tenant) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    tenant: {
      id: tenant.id,
      businessName: tenant.business_name,
      currency: tenant.currency as SupportedCurrency,
    },
  };
}

const CancelBookingInputSchema = z
  .object({
    bookingId: z.string().uuid(),
  })
  .strict();

/**
 * Cancels an existing booking owned by the authenticated tenant and immediately queries
 * the Smart Waitlist Engine for waiting clients whose services fit inside the freed window.
 */
export async function cancelBookingAndFindWaitlistAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly cancelledBookingId: string; readonly matches: readonly MatchedWaitlistOpportunity[] }>> {
  const ctx = await requireAuthenticatedTenant();
  if (!ctx) {
    return { ok: false, errorCode: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = CancelBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid booking ID.' };
  }

  const { data: updatedBooking, error: updateError } = await ctx.supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data.bookingId)
    .eq('tenant_id', ctx.tenant.id)
    .select('id, booking_date, booking_time, total_duration_minutes, staff_name')
    .single();

  if (updateError || !updatedBooking) {
    return {
      ok: false,
      errorCode: 'BOOKING_NOT_FOUND',
      message: 'Booking not found or access denied.',
    };
  }

  const { data: waitingRows, error: waitlistError } = await ctx.supabase
    .from('waitlist_entries')
    .select(
      'id, tenant_id, client_name, client_phone, desired_date, desired_services_json, total_duration_minutes, total_price_usd, total_price_eur, preferred_time_window, created_at'
    )
    .eq('tenant_id', ctx.tenant.id)
    .eq('desired_date', updatedBooking.booking_date)
    .eq('status', 'waiting');

  if (waitlistError) {
    return {
      ok: true,
      data: { cancelledBookingId: updatedBooking.id, matches: [] },
    };
  }

  const candidates = (waitingRows ?? []).map((row) =>
    WaitlistCandidateSchema.parse({
      id: row.id,
      tenantId: row.tenant_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      desiredDate: String(row.desired_date),
      desiredServices: Array.isArray(row.desired_services_json)
        ? row.desired_services_json.map(String)
        : ['Service'],
      totalDurationMinutes: Number(row.total_duration_minutes),
      totalPriceUsd: Number(row.total_price_usd),
      totalPriceEur: Number(row.total_price_eur),
      preferredTimeWindow: row.preferred_time_window,
      createdAt: String(row.created_at),
    })
  );

  const matches = findMatchingWaitlistCandidates(
    {
      tenantId: ctx.tenant.id,
      businessName: ctx.tenant.businessName,
      cancelledBookingId: updatedBooking.id,
      bookingDate: String(updatedBooking.booking_date),
      bookingTime: updatedBooking.booking_time,
      releasedDurationMinutes: Number(updatedBooking.total_duration_minutes),
      staffName: updatedBooking.staff_name,
      currency: ctx.tenant.currency,
    },
    candidates
  );

  return {
    ok: true,
    data: {
      cancelledBookingId: updatedBooking.id,
      matches,
    },
  };
}

const FillVacancyInputSchema = z
  .object({
    cancelledBookingId: z.string().uuid(),
    waitlistEntryId: z.string().uuid(),
  })
  .strict();

/**
 * Promotes a waiting client into a cancelled slot with 1 click (`recovered_from_waitlist`).
 */
export async function fillVacancyFromWaitlistAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly bookingId: string; readonly clientName: string }>> {
  const ctx = await requireAuthenticatedTenant();
  if (!ctx) {
    return { ok: false, errorCode: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = FillVacancyInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid IDs provided.' };
  }

  const { data: waitlistRow, error: wlError } = await ctx.supabase
    .from('waitlist_entries')
    .select('*')
    .eq('id', parsed.data.waitlistEntryId)
    .eq('tenant_id', ctx.tenant.id)
    .eq('status', 'waiting')
    .single();

  if (wlError || !waitlistRow) {
    return { ok: false, errorCode: 'WAITLIST_NOT_FOUND', message: 'Waitlist entry unavailable.' };
  }

  const { data: restoredBooking, error: restoreError } = await ctx.supabase
    .from('bookings')
    .update({
      client_name: waitlistRow.client_name,
      client_phone: waitlistRow.client_phone,
      selected_services_json: waitlistRow.desired_services_json,
      total_duration_minutes: waitlistRow.total_duration_minutes,
      total_price_usd: waitlistRow.total_price_usd,
      total_price_eur: waitlistRow.total_price_eur,
      source: 'waitlist_fill',
      status: 'recovered_from_waitlist',
    })
    .eq('id', parsed.data.cancelledBookingId)
    .eq('tenant_id', ctx.tenant.id)
    .eq('status', 'cancelled')
    .select('id, client_name')
    .single();

  if (restoreError || !restoredBooking) {
    return {
      ok: false,
      errorCode: 'VACANCY_FILL_FAILED',
      message: 'Could not fill the cancelled slot (it may have already been claimed).',
    };
  }

  await ctx.supabase
    .from('waitlist_entries')
    .update({ status: 'promoted_to_booking' })
    .eq('id', waitlistRow.id)
    .eq('tenant_id', ctx.tenant.id);

  return {
    ok: true,
    data: {
      bookingId: restoredBooking.id,
      clientName: restoredBooking.client_name,
    },
  };
}

const ManageStaffActionSchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('create'),
      name: z.string().trim().min(2).max(80).regex(NO_HTML_TAGS_REGEX),
      role: z.string().trim().min(2).max(60).regex(NO_HTML_TAGS_REGEX).default('Specialist'),
    })
    .strict(),
  z
    .object({
      operation: z.literal('toggle_active'),
      staffId: z.string().uuid(),
      active: z.boolean(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('delete'),
      staffId: z.string().uuid(),
    })
    .strict(),
]);

/**
 * Manages up to 5 active team members included at no extra cost per BookGrid tenant.
 */
export async function manageStaffMemberAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly staffId: string; readonly operation: string }>> {
  const ctx = await requireAuthenticatedTenant();
  if (!ctx) {
    return { ok: false, errorCode: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = ManageStaffActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;

  if (input.operation === 'create') {
    const { count } = await ctx.supabase
      .from('staff_members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenant.id)
      .eq('active', true);

    if ((count ?? 0) >= MAX_STAFF_INCLUDED_PER_TENANT) {
      return {
        ok: false,
        errorCode: 'STAFF_QUOTA_EXCEEDED',
        message: `BookGrid includes up to ${MAX_STAFF_INCLUDED_PER_TENANT} active staff members per store.`,
      };
    }

    const { data: created, error: createError } = await ctx.supabase
      .from('staff_members')
      .insert({
        tenant_id: ctx.tenant.id,
        name: input.name,
        role: input.role,
        active: true,
      })
      .select('id')
      .single();

    if (createError || !created) {
      return {
        ok: false,
        errorCode: 'STAFF_CREATE_FAILED',
        message: createError?.message ?? 'Failed to add team member.',
      };
    }

    return { ok: true, data: { staffId: created.id, operation: 'create' } };
  }

  if (input.operation === 'toggle_active') {
    const { error: toggleError } = await ctx.supabase
      .from('staff_members')
      .update({ active: input.active })
      .eq('id', input.staffId)
      .eq('tenant_id', ctx.tenant.id);

    if (toggleError) {
      return {
        ok: false,
        errorCode: 'STAFF_UPDATE_FAILED',
        message: toggleError.message,
      };
    }
    return { ok: true, data: { staffId: input.staffId, operation: 'toggle_active' } };
  }

  const { error: deleteError } = await ctx.supabase
    .from('staff_members')
    .delete()
    .eq('id', input.staffId)
    .eq('tenant_id', ctx.tenant.id);

  if (deleteError) {
    return { ok: false, errorCode: 'STAFF_DELETE_FAILED', message: deleteError.message };
  }

  return { ok: true, data: { staffId: input.staffId, operation: 'delete' } };
}

const ImportScheduleActionSchema = z
  .object({
    targetDate: z.string().regex(ISO_DATE_REGEX),
    rawScheduleText: z.string().trim().min(5).max(15000),
    commitToDatabase: z.boolean().default(false),
  })
  .strict();

/**
 * Parses and sanitizes raw WhatsApp / paper notebook schedule data using AI security guardrails.
 * Only writes to Supabase when `commitToDatabase` is explicitly true.
 */
export async function parseAndImportScheduleAction(
  rawInput: unknown
): Promise<ActionResult<SanitizedScheduleImportResult & { readonly committed: boolean }>> {
  const ctx = await requireAuthenticatedTenant();
  if (!ctx) {
    return { ok: false, errorCode: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = ImportScheduleActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  let sanitized: SanitizedScheduleImportResult;
  try {
    sanitized = parseAndSanitizeRawSchedule({
      tenantId: ctx.tenant.id,
      targetDate: parsed.data.targetDate,
      rawScheduleText: parsed.data.rawScheduleText,
    });
  } catch (err) {
    return {
      ok: false,
      errorCode: 'AI_PARSE_FAILED',
      message: err instanceof Error ? err.message : 'Unable to extract valid appointments.',
    };
  }

  if (parsed.data.commitToDatabase) {
    const rowsToInsert = sanitized.bookings.map((item) => ({
      tenant_id: ctx.tenant.id,
      staff_name: item.staffName,
      booking_code: `BG-AI-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      client_name: item.clientName,
      client_phone: item.clientPhone,
      selected_services_json: item.servicesList,
      total_duration_minutes: item.estimatedDurationMinutes,
      total_price_usd: item.estimatedPriceUsd,
      total_price_eur: item.estimatedPriceEur,
      currency: ctx.tenant.currency,
      booking_date: item.bookingDate,
      booking_time: item.bookingTime,
      source: 'ai_importer',
      status: 'confirmed',
    }));

    const { error: insertError } = await ctx.supabase.from('bookings').insert(rowsToInsert);
    if (insertError) {
      return {
        ok: false,
        errorCode: 'AI_IMPORT_DB_ERROR',
        message: insertError.message,
      };
    }

    const inputHash = crypto
      .createHash('sha256')
      .update(parsed.data.rawScheduleText, 'utf8')
      .digest('hex');

    await ctx.supabase.from('ai_import_logs').insert({
      tenant_id: ctx.tenant.id,
      raw_input_hash: inputHash,
      extracted_count: sanitized.extractedCount,
    });
  }

  return {
    ok: true,
    data: {
      ...sanitized,
      committed: parsed.data.commitToDatabase,
    },
  };
}

const ManageServiceActionSchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('create'),
      name: z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX),
      durationMinutes: z.number().int().min(5).max(480),
      priceUsd: z.number().min(0).max(50000),
      priceEur: z.number().min(0).max(50000),
    })
    .strict(),
  z
    .object({
      operation: z.literal('delete'),
      serviceId: z.string().uuid(),
    })
    .strict(),
]);

/**
 * Creates or removes services priced strictly in USD & EUR for the authenticated tenant.
 */
export async function manageServiceAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly serviceId: string; readonly operation: string }>> {
  const ctx = await requireAuthenticatedTenant();
  if (!ctx) {
    return { ok: false, errorCode: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = ManageServiceActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;
  if (input.operation === 'create') {
    const { data: created, error: createError } = await ctx.supabase
      .from('services')
      .insert({
        tenant_id: ctx.tenant.id,
        name: input.name,
        duration_minutes: input.durationMinutes,
        price_usd: input.priceUsd,
        price_eur: input.priceEur,
        active: true,
      })
      .select('id')
      .single();

    if (createError || !created) {
      return {
        ok: false,
        errorCode: 'SERVICE_CREATE_FAILED',
        message: createError?.message ?? 'Failed to add service.',
      };
    }
    return { ok: true, data: { serviceId: created.id, operation: 'create' } };
  }

  const { error: deleteError } = await ctx.supabase
    .from('services')
    .delete()
    .eq('id', input.serviceId)
    .eq('tenant_id', ctx.tenant.id);

  if (deleteError) {
    return { ok: false, errorCode: 'SERVICE_DELETE_FAILED', message: deleteError.message };
  }

  return { ok: true, data: { serviceId: input.serviceId, operation: 'delete' } };
}
