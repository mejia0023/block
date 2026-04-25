import { useState, useEffect } from 'react';
import { Search, Filter, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios.config';
import type { BlockchainSyncLog } from '../../types';

const STATUS_META: Record<BlockchainSyncLog['status'], { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDING:   { label: 'Pendiente',  color: 'var(--status-closed)', bg: 'var(--status-closed-bg)', Icon: Clock },
  CONFIRMED: { label: 'Confirmado', color: 'var(--status-active)', bg: 'var(--status-active-bg)', Icon: CheckCircle2 },
  FAILED:    { label: 'Fallido',    color: 'var(--error)',         bg: 'var(--error-bg)',         Icon: XCircle },
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

  const inputBase: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    outline: 'none',
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Auditoría Blockchain</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Registro de transacciones en Hyperledger Fabric</p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={inputBase}
            placeholder="Filtrar por txId…"
            value={txFilter}
            onChange={(e) => setTxFilter(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <select
            className="pl-8 pr-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            style={inputBase}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="FAILED">Fallido</option>
          </select>
        </div>
        <span className="flex items-center text-xs ml-auto px-3 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--surface-2)' }}>
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-3)' }}>
          <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-3)' }}>
          No hay registros{statusFilter || txFilter ? ' para este filtro' : ''}.
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Estado', 'txId', 'Elección', 'Fecha', 'Error'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold border-b"
                      style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const meta = STATUS_META[log.status];
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--border)` : 'none' }}
                    >
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          <meta.Icon size={11} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <code
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontFamily: 'monospace' }}
                        >
                          {log.txId ? `${log.txId.slice(0, 16)}…` : '—'}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <code
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontFamily: 'monospace' }}
                        >
                          {log.electionId.slice(0, 8)}…
                        </code>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-2)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: log.errorMessage ? 'var(--error)' : 'var(--text-3)' }}>
                        {log.errorMessage ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
