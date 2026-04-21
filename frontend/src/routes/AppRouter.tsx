import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/public/Login';
import LiveResults from '../pages/public/LiveResults';
import Dashboard from '../pages/admin/Dashboard';
import ElectionManager from '../pages/admin/ElectionManager';
import AuditLogs from '../pages/admin/AuditLogs';
import VotingPage from '../pages/voter/VotingPage';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="elections" element={<ElectionManager />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="results" element={<LiveResults />} />
          <Route path="vote" element={<VotingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
