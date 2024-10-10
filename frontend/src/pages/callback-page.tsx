import React from "react";
import Sidebar from '../components/SideBar';
import Content from '../components/Contents';
import { toast, Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

export const CallbackPage = () => {
  return (
    <div className="flex h-full bg-white">
    <Sidebar />
    <Content />
  </div>
  );
};