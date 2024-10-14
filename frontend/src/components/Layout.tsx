import React from 'react';
import Sidebar from './SideBar';
import Content from './Contents';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background font-sans antialiased">
      <Sidebar />
      <main className="flex-grow p-6 min-h-screen">
        <Content />
      </main>
    </div>
  );
};

export default Layout;
