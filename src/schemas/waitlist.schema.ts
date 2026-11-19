import { z } from 'zod';
import {
  E164_PHONE_REGEX,
  ISO_DATE_REGEX,
  NO_HTML_TAGS_REGEX,
} from './tenant.schema';

/**
 * Smart Waitlist Entry Creation Schema
 */
export const CreateWaitlistEntryInputSchema = z
  .object({
    tenantId: z.string().uuid(),
    clientName: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(NO_HTML_TAGS_REGEX, 'HTML tags are not permitted'),
    clientPhone: z.string().trim().regex(E164_PHONE_REGEX),
    desiredDate: z.string().regex(ISO_DATE_REGEX),
    serviceIds: z.array(z.string().uuid()).min(1).max(10),
    preferredTimeWindow: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(NO_HTML_TAGS_REGEX)
      .default('Anytime'),
  })
  .strict();

export const WaitlistCandidateSchema = z
  .object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    clientName: z.string(),
    clientPhone: z.string(),
    desiredDate: z.string().regex(ISO_DATE_REGEX),
    desiredServices: z.array(z.string().min(1)),
    totalDurationMinutes: z.number().int().min(5).max(720),
    totalPriceUsd: z.number().min(0),
    totalPriceEur: z.number().min(0),
    preferredTimeWindow: z.string(),
    createdAt: z.string(),
  })
  .strict();

export type CreateWaitlistEntryInput = z.infer<typeof CreateWaitlistEntryInputSchema>;
export type WaitlistCandidate = z.infer<typeof WaitlistCandidateSchema>;
