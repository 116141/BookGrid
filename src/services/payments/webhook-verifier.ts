import 'server-only';
import crypto from 'node:crypto';
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

/**
 * Parses and validates the verified raw JSON body against `SubscriptionWebhookPayloadSchema`.
 */
export function parseVerifiedSubscriptionWebhook(rawBody: string): SubscriptionWebhookPayload {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    throw new Error('WEBHOOK_BAD_PAYLOAD: Invalid JSON body.');
  }

  const result = SubscriptionWebhookPayloadSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(
      `WEBHOOK_SCHEMA_INVALID: ${result.error.issues.map((i) => i.message).join('; ')}`
    );
  }

  return result.data;
}
