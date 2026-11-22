import Link from 'next/link';
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Euro,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { requireSuperAdminOrNotFound } from '@/lib/auth/super-admin';
import { getAdminOverviewStats } from '@/services/admin/admin-queries.service';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  await requireSuperAdminOrNotFound();
  const stats = await getAdminOverviewStats();

  const kpiCards = [
    {
      label: 'MRR Total (USD)',
      value: `$${stats.mrrUsd.toFixed(2)}`,
      sub: 'Planos ativos em Dólar ($29)',
      icon: DollarSign,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'MRR Total (EUR)',
      value: `€${stats.mrrEur.toFixed(2)}`,
      sub: 'Planos ativos em Euro (25 €)',
      icon: Euro,
      accent: 'text-[#5B38E8] bg-[#EFEAFF] border-[#DDD3FF]',
    },
    {
      label: 'Total de Lojas',
      value: String(stats.totalTenants),
      sub: `+${stats.newLast7Days} nos últimos 7d • +${stats.newLast30Days} em 30d`,
      icon: Store,
      accent: 'text-slate-700 bg-slate-100 border-[#EAE6F5]',
    },
    {
      label: 'Lojas em Trial',
      value: String(stats.trialTenants),
      sub: 'Janela de 14 dias grátis',
      icon: Clock,
      accent: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Assinantes Ativos',
      value: String(stats.activeTenants),
      sub: 'Pagamentos confirmados via Paddle/Dodo',
      icon: Users,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Agendamentos Totais',
      value: String(stats.totalBookings),
      sub: 'Reservas processadas na plataforma',
      icon: CalendarCheck,
      accent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1B1340]">
            Visão Geral &amp; Finanças
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Métricas globais da plataforma BookGrid em tempo real.
          </p>
        </div>
        <Link
          href="/admin/tenants"
          className="px-3.5 py-2 rounded-lg bg-[#1B1340] text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Gerir Lojas ({stats.totalTenants})
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white border border-[#EAE6F5] p-5 shadow-sm flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <div className="text-2xl font-bold tracking-tight text-[#1B1340]">{card.value}</div>
                <p className="text-[11px] text-slate-500">{card.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.accent}`}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Growth & Top Active Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#EAE6F5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1B1340] inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6D4AFF]" strokeWidth={1.75} />
              Crescimento Recente (Últimas Lojas)
            </h2>
            <span className="text-[11px] font-medium text-slate-500">
              {stats.newLast7Days} novas (7d)
            </span>
          </div>

          {stats.recentTenants.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">Nenhuma loja cadastrada ainda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentTenants.map((tenant) => (
                <div key={tenant.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1B1340] truncate">
                      {tenant.businessName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      bookgrid.app/{tenant.slug} • {tenant.ownerEmail}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {tenant.createdAt.slice(0, 10)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-[#EAE6F5]">
                      {tenant.subscriptionStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#EAE6F5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1B1340] inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
              Ranking das Lojas Mais Ativas
            </h2>
            <span className="text-[11px] font-medium text-slate-500">Por nº de reservas</span>
          </div>

          {stats.topTenants.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">Nenhum agendamento registrado ainda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.topTenants.map((tenant, idx) => (
                <div key={tenant.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-[#EAE6F5] text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1B1340] truncate">
                        {tenant.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {tenant.staffCount} profissionais • {tenant.currency}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-[#EAE6F5] text-xs font-bold text-[#1B1340] shrink-0">
                    {tenant.bookingCount} reservas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
