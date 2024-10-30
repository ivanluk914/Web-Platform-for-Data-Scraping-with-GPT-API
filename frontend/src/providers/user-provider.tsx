import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { UserModel } from '../models/user';
import { useHttp } from './http-provider';

interface UserContextType {
  currentUser: UserModel | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: isAuth0Loading } = useAuth0();
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();

  const fetchUser = async () => {
    if (!user?.sub || !isAuthenticated) {
      setCurrentUser(null);
      return;
    }

    try {
      const response = await http.get(`/user/${user.sub}`);
      setCurrentUser(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      setCurrentUser(null);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuth0Loading) {
      refreshUser();
    }
  }, [isAuth0Loading, isAuthenticated, user?.sub]);

  const value = {
    currentUser,
    isLoading: isLoading || isAuth0Loading,
    error,
    refreshUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
