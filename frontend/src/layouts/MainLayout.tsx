import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home,
  LayoutDashboard, 
  FileText, 
  Bell, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Shield,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { getPostLogoutRoute } from '../lib/authRoutes';
import { Button } from '../components/ui/Button';
import { SiteFooter } from '../components/layout/SiteFooter';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin, isStaff, isStudent } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/', show: true },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', show: true },
    { label: 'My Complaints', icon: FileText, path: '/complaints', show: isStudent },
    { label: 'Verify Fixes', icon: ShieldCheck, path: '/complaints/verification', show: isStudent },
    { label: 'Dept Complaints', icon: FileText, path: '/staff/complaints', show: isStaff },
    { label: 'Registrations', icon: Users, path: '/staff/registrations', show: isStaff },
    { label: 'All Complaints', icon: FileText, path: '/admin/complaints', show: isAdmin },
    { label: 'Analytics', icon: BarChart3, path: '/admin/analytics', show: isAdmin },
    { label: 'User Roles', icon: Users, path: '/admin/users', show: isAdmin },
    { label: 'Audit Logs', icon: Shield, path: '/admin/audit-logs', show: isAdmin },
    { label: 'Notifications', icon: Bell, path: '/notifications', show: true },
    { label: 'Chatbot', icon: MessageSquare, path: '/chatbot', show: true },
    { label: 'Profile', icon: Users, path: '/profile', show: true },
  ];

  const activeItems = navItems.filter(item => item.show);

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors relative">
      
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-200/80 bg-white/95 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 lg:block z-30 shadow-xl">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="relative">
              <img 
                src="/images/astu-logo.png" 
                alt="ASTU Logo" 
                className="h-12 w-12 rounded-xl object-contain shadow-md"
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">
                ASTU Smart
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Student'} Portal
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {activeItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all relative group',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon size={20} className={cn(isActive && "text-white")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-900/30 dark:to-emerald-800/25 p-4 border border-emerald-200/60 dark:border-emerald-800/60">
              <div className="relative h-12 w-12">
                {user?.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.name}
                    className="h-12 w-12 rounded-full object-cover shadow-md border border-emerald-400/70"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold shadow-md">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="flex-1">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate(getPostLogoutRoute());
                }}
                className="flex-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <div className="flex items-center gap-2">
          <img 
            src="/images/astu-logo.png" 
            alt="ASTU Logo" 
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="font-bold text-emerald-600">ASTU Smart</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:hidden"
          >
            <nav className="space-y-1">
              {activeItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium',
                    location.pathname === item.path
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                <button
                  onClick={() => {
                    logout();
                    navigate(getPostLogoutRoute());
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </nav>
          </motion.div>
        </>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 relative z-10 flex-1 flex flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          {/* Back Button */}
          {location.pathname !== '/dashboard' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ArrowLeft size={18} />
                Back
              </Button>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
        
        {/* Footer at bottom */}
        <SiteFooter />
      </main>
    </div>
  );
};
