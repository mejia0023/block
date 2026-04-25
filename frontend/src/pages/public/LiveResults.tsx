import { useState } from 'react';
import { BarChart2, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../../api/axios.config';
import type { TallyResult, Election } from '../../types';
import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';

export default function LiveResults() {
  const { elections } = useElections();
  const [selectedId, setSelectedId] = useState('');
  const [tally, setTally] = useState<TallyResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeOrClosed = elections.filter(
    (e: Election) => e.status === 'ACTIVA' || e.status === 'CERRADA' || e.status === 'ESCRUTADA',
  );

  const selectedElection = elections.find((e) => e.id === selectedId) ?? null;

  function candidateLabel(candidateId: string): string {
    if (candidateId === 'votos_blancos') return 'Votos en blanco';
    if (candidateId === 'votos_nulos')   return 'Votos nulos';
    const candidate = selectedElection?.candidates.find((c) => c.id === candidateId);
    return candidate ? `${candidate.candidateName} — ${candidate.frontName}` : candidateId.slice(0, 8) + '…';
  }

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

  const totalVotes = tally ? Object.values(tally.results).reduce((a, b) => a + b, 0) : 0;
  const sortedResults = tally
    ? Object.entries(tally.results).sort(([, a], [, b]) => b - a)
    : [];

  const inputBase: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    outline: 'none',
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Resultados en Vivo</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Datos en tiempo real desde Hyperledger Fabric</p>
      </div>

      {/* Controls */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-2xl items-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="relative flex-1 min-w-[220px]">
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <select
            className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none cursor-pointer pr-8"
            style={inputBase}
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setTally(null); }}
          >
            <option value="">Seleccionar elección…</option>
            {activeOrClosed.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {selectedId && selectedElection && (
          <StatusBadge status={selectedElection.status} />
        )}

        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)' }}
          onClick={fetchResults}
          disabled={!selectedId || loading}
        >
          {loading ? <><RefreshCw size={13} className="animate-spin" /> Cargando…</> : <><BarChart2 size={13} /> Ver resultados</>}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {tally && (
        <div
          className="rounded-2xl overflow-hidden animate-slide-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          {/* Summary bar */}
          <div
            className="px-5 py-3.5 flex items-center justify-between border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              {totalVotes} voto{totalVotes !== 1 ? 's' : ''} totales
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              Actualizado: {new Date(tally.lastUpdated).toLocaleString()}
            </span>
          </div>

          {/* Results */}
          <div className="p-5 flex flex-col gap-4">
            {sortedResults.map(([candidateId, count], i) => {
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isFirst = i === 0 && count > 0;
              return (
                <div key={candidateId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-xs flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                      {isFirst && <span className="text-base">🥇</span>}
                      {candidateLabel(candidateId)}
                    </span>
                    <span className="text-xs font-semibold ml-4 shrink-0" style={{ color: isFirst ? 'var(--status-active)' : 'var(--text-2)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isFirst
                          ? 'linear-gradient(90deg, var(--status-active), var(--brand))'
                          : 'var(--border-2)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
