import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PrivateOutlet({ accessKey, children }) {
  const { session, isAuthenticated, hasAccess } = useAuth();
  if (!(session?.user || isAuthenticated)) return <Navigate to="/login" replace />;
  if (accessKey && hasAccess && !hasAccess(accessKey)) return <Navigate to="/dashboard" replace />;
  return children ? children : <Outlet />;
}
