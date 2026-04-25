import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const adminLinks = [
  { to: '/admin/dashboard',  label: 'Dashboard' },
  { to: '/admin/elecciones', label: 'Elecciones' },
  { to: '/admin/usuarios',   label: 'Usuarios' },
  { to: '/admin/auditoria',  label: 'Auditoría' },
  { to: '/admin/resultados', label: 'Resultados' },
];

const voterLinks = [
  { to: '/votante/votar',      label: 'Emitir Voto' },
  { to: '/votante/resultados', label: 'Resultados' },
];

const auditorLinks = [
  { to: '/auditor/resultados', label: 'Resultados' },
  { to: '/auditor/blockchain', label: 'Blockchain' },
];

const rolLabel: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  VOTANTE:       'Votante',
  AUDITOR:       'Auditor',
};

const rolBadge: Record<string, string> = {
  ADMINISTRADOR: 'bg-amber-100 text-amber-800',
  VOTANTE:       'bg-green-50 text-green-800',
  AUDITOR:       'bg-blue-100 text-blue-800',
};

export default function Sidebar() {
  const isAdmin   = useAuthStore((s) => s.isAdmin());
  const isAuditor = useAuthStore((s) => s.isAuditor());
  const rol       = useAuthStore((s) => s.getRolNormalizado()) ?? 'VOTANTE';

  const links = isAdmin ? adminLinks : isAuditor ? auditorLinks : voterLinks;

  return (
    <aside className="w-[200px] bg-white border-r border-slate-200 py-5 shrink-0">
      <div className={`mx-3 mb-4 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-center ${rolBadge[rol] ?? ''}`}>
        {rolLabel[rol]}
      </div>
      <ul className="list-none">
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `block px-5 py-2.5 text-[13px] no-underline transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-indigo-500 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-400'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
