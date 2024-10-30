import React from 'react';
import Sidebar from './SideBar';
import Content from './Contents';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background font-sans antialiased">
      <Sidebar />
      <main className="flex-grow p-6 min-h-screen overflow-y-auto">
        <Content />
      </main>
    </div>
  );
};

export default Layout;
