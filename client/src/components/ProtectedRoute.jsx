import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ roles }) {
  const { user, ready } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zyvex-black text-zinc-400">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
