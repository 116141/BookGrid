'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BookGridLogo } from '@/components/brand/BookGridLogo';
import type { SupportedCurrency } from '@/schemas/env.schema';

export function LandingCurrencyShowcase() {
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [demoCombo, setDemoCombo] = useState<boolean>(true);

  const planPrice = currency === 'USD' ? '$29' : '25 €';
  const planSuffix = currency === 'USD' ? 'USD / month' : 'EUR / month';
  const demoTotalPrice =
    currency === 'USD' ? (demoCombo ? '$60.00 USD' : '$35.00 USD') : demoCombo ? '43.00 € EUR' : '25.00 € EUR';
  const demoDuration = demoCombo ? '60 min' : '40 min';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <BookGridLogo showByline />

          <div className="flex items-center gap-3">
            {/* USD / EUR SWITCHER */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currency === 'USD'
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  currency === 'EUR'
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                EUR (€)
              </button>
            </div>

            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0F172A] transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-[#0F172A] text-white font-semibold text-xs hover:bg-slate-800 transition"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ASYMMETRIC EDITORIAL HERO (CAL.COM / STRIPE STYLE) */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT: CLEAR VALUE PROPOSITION */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                Scheduling infrastructure for service businesses
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.12]">
                Simple, reliable booking for teams—without per-seat pricing.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Give your clients a clean booking link at{' '}
                <span className="font-mono text-sm text-[#0F172A] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  bookgrid.app/[slug]
                </span>
                . Support multi-service appointments, include up to 5 staff members at one flat rate,
                and recover last-minute cancellations automatically.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F172A] text-white font-semibold text-sm hover:bg-slate-800 transition"
                >
                  Create your booking page
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Merchant sign in
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={2.25} />
                  14-day free trial
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={2.25} />
                  Up to 5 team members included
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={2.25} />
                  {planPrice} {planSuffix}
                </span>
              </div>
            </div>

            {/* RIGHT: REALISTIC INTERACTIVE PRODUCT PREVIEW CARD */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">Atlantic Barber Studio</p>
                    <p className="text-[11px] font-mono text-slate-500">bookgrid.app/atlantic-barber</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    Live preview
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      1. Select services (auto-calculates time)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg border-2 border-[#0F172A] bg-slate-50">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                          <span>Skin Fade Haircut</span>
                          <span>{currency === 'USD' ? '$35' : '25 €'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">40 min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDemoCombo((prev) => !prev)}
                        className={`p-3 rounded-lg border text-left transition ${
                          demoCombo
                            ? 'border-2 border-[#0F172A] bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                          <span>Hot Towel Beard</span>
                          <span>{currency === 'USD' ? '$25' : '18 €'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          +20 min {demoCombo ? '(Selected)' : '(Click to add)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      2. Available continuous slots ({demoDuration})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {['09:30', '11:00', '14:30', '16:00'].map((slot, idx) => (
                        <div
                          key={slot}
                          className={`py-2 rounded-lg text-center text-xs font-semibold border ${
                            idx === 1
                              ? 'bg-[#0F172A] text-white border-[#0F172A]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Total: <b className="text-[#0F172A]">{demoDuration}</b> •{' '}
                      <b className="text-[#0F172A]">{demoTotalPrice}</b>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                      No account needed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID (CLEAN EDITORIAL CARDS) */}
        <section className="border-t border-slate-200 bg-white py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Built around the real bottlenecks of service businesses
              </h2>
              <p className="text-sm text-slate-600">
                Everything you need to run a multi-staff calendar without enterprise bloat or hidden fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2.5">
                <Layers className="w-5 h-5 text-[#0F172A]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#0F172A]">Multi-Service Cart</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clients book combined services in one visit. BookGrid sums durations and reserves a
                  continuous slot automatically.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2.5">
                <Users className="w-5 h-5 text-[#0F172A]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#0F172A]">Up to 5 Staff Included</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Add up to 5 active team members with independent schedules for one flat monthly price.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2.5">
                <CalendarCheck className="w-5 h-5 text-[#0F172A]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#0F172A]">Smart Waitlist Fill</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When a client cancels, BookGrid matches waiting clients whose services fit that exact
                  gap so you fill the slot in one click.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#0F172A]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#0F172A]">AI Schedule Import</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste messy WhatsApp messages or paper notebook notes to import existing bookings in
                  seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING (USD & EUR ONLY) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-3 max-w-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Flat-Rate Pricing ({currency})
                </span>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  BookGrid Pro — All Features Included
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                    Dedicated booking link: <code className="text-[#0F172A]">bookgrid.app/your-shop</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                    Up to <b>5 team members</b> included ($0 extra per seat)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                    Multi-service cart, smart waitlist &amp; AI schedule importer
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-6 text-center min-w-[230px] space-y-4">
                <div>
                  <div className="text-4xl font-bold text-[#0F172A]">{planPrice}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">{planSuffix}</div>
                </div>
                <Link
                  href="/signup"
                  className="block w-full py-2.5 px-4 rounded-lg bg-[#0F172A] text-white font-semibold text-xs hover:bg-slate-800 transition"
                >
                  Start 14-day free trial
                </Link>
                <p className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  Global billing via Paddle / Dodo
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} BookGrid by GilByte Solutions. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:gilbytesolutions@hotmail.com"
              className="hover:text-[#0F172A] transition"
            >
              Contact: gilbytesolutions@hotmail.com
            </a>
            <Link href="/terms" className="hover:text-[#0F172A] transition">
              Terms of Service &amp; Refunds
            </Link>
            <Link href="/privacy" className="hover:text-[#0F172A] transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
