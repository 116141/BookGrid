import { z } from 'zod';

export const ExtendTrialInputSchema = z
  .object({
    tenantId: z.string().uuid(),
    days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  })
  .strict();

export const UpdateTenantStatusInputSchema = z
  .object({
    tenantId: z.string().uuid(),
    status: z.enum(['trial', 'active', 'vip', 'suspended', 'past_due', 'canceled']),
  })
  .strict();

export const TenantIdInputSchema = z
  .object({
    tenantId: z.string().uuid(),
  })
  .strict();

export const CreateAnnouncementInputSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    message: z.string().trim().min(4).max(500),
    tone: z.enum(['info', 'warning', 'success']).default('info'),
    isActive: z.boolean().default(true),
  })
  .strict();

export const ToggleAnnouncementInputSchema = z
  .object({
    announcementId: z.string().uuid(),
    isActive: z.boolean(),
  })
  .strict();

export const AnnouncementIdInputSchema = z
  .object({
    announcementId: z.string().uuid(),
  })
  .strict();

export type ExtendTrialInput = z.infer<typeof ExtendTrialInputSchema>;
export type UpdateTenantStatusInput = z.infer<typeof UpdateTenantStatusInputSchema>;
export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementInputSchema>;
