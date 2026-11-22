import Link from 'next/link';
import { Check } from 'lucide-react';
import { BookGridLogo } from '@/components/brand/BookGridLogo';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5FF] text-[#1B1340] flex flex-col">
      <header className="border-b border-[#EAE6F5] bg-white">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <BookGridLogo />
          <Link
            href="/signup"
            className="text-xs font-semibold px-4 py-2 rounded-full bg-[#6D4AFF] text-white hover:bg-[#4A2DC5] transition"
          >
            Start 14-day free trial
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-proton-serif text-4xl sm:text-5xl text-[#372580]">Simple, Flat-Rate Pricing</h1>
          <p className="text-sm sm:text-base text-[#5C5873]">
            Up to 5 team members included. Zero per-seat fees. Choose USD ($) or EUR (€).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl bg-white border-2 border-[#6D4AFF] overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="bg-[#6D4AFF] px-4 py-2 text-center text-white text-xs font-bold uppercase tracking-widest">
              Recommended
            </div>
            <div className="p-7 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-proton-serif text-2xl text-[#372580]">US Dollar Plan</span>
                  <span className="rounded-md bg-[#E2DBFF] text-[#6D4AFF] px-3 py-1 text-xs font-bold uppercase">
                    14 Days Free
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-[#1B1340]">$29</span>
                  <span className="text-sm text-[#5C5873]">USD / month</span>
                </div>
                <ul className="space-y-2.5 text-sm text-[#4A4660]">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    Up to 5 team members included
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    Multi-service cart &amp; anti-double-booking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    Smart Waitlist &amp; AI Schedule Importer
                  </li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="block text-center w-full py-3 rounded-full bg-[#6D4AFF] text-white text-base font-semibold hover:bg-[#4A2DC5] transition"
              >
                Start 14-day free trial
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#EAE6F5] p-7 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-proton-serif text-2xl text-[#372580]">Euro Plan</span>
                <span className="rounded-md bg-[#E2DBFF] text-[#6D4AFF] px-3 py-1 text-xs font-bold uppercase">
                  14 Days Free
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-[#1B1340]">25 €</span>
                <span className="text-sm text-[#5C5873]">EUR / month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-[#4A4660]">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  Up to 5 team members included
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  Multi-service cart &amp; anti-double-booking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  Smart Waitlist &amp; AI Schedule Importer
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="block text-center w-full py-3 rounded-full bg-transparent text-[#6D4AFF] text-base font-semibold shadow-[inset_0_0_0_2px_#6D4AFF] hover:bg-[#4A2DC5] hover:text-white transition"
            >
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#EAE6F5] bg-white py-6 px-4 text-xs text-[#5C5873]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>BookGrid by GilByte Solutions</span>
          <div className="flex items-center gap-4">
            <a href="mailto:gilbytesolutions@hotmail.com" className="hover:text-[#1B1340]">
              gilbytesolutions@hotmail.com
            </a>
            <Link href="/terms" className="hover:text-[#1B1340]">
              Terms &amp; Refunds
            </Link>
            <Link href="/privacy" className="hover:text-[#1B1340]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
