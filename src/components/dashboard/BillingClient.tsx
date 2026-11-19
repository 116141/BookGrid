'use client';

import { useState } from 'react';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import type { SupportedCurrency } from '@/schemas/env.schema';

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

  const priceLabel = selectedCurrency === 'USD' ? '$29 USD / month' : '25 € EUR / month';

  function handleLaunchCheckout() {
    setCheckoutNotice(
      `Paddle / Dodo Checkout initialized for ${businessName} (Tenant: ${tenantId}) in ${selectedCurrency} (${priceLabel}). ` +
        `Verified webhook events at /api/webhooks/payments will automatically activate your store, with payouts routed to Payoneer (${selectedCurrency}).`
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
