import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';
import type { ElectionStatus } from '../../types';

const STATUSES: ElectionStatus[] = ['PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA'];

export default function Dashboard() {
  const { elections, loading } = useElections();

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = elections.filter((e) => e.status === s).length;
    return acc;
  }, {});

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-grid">
        {STATUSES.map((s) => (
          <div key={s} className="stat-card">
            <StatusBadge status={s} />
            <span className="stat-count">{counts[s]}</span>
            <span className="stat-label">elecciones</span>
          </div>
        ))}
      </div>

      <h3>Elecciones recientes</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Inicio</th>
            <th>Fin</th>
          </tr>
        </thead>
        <tbody>
          {elections.slice(0, 5).map((e) => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td><StatusBadge status={e.status} /></td>
              <td>{new Date(e.startDate).toLocaleDateString()}</td>
              <td>{new Date(e.endDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
