import React, { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { UserModel } from '../models/user';
import { useHttp } from './http-provider';
import { useQuery } from '@tanstack/react-query';

interface UserContextType {
  currentUser: UserModel | null;
  isLoading: boolean;
  error: Error | null;
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
  const http = useHttp();

  const {
    data: currentUser,
    isLoading,
    error,
  } = useQuery<UserModel>({
    queryKey: ['users', user?.sub],
    queryFn: async () => {
      if (!user?.sub || !isAuthenticated) {
        return null;
      }
      console.log('Fetching user', user.sub);
      const response = await http.get(`/user/${user.sub}`);
      return response.data;
    },
    enabled: !!user?.sub && isAuthenticated && !isAuth0Loading,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const value = {
    currentUser: currentUser ?? null,
    isLoading: isLoading || isAuth0Loading,
    error: error instanceof Error ? error : null,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
