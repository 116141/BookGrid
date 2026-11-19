import 'server-only';
import crypto from 'node:crypto';
import { z } from 'zod';
import {
  SubscriptionWebhookPayloadSchema,
  type SubscriptionWebhookPayload,
} from '@/schemas/payment.schema';

export const MAX_WEBHOOK_AGE_SECONDS = 300 as const; // 5-minute replay attack window

export interface WebhookSignatureVerificationInput {
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly webhookSecret: string;
  readonly currentUnixSeconds?: number;
}

/**
 * Cryptographic HMAC-SHA256 Signature Verifier for Paddle / Dodo Payments Webhooks.
 * Supports Paddle format (`ts=1700000000;h1=abcdef...`) and standard `t=...,v1=...` headers.
 * Enforces constant-time comparison (`crypto.timingSafeEqual`) and 5-minute replay protection.
 */
export function verifyWebhookSignatureOrThrow(input: WebhookSignatureVerificationInput): void {
  if (!input.signatureHeader) {
    throw new Error('WEBHOOK_UNAUTHORIZED: Missing cryptographic signature header.');
  }

  if (!input.webhookSecret || input.webhookSecret.length < 10) {
    throw new Error('WEBHOOK_MISCONFIGURED: Server webhook secret is missing or invalid.');
  }

  const parts = input.signatureHeader.split(/[;,]/).map((p) => p.trim());
  let timestampStr: string | undefined;
  let receivedHex: string | undefined;

  for (const part of parts) {
    const [key, val] = part.split('=');
    if ((key === 'ts' || key === 't') && val) {
      timestampStr = val;
    } else if ((key === 'h1' || key === 'v1') && val) {
      receivedHex = val;
    }
  }

  if (!timestampStr || !receivedHex) {
    throw new Error('WEBHOOK_UNAUTHORIZED: Malformed signature header.');
  }

  const eventTimestamp = Number(timestampStr);
  const nowSeconds = input.currentUnixSeconds ?? Math.floor(Date.now() / 1000);

  if (
    !Number.isFinite(eventTimestamp) ||
    Math.abs(nowSeconds - eventTimestamp) > MAX_WEBHOOK_AGE_SECONDS
  ) {
    throw new Error('WEBHOOK_REPLAY_DETECTED: Webhook timestamp is outside the 5-minute tolerance window.');
  }

  const signedPayload = `${timestampStr}:${input.rawBody}`;
  const computedHex = crypto
    .createHmac('sha256', input.webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const computedBuf = Buffer.from(computedHex, 'utf8');
  const receivedBuf = Buffer.from(receivedHex, 'utf8');

  if (
    computedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(computedBuf, receivedBuf)
  ) {
    throw new Error('WEBHOOK_UNAUTHORIZED: HMAC-SHA256 signature mismatch.');
  }
}

const PaddleV2WebhookSchema = z.object({
  event_id: z.string().trim().min(5).max(120),
  event_type: z.string().trim().min(3).max(80),
  occurred_at: z.string().trim().optional(),
  data: z.object({
    id: z.string().trim().min(3).max(120),
    subscription_id: z.string().trim().optional(),
    currency_code: z.enum(['USD', 'EUR']).optional(),
    custom_data: z
      .object({
        tenant_id: z.string().uuid(),
        currency: z.enum(['USD', 'EUR']).optional(),
      })
      .passthrough(),
  }),
});

function mapPaddleEventType(
  paddleEventType: string
): SubscriptionWebhookPayload['eventType'] | null {
  switch (paddleEventType) {
    case 'subscription.created':
    case 'subscription.activated':
    case 'transaction.completed':
      return 'subscription.activated';
    case 'subscription.updated':
      return 'subscription.updated';
    case 'subscription.past_due':
      return 'subscription.past_due';
    case 'subscription.canceled':
      return 'subscription.canceled';
    default:
      return null;
  }
}

/**
 * Parses and validates the verified raw JSON body against `SubscriptionWebhookPayloadSchema`
 * or official Paddle Billing v2 webhook payloads.
 */
export function parseVerifiedSubscriptionWebhook(rawBody: string): SubscriptionWebhookPayload {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    throw new Error('WEBHOOK_BAD_PAYLOAD: Invalid JSON body.');
  }

  const directResult = SubscriptionWebhookPayloadSchema.safeParse(parsedJson);
  if (directResult.success) {
    return directResult.data;
  }

  const paddleResult = PaddleV2WebhookSchema.safeParse(parsedJson);
  if (paddleResult.success) {
    const evt = paddleResult.data;
    const mappedType = mapPaddleEventType(evt.event_type);
    if (!mappedType) {
      throw new Error(`WEBHOOK_UNSUPPORTED_EVENT: ${evt.event_type}`);
    }

    const currency = evt.data.currency_code ?? evt.data.custom_data.currency ?? 'USD';
    const occurredAtUnixSeconds = evt.occurred_at
      ? Math.max(1, Math.floor(new Date(evt.occurred_at).getTime() / 1000))
      : Math.floor(Date.now() / 1000);

    return SubscriptionWebhookPayloadSchema.parse({
      eventId: evt.event_id,
      provider: 'paddle',
      eventType: mappedType,
      tenantId: evt.data.custom_data.tenant_id,
      externalSubscriptionId: evt.data.subscription_id ?? evt.data.id,
      currency,
      amount: currency === 'EUR' ? 25 : 29,
      occurredAtUnixSeconds,
    });
  }

  throw new Error(
    `WEBHOOK_SCHEMA_INVALID: ${directResult.error.issues.map((i) => i.message).join('; ')}`
  );
}
