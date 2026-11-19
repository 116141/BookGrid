import { z } from 'zod';
import { SupportedCurrencySchema } from './env.schema';
import {
  E164_PHONE_REGEX,
  ISO_DATE_REGEX,
  NO_HTML_TAGS_REGEX,
  TIME_24H_REGEX,
} from './tenant.schema';

/**
 * Multi-Service Cart Item (Resolved from Database on the Server — Never Trusted from Client)
 */
export const CatalogServiceItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    durationMinutes: z.number().int().min(5).max(480),
    priceUsd: z.number().min(0),
    priceEur: z.number().min(0),
  })
  .strict();

/**
 * Zero-Trust Public Booking Request Schema (bookgrid.app/[slug])
 * Note: Prices and durations are NOT accepted from the client request;
 * the server recalculates them from the selected `serviceIds`.
 */
export const CreateBookingInputSchema = z
  .object({
    tenantId: z.string().uuid(),
    staffId: z.string().uuid().nullable(),
    serviceIds: z
      .array(z.string().uuid())
      .min(1, 'At least one service must be selected in the cart')
      .max(10, 'Maximum 10 services per single visit'),
    clientName: z
      .string()
      .trim()
      .min(2, 'Client name must have at least 2 characters')
      .max(80, 'Client name cannot exceed 80 characters')
      .regex(NO_HTML_TAGS_REGEX, 'HTML tags are not permitted'),
    clientPhone: z
      .string()
      .trim()
      .regex(E164_PHONE_REGEX, 'Phone number must follow international E.164 format'),
    bookingDate: z.string().regex(ISO_DATE_REGEX, 'Date must be YYYY-MM-DD'),
    bookingTime: z.string().regex(TIME_24H_REGEX, 'Time must be HH:mm (24h)'),
    currency: SupportedCurrencySchema,
  })
  .strict();

export const PublicBusySlotSchema = z
  .object({
    staffId: z.string().uuid().nullable(),
    bookingDate: z.string().regex(ISO_DATE_REGEX),
    bookingTime: z.string().regex(TIME_24H_REGEX),
    totalDurationMinutes: z.number().int().min(5).max(720),
  })
  .strict();

export type CatalogServiceItem = z.infer<typeof CatalogServiceItemSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;
export type PublicBusySlot = z.infer<typeof PublicBusySlotSchema>;
