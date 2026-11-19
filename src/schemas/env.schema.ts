import { z } from 'zod';

/**
 * BookGrid Supported Currencies (100% Global USD & EUR via Paddle / Dodo -> Payoneer)
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR'] as const;
export const SupportedCurrencySchema = z.enum(SUPPORTED_CURRENCIES);
export type SupportedCurrency = z.infer<typeof SupportedCurrencySchema>;

/**
 * Public Client Environment Schema (Safe for Browser & Server)
 */
export const PublicEnvSchema = z
  .object({
    NEXT_PUBLIC_APP_NAME: z.literal('BookGrid').default('BookGrid'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('https://bookgrid.app'),
    NEXT_PUBLIC_DEFAULT_CURRENCY: SupportedCurrencySchema.default('USD'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
    NEXT_PUBLIC_PAYMENT_PROVIDER: z.enum(['paddle', 'dodo']).default('paddle'),
    NEXT_PUBLIC_PADDLE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(5).optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_USD: z.string().min(3).optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_EUR: z.string().min(3).optional(),
  })
  .strict();

/**
 * Server-Only Sensitive Environment Schema (NEVER exposed to client bundles)
 */
export const ServerEnvSchema = PublicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PADDLE_API_KEY: z.string().min(10).optional(),
  PADDLE_WEBHOOK_SECRET: z.string().min(10).optional(),
  DODO_WEBHOOK_SECRET: z.string().min(10).optional(),
  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_API_KEY: z.string().min(10).optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
}).strict();

export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
