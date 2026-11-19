'use client';

import { useRef, useState } from 'react';
import Script from 'next/script';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import type { SupportedCurrency } from '@/schemas/env.schema';

interface PaddleCheckoutOpenOptions {
  readonly items: readonly { readonly priceId: string; readonly quantity: number }[];
  readonly customData?: Readonly<Record<string, string>>;
  readonly settings?: {
    readonly displayMode?: 'overlay' | 'inline';
    readonly theme?: 'light' | 'dark';
    readonly successUrl?: string;
  };
}

interface PaddleGlobal {
  readonly Environment?: {
    readonly set: (env: 'sandbox' | 'production') => void;
  };
  readonly Initialize: (options: { readonly token: string }) => void;
  readonly Checkout: {
    readonly open: (options: PaddleCheckoutOpenOptions) => void;
  };
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

interface BillingClientProps {
  readonly tenantId: string;
  readonly businessName: string;
  readonly defaultCurrency: SupportedCurrency;
  readonly subscriptionStatus: string;
  readonly trialEndsAt: string;
  readonly paymentProvider: string;
}

export function BillingClient({
  tenantId,
  businessName,
  defaultCurrency,
  subscriptionStatus,
  trialEndsAt,
  paymentProvider,
}: BillingClientProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [paddleScriptReady, setPaddleScriptReady] = useState(false);
  const paddleInitializedRef = useRef(false);

  const priceLabel = selectedCurrency === 'USD' ? '$29 USD / month' : '25 € EUR / month';

  function handleLaunchCheckout() {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
    const paddleEnv =
      process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' ? 'sandbox' : 'production';
    const priceId =
      selectedCurrency === 'USD'
        ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_USD?.trim()
        : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_EUR?.trim();

    if (!clientToken || !priceId) {
      setCheckoutNotice(
        `Paddle checkout is not configured yet for ${selectedCurrency}. Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_PRICE_ID_${selectedCurrency} in Vercel Environment Variables.`
      );
      return;
    }

    const paddle = typeof window !== 'undefined' ? window.Paddle : undefined;
    if (!paddle) {
      setCheckoutNotice('Loading Paddle Checkout... please try again in a moment.');
      return;
    }

    if (!paddleInitializedRef.current) {
      if (paddleEnv === 'sandbox') {
        paddle.Environment?.set('sandbox');
      }
      paddle.Initialize({ token: clientToken });
      paddleInitializedRef.current = true;
    }

    setCheckoutNotice(null);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: {
        tenant_id: tenantId,
        currency: selectedCurrency,
      },
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        successUrl: `${window.location.origin}/billing?checkout=success`,
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => setPaddleScriptReady(true)}
      />
      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Global SaaS Subscription
            </span>
            <h1 className="text-xl font-bold text-[#0F172A]">Billing &amp; Plan Status</h1>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              subscriptionStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : subscriptionStatus === 'trial'
                ? 'bg-slate-100 text-[#0F172A] border-slate-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {subscriptionStatus}
          </span>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Store / Tenant:</span>
            <span className="font-semibold text-[#0F172A]">{businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Trial window ends:</span>
            <span className="font-mono text-[#0F172A]">{trialEndsAt.slice(0, 10)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Merchant of Record:</span>
            <span className="font-semibold text-[#0F172A] uppercase">{paymentProvider} → Payoneer</span>
          </div>
        </div>

        {/* USD / EUR CURRENCY SWITCHER */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Select billing currency (USD or EUR only)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCurrency('USD')}
              className={`p-3.5 rounded-xl border text-left transition ${
                selectedCurrency === 'USD'
                  ? 'bg-slate-50 border-2 border-[#0F172A]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-semibold text-slate-600 block">US Dollar (USD)</span>
              <span className="text-lg font-bold text-[#0F172A]">$29 / month</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCurrency('EUR')}
              className={`p-3.5 rounded-xl border text-left transition ${
                selectedCurrency === 'EUR'
                  ? 'bg-slate-50 border-2 border-[#0F172A]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-semibold text-slate-600 block">Euro (EUR)</span>
              <span className="text-lg font-bold text-[#0F172A]">25 € / month</span>
            </button>
          </div>
        </div>

        <ul className="text-xs text-slate-600 space-y-2 pt-1">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
            Up to <b>5 team members included</b> at zero extra per-seat charge
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
            Multi-service cart duration calculator &amp; anti-double-booking protection
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
            Smart Waitlist automatic gap-filling &amp; AI Schedule Importer
          </li>
        </ul>

        {checkoutNotice && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {checkoutNotice}
          </div>
        )}

        <button
          type="button"
          onClick={handleLaunchCheckout}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#0F172A] text-white font-semibold text-sm hover:bg-slate-800 transition"
        >
          <CreditCard className="w-4 h-4" strokeWidth={1.75} />
          Upgrade / Subscribe — {priceLabel}
        </button>

        <p className="inline-flex items-center justify-center gap-1.5 w-full text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          Encrypted checkout powered by Paddle / Dodo Payments
        </p>
      </div>
    </div>
  );
}
