import { useState } from 'react';
import { useElections } from '../../hooks/useElections';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios.config';
import type { Candidate } from '../../types';

export default function VotingPage() {
  const { elections, loading } = useElections();
  const user = useAuthStore((s) => s.user);

  const [selected, setSelected] = useState<Candidate | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeElections = elections.filter((e) => e.status === 'ACTIVA');
  const election = activeElections[0] ?? null;

  async function handleVote() {
    if (!selected || !election) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post<{ txId: string }>('/fabric/vote', {
        electionId: election.id,
        candidateId: selected.id,
      });
      setTxId(data.txId);
      useAuthStore.getState().setAuth({
        access_token: useAuthStore.getState().token!,
        user: { ...user!, hasVoted: true },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al emitir el voto. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (user?.hasVoted || txId) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-white rounded-xl p-10 text-center max-w-md w-full shadow-lg">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-semibold mb-2">Voto Registrado</h2>
          <p className="text-slate-500 text-sm">Tu voto ha sido registrado exitosamente en la blockchain.</p>
          {txId && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-left">
              <span className="block text-[11px] text-slate-500 mb-1.5 font-semibold uppercase">ID de Transacción:</span>
              <code className="font-mono text-xs text-slate-800 break-all block">{txId}</code>
            </div>
          )}
          {!txId && <p className="mt-4 text-sm text-slate-500">Tu voto fue registrado en una sesión anterior.</p>}
        </div>
      </div>
    );
  }

  if (loading) return <p className="p-6">Cargando elecciones…</p>;

  if (!election) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-sm">
        No hay elecciones activas en este momento.
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold">{election.title}</h2>
          {election.description && (
            <p className="text-slate-500 text-[13px] mt-1">{election.description}</p>
          )}
        </div>
      </div>

      <p className="text-slate-500 text-[13px] mb-5">
        Selecciona un candidato y presiona <strong>Emitir Voto</strong>
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
        {election.candidates.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelected(c)}
            className={`relative bg-white border-2 rounded-xl p-5 cursor-pointer text-center transition-all ${
              selected?.id === c.id
                ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,.15)]'
                : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.candidateName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-500">
                  {c.candidateName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-semibold text-sm mb-0.5">{c.candidateName}</p>
            <p className="text-xs text-slate-500 mb-1">{c.frontName}</p>
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">
              {c.position.replace(/_/g, ' ')}
            </p>
            {selected?.id === c.id && (
              <div className="absolute top-2.5 right-3 text-indigo-500 text-base font-bold">✓</div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-xs mt-4">{error}</p>}

      <button
        className="mt-6 bg-indigo-500 text-white border-none px-7 py-2.5 rounded-md cursor-pointer text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!selected}
        onClick={() => setConfirming(true)}
      >
        Emitir Voto
      </button>

      {confirming && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-8 py-7 w-[360px] shadow-2xl">
            <h3 className="text-base font-semibold mb-4">Confirmar Voto</h3>
            <p className="text-sm mb-1">
              Estás a punto de votar por:<br />
              <strong>{selected.candidateName}</strong><br />
              <span className="text-slate-500 text-[13px]">{selected.frontName}</span>
            </p>
            <p className="text-red-500 text-xs mt-2 mb-5">⚠ Esta acción es irreversible.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleVote}
                disabled={submitting}
                className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold disabled:opacity-60"
              >
                {submitting ? 'Registrando…' : 'Confirmar Voto'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="bg-slate-200 text-slate-800 border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
