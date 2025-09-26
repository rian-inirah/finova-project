import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pb-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
