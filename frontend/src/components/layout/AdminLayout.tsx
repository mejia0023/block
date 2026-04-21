import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-body">
        <Sidebar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
