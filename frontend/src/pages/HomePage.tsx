import { useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from '../components/SideBar';
import Content from '../components/Contents';

const HomePage = () => {
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedHomePage');
    
    if (!hasVisited) {
      toast.success('Welcome, Jane Doe!');
      localStorage.setItem('hasVisitedHomePage', 'true');
    }
  }, []);

  return (
    <div className="flex h-full bg-white">
      <Sidebar />
      <Content />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{duration: 5000}}/>
    </div>
  );
};

export default HomePage;
