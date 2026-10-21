import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

export default function HomeRedirect() {
  const { role } = useAuth();
  if (role === ROLES.CITIZEN) return <Navigate to="/citizen" replace />;
  return <Navigate to="/dashboard" replace />;
}
