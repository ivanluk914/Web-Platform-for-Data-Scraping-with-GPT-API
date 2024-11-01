import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@nextui-org/react';
import { useUser } from '../providers/user-provider';
import { hasRole } from '../models/user';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: number[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { currentUser, isLoading } = useUser();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [toastShown, setToastShown] = useState(false); 

  useEffect(() => {
    if (!isLoading && currentUser) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(currentUser, role));
      setHasAccess(hasRequiredRole);
      setToastShown(false);

    } else if (!isLoading) {
      setHasAccess(false);
    }
  }, [isLoading, currentUser, requiredRoles]);

  useEffect(() => {
    if (hasAccess === false && !toastShown) {
      toast.error('You do not have access to this page');
      setToastShown(true);
    }
  }, [hasAccess, toastShown]);

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