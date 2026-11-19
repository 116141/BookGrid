import { z } from 'zod';
import { SupportedCurrencySchema } from './env.schema';

export const PaymentProviderSchema = z.enum(['paddle', 'dodo']);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const SubscriptionWebhookPayloadSchema = z
  .object({
    eventId: z.string().trim().min(5).max(120),
    provider: PaymentProviderSchema,
    eventType: z.enum([
      'subscription.activated',
      'subscription.updated',
      'subscription.past_due',
      'subscription.canceled',
    ]),
    tenantId: z.string().uuid(),
    externalSubscriptionId: z.string().trim().min(3).max(120),
    currency: SupportedCurrencySchema,
    amount: z.number().min(0).max(10000),
    occurredAtUnixSeconds: z.number().int().positive(),
  })
  .strict();

export type SubscriptionWebhookPayload = z.infer<typeof SubscriptionWebhookPayloadSchema>;
