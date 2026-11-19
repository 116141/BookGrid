import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { PaymentProvider, SubscriptionWebhookPayload } from '@/schemas/payment.schema';
import {
  parseVerifiedSubscriptionWebhook,
  verifyWebhookSignatureOrThrow,
} from '@/services/payments/webhook-verifier';

function resolveSubscriptionStatus(
  eventType: SubscriptionWebhookPayload['eventType']
): 'active' | 'past_due' | 'canceled' {
  switch (eventType) {
    case 'subscription.activated':
    case 'subscription.updated':
      return 'active';
    case 'subscription.past_due':
      return 'past_due';
    case 'subscription.canceled':
      return 'canceled';
  }
}

/**
 * Cryptographically Verified Payment Webhook Handler (`/api/webhooks/payments`)
 * Supports Paddle & Dodo Payments (Merchant of Record -> Payoneer USD/EUR Payouts).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();

  const paddleSignature = request.headers.get('paddle-signature');
  const dodoSignature = request.headers.get('webhook-signature');

  let provider: PaymentProvider;
  let signatureHeader: string | null;
  let webhookSecret: string | undefined;

  if (paddleSignature) {
    provider = 'paddle';
    signatureHeader = paddleSignature;
    webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  } else if (dodoSignature) {
    provider = 'dodo';
    signatureHeader = dodoSignature;
    webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  } else {
    return NextResponse.json(
      { error: 'Missing Paddle-Signature or webhook-signature header' },
      { status: 401 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: `Webhook secret not configured for ${provider}` },
      { status: 500 }
    );
  }

  try {
    verifyWebhookSignatureOrThrow({
      rawBody,
      signatureHeader,
      webhookSecret,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 401 });
  }

  let payload: SubscriptionWebhookPayload;
  try {
    payload = parseVerifiedSubscriptionWebhook(rawBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();

  // 1. Idempotency Guard: Register event_id in `payment_webhook_events`
  const { error: eventInsertError } = await adminClient
    .from('payment_webhook_events')
    .insert({
      event_id: payload.eventId,
      provider: payload.provider,
      event_type: payload.eventType,
      tenant_id: payload.tenantId,
      currency: payload.currency,
      amount: payload.amount,
    });

  if (eventInsertError) {
    if (eventInsertError.code === '23505') {
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: 'Failed to record webhook idempotency event' },
      { status: 500 }
    );
  }

  // 2. Update Tenant Subscription Status & Billing Currency (USD / EUR)
  const nextStatus = resolveSubscriptionStatus(payload.eventType);
  const { error: tenantUpdateError } = await adminClient
    .from('tenants')
    .update({
      subscription_status: nextStatus,
      payment_provider: payload.provider,
      external_subscription_id: payload.externalSubscriptionId,
      currency: payload.currency,
    })
    .eq('id', payload.tenantId);

  if (tenantUpdateError) {
    return NextResponse.json(
      { error: 'Failed to update tenant subscription status' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      received: true,
      tenantId: payload.tenantId,
      subscriptionStatus: nextStatus,
      currency: payload.currency,
    },
    { status: 200 }
  );
}
