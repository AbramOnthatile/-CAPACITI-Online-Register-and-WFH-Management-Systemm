import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../api/types';
import { isUserRole } from '../lib/auth/session';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    !isUserRole(user.role)
    || !Object.values(UserRole).includes(user.role)
    || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default RoleRoute;
