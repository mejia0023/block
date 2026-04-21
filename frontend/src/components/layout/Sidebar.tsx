import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/elections', label: 'Elecciones' },
  { to: '/audit', label: 'Auditoría' },
  { to: '/results', label: 'Resultados' },
];

const voterLinks = [
  { to: '/vote', label: 'Emitir Voto' },
  { to: '/results', label: 'Resultados' },
];

export default function Sidebar() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const links = isAdmin ? adminLinks : voterLinks;

  return (
    <aside className="sidebar">
      <ul>
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
