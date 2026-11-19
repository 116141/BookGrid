import { z } from 'zod';
import { SupportedCurrencySchema } from './env.schema';
import {
  E164_PHONE_REGEX,
  NO_HTML_TAGS_REGEX,
  SLUG_REGEX,
} from './tenant.schema';

export const SignInSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').max(120),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  })
  .strict();

export const SignUpMerchantSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').max(120),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    businessName: z
      .string()
      .trim()
      .min(2, 'Business name must be at least 2 characters')
      .max(100)
      .regex(NO_HTML_TAGS_REGEX, 'HTML tags are not permitted'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'URL slug must be at least 3 characters')
      .max(60)
      .regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    niche: z.enum(['barber', 'clinic', 'auto', 'realtor', 'general']).default('barber'),
    city: z.string().trim().min(2).max(100).regex(NO_HTML_TAGS_REGEX),
    whatsappPhone: z
      .string()
      .trim()
      .regex(E164_PHONE_REGEX, 'WhatsApp phone must follow international E.164 format'),
    currency: SupportedCurrencySchema.default('USD'),
  })
  .strict();

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpMerchantInput = z.infer<typeof SignUpMerchantSchema>;
