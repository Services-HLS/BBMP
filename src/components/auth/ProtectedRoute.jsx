import { Navigate, useLocation } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, ready, role } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <LoadingState fullPage label="Starting BBMP One App…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
