import { CreditCard, ShieldCheck } from 'lucide-react';
import { requireSuperAdminOrNotFound } from '@/lib/auth/super-admin';
import { getAdminPaymentEvents } from '@/services/admin/admin-queries.service';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  await requireSuperAdminOrNotFound();
  const events = await getAdminPaymentEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
            Extrato de Pagamentos &amp; Webhooks
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Auditoria financeira em tempo real da tabela{' '}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
              payment_webhook_events
            </code>
            .
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-teal-600" strokeWidth={1.75} />
          {events.length} eventos registrados
        </span>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {events.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-slate-700">Nenhum evento de pagamento ainda</p>
            <p className="text-xs text-slate-500">
              Assim que um lojista assinar via Paddle ou Dodo Payments, o extrato aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Tipo de Evento</th>
                  <th className="px-4 py-3">Tenant ID</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {evt.createdAt.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#0F172A]">
                      {evt.eventId}
                    </td>
                    <td className="px-4 py-3 uppercase font-bold text-[11px] text-slate-700">
                      {evt.provider}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {evt.tenantId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0F172A] whitespace-nowrap">
                      {evt.currency === 'EUR'
                        ? `€${evt.amount.toFixed(2)}`
                        : `$${evt.amount.toFixed(2)}`}{' '}
                      {evt.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
