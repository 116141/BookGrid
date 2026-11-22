'use client';

import { useState, useTransition } from 'react';
import {
  Clock,
  ExternalLink,
  Eye,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteTenantAction,
  extendTenantTrialAction,
  inspectTenantDetailsAction,
  updateTenantStatusAction,
} from '@/actions/admin.actions';
import type {
  AdminTenantDetails,
  AdminTenantSummary,
} from '@/services/admin/admin-queries.service';

const STATUS_FILTERS = [
  'all',
  'trial',
  'active',
  'vip',
  'suspended',
  'past_due',
  'canceled',
] as const;

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'vip':
      return 'bg-[#EFEAFF] text-[#5B38E8] border-[#DDD3FF]';
    case 'trial':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'suspended':
    case 'past_due':
    case 'canceled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-[#EAE6F5]';
  }
}

export function AdminTenantsClient({
  initialTenants,
}: {
  readonly initialTenants: readonly AdminTenantSummary[];
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inspected, setInspected] = useState<{
    readonly tenant: AdminTenantSummary;
    readonly details: AdminTenantDetails;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = search.trim().toLowerCase();
  const filtered = initialTenants.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.subscriptionStatus === statusFilter;
    const matchesQuery =
      !normalizedQuery ||
      t.businessName.toLowerCase().includes(normalizedQuery) ||
      t.slug.toLowerCase().includes(normalizedQuery) ||
      t.ownerEmail.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });

  function handleExtendTrial(tenantId: string, days: 7 | 14 | 30) {
    setFeedback(null);
    startTransition(async () => {
      const res = await extendTenantTrialAction({ tenantId, days });
      setFeedback(res.message ?? (res.ok ? 'Atualizado.' : 'Erro ao estender trial.'));
    });
  }

  function handleChangeStatus(
    tenantId: string,
    status: 'active' | 'vip' | 'suspended'
  ) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateTenantStatusAction({ tenantId, status });
      setFeedback(res.message ?? (res.ok ? 'Status atualizado.' : 'Erro ao atualizar status.'));
    });
  }

  function handleInspect(tenant: AdminTenantSummary) {
    setFeedback(null);
    startTransition(async () => {
      const res = await inspectTenantDetailsAction({ tenantId: tenant.id });
      if (res.ok && res.data) {
        setInspected({ tenant, details: res.data });
      } else {
        setFeedback(res.message ?? 'Não foi possível carregar os detalhes.');
      }
    });
  }

  function handleDelete(tenant: AdminTenantSummary) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir permanentemente a loja "${tenant.businessName}" (/${tenant.slug})?`
    );
    if (!confirmed) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteTenantAction({ tenantId: tenant.id });
      setFeedback(res.message ?? (res.ok ? 'Loja excluída.' : 'Erro ao excluir loja.'));
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1B1340]">
          Gestão de Clientes &amp; Suporte
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Busque lojas, estenda períodos de teste, libere acessos VIP ou inspecione reservas.
        </p>
      </div>

      {/* Search & Status Filters */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da loja, slug ou e-mail do dono..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#EAE6F5] text-xs text-[#1B1340] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase border transition ${
                statusFilter === st
                  ? 'bg-[#1B1340] text-white border-[#1B1340]'
                  : 'bg-white text-slate-600 border-[#EAE6F5] hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-[#6D4AFF] text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tenants Table */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7FC] border-b border-[#EAE6F5] text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Loja / Link</th>
                <th className="px-4 py-3">Dono (E-mail)</th>
                <th className="px-4 py-3">Moeda</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fim do Trial</th>
                <th className="px-4 py-3 text-center">Equipe / Reservas</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma loja encontrada para esse filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1B1340]">{tenant.businessName}</div>
                      <a
                        href={`/${tenant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#5B38E8] hover:underline"
                      >
                        bookgrid.app/{tenant.slug}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tenant.ownerEmail}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{tenant.currency}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClass(
                          tenant.subscriptionStatus
                        )}`}
                      >
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {tenant.trialEndsAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {tenant.staffCount} / {tenant.bookingCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleExtendTrial(tenant.id, 7)}
                          title="Estender Trial +7 dias"
                          className="px-2 py-1 rounded border border-[#EAE6F5] bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Clock className="w-3 h-3 inline mr-0.5" />+7d
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleExtendTrial(tenant.id, 14)}
                          className="px-2 py-1 rounded border border-[#EAE6F5] bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          +14d
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleExtendTrial(tenant.id, 30)}
                          className="px-2 py-1 rounded border border-[#EAE6F5] bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          +30d
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangeStatus(tenant.id, 'active')}
                          className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangeStatus(tenant.id, 'vip')}
                          className="px-2 py-1 rounded border border-[#DDD3FF] bg-[#EFEAFF] text-[11px] font-semibold text-[#5B38E8] hover:bg-teal-100 disabled:opacity-50"
                        >
                          VIP
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleChangeStatus(tenant.id, 'suspended')}
                          className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <ShieldAlert className="w-3 h-3 inline mr-0.5" />
                          Susp.
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleInspect(tenant)}
                          title="Inspecionar loja"
                          className="p-1.5 rounded border border-[#EAE6F5] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(tenant)}
                          title="Excluir loja de teste"
                          className="p-1.5 rounded border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Inspection Modal */}
      {inspected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-white border border-[#EAE6F5] shadow-xl p-6 max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#1B1340]">
                  Inspeção: {inspected.tenant.businessName}
                </h2>
                <p className="text-xs text-slate-500">
                  bookgrid.app/{inspected.tenant.slug} • {inspected.tenant.ownerEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspected(null)}
                className="p-1.5 rounded-lg border border-[#EAE6F5] text-slate-500 hover:text-[#1B1340]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#F8F7FC] border border-[#EAE6F5] p-3.5 space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-600">
                  Equipe ({inspected.details.staff.length})
                </h3>
                {inspected.details.staff.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem membros cadastrados.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {inspected.details.staff.map((m) => (
                      <li key={m.id} className="flex justify-between">
                        <span className="font-medium text-[#1B1340]">{m.name}</span>
                        <span className="text-slate-500">{m.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl bg-[#F8F7FC] border border-[#EAE6F5] p-3.5 space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-600">
                  Serviços ({inspected.details.services.length})
                </h3>
                {inspected.details.services.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem serviços cadastrados.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {inspected.details.services.map((s) => (
                      <li key={s.id} className="flex justify-between">
                        <span className="font-medium text-[#1B1340]">
                          {s.name} ({s.durationMinutes}m)
                        </span>
                        <span className="text-slate-600">
                          ${s.priceUsd} / €{s.priceEur}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F7FC] border border-[#EAE6F5] p-3.5 space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-600">
                Reservas Recentes ({inspected.details.recentBookings.length})
              </h3>
              {inspected.details.recentBookings.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma reserva encontrada.</p>
              ) : (
                <div className="divide-y divide-slate-200/70 text-xs">
                  {inspected.details.recentBookings.map((b) => (
                    <div key={b.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-slate-500 mr-2">#{b.bookingCode}</span>
                        <span className="font-semibold text-[#1B1340]">{b.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600">
                          {b.bookingDate} {b.bookingTime}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-[#EAE6F5]">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
