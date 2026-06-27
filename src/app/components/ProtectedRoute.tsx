import { Navigate, useLocation } from 'react-router';
import { canAccessPath } from '../utils/permissions';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const role = localStorage.getItem('userRole');

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to="/app/access-denied" replace />;
  }

  return <>{children}</>;
}