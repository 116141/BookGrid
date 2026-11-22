'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { signOutMerchantAction } from '@/actions/auth.actions';
import { BookGridMark } from '@/components/brand/BookGridLogo';

const ADMIN_TABS = [
  { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Clientes & Suporte', icon: Store },
  { href: '/admin/payments', label: 'Pagamentos & Webhooks', icon: CreditCard },
  { href: '/admin/announcements', label: 'Avisos Globais', icon: Megaphone },
] as const;

export function AdminNav({ adminEmail }: { readonly adminEmail: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#EAE6F5] bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin" className="inline-flex items-center gap-2.5 shrink-0">
            <BookGridMark size="md" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-[#1B1340] tracking-tight">
                BookGrid Command Center
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5B38E8]">
                <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                Super Admin • {adminEmail}
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-[#EAE6F5]/80">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-white text-[#1B1340] shadow-sm border border-[#EAE6F5]'
                    : 'text-slate-600 hover:text-[#1B1340]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Activity className="w-3 h-3" strokeWidth={2} />
            Live
          </span>
          <Link
            href="/agenda"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAE6F5] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Painel Loja
          </Link>
          <form action={signOutMerchantAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAE6F5] bg-white text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              Sair
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2.5 overflow-x-auto">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
                active
                  ? 'bg-[#1B1340] text-white border-[#1B1340]'
                  : 'bg-white text-slate-600 border-[#EAE6F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
