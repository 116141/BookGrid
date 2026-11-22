'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Megaphone, Power, Trash2 } from 'lucide-react';
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from '@/actions/admin.actions';
import type { SystemAnnouncementRow } from '@/services/admin/admin-queries.service';

export function AdminAnnouncementsClient({
  initialRows,
  migrationMissing,
}: {
  readonly initialRows: readonly SystemAnnouncementRow[];
  readonly migrationMissing: boolean;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'info' | 'warning' | 'success'>('info');
  const [isActive, setIsActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createAnnouncementAction({ title, message, tone, isActive });
      if (res.ok) {
        setTitle('');
        setMessage('');
        setFeedback('Aviso global salvo e atualizado!');
      } else {
        setFeedback(res.message ?? 'Erro ao salvar aviso.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1B1340]">
          Avisos Globais &amp; Sistema
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Publique um banner global exibido no topo do painel de todos os lojistas.
        </p>
      </div>

      {migrationMissing && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold">Tabela system_announcements ainda não criada no Supabase</p>
          <p>
            Execute a migração{' '}
            <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">
              supabase/migrations/0002_super_admin_and_announcements.sql
            </code>{' '}
            no SQL Editor do Supabase para ativar esta aba.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-[#EAE6F5] p-5 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-bold text-[#1B1340] inline-flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#6D4AFF]" strokeWidth={1.75} />
          Novo Aviso Global
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novidade no BookGrid / Manutenção programada"
              className="w-full px-3 py-2 rounded-lg border border-[#EAE6F5] text-xs text-[#1B1340]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estilo</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as 'info' | 'warning' | 'success')}
              className="w-full px-3 py-2 rounded-lg border border-[#EAE6F5] text-xs text-[#1B1340] bg-white"
            >
              <option value="info">Informativo (Azul/Cinza)</option>
              <option value="success">Novidade (Verde)</option>
              <option value="warning">Alerta (Amarelo)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mensagem</label>
          <textarea
            required
            minLength={4}
            maxLength={500}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva a mensagem curta que aparecerá no topo do painel dos lojistas..."
            className="w-full px-3 py-2 rounded-lg border border-[#EAE6F5] text-xs text-[#1B1340]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Ativar imediatamente (desativa avisos anteriores)
          </label>

          <button
            type="submit"
            disabled={isPending || migrationMissing}
            className="px-4 py-2 rounded-lg bg-[#1B1340] text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
          >
            Publicar Aviso
          </button>
        </div>

        {feedback && <p className="text-xs font-medium text-slate-700">{feedback}</p>}
      </form>

      <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm divide-y divide-slate-100">
        {initialRows.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">Nenhum aviso publicado ainda.</p>
        ) : (
          initialRows.map((row) => (
            <div key={row.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1B1340]">{row.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      row.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-[#EAE6F5]'
                    }`}
                  >
                    {row.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{row.message}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleAnnouncementAction({
                        announcementId: row.id,
                        isActive: !row.isActive,
                      });
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EAE6F5] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Power className="w-3.5 h-3.5" />
                  {row.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAnnouncementAction({ announcementId: row.id });
                    })
                  }
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
