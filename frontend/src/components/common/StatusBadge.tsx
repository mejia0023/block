import type { ElectionStatus } from '../../types';

const classMap: Record<ElectionStatus, string> = {
  BORRADOR:   'bg-slate-400',
  PROGRAMADA: 'bg-indigo-500',
  ACTIVA:     'bg-green-500',
  CERRADA:    'bg-amber-500',
  ESCRUTADA:  'bg-slate-500',
};

export default function StatusBadge({ status }: { status: ElectionStatus }) {
  return (
    <span className={`${classMap[status]} text-white px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {status}
    </span>
  );
}
