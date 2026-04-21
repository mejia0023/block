import type { ElectionStatus } from '../../types';

const colorMap: Record<ElectionStatus, string> = {
  PROGRAMADA: '#6366f1',
  ACTIVA: '#22c55e',
  CERRADA: '#f59e0b',
  ESCRUTADA: '#64748b',
};

export default function StatusBadge({ status }: { status: ElectionStatus }) {
  return (
    <span
      style={{
        backgroundColor: colorMap[status],
        color: '#fff',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}
