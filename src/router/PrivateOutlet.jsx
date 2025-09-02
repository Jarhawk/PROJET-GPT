import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PrivateOutlet({ access, children }) {
  const { session, isAuthenticated, hasAccess } = useAuth();
  if (!(session?.user || isAuthenticated)) return <Navigate to="/login" replace />;
  if (access && hasAccess && !hasAccess(access)) return <Navigate to="/dashboard" replace />;
  return children ? children : <Outlet />;
}
