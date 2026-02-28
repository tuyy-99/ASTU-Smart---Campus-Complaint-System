import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { getPostLogoutRoute } from '../../lib/authRoutes';

interface SiteNavbarProps {
  className?: string;
}

export const SiteNavbar: React.FC<SiteNavbarProps> = ({ className }) => {
  const { isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const complaintsPath = isAdmin ? '/admin/complaints' : isStaff ? '/staff/complaints' : '/complaints';
  const protectedPath = (path: string) => (isAuthenticated ? path : '/login');

  const navItems = [
    { to: '/', label: 'Home' },
    { to: protectedPath('/dashboard'), label: 'Dashboard' },
    { to: protectedPath(complaintsPath), label: 'Complaints' },
    { to: protectedPath('/map'), label: 'Map' },
    { to: protectedPath('/profile'), label: 'Profile' }
  ];

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 ${className || ''}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/astu-logo.png" alt="ASTU Logo" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-lg font-bold text-emerald-600">ASTU Smart</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                logout();
                navigate(getPostLogoutRoute());
              }}
            >
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
