import Link from 'next/link';
import { BookGridLogo } from '@/components/brand/BookGridLogo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#1B1340]">
      <header className="border-b border-[#EAE6F5] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <BookGridLogo showByline />
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-[#1B1340]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="rounded-2xl bg-white border border-[#EAE6F5] p-6 md:p-8 space-y-5 shadow-sm text-sm text-slate-700 leading-relaxed">
          <div className="border-b border-[#EAE6F5] pb-4">
            <h1 className="text-2xl font-bold text-[#1B1340]">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-1">
              BookGrid — Operated by GilByte Solutions • Last updated: November 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-[#1B1340]">1. Data We Collect</h2>
            <p>
              We collect only the information required to operate your scheduling storefront: merchant
              account details (email, business name, city, WhatsApp contact) and client appointment
              details (name, phone number, selected services, and booking timestamp).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#1B1340]">2. Multi-Tenant Isolation &amp; Security</h2>
            <p>
              All store data is isolated at the PostgreSQL database level using Row Level Security
              (RLS). Public booking pages only query anonymous busy time intervals and never expose
              other clients&apos; personal contact information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#1B1340]">3. Payment Processing</h2>
            <p>
              BookGrid does not store credit card numbers on its servers. All subscription payments in
              USD and EUR are securely handled by our Merchant of Record (Paddle / Dodo Payments).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#1B1340]">4. Data Deletion Requests</h2>
            <p>
              You may request deletion of your merchant account or booking records at any time by
              emailing{' '}
              <span className="font-mono text-xs text-[#1B1340]">support@gilbytesolutions.com</span>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
