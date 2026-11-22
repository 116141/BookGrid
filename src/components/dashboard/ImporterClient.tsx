'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet } from 'lucide-react';
import { parseAndImportScheduleAction } from '@/actions/dashboard.actions';
import type { AIExtractedBookingItem } from '@/schemas/ai-import.schema';
import type { SupportedCurrency } from '@/schemas/env.schema';

interface ImporterClientProps {
  readonly currency: SupportedCurrency;
  readonly defaultDate: string;
}

export function ImporterClient({ currency, defaultDate }: ImporterClientProps) {
  const router = useRouter();
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [rawScheduleText, setRawScheduleText] = useState(
    '10:30 - Jason Silva (+1 617 555 0144) - Skin Fade Haircut + Beard Therapy com Mestre João\n13:00 - Carla Mendes (+351 914 220 119) - Full Braids & Hydration com Sónia'
  );
  const [previewItems, setPreviewItems] = useState<AIExtractedBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleExtractPreview() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    const res = await parseAndImportScheduleAction({
      targetDate,
      rawScheduleText,
      commitToDatabase: false,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setPreviewItems([...res.data.bookings]);
  }

  function updatePreviewField(index: number, field: 'clientName' | 'bookingTime' | 'staffName', value: string) {
    setPreviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleCommitBatch() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const editedRaw = previewItems
      .map(
        (item) =>
          `${item.bookingTime} - ${item.clientName} (${item.clientPhone}) - ${item.servicesList.join(' + ')} com ${item.staffName}`
      )
      .join('\n');

    const res = await parseAndImportScheduleAction({
      targetDate,
      rawScheduleText: editedRaw,
      commitToDatabase: true,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(
      `${res.data.extractedCount} appointments validated and saved to your agenda.`
    );
    setPreviewItems([]);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: RAW INPUT */}
      <div className="lg:col-span-6 rounded-xl bg-white border border-[#EAE6F5] p-5 space-y-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Schedule Importer
          </span>
          <h1 className="text-lg font-bold text-[#1B1340] mt-0.5">
            Import from WhatsApp or Paper Notebook
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            All pasted text is sanitized via strict Zod schemas before entering your database.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Paste WhatsApp messages or notebook lines
          </label>
          <textarea
            rows={7}
            value={rawScheduleText}
            onChange={(e) => setRawScheduleText(e.target.value)}
            className="w-full rounded-lg bg-slate-50 border border-slate-300 p-3 text-xs font-mono text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {successMsg}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleExtractPreview()}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#1B1340] text-white font-semibold text-xs hover:bg-slate-800 transition disabled:opacity-60"
        >
          <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
          {loading ? 'Parsing...' : 'Extract & Preview Schedule'}
        </button>
      </div>

      {/* RIGHT: EDITABLE PREVIEW & BATCH COMMIT */}
      <div className="lg:col-span-6 rounded-xl bg-white border border-[#EAE6F5] p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EAE6F5] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1B1340]">Editable Staging Preview</h2>
            <p className="text-xs text-slate-500">Review or edit fields before committing</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">{previewItems.length} detected</span>
        </div>

        {previewItems.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">
            Run &quot;Extract &amp; Preview Schedule&quot; on the left to inspect sanitized appointments here.
          </p>
        ) : (
          <div className="space-y-3">
            {previewItems.map((item, idx) => (
              <div
                key={`${item.bookingTime}-${idx}`}
                className="rounded-lg bg-[#F8F7FC] border border-[#EAE6F5] p-3 space-y-2"
              >
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={item.bookingTime}
                    onChange={(e) => updatePreviewField(idx, 'bookingTime', e.target.value)}
                    className="rounded-md bg-white border border-slate-300 px-2 py-1.5 text-[#1B1340] font-semibold"
                  />
                  <input
                    type="text"
                    value={item.clientName}
                    onChange={(e) => updatePreviewField(idx, 'clientName', e.target.value)}
                    className="rounded-md bg-white border border-slate-300 px-2 py-1.5 text-[#1B1340] font-semibold"
                  />
                  <input
                    type="text"
                    value={item.staffName}
                    onChange={(e) => updatePreviewField(idx, 'staffName', e.target.value)}
                    className="rounded-md bg-white border border-slate-300 px-2 py-1.5 text-slate-700"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    {item.servicesList.join(' + ')} ({item.estimatedDurationMinutes} min) • {item.clientPhone}
                  </span>
                  <span className="font-semibold text-[#1B1340]">
                    {currency === 'EUR'
                      ? `${item.estimatedPriceEur.toFixed(2)} €`
                      : `$${item.estimatedPriceUsd.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleCommitBatch()}
              className="w-full py-2.5 rounded-lg bg-[#1B1340] text-white font-semibold text-xs hover:bg-slate-800 transition"
            >
              Confirm &amp; Import All ({previewItems.length}) to Agenda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
