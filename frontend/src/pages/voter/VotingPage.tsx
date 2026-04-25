import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, AlertCircle, Vote } from 'lucide-react';
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

  /* ── Already voted ─────────────────────────────────────────────────────── */
  if (user?.hasVoted || txId) {
    return (
      <div className="flex items-center justify-center p-12 animate-fade-in">
        <div
          className="rounded-2xl p-10 text-center max-w-md w-full animate-scale-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--status-active-bg)' }}
          >
            <CheckCircle2 size={32} style={{ color: 'var(--status-active)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Voto Registrado</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Tu voto ha sido registrado exitosamente en la blockchain.
          </p>
          {txId && (
            <div
              className="mt-6 rounded-xl p-4 text-left"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <span className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                ID de Transacción
              </span>
              <code className="text-xs break-all" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>
                {txId}
              </code>
            </div>
          )}
          {!txId && (
            <p className="mt-4 text-xs" style={{ color: 'var(--text-3)' }}>
              Tu voto fue registrado en una sesión anterior.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-3)' }}>
      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </div>
  );

  if (!election) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <Vote size={32} style={{ color: 'var(--text-3)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>No hay elecciones activas en este momento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{election.title}</h2>
        {election.description && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{election.description}</p>
        )}
        <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
          Selecciona un candidato y presiona <strong style={{ color: 'var(--text-2)' }}>Emitir Voto</strong>
        </p>
      </div>

      {/* Candidate grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-4">
        {election.candidates.map((c) => {
          const isSelected = selected?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="relative rounded-2xl p-5 text-center cursor-pointer border-0 transition-all duration-200 flex flex-col items-center gap-2"
              style={{
                background: isSelected ? 'var(--brand-light)' : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                boxShadow: isSelected ? `0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent), var(--shadow)` : 'var(--shadow-sm)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
              aria-pressed={isSelected}
              aria-label={`Votar por ${c.candidateName}`}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden text-2xl font-bold"
                style={{
                  background: isSelected ? 'var(--brand)' : 'var(--surface-2)',
                  color: isSelected ? '#fff' : 'var(--brand)',
                }}
              >
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.candidateName} className="w-full h-full object-cover" />
                ) : (
                  c.candidateName.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <p className="font-bold text-sm" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-1)' }}>
                  {c.candidateName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{c.frontName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>
                  {c.position}
                </p>
              </div>

              {isSelected && (
                <div
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--brand)' }}
                >
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        className="self-start flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{ background: selected ? 'var(--brand)' : 'var(--border-2)' }}
        disabled={!selected}
        onClick={() => setConfirming(true)}
      >
        <Vote size={15} />
        Emitir Voto
      </button>

      {/* Confirm modal */}
      {confirming && selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
          style={{ background: 'rgba(0,0,0,.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-[380px] mx-4 rounded-2xl p-7 flex flex-col gap-5 animate-scale-in"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-light)' }}
              >
                <Vote size={17} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-1)' }}>Confirmar Voto</h3>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                  Estás a punto de votar por:
                </p>
                <p className="font-bold text-sm mt-1.5" style={{ color: 'var(--text-1)' }}>{selected.candidateName}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{selected.frontName}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs"
              style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
            >
              <AlertTriangle size={13} className="shrink-0" />
              Esta acción es irreversible.
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border transition-colors disabled:opacity-60"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'var(--border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleVote}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--brand)' }}
              >
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Registrando…</> : 'Confirmar Voto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
