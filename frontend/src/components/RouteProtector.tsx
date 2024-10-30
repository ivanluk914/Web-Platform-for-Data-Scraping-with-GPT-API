import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { UserService } from '../api/user-service';
import { Skeleton } from '@nextui-org/react';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: number[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuth0();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const http = useHttp();
  const toastShown = useRef(false);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (!isAuthenticated) {
        setHasAccess(false);
        return  <Navigate to="/home" />;
      }

      try {
        const roles = await new UserService(http).getUserRoles(user?.sub || '');
        const hasRequiredRole = roles.some(role => requiredRoles.includes(role));
        setHasAccess(hasRequiredRole);
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setHasAccess(false);
      }
    };

    checkUserRoles();
  }, [isAuthenticated, user, http, requiredRoles]);

  if (hasAccess === null) {
    return (
      <div className="p-4">
        <Skeleton className="w-full h-8 mb-4" />
      </div>
    );
  }

  if (!hasAccess) {
    // if (!toastShown.current) {
    //   toast.error('You do not have access to this page');
    //   toastShown.current = true;
    // }
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;