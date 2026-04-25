import { useState } from 'react';
import api from '../../api/axios.config';
import type { TallyResult, Election } from '../../types';
import { useElections } from '../../hooks/useElections';

export default function AuditorDashboard() {
  const { elections } = useElections();
  const [selectedId, setSelectedId] = useState('');
  const [tally, setTally] = useState<TallyResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const disponibles = elections.filter(
    (e: Election) => e.status === 'ACTIVA' || e.status === 'CERRADA' || e.status === 'ESCRUTADA',
  );

  const selectedElection = elections.find((e) => e.id === selectedId) ?? null;

  function candidateLabel(candidateId: string): string {
    if (candidateId === 'votos_blancos') return 'Votos en blanco';
    if (candidateId === 'votos_nulos')   return 'Votos nulos';
    const c = selectedElection?.candidates.find((c) => c.id === candidateId);
    return c ? `${c.candidateName} — ${c.frontName}` : candidateId.slice(0, 8) + '…';
  }

  async function fetchResults() {
    if (!selectedId) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get<TallyResult>(`/fabric/results/${selectedId}`);
      setTally(data);
    } catch {
      setError('No se pudieron cargar los resultados del ledger');
      setTally(null);
    } finally {
      setLoading(false);
    }
  }

  const totalVotes = tally ? Object.values(tally.results).reduce((a, b) => a + b, 0) : 0;
  const selectCls = 'border border-slate-300 rounded-md px-2.5 py-1.5 text-[13px] min-w-[200px]';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold">Panel de Auditoría</h2>
          <p className="text-slate-500 text-[13px] mt-1">
            Solo lectura — datos directamente del ledger de Hyperledger Fabric.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select className={selectCls} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setTally(null); }}>
          <option value="">Seleccionar elección…</option>
          {disponibles.map((e) => (
            <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
          ))}
        </select>
        <button
          className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={fetchResults}
          disabled={!selectedId || loading}
        >
          {loading ? 'Consultando ledger…' : 'Ver en blockchain'}
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      {tally && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
          <p className="text-slate-500 text-sm mb-4">
            Total votos: <strong>{totalVotes}</strong> — Última actualización en ledger:{' '}
            {new Date(tally.lastUpdated).toLocaleString()}
          </p>
          <div className="flex flex-col gap-3.5">
            {Object.entries(tally.results).map(([candidateId, count]) => {
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={candidateId} className="flex items-center gap-3">
                  <span className="w-40 text-sm truncate">{candidateLabel(candidateId)}</span>
                  <div className="flex-1 bg-slate-200 rounded-md h-4">
                    <div className="bg-indigo-500 h-full rounded-md transition-[width] duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-xs text-slate-500 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
