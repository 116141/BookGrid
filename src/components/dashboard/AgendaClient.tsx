'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle, Search, UserPlus, X } from 'lucide-react';
import type { SupportedCurrency } from '@/schemas/env.schema';
import {
  cancelBookingAndFindWaitlistAction,
  fillVacancyFromWaitlistAction,
} from '@/actions/dashboard.actions';
import type { MatchedWaitlistOpportunity } from '@/services/waitlist/vacancy-matcher';

export interface DashboardBookingRow {
  readonly id: string;
  readonly bookingCode: string;
  readonly clientName: string;
  readonly clientPhone: string;
  readonly staffName: string;
  readonly servicesSummary: string;
  readonly totalDurationMinutes: number;
  readonly totalPriceUsd: number;
  readonly totalPriceEur: number;
  readonly bookingDate: string;
  readonly bookingTime: string;
  readonly status: string;
}

interface AgendaClientProps {
  readonly slug: string;
  readonly businessName: string;
  readonly currency: SupportedCurrency;
  readonly initialBookings: readonly DashboardBookingRow[];
}

function formatMoney(usd: number, eur: number, currency: SupportedCurrency): string {
  return currency === 'EUR' ? `${eur.toFixed(2)} € EUR` : `$${usd.toFixed(2)} USD`;
}

export function AgendaClient({
  slug,
  businessName,
  currency,
  initialBookings,
}: AgendaClientProps) {
  const [bookings, setBookings] = useState<readonly DashboardBookingRow[]>(initialBookings);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeVacancy, setActiveVacancy] = useState<{
    readonly cancelledBookingId: string;
    readonly bookingTime: string;
    readonly matches: readonly MatchedWaitlistOpportunity[];
  } | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'recovered' | 'cancelled'>('all');

  function handleCopyPublicLink() {
    const url = `${window.location.origin}/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancelBooking(booking: DashboardBookingRow) {
    setBusyId(booking.id);
    setStatusBanner(null);

    const res = await cancelBookingAndFindWaitlistAction({ bookingId: booking.id });
    setBusyId(null);

    if (!res.ok) {
      setStatusBanner(res.message);
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
    );

    setActiveVacancy({
      cancelledBookingId: booking.id,
      bookingTime: booking.bookingTime,
      matches: res.data.matches,
    });
  }

  async function handleFillVacancy(waitlistEntryId: string) {
    if (!activeVacancy) return;
    setBusyId(waitlistEntryId);
    const res = await fillVacancyFromWaitlistAction({
      cancelledBookingId: activeVacancy.cancelledBookingId,
      waitlistEntryId,
    });
    setBusyId(null);

    if (!res.ok) {
      setStatusBanner(res.message);
      return;
    }

    const matchedCandidate = activeVacancy.matches.find(
      (m) => m.candidate.id === waitlistEntryId
    )?.candidate;

    if (matchedCandidate) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === activeVacancy.cancelledBookingId
            ? {
                ...b,
                clientName: matchedCandidate.clientName,
                clientPhone: matchedCandidate.clientPhone,
                servicesSummary: matchedCandidate.desiredServices.join(' + '),
                totalDurationMinutes: matchedCandidate.totalDurationMinutes,
                totalPriceUsd: matchedCandidate.totalPriceUsd,
                totalPriceEur: matchedCandidate.totalPriceEur,
                status: 'recovered_from_waitlist',
              }
            : b
        )
      );
    }

    setStatusBanner(`Slot filled with ${res.data.clientName} from the Smart Waitlist.`);
    setActiveVacancy(null);
  }

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
  const recoveredBookings = bookings.filter((b) => b.status === 'recovered_from_waitlist');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');
  const totalUsd = activeBookings.reduce((acc, b) => acc + b.totalPriceUsd, 0);
  const totalEur = activeBookings.reduce((acc, b) => acc + b.totalPriceEur, 0);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active' && b.status === 'cancelled') return false;
    if (activeTab === 'recovered' && b.status !== 'recovered_from_waitlist') return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled') return false;
    if (!normalizedQuery) return true;
    return (
      b.clientName.toLowerCase().includes(normalizedQuery) ||
      b.bookingCode.toLowerCase().includes(normalizedQuery) ||
      b.clientPhone.toLowerCase().includes(normalizedQuery) ||
      b.staffName.toLowerCase().includes(normalizedQuery) ||
      b.servicesSummary.toLowerCase().includes(normalizedQuery)
    );
  });

  const AGENDA_TABS = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'active', label: 'Confirmed', count: activeBookings.length },
    { id: 'recovered', label: 'Waitlist', count: recoveredBookings.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
  ] as const;

  return (
    <div className="space-y-5">
      {/* HEADER + SHARE PUBLIC LINK */}
      <div className="rounded-xl bg-white border border-[#EAE6F5] p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-[#1B1340]">Daily Agenda</h1>
          <p className="text-xs text-slate-500">
            {activeBookings.length} active bookings • Projected revenue:{' '}
            <b className="text-[#1B1340]">{formatMoney(totalUsd, totalEur, currency)}</b>
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyPublicLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6D4AFF] text-white font-semibold text-xs hover:bg-[#5B38E8] transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Link copied' : `Copy bookgrid.app/${slug}`}
        </button>
      </div>

      {statusBanner && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
          {statusBanner}
        </div>
      )}

      {/* SMART WAITLIST AUTO-FILL CARD WHEN A BOOKING IS CANCELLED */}
      {activeVacancy && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-900">
              Fill cancelled slot ({activeVacancy.bookingTime}) from Smart Waitlist
            </span>
            <button
              type="button"
              onClick={() => setActiveVacancy(null)}
              className="text-xs text-amber-700 hover:text-amber-950 font-medium"
            >
              Dismiss
            </button>
          </div>

          {activeVacancy.matches.length === 0 ? (
            <p className="text-xs text-amber-800">
              No waiting clients fit inside this cancelled window on this date yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activeVacancy.matches.map((match) => (
                <div
                  key={match.candidate.id}
                  className="rounded-lg bg-white border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1B1340]">
                      {match.candidate.clientName}{' '}
                      <span className="text-amber-700 font-semibold">
                        ({match.durationUtilizationPercent}% slot fit)
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {match.candidate.desiredServices.join(' + ')} •{' '}
                      {match.candidate.totalDurationMinutes} min • {match.formattedPrice}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={match.whatsappFlashUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-[11px] hover:bg-slate-50"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      disabled={busyId === match.candidate.id}
                      onClick={() => void handleFillVacancy(match.candidate.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#6D4AFF] text-white font-semibold text-[11px] hover:bg-[#5B38E8]"
                    >
                      <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Fill slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROTON-STYLE SEARCH + TAB FILTERS */}
      <div className="rounded-xl bg-white border border-[#EAE6F5] p-3 space-y-3 shadow-sm">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#5C5873] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by client, #code, phone, or staff..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F7F5FF] border border-[#EAE6F5] text-sm text-[#1B1340] placeholder:text-[#5C5873] focus:bg-white focus:border-[#6D4AFF] focus:outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#EAE6F5] pt-2.5">
          {AGENDA_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#EFEAFF] text-[#6D4AFF]'
                    : 'text-[#5C5873] hover:text-[#1B1340] hover:bg-[#F7F5FF]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-[#6D4AFF] text-white' : 'bg-[#F7F5FF] text-[#5C5873]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#EAE6F5] p-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[#1B1340]">No bookings yet</p>
            <p className="text-xs text-slate-500">
              Share your public link <b>bookgrid.app/{slug}</b> or use the AI Importer tab.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#EAE6F5] p-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[#1B1340]">No matching bookings</p>
            <p className="text-xs text-[#5C5873]">
              Try clearing your search or switching filter tabs.
            </p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isCancelled = b.status === 'cancelled';
            const cleanPhone = b.clientPhone.replace(/\D/g, '');
            const reminderHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hi ${b.clientName}! Friendly reminder for your ${b.servicesSummary} (${b.totalDurationMinutes} min) at ${businessName} on ${b.bookingDate} at ${b.bookingTime}.`
            )}`;

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCancelled
                    ? 'bg-slate-50 border-[#EAE6F5] opacity-65'
                    : 'bg-white border-[#EAE6F5] shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-[#EAE6F5] text-[#1B1340] text-xs font-semibold">
                      {b.bookingDate} • {b.bookingTime}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#EFEAFF] border border-[#DDD3FF] text-teal-800 text-[11px] font-semibold">
                      {b.staffName}
                    </span>
                    <span className="text-sm font-bold text-[#1B1340]">{b.clientName}</span>
                    {b.status === 'recovered_from_waitlist' && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Waitlist filled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {b.servicesSummary} ({b.totalDurationMinutes} min) •{' '}
                    <b className="text-[#1B1340]">
                      {formatMoney(b.totalPriceUsd, b.totalPriceEur, currency)}
                    </b>
                  </p>
                </div>

                {!isCancelled ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={reminderHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleCancelBooking(b)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-50 transition"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {busyId === b.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-rose-600 uppercase">Cancelled</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
