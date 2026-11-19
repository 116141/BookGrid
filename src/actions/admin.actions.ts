'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdminForAction } from '@/lib/auth/super-admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  AnnouncementIdInputSchema,
  CreateAnnouncementInputSchema,
  ExtendTrialInputSchema,
  TenantIdInputSchema,
  ToggleAnnouncementInputSchema,
  UpdateTenantStatusInputSchema,
} from '@/schemas/admin.schema';
import {
  getAdminTenantDetails,
  recordAdminAuditLog,
  type AdminTenantDetails,
} from '@/services/admin/admin-queries.service';

export interface AdminActionResult<T = undefined> {
  readonly ok: boolean;
  readonly message?: string;
  readonly data?: T;
}

export async function extendTenantTrialAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = ExtendTrialInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid trial extension request.' };
  }

  const admin = createSupabaseAdminClient();
  const { data: tenant, error: fetchError } = await admin
    .from('tenants')
    .select('id, trial_ends_at')
    .eq('id', parsed.data.tenantId)
    .maybeSingle();

  if (fetchError || !tenant) {
    return { ok: false, message: 'Tenant not found.' };
  }

  const baseMs = Math.max(Date.now(), new Date(String(tenant.trial_ends_at)).getTime());
  const nextEndsAt = new Date(baseMs + parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from('tenants')
    .update({ trial_ends_at: nextEndsAt, subscription_status: 'trial' })
    .eq('id', parsed.data.tenantId);

  if (updateError) {
    return { ok: false, message: 'Failed to extend trial.' };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'EXTEND_TRIAL',
    targetTenantId: parsed.data.tenantId,
    details: { daysAdded: parsed.data.days, nextEndsAt },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tenants');
  return { ok: true, message: `Trial extended by +${parsed.data.days} days.` };
}

export async function updateTenantStatusAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = UpdateTenantStatusInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid status update.' };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('tenants')
    .update({ subscription_status: parsed.data.status })
    .eq('id', parsed.data.tenantId);

  if (error) {
    return { ok: false, message: `Failed to update status: ${error.message}` };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'UPDATE_TENANT_STATUS',
    targetTenantId: parsed.data.tenantId,
    details: { newStatus: parsed.data.status },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tenants');
  return { ok: true, message: `Status updated to ${parsed.data.status.toUpperCase()}.` };
}

export async function inspectTenantDetailsAction(
  rawInput: unknown
): Promise<AdminActionResult<AdminTenantDetails>> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = TenantIdInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid tenant ID.' };
  }

  const details = await getAdminTenantDetails(parsed.data.tenantId);
  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'INSPECT_TENANT',
    targetTenantId: parsed.data.tenantId,
  });

  return { ok: true, data: details };
}

export async function deleteTenantAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = TenantIdInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid tenant ID.' };
  }

  const admin = createSupabaseAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, slug, business_name')
    .eq('id', parsed.data.tenantId)
    .maybeSingle();

  const { error } = await admin.from('tenants').delete().eq('id', parsed.data.tenantId);
  if (error) {
    return { ok: false, message: `Failed to delete tenant: ${error.message}` };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'DELETE_TENANT',
    targetTenantId: parsed.data.tenantId,
    details: { slug: tenant?.slug ?? null, businessName: tenant?.business_name ?? null },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tenants');
  return { ok: true, message: 'Store deleted.' };
}

export async function createAnnouncementAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = CreateAnnouncementInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid announcement.' };
  }

  const admin = createSupabaseAdminClient();
  if (parsed.data.isActive) {
    await admin.from('system_announcements').update({ is_active: false }).eq('is_active', true);
  }

  const { error } = await admin.from('system_announcements').insert({
    title: parsed.data.title,
    message: parsed.data.message,
    tone: parsed.data.tone,
    is_active: parsed.data.isActive,
    created_by_email: adminCtx.email,
  });

  if (error) {
    return { ok: false, message: `Database error: ${error.message}` };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'CREATE_ANNOUNCEMENT',
    details: { title: parsed.data.title, tone: parsed.data.tone, isActive: parsed.data.isActive },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/agenda');
  return { ok: true, message: 'Announcement published.' };
}

export async function toggleAnnouncementAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = ToggleAnnouncementInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid toggle request.' };
  }

  const admin = createSupabaseAdminClient();
  if (parsed.data.isActive) {
    await admin.from('system_announcements').update({ is_active: false }).eq('is_active', true);
  }

  const { error } = await admin
    .from('system_announcements')
    .update({ is_active: parsed.data.isActive, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.announcementId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'TOGGLE_ANNOUNCEMENT',
    details: { announcementId: parsed.data.announcementId, isActive: parsed.data.isActive },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/agenda');
  return { ok: true };
}

export async function deleteAnnouncementAction(rawInput: unknown): Promise<AdminActionResult> {
  const adminCtx = await requireSuperAdminForAction();
  const parsed = AnnouncementIdInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid announcement ID.' };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('system_announcements')
    .delete()
    .eq('id', parsed.data.announcementId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await recordAdminAuditLog({
    adminEmail: adminCtx.email,
    action: 'DELETE_ANNOUNCEMENT',
    details: { announcementId: parsed.data.announcementId },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/agenda');
  return { ok: true };
}
