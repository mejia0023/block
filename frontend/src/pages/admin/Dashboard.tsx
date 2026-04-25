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

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

      <div className="flex gap-4 mb-7 flex-wrap">
        {STATUSES.map((s) => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl px-7 py-5 flex flex-col items-center gap-1.5">
            <StatusBadge status={s} />
            <span className="text-3xl font-bold">{counts[s]}</span>
            <span className="text-xs text-slate-500">elecciones</span>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mt-5 mb-2.5">Elecciones recientes</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-sm bg-white">
          <thead>
            <tr>
              <th className="bg-slate-50 text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold">Título</th>
              <th className="bg-slate-50 text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold">Estado</th>
              <th className="bg-slate-50 text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold">Inicio</th>
              <th className="bg-slate-50 text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold">Fin</th>
            </tr>
          </thead>
          <tbody>
            {elections.slice(0, 5).map((e) => (
              <tr key={e.id}>
                <td className="px-3.5 py-2.5 border-b border-slate-100">{e.title}</td>
                <td className="px-3.5 py-2.5 border-b border-slate-100"><StatusBadge status={e.status} /></td>
                <td className="px-3.5 py-2.5 border-b border-slate-100">{new Date(e.startDate).toLocaleDateString()}</td>
                <td className="px-3.5 py-2.5 border-b border-slate-100">{new Date(e.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
