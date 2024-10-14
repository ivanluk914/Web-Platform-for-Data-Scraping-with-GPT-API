import React, { useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth0 } from '@auth0/auth0-react';


const HomePage: React.FC = () => {
  const { user } = useAuth0();
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedHomePage');
    
    if (!hasVisited) {
      toast.success(`Welcome, ${user?.name || 'Guest'}!`);
      localStorage.setItem('hasVisitedHomePage', 'true');
    }

  }, []);

  return (
    <>
      <Layout />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{duration: 5000}}/>
    </>
  );
};

export default HomePage;
