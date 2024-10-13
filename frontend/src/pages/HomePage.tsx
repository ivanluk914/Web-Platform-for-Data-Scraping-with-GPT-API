import React, { useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';

const HomePage: React.FC = () => {
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedHomePage');
    
    if (!hasVisited) {
      toast.success('Welcome, Jane Doe!');
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
