import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Skeleton } from '@nextui-org/react';
import { useUser } from '../providers/user-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: number[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated } = useAuth0();
  const { currentUser, isLoading } = useUser();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setHasAccess(false);
      return;
    }

    if (currentUser) {
      const hasRequiredRole = currentUser.roles?.some(role => requiredRoles.includes(role)) ?? false;
      setHasAccess(hasRequiredRole);
    } else {
      setHasAccess(false);
    }
  }, [isAuthenticated, isLoading, currentUser, requiredRoles]);

  if (hasAccess === null || isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="w-full h-8 mb-4" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;