import { z } from 'zod';
import { SupportedCurrencySchema } from './env.schema';

/**
 * Common Regex Patterns (Zero-Trust Input Sanitization)
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const E164_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
export const NO_HTML_TAGS_REGEX = /^[^<>]*$/;

export const MAX_STAFF_INCLUDED_PER_TENANT = 5 as const;

export const TenantSlugParamSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3, 'Tenant slug must be at least 3 characters')
      .max(60, 'Tenant slug cannot exceed 60 characters')
      .regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  })
  .strict();

export const TenantCreateSchema = z
  .object({
    slug: z.string().trim().min(3).max(60).regex(SLUG_REGEX),
    businessName: z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX),
    niche: z.enum(['barber', 'clinic', 'auto', 'realtor', 'general']).default('barber'),
    city: z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX),
    whatsappPhone: z.string().trim().regex(E164_PHONE_REGEX, 'Invalid E.164 international phone number'),
    currency: SupportedCurrencySchema.default('USD'),
    openingTime: z.string().regex(TIME_24H_REGEX).default('09:00'),
    closingTime: z.string().regex(TIME_24H_REGEX).default('19:00'),
  })
  .strict();

export const StaffMemberCreateSchema = z
  .object({
    tenantId: z.string().uuid(),
    name: z.string().trim().min(2).max(80).regex(NO_HTML_TAGS_REGEX),
    role: z.string().trim().min(2).max(60).regex(NO_HTML_TAGS_REGEX).default('Specialist'),
    active: z.boolean().default(true),
  })
  .strict();

export const ServiceCreateSchema = z
  .object({
    tenantId: z.string().uuid(),
    name: z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX),
    durationMinutes: z.number().int().min(5).max(480),
    priceUsd: z.number().min(0).max(50000),
    priceEur: z.number().min(0).max(50000),
    active: z.boolean().default(true),
  })
  .strict();

export type TenantSlugParam = z.infer<typeof TenantSlugParamSchema>;
export type TenantCreateInput = z.infer<typeof TenantCreateSchema>;
export type StaffMemberCreateInput = z.infer<typeof StaffMemberCreateSchema>;
export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;
