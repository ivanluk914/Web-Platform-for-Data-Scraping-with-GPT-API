import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const CallbackPage: React.FC = () => {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !error && isAuthenticated) {
      navigate('/home');
    }
  }, [isLoading, error, isAuthenticated, navigate]);

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  return <div></div>;
};
