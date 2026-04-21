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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al emitir el voto. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (user?.hasVoted || txId) {
    return (
      <div className="voting-receipt">
        <div className="receipt-card">
          <div className="receipt-icon">✓</div>
          <h2>Voto Registrado</h2>
          <p>Tu voto ha sido registrado exitosamente en la blockchain.</p>
          {txId && (
            <div className="receipt-tx">
              <span className="receipt-label">ID de Transacción:</span>
              <code className="receipt-txid">{txId}</code>
            </div>
          )}
          {!txId && <p className="receipt-note">Tu voto fue registrado en una sesión anterior.</p>}
        </div>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 24 }}>Cargando elecciones…</p>;

  if (!election) {
    return (
      <div className="voting-empty">
        <p>No hay elecciones activas en este momento.</p>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="page-header">
        <div>
          <h2>{election.title}</h2>
          {election.description && (
            <p className="election-desc">{election.description}</p>
          )}
        </div>
      </div>

      <p className="voting-instruction">
        Selecciona un candidato y presiona <strong>Emitir Voto</strong>
      </p>

      <div className="candidates-grid">
        {election.candidates.map((c) => (
          <div
            key={c.id}
            className={`candidate-card${selected?.id === c.id ? ' selected' : ''}`}
            onClick={() => setSelected(c)}
          >
            <div className="candidate-avatar">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.candidateName} />
              ) : (
                <span>{c.candidateName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="candidate-info">
              <p className="candidate-name">{c.candidateName}</p>
              <p className="candidate-front">{c.frontName}</p>
              <p className="candidate-position">{c.position.replace(/_/g, ' ')}</p>
            </div>
            {selected?.id === c.id && <div className="candidate-check">✓</div>}
          </div>
        ))}
      </div>

      {error && <p className="error-msg" style={{ marginTop: 16 }}>{error}</p>}

      <button
        className="btn-primary vote-btn"
        disabled={!selected}
        onClick={() => setConfirming(true)}
      >
        Emitir Voto
      </button>

      {confirming && selected && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: 16 }}>Confirmar Voto</h3>
            <p>
              Estás a punto de votar por:
              <br />
              <strong>{selected.candidateName}</strong>
              <br />
              <span style={{ color: '#64748b', fontSize: 13 }}>{selected.frontName}</span>
            </p>
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
              ⚠ Esta acción es irreversible.
            </p>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button
                className="btn-primary"
                onClick={handleVote}
                disabled={submitting}
              >
                {submitting ? 'Registrando…' : 'Confirmar'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setConfirming(false)}
                disabled={submitting}
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
