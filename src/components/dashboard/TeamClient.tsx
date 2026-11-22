'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import {
  manageServiceAction,
  manageStaffMemberAction,
} from '@/actions/dashboard.actions';
import { MAX_STAFF_INCLUDED_PER_TENANT } from '@/schemas/tenant.schema';

export interface TeamStaffRow {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly active: boolean;
}

export interface TeamServiceRow {
  readonly id: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly priceUsd: number;
  readonly priceEur: number;
}

interface TeamClientProps {
  readonly initialStaff: readonly TeamStaffRow[];
  readonly initialServices: readonly TeamServiceRow[];
}

export function TeamClient({ initialStaff, initialServices }: TeamClientProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<readonly TeamStaffRow[]>(initialStaff);
  const [services, setServices] = useState<readonly TeamServiceRow[]>(initialServices);

  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Senior Specialist');

  const [serviceName, setServiceName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [priceUsd, setPriceUsd] = useState(35);
  const [priceEur, setPriceEur] = useState(25);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeStaffCount = staff.filter((m) => m.active).length;

  async function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await manageStaffMemberAction({
      operation: 'create',
      name: staffName,
      role: staffRole,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setStaff((prev) => [
      ...prev,
      { id: res.data.staffId, name: staffName, role: staffRole, active: true },
    ]);
    setStaffName('');
    router.refresh();
  }

  async function handleToggleStaff(member: TeamStaffRow) {
    setErrorMsg(null);
    const res = await manageStaffMemberAction({
      operation: 'toggle_active',
      staffId: member.id,
      active: !member.active,
    });
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setStaff((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, active: !member.active } : m))
    );
  }

  async function handleDeleteStaff(staffId: string) {
    setErrorMsg(null);
    const res = await manageStaffMemberAction({
      operation: 'delete',
      staffId,
    });
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setStaff((prev) => prev.filter((m) => m.id !== staffId));
  }

  async function handleAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await manageServiceAction({
      operation: 'create',
      name: serviceName,
      durationMinutes,
      priceUsd,
      priceEur,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setServices((prev) => [
      ...prev,
      {
        id: res.data.serviceId,
        name: serviceName,
        durationMinutes,
        priceUsd,
        priceEur,
      },
    ]);
    setServiceName('');
    router.refresh();
  }

  async function handleDeleteService(serviceId: string) {
    setErrorMsg(null);
    const res = await manageServiceAction({
      operation: 'delete',
      serviceId,
    });
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: TEAM MANAGEMENT (UP TO 5 INCLUDED) */}
        <section className="lg:col-span-6 rounded-xl bg-white border border-[#EAE6F5] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-[#EAE6F5] pb-3">
            <div>
              <h1 className="text-base font-bold text-[#1B1340]">Team Members</h1>
              <p className="text-xs text-slate-500">Zero per-seat fee up to 5 members</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#EFEAFF] border border-[#DDD3FF] text-teal-800 text-xs font-semibold">
              {activeStaffCount} / {MAX_STAFF_INCLUDED_PER_TENANT} included
            </span>
          </div>

          <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Staff name"
              className="sm:col-span-5 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
            />
            <input
              type="text"
              required
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              placeholder="Role (e.g. Barber)"
              className="sm:col-span-4 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || activeStaffCount >= MAX_STAFF_INCLUDED_PER_TENANT}
              className="sm:col-span-3 inline-flex items-center justify-center gap-1 rounded-lg bg-[#1B1340] text-white font-semibold text-xs py-2 hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          <div className="space-y-2">
            {staff.map((m) => (
              <div
                key={m.id}
                className="rounded-lg bg-[#F8F7FC] border border-[#EAE6F5] p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-[#1B1340]">{m.name}</p>
                  <p className="text-[11px] text-slate-500">{m.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleStaff(m)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      m.active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-[#EAE6F5] text-slate-600'
                    }`}
                  >
                    {m.active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteStaff(m.id)}
                    className="p-1.5 rounded-md bg-white border border-[#EAE6F5] text-slate-500 hover:text-rose-600 hover:border-rose-200"
                    aria-label="Remove staff member"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: SERVICE CATALOG (USD & EUR) */}
        <section className="lg:col-span-6 rounded-xl bg-white border border-[#EAE6F5] p-5 space-y-4 shadow-sm">
          <div className="border-b border-[#EAE6F5] pb-3">
            <h2 className="text-base font-bold text-[#1B1340]">Service Catalog (USD &amp; EUR)</h2>
            <p className="text-xs text-slate-500">
              Used by the Multi-Service Cart to auto-sum duration and price
            </p>
          </div>

          <form onSubmit={handleAddService} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Service name (e.g. Skin Fade)"
                className="sm:col-span-8 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
              />
              <input
                type="number"
                required
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                placeholder="Min"
                className="sm:col-span-4 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-[#1B1340] focus:border-[#1B1340] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs">
                <span className="text-slate-400 mr-1">$</span>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(Number(e.target.value))}
                  className="w-full bg-transparent text-[#1B1340] font-semibold focus:outline-none"
                />
                <span className="text-slate-400 ml-1">USD</span>
              </div>

              <div className="flex items-center rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs">
                <span className="text-slate-400 mr-1">€</span>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={priceEur}
                  onChange={(e) => setPriceEur(Number(e.target.value))}
                  className="w-full bg-transparent text-[#1B1340] font-semibold focus:outline-none"
                />
                <span className="text-slate-400 ml-1">EUR</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#1B1340] text-white font-semibold text-xs py-2 hover:bg-slate-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add service
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-lg bg-[#F8F7FC] border border-[#EAE6F5] p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-[#1B1340]">{s.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {s.durationMinutes} min • ${s.priceUsd.toFixed(2)} USD / {s.priceEur.toFixed(2)} € EUR
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteService(s.id)}
                  className="p-1.5 rounded-md bg-white border border-[#EAE6F5] text-slate-500 hover:text-rose-600 hover:border-rose-200"
                  aria-label="Delete service"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
