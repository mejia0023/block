import { useState, useEffect } from 'react';
import api from '../../api/axios.config';
import type { BlockchainSyncLog } from '../../types';

const STATUS_COLOR: Record<BlockchainSyncLog['status'], string> = {
  PENDING:   'text-amber-500',
  CONFIRMED: 'text-green-500',
  FAILED:    'text-red-500',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<BlockchainSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get<BlockchainSyncLog[]>('/audit/logs')
      .then(({ data }) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchTx = txFilter ? l.txId?.includes(txFilter) : true;
    const matchStatus = statusFilter ? l.status === statusFilter : true;
    return matchTx && matchStatus;
  });

  const inputCls = 'border border-slate-300 rounded-md px-2.5 py-1.5 text-[13px] min-w-[200px]';

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Auditoría Blockchain</h2>

      <div className="flex gap-3 mb-4">
        <input className={inputCls} placeholder="Filtrar por txId…" value={txFilter} onChange={(e) => setTxFilter(e.target.value)} />
        <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">No hay registros.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm bg-white">
            <thead>
              <tr>
                {['Estado', 'txId', 'Elección', 'Fecha', 'Error'].map((h) => (
                  <th key={h} className="bg-slate-50 text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="px-3.5 py-2.5 border-b border-slate-100">
                    <span className={`${STATUS_COLOR[log.status]} font-bold`}>{log.status}</span>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-slate-100">
                    <code className="text-[11px]">{log.txId ? `${log.txId.slice(0, 16)}…` : '—'}</code>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-slate-100">
                    <code className="text-[11px]">{log.electionId.slice(0, 8)}…</code>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-slate-100">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 border-b border-slate-100 text-red-500 text-xs">{log.errorMessage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
