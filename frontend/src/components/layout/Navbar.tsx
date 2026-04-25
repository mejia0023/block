import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center bg-slate-800 text-white px-6 h-[52px] gap-6">
      <span className="font-bold text-base mr-auto">FICCT E-Voting</span>
      <nav className="flex gap-4">
        <Link to="/dashboard" className="text-slate-300 text-[13px] hover:text-white no-underline">Dashboard</Link>
        <Link to="/elections" className="text-slate-300 text-[13px] hover:text-white no-underline">Elecciones</Link>
        <Link to="/audit"     className="text-slate-300 text-[13px] hover:text-white no-underline">Auditoría</Link>
        <Link to="/results"   className="text-slate-300 text-[13px] hover:text-white no-underline">Resultados</Link>
      </nav>
      <div className="flex items-center gap-3 text-[13px]">
        <span>{user?.name ?? user?.ru}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white border-none px-3 py-1 rounded-md cursor-pointer text-xs"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
