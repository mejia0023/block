import { useState } from 'react';
import api from '../../api/axios.config';
import type { TallyResult, Election } from '../../types';
import { useElections } from '../../hooks/useElections';

export default function LiveResults() {
  const { elections } = useElections();
  const [selectedId, setSelectedId] = useState('');
  const [tally, setTally] = useState<TallyResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeOrClosed = elections.filter(
    (e: Election) => e.status === 'ACTIVA' || e.status === 'CERRADA' || e.status === 'ESCRUTADA',
  );

  async function fetchResults() {
    if (!selectedId) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get<TallyResult>(`/fabric/results/${selectedId}`);
      setTally(data);
    } catch {
      setError('No se pudieron cargar los resultados');
      setTally(null);
    } finally {
      setLoading(false);
    }
  }

  const totalVotes = tally
    ? Object.values(tally.results).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div>
      <h2>Resultados en Vivo</h2>

      <div className="filter-bar">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Seleccionar elección…</option>
          {activeOrClosed.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.status})
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={fetchResults} disabled={!selectedId || loading}>
          {loading ? 'Cargando…' : 'Ver resultados'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {tally && (
        <div className="results-container">
          <p className="results-meta">
            Total votos: <strong>{totalVotes}</strong> — Actualizado:{' '}
            {new Date(tally.lastUpdated).toLocaleString()}
          </p>
          {Object.entries(tally.results).map(([candidateId, count]) => {
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={candidateId} className="result-row">
                <span className="result-label">
                  {candidateId === 'votos_blancos'
                    ? 'Votos en blanco'
                    : candidateId === 'votos_nulos'
                    ? 'Votos nulos'
                    : candidateId.slice(0, 8) + '…'}
                </span>
                <div className="result-bar-wrap">
                  <div className="result-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="result-count">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
