import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';

interface Props {
  children: React.ReactNode;
  /** Roles que pueden acceder. Sin este prop = cualquier usuario autenticado. */
  roles?: Array<'ADMINISTRADOR' | 'ADMIN' | 'VOTANTE' | 'ESTUDIANTE' | 'DOCENTE' | 'AUDITOR'>;
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated } = useAuth();
  const isAdmin   = useAuthStore((s) => s.isAdmin());
  const isAuditor = useAuthStore((s) => s.isAuditor());
  const isVoter   = useAuthStore((s) => s.isVoter());

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const allowed = roles.some((r) => {
      if (r === 'ADMINISTRADOR' || r === 'ADMIN') return isAdmin;
      if (r === 'AUDITOR') return isAuditor;
      return isVoter; // VOTANTE, ESTUDIANTE, DOCENTE
    });

    if (!allowed) {
      if (isAdmin)   return <Navigate to="/admin/dashboard" replace />;
      if (isAuditor) return <Navigate to="/auditor/resultados" replace />;
      return <Navigate to="/votante/votar" replace />;
    }
  }

  return <>{children}</>;
}
