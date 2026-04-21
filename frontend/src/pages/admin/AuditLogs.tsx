import { useState, useEffect } from 'react';
import api from '../../api/axios.config';
import type { BlockchainSyncLog } from '../../types';

const STATUS_COLOR: Record<BlockchainSyncLog['status'], string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22c55e',
  FAILED: '#ef4444',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<BlockchainSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api
      .get<BlockchainSyncLog[]>('/audit/logs')
      .then(({ data }) => setLogs(data))
      .catch(() => {/* endpoint may not exist yet */})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchTx = txFilter ? l.txId?.includes(txFilter) : true;
    const matchStatus = statusFilter ? l.status === statusFilter : true;
    return matchTx && matchStatus;
  });

  return (
    <div>
      <h2>Auditoría Blockchain</h2>

      <div className="filter-bar">
        <input
          placeholder="Filtrar por txId…"
          value={txFilter}
          onChange={(e) => setTxFilter(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : filtered.length === 0 ? (
        <p>No hay registros.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>txId</th>
              <th>Elección</th>
              <th>Fecha</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td>
                  <span
                    style={{
                      color: STATUS_COLOR[log.status],
                      fontWeight: 700,
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td>
                  <code style={{ fontSize: 11 }}>
                    {log.txId ? `${log.txId.slice(0, 16)}…` : '—'}
                  </code>
                </td>
                <td>
                  <code style={{ fontSize: 11 }}>{log.electionId.slice(0, 8)}…</code>
                </td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td style={{ color: '#ef4444', fontSize: 12 }}>
                  {log.errorMessage ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
