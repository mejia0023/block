import { Vote, CheckCircle2, Clock, BarChart2, FileEdit } from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';
import type { ElectionStatus } from '../../types';

const STATUSES: ElectionStatus[] = ['PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA'];

const statMeta: Record<ElectionStatus, { Icon: React.ElementType; color: string; bg: string }> = {
  PROGRAMADA: { Icon: Clock,         color: 'var(--status-sched)',   bg: 'var(--status-sched-bg)' },
  ACTIVA:     { Icon: Vote,          color: 'var(--status-active)',  bg: 'var(--status-active-bg)' },
  CERRADA:    { Icon: CheckCircle2,  color: 'var(--status-closed)',  bg: 'var(--status-closed-bg)' },
  ESCRUTADA:  { Icon: BarChart2,     color: 'var(--status-counted)', bg: 'var(--status-counted-bg)' },
  BORRADOR:   { Icon: FileEdit,      color: 'var(--status-draft)',   bg: 'var(--status-draft-bg)' },
};

const STATUS_LABEL: Record<ElectionStatus, string> = {
  BORRADOR: 'Borrador', PROGRAMADA: 'Programadas', ACTIVA: 'Activas',
  CERRADA: 'Cerradas', ESCRUTADA: 'Escrutadas',
};

export default function Dashboard() {
  const { elections, loading } = useElections();

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = elections.filter((e) => e.status === s).length;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-3)' }}>
      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Dashboard</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Resumen del sistema de votación</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((s) => {
          const { Icon, color, bg } = statMeta[s];
          return (
            <div
              key={s}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                  {STATUS_LABEL[s]}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <span className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>{counts[s]}</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>elecciones</span>
            </div>
          );
        })}
      </div>

      {/* Recent elections */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Elecciones recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Título', 'Estado', 'Inicio', 'Fin'].map((h) => (
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
              {elections.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center px-5 py-8 text-sm" style={{ color: 'var(--text-3)' }}>
                    No hay elecciones registradas
                  </td>
                </tr>
              )}
              {elections.slice(0, 5).map((e, i) => (
                <tr
                  key={e.id}
                  className="transition-colors"
                  style={{ borderBottom: i < 4 ? `1px solid var(--border)` : 'none' }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-1)' }}>{e.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-2)' }}>
                    {new Date(e.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-2)' }}>
                    {new Date(e.endDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
