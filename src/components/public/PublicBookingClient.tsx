'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, CheckCircle2, Clock, MapPin, MessageCircle, User } from 'lucide-react';
import type { SupportedCurrency } from '@/schemas/env.schema';
import type { CatalogServiceItem } from '@/schemas/booking.schema';
import {
  createPublicBookingAction,
  getPublicAvailabilityAction,
  joinPublicWaitlistAction,
  type PublicBookingConfirmation,
} from '@/actions/public-booking.actions';

export interface PublicStaffOption {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

export interface PublicTenantProfile {
  readonly id: string;
  readonly slug: string;
  readonly businessName: string;
  readonly city: string;
  readonly whatsappPhone: string;
  readonly currency: SupportedCurrency;
}

interface PublicBookingClientProps {
  readonly tenant: PublicTenantProfile;
  readonly services: readonly CatalogServiceItem[];
  readonly staffMembers: readonly PublicStaffOption[];
  readonly initialDate: string;
  readonly initialAvailableSlots: readonly string[];
}

function formatCurrencyValue(usd: number, eur: number, currency: SupportedCurrency): string {
  if (currency === 'EUR') {
    return eur === 0 ? 'Free' : `${eur.toFixed(2)} € EUR`;
  }
  return usd === 0 ? 'Free' : `$${usd.toFixed(2)} USD`;
}

export function PublicBookingClient({
  tenant,
  services,
  staffMembers,
  initialDate,
  initialAvailableSlots,
}: PublicBookingClientProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    services[0] ? [services[0].id] : []
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(initialDate);
  const [availableSlots, setAvailableSlots] = useState<readonly string[]>(initialAvailableSlots);
  const [selectedTime, setSelectedTime] = useState<string>(initialAvailableSlots[0] ?? '');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [preferredWaitlistWindow, setPreferredWaitlistWindow] = useState<string>('Any afternoon slot');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState<boolean>(false);
  const [slotsRefreshNonce, setSlotsRefreshNonce] = useState<number>(0);

  const cartSummary = useMemo(() => {
    const selected = services.filter((s) => selectedServiceIds.includes(s.id));
    let totalDuration = 0;
    let totalUsd = 0;
    let totalEur = 0;
    for (const s of selected) {
      totalDuration += s.durationMinutes;
      totalUsd += s.priceUsd;
      totalEur += s.priceEur;
    }
    return {
      count: selected.length,
      names: selected.map((s) => s.name),
      totalDuration: Math.max(5, totalDuration),
      totalUsd,
      totalEur,
    };
  }, [services, selectedServiceIds]);

  useEffect(() => {
    let active = true;
    async function refreshSlots() {
      if (selectedServiceIds.length === 0) return;
      setSlotsLoading(true);
      const res = await getPublicAvailabilityAction({
        tenantId: tenant.id,
        bookingDate,
        staffId: selectedStaffId,
        totalDurationMinutes: cartSummary.totalDuration,
      });
      if (!active) return;
      setSlotsLoading(false);
      if (res.ok) {
        setAvailableSlots(res.data.availableSlots);
        setSelectedTime((prev) =>
          res.data.availableSlots.includes(prev) ? prev : (res.data.availableSlots[0] ?? '')
        );
      }
    }
    void refreshSlots();
    return () => {
      active = false;
    };
  }, [
    tenant.id,
    bookingDate,
    selectedStaffId,
    cartSummary.totalDuration,
    selectedServiceIds.length,
    slotsRefreshNonce,
  ]);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.length > 1 ? prev.filter((id) => id !== serviceId) : prev;
      }
      return [...prev, serviceId];
    });
  }

  async function handleConfirmBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setWaitlistSuccess(false);

    if (!selectedTime) {
      setErrorMsg('Please select an available time slot or join the VIP Waitlist below.');
      return;
    }

    setSubmitting(true);
    const res = await createPublicBookingAction({
      tenantId: tenant.id,
      staffId: selectedStaffId,
      serviceIds: selectedServiceIds,
      clientName,
      clientPhone,
      bookingDate,
      bookingTime: selectedTime,
      currency: tenant.currency,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setConfirmation(res.data);
    setSlotsRefreshNonce((n) => n + 1);
  }

  async function handleJoinWaitlist() {
    setErrorMsg(null);
    setSubmitting(true);
    const res = await joinPublicWaitlistAction({
      tenantId: tenant.id,
      clientName,
      clientPhone,
      desiredDate: bookingDate,
      serviceIds: selectedServiceIds,
      preferredTimeWindow: preferredWaitlistWindow,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setWaitlistSuccess(true);
  }

  function downloadIcsCalendar() {
    if (!confirmation) return;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BookGrid//GilByte Solutions//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${confirmation.selectedServiceNames.join(' + ')} - ${tenant.businessName}`,
      `DESCRIPTION:Booking #${confirmation.bookingCode} (${confirmation.totalDurationMinutes} min)`,
      `LOCATION:${tenant.city}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT120M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Appointment reminder (2 hours ahead)',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BookGrid_${confirmation.bookingCode}.ics`;
    link.click();
  }

  const cleanWhatsapp = tenant.whatsappPhone.replace(/\D/g, '');
  const waConfirmHref = confirmation
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        `Hi ${tenant.businessName}! I booked via BookGrid:\nCode: #${confirmation.bookingCode}\nServices: ${confirmation.selectedServiceNames.join(' + ')} (${confirmation.totalDurationMinutes} min)\nDate: ${confirmation.bookingDate} at ${confirmation.bookingTime}`
      )}`
    : '#';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-12">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">{tenant.businessName}</h1>
            <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {tenant.city} • <span className="font-mono">bookgrid.app/{tenant.slug}</span>
            </p>
          </div>
          <Link
            href="/"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#0F172A]"
          >
            BookGrid
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* LIVE MULTI-SERVICE CART SUMMARY */}
        <div className="rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {cartSummary.count} {cartSummary.count === 1 ? 'Service Selected' : 'Services in Cart'}
            </span>
            <p className="text-xs font-medium text-[#0F172A] truncate max-w-[220px] sm:max-w-md">
              {cartSummary.names.join(' + ')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm sm:text-base font-bold text-[#0F172A]">
              {formatCurrencyValue(cartSummary.totalUsd, cartSummary.totalEur, tenant.currency)}
            </div>
            <div className="text-[11px] font-medium text-teal-700 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              {cartSummary.totalDuration} min total
            </div>
          </div>
        </div>

        {/* CONFIRMATION TICKET */}
        {confirmation && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                Booking Confirmed
              </span>
              <span className="font-mono text-xs text-emerald-700 font-semibold">
                #{confirmation.bookingCode}
              </span>
            </div>
            <p className="text-sm text-emerald-950">
              Your appointment (<b>{confirmation.selectedServiceNames.join(' + ')}</b> —{' '}
              {confirmation.totalDurationMinutes} min) is confirmed for{' '}
              <b>
                {confirmation.bookingDate} at {confirmation.bookingTime}
              </b>
              .
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={waConfirmHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#0F172A] text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                Send Ticket via WhatsApp
              </a>
              <button
                type="button"
                onClick={downloadIcsCalendar}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <CalendarPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                Add Reminder (.ICS)
              </button>
            </div>
          </div>
        )}

        {waitlistSuccess && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 font-medium">
            You&apos;re on the VIP Waitlist for {bookingDate}. If an opening matches your{' '}
            {cartSummary.totalDuration}-minute combo, the team will notify you immediately.
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleConfirmBooking} className="space-y-6 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
          {/* STEP 1: MULTI-SERVICE CART */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select 1 or More Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((service) => {
                const active = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`text-left p-3.5 rounded-xl border transition ${
                      active
                        ? 'bg-slate-50 border-2 border-[#0F172A]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0F172A]">{service.name}</span>
                      <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap">
                        {formatCurrencyValue(service.priceUsd, service.priceEur, tenant.currency)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      +{service.durationMinutes} min
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2: STAFF SELECTOR */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Choose Team Member
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedStaffId(null)}
                className={`p-3 rounded-xl border text-center transition ${
                  selectedStaffId === null
                    ? 'bg-slate-50 border-2 border-[#0F172A] text-[#0F172A]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1 text-slate-500" strokeWidth={1.75} />
                <span className="text-xs font-semibold block">Any Available</span>
                <span className="text-[10px] text-slate-500">Fastest slot</span>
              </button>
              {staffMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedStaffId(member.id)}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedStaffId === member.id
                      ? 'bg-slate-50 border-2 border-[#0F172A] text-[#0F172A]'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1 text-slate-500" strokeWidth={1.75} />
                  <span className="text-xs font-semibold block truncate">{member.name}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{member.role}</span>
                </button>
              ))}
            </div>
          </section>

          {/* STEP 3: DATE & REAL-TIME SLOTS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Date
              </label>
              <input
                type="date"
                value={bookingDate}
                min={initialDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Available Times ({cartSummary.totalDuration} min)
              </label>
              {slotsLoading ? (
                <p className="text-xs text-slate-500 py-2">Checking availability...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-amber-700 py-2 font-medium">
                  No open slots fit {cartSummary.totalDuration} min on this date. Join the VIP Waitlist below.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition ${
                        selectedTime === slot
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* STEP 4: CLIENT INFO */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Your name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">WhatsApp / Phone (E.164)</label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+16175550199"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0F172A] focus:outline-none"
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedTime}
              className="w-full py-3 rounded-lg bg-[#0F172A] text-white font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Confirm Multi-Service Booking'}
            </button>

            <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                value={preferredWaitlistWindow}
                onChange={(e) => setPreferredWaitlistWindow(e.target.value)}
                placeholder="Preferred time window (e.g. Afternoon)"
                className="flex-1 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#0F172A] focus:outline-none"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={handleJoinWaitlist}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-semibold text-xs hover:bg-slate-100 transition whitespace-nowrap"
              >
                Join VIP Waitlist
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
