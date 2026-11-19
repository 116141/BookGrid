'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CreditCard, ExternalLink, FileSpreadsheet, LogOut, Users } from 'lucide-react';
import { signOutMerchantAction } from '@/actions/auth.actions';
import { BookGridMark } from '@/components/brand/BookGridLogo';

interface DashboardNavProps {
  readonly businessName: string;
  readonly slug: string;
}

const NAV_ITEMS = [
  { href: '/agenda', label: 'Agenda', Icon: Calendar },
  { href: '/importer', label: 'AI Import', Icon: FileSpreadsheet },
  { href: '/team', label: 'Team', Icon: Users },
  { href: '/billing', label: 'Billing', Icon: CreditCard },
] as const;

export function DashboardNav({ businessName, slug }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookGridMark size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F172A] truncate">{businessName}</p>
              <Link
                href={`/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-[#0F172A] truncate"
              >
                bookgrid.app/{slug}
                <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              </Link>
            </div>
          </div>

          {/* DESKTOP TABS */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-[#0F172A] shadow-sm'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <form action={signOutMerchantAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (NATIVE APP STYLE) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white grid grid-cols-4">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`py-2.5 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                active ? 'text-[#0F172A]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
