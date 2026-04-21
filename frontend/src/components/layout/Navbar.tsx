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
    <header className="navbar">
      <span className="navbar-brand">FICCT E-Voting</span>
      <nav className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/elections">Elecciones</Link>
        <Link to="/audit">Auditoría</Link>
        <Link to="/results">Resultados</Link>
      </nav>
      <div className="navbar-user">
        <span>{user?.name ?? user?.ru}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
}
