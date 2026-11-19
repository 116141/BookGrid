import { z } from 'zod';
import {
  E164_PHONE_REGEX,
  ISO_DATE_REGEX,
  NO_HTML_TAGS_REGEX,
  TIME_24H_REGEX,
} from './tenant.schema';

/**
 * Raw Input Schema for AI Schedule Importer (WhatsApp text or OCR text)
 */
export const RawAIImportRequestSchema = z
  .object({
    tenantId: z.string().uuid(),
    targetDate: z.string().regex(ISO_DATE_REGEX),
    rawScheduleText: z
      .string()
      .trim()
      .min(5, 'Schedule text is too short to extract appointments')
      .max(15000, 'Schedule text exceeds maximum batch limit of 15,000 characters'),
  })
  .strict();

/**
 * Deterministic Output Schema for Each AI-Extracted Booking (OWASP LLM02 Guardrail)
 */
export const AIExtractedBookingItemSchema = z
  .object({
    clientName: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(NO_HTML_TAGS_REGEX, 'HTML or script characters rejected'),
    clientPhone: z
      .string()
      .trim()
      .regex(E164_PHONE_REGEX, 'Phone number must be normalized to E.164 format'),
    bookingDate: z.string().regex(ISO_DATE_REGEX),
    bookingTime: z.string().regex(TIME_24H_REGEX),
    servicesList: z.array(z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX)).min(1).max(10),
    staffName: z.string().trim().min(2).max(80).regex(NO_HTML_TAGS_REGEX).default('Any Specialist'),
    estimatedDurationMinutes: z.number().int().min(10).max(480),
    estimatedPriceUsd: z.number().min(0).max(50000),
    estimatedPriceEur: z.number().min(0).max(50000),
  })
  .strict();

export const AIImportedBookingArraySchema = z
  .array(AIExtractedBookingItemSchema)
  .min(1, 'No valid appointments could be extracted')
  .max(100, 'Maximum 100 appointments per import batch');

export type RawAIImportRequest = z.infer<typeof RawAIImportRequestSchema>;
export type AIExtractedBookingItem = z.infer<typeof AIExtractedBookingItemSchema>;
