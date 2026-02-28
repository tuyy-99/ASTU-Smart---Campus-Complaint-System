import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  ArrowRight,
  GraduationCap,
  UserCog,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { PageHero } from '../components/ui/PageHero';
import { formatDate, cn } from '../lib/utils';
import api from '../api/client';
import { Complaint, ComplaintStatus, UserRole } from '../types';
import { mapComplaint } from '../api/mappers';

const DashboardPage: React.FC = () => {
  const { user, isStudent, isStaff, isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/complaints');
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    },
  });

  const stats = React.useMemo(() => {
    if (!complaints) return { total: 0, pendingReview: 0, open: 0, inProgress: 0, resolved: 0, rejected: 0 };
    return {
      total: complaints.length,
      pendingReview: complaints.filter(c => c.status === ComplaintStatus.PENDING_REVIEW).length,
      open: complaints.filter(c => c.status === ComplaintStatus.OPEN).length,
      inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
      resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
      rejected: complaints.filter(c => c.status === ComplaintStatus.REJECTED).length,
    };
  }, [complaints]);

  const pendingVerification = React.useMemo(() => {
    if (!isStudent || !complaints) return [];
    return complaints.filter(
      (item) =>
        item.status === ComplaintStatus.RESOLVED &&
        (!item.resolutionVerification?.status || item.resolutionVerification.status === 'pending')
    );
  }, [complaints, isStudent]);

  // Role-based styling
  const roleConfig = React.useMemo(() => {
    if (isAdmin) {
      return {
        gradient: 'from-purple-600 to-purple-400',
        bgGradient: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
        icon: Shield,
        title: 'Admin Dashboard',
        subtitle: 'Manage system-wide operations and analytics.',
        accentColor: 'purple'
      };
    } else if (isStaff) {
      return {
        gradient: 'from-blue-600 to-blue-400',
        bgGradient: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
        icon: UserCog,
        title: 'Staff Dashboard',
        subtitle: 'Review and manage department complaints.',
        accentColor: 'blue'
      };
    } else {
      return {
        gradient: 'from-emerald-600 to-emerald-400',
        bgGradient: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
        icon: GraduationCap,
        title: 'Student Dashboard',
        subtitle: 'Track and manage your campus issues.',
        accentColor: 'emerald'
      };
    }
  }, [isStaff, isAdmin]);

  const RoleIcon = roleConfig.icon;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={RoleIcon}
          title={`Welcome, ${user?.name || ''}`}
          subtitle={roleConfig.subtitle}
          iconWrapClassName={isAdmin ? 'bg-purple-600' : isStaff ? 'bg-blue-600' : 'bg-emerald-600'}
        >
          {isStudent && (
            <Link to="/complaints/new">
              <Button size="lg" className="shadow-xl">
                <Plus className="mr-2 h-5 w-5" /> New Complaint
              </Button>
            </Link>
          )}
        </PageHero>
      </motion.div>

      {/* Enhanced Stats Grid with animations */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-modern flex items-center gap-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-800/40 hover:scale-105 transition-transform">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-modern flex items-center gap-4 bg-gradient-to-br from-sky-50/80 to-sky-100/40 dark:from-sky-900/20 dark:to-sky-800/10 border-sky-200/60 dark:border-sky-800/40 hover:scale-105 transition-transform">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Open</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.open}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-modern flex items-center gap-4 bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/60 dark:border-amber-800/40 hover:scale-105 transition-transform">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">In Progress</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-modern flex items-center gap-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-800/40 hover:scale-105 transition-transform">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Resolved</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.resolved}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {isStudent && (
        <Card className="card-modern border-emerald-200/60 dark:border-emerald-800/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Resolution Verification
            </h2>
            <Link to="/complaints/verification" className="text-sm font-semibold text-emerald-600 hover:underline">
              Open Verification Page
            </Link>
          </div>

          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Pending verification:{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {pendingVerification.length}
              </span>
            </p>
          </div>

          {pendingVerification.length > 0 && (
            <div className="mt-4 space-y-2">
              {pendingVerification.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/complaints/${item.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.updatedAt)}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent Complaints with enhanced styling */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={cn(
            "text-2xl font-bold",
            roleConfig.gradient === 'from-purple-600 to-purple-400' && "admin-gradient-text",
            roleConfig.gradient === 'from-blue-600 to-blue-400' && "staff-gradient-text",
            roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "student-gradient-text"
          )}>
            Recent Complaints
          </h2>
          <Link 
            to={isAdmin ? "/admin/complaints" : isStaff ? "/staff/complaints" : "/complaints"} 
            className={cn(
              "text-sm font-semibold hover:underline transition-all flex items-center gap-1",
              roleConfig.gradient === 'from-purple-600 to-purple-400' && "text-purple-600 hover:text-purple-700",
              roleConfig.gradient === 'from-blue-600 to-blue-400' && "text-blue-600 hover:text-blue-700",
              roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "text-emerald-600 hover:text-emerald-700"
            )}
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4">
          {complaints?.slice(0, 5).map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link to={`/complaints/${complaint.id}`}>
                <Card className="card-modern group transition-all">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className={cn(
                          "font-bold text-lg transition-colors",
                          roleConfig.gradient === 'from-purple-600 to-purple-400' && "group-hover:text-purple-600",
                          roleConfig.gradient === 'from-blue-600 to-blue-400' && "group-hover:text-blue-600",
                          roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "group-hover:text-emerald-600"
                        )}>
                          {complaint.title}
                        </h3>
                        <StatusBadge status={complaint.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium">{complaint.category}</span>
                        <span>•</span>
                        <span>{formatDate(complaint.createdAt)}</span>
                        {isAdmin && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "font-semibold",
                              roleConfig.gradient === 'from-purple-600 to-purple-400' && "text-purple-600",
                              roleConfig.gradient === 'from-blue-600 to-blue-400' && "text-blue-600",
                              roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "text-emerald-600"
                            )}>
                              {complaint.studentName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 text-sm font-semibold transition-all",
                      roleConfig.gradient === 'from-purple-600 to-purple-400' && "text-purple-600 group-hover:text-purple-700",
                      roleConfig.gradient === 'from-blue-600 to-blue-400' && "text-blue-600 group-hover:text-blue-700",
                      roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "text-emerald-600 group-hover:text-emerald-700"
                    )}>
                      Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}

          {complaints?.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <FileText size={64} className="mb-6 text-slate-300 dark:text-slate-600" />
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No complaints found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">Get started by creating your first complaint</p>
              {isStudent && (
                <Link to="/complaints/new">
                  <Button size="lg" className="shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Create your first complaint
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
