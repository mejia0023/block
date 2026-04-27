import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Vote, Users, ShieldCheck, BarChart2,
  BarChart, Link2, Server, Layers, Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const adminLinks = [
  { to: '/admin/dashboard',  label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/admin/elecciones', label: 'Elecciones',  Icon: Vote },
  { to: '/admin/usuarios',   label: 'Usuarios',    Icon: Users },
  { to: '/admin/auditoria',  label: 'Auditoría',   Icon: ShieldCheck },
  { to: '/admin/resultados', label: 'Resultados',  Icon: BarChart2 },
  { to: '/admin/nodos',    label: 'Nodos',    Icon: Server },
  { to: '/admin/canales',  label: 'Canales',  Icon: Layers },
  { to: '/admin/ca',       label: 'CA',       Icon: Lock },
];

const voterLinks = [
  { to: '/votante/votar',      label: 'Emitir Voto', Icon: Vote },
  { to: '/votante/resultados', label: 'Resultados',  Icon: BarChart2 },
];

const auditorLinks = [
  { to: '/auditor/resultados', label: 'Resultados',  Icon: BarChart },
  { to: '/auditor/blockchain', label: 'Blockchain',  Icon: Link2 },
];

const rolMeta: Record<string, { label: string; colorVar: string; dot: string }> = {
  ADMINISTRADOR: { label: 'Administrador', colorVar: 'var(--status-closed)',  dot: 'bg-amber-500' },
  VOTANTE:       { label: 'Votante',       colorVar: 'var(--status-active)',  dot: 'bg-emerald-500' },
  AUDITOR:       { label: 'Auditor',       colorVar: 'var(--status-sched)',   dot: 'bg-blue-500' },
};

export default function Sidebar() {
  const isAdmin   = useAuthStore((s) => s.isAdmin());
  const isAuditor = useAuthStore((s) => s.isAuditor());
  const rol       = useAuthStore((s) => s.getRolNormalizado()) ?? 'VOTANTE';

  const links = isAdmin ? adminLinks : isAuditor ? auditorLinks : voterLinks;
  const meta  = rolMeta[rol] ?? rolMeta['VOTANTE'];

  return (
    <aside
      className="w-52 shrink-0 flex flex-col py-4"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Role badge */}
      <div className="mx-3 mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--surface-2)' }}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: meta.colorVar }}>
          {meta.label}
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Navegación principal">
        <ul className="list-none flex flex-col gap-0.5 px-2">
          {links.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] no-underline transition-all duration-150 ${
                    isActive
                      ? 'font-semibold'
                      : 'hover:opacity-100'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'var(--brand-light)', color: 'var(--brand)' }
                    : { color: 'var(--text-2)' }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      className="shrink-0"
                      style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }}
                    />
                    {label}
                    {isActive && (
                      <span
                        className="ml-auto w-1 h-4 rounded-full"
                        style={{ background: 'var(--brand)' }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
