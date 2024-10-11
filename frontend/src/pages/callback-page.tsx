import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SideBar';
import Content from '../components/Contents';

export const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /home after loading the callback page
    navigate('/home');
  }, [navigate]);

  return (
    <div className="flex h-full bg-white">
      <Sidebar />
      <Content />
    </div>
  );
};

export default CallbackPage;