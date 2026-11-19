import Link from 'next/link';
import { Check } from 'lucide-react';
import { BookGridLogo } from '@/components/brand/BookGridLogo';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <BookGridLogo />
          <Link
            href="/signup"
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 transition"
          >
            Start 14-day free trial
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Simple, Flat-Rate Pricing</h1>
          <p className="text-sm text-slate-600">
            Up to 5 team members included. Zero per-seat fees. Choose USD ($) or EUR (€).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                US Dollar Plan
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">$29</span>
                <span className="text-sm text-slate-500">USD / month</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Up to 5 team members included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Multi-service cart &amp; anti-double-booking
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Smart Waitlist &amp; AI Schedule Importer
              </li>
            </ul>
            <Link
              href="/signup"
              className="block text-center w-full py-2.5 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              Start 14-day free trial
            </Link>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Euro Plan
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">25 €</span>
                <span className="text-sm text-slate-500">EUR / month</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Up to 5 team members included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Multi-service cart &amp; anti-double-booking
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                Smart Waitlist &amp; AI Schedule Importer
              </li>
            </ul>
            <Link
              href="/signup"
              className="block text-center w-full py-2.5 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>BookGrid by GilByte Solutions</span>
          <div className="flex items-center gap-4">
            <a href="mailto:gilbytesolutions@hotmail.com" className="hover:text-[#0F172A]">
              gilbytesolutions@hotmail.com
            </a>
            <Link href="/terms" className="hover:text-[#0F172A]">
              Terms &amp; Refunds
            </Link>
            <Link href="/privacy" className="hover:text-[#0F172A]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
