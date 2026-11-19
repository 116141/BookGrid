import Link from 'next/link';
import { BookGridLogo } from '@/components/brand/BookGridLogo';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <BookGridLogo showByline />
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-[#0F172A]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm text-sm text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-[#0F172A]">Terms of Service</h1>
            <p className="text-xs text-slate-500 mt-1">
              BookGrid — Operated by GilByte Solutions • Last updated: November 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-[#0F172A]">1. Service Overview</h2>
            <p>
              BookGrid (<code className="font-mono text-xs">bookgrid.app</code>) provides cloud-based
              multi-service scheduling, team calendar management (up to 5 active staff members per
              store), smart waitlist vacancy recovery, and schedule import tools for service
              businesses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#0F172A]">2. Subscriptions, Billing &amp; Refunds</h2>
            <p>
              BookGrid Pro subscriptions are billed monthly at <b>$29.00 USD/month</b> or{' '}
              <b>25.00 € EUR/month</b> after an initial 14-day free trial. Payments are processed by
              our authorized Merchant of Record (Paddle / Dodo Payments). You may cancel your
              subscription at any time from your Billing dashboard to stop future renewals.
            </p>
            <p>
              <b>Refund Policy:</b> If you experience a technical issue or were billed unintentionally,
              you may request a full refund within 14 days of your initial paid charge by contacting
              support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#0F172A]">3. Acceptable Use &amp; Data Ownership</h2>
            <p>
              Merchants retain full ownership of their customer booking records and service catalogs.
              Automated scraping, booking spam, or unauthorized access attempts against other tenant
              accounts are strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-[#0F172A]">4. Contact</h2>
            <p>
              For billing, support, or legal inquiries, contact <b>GilByte Solutions</b> at{' '}
              <span className="font-mono text-xs text-[#0F172A]">support@gilbytesolutions.com</span>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
