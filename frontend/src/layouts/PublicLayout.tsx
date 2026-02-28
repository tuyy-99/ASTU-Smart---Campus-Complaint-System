import React from 'react';
import { Outlet } from 'react-router-dom';
import { SiteNavbar } from '../components/layout/SiteNavbar';
import { SiteFooter } from '../components/layout/SiteFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900 dark:text-slate-100">
      <SiteNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
};
