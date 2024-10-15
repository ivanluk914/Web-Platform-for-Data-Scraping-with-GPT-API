import {
    QueryClient,
    QueryClientProvider,
  } from '@tanstack/react-query';
  import React, { createContext, useContext, useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const HttpContext = createContext<AxiosInstance | null>(null);

export const useHttp = () => {
  const context = useContext(HttpContext);
  if (!context) {
    throw new Error('useHttp must be used within an HttpProvider');
  }
  return context;
};

export const HttpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:8080/api',
    });

    instance.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessTokenSilently();
        config.headers!.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting access token', error);
      }
      return config;
    });

    return instance;
  }, [getAccessTokenSilently]);

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <HttpContext.Provider value={axiosInstance}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </HttpContext.Provider>
  );
};
