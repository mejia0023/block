import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import Login from '../pages/public/Login';
import LiveResults from '../pages/public/LiveResults';
import Dashboard from '../pages/admin/Dashboard';
import ElectionManager from '../pages/admin/ElectionManager';
import AuditLogs from '../pages/admin/AuditLogs';
import UsersPage from '../pages/admin/UsersPage';
import VotingPage from '../pages/voter/VotingPage';
import AuditorDashboard from '../pages/auditor/AuditorDashboard';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

/** Redirige al home según el rol del usuario autenticado */
function RootRedirect() {
  const isAdmin   = useAuthStore((s) => s.isAdmin());
  const isAuditor = useAuthStore((s) => s.isAuditor());
  if (isAdmin)   return <Navigate to="/admin/dashboard" replace />;
  if (isAuditor) return <Navigate to="/auditor/resultados" replace />;
  return <Navigate to="/votante/votar" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Público ───────────────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />

        {/* Raíz → redirige según rol */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootRedirect />
            </ProtectedRoute>
          }
        />

        {/* ── ADMINISTRADOR ─────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMINISTRADOR', 'ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="elecciones" element={<ElectionManager />} />
          <Route path="usuarios"   element={<UsersPage />} />
          <Route path="auditoria"  element={<AuditLogs />} />
          <Route path="resultados" element={<LiveResults />} />
        </Route>

        {/* ── VOTANTE ───────────────────────────────────────────────────── */}
        <Route
          path="/votante"
          element={
            <ProtectedRoute roles={['VOTANTE', 'ESTUDIANTE', 'DOCENTE']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/votante/votar" replace />} />
          <Route path="votar"      element={<VotingPage />} />
          <Route path="resultados" element={<LiveResults />} />
        </Route>

        {/* ── AUDITOR ───────────────────────────────────────────────────── */}
        <Route
          path="/auditor"
          element={
            <ProtectedRoute roles={['AUDITOR']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/auditor/resultados" replace />} />
          <Route path="resultados" element={<AuditorDashboard />} />
          <Route path="blockchain" element={<AuditLogs />} />
        </Route>

        {/* URLs antiguas → redirigen al equivalente nuevo */}
        <Route path="/dashboard"  element={<Navigate to="/admin/dashboard"    replace />} />
        <Route path="/elections"  element={<Navigate to="/admin/elecciones"   replace />} />
        <Route path="/users"      element={<Navigate to="/admin/usuarios"     replace />} />
        <Route path="/audit"      element={<Navigate to="/admin/auditoria"    replace />} />
        <Route path="/vote"       element={<Navigate to="/votante/votar"      replace />} />
        <Route path="/results"    element={<Navigate to="/votante/resultados" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
