import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus,
  ArrowRight,
  Download,
  GraduationCap,
  UserCog,
  Shield,
  CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { PageHero } from '../components/ui/PageHero';
import { formatDate, cn } from '../lib/utils';
import { getCategoryConfig } from '../lib/categoryIcons';
import api from '../api/client';
import { Complaint, ComplaintStatus, UserRole } from '../types';
import { mapComplaint } from '../api/mappers';

const ComplaintsListPage: React.FC = () => {
  const { isStudent, isStaff, isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = React.useState<ComplaintStatus>(ComplaintStatus.IN_PROGRESS);
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: async () => {
      const endpoint = '/api/complaints';
      const response = await api.get(endpoint);
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    },
  });

  const filteredComplaints = React.useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                           c.description.toLowerCase().includes(search.toLowerCase()) ||
                           c.id.includes(search);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const complaintDate = new Date(c.createdAt);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matchesDateRange = matchesDateRange && complaintDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && complaintDate <= toDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesDateRange;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter, dateFrom, dateTo]);

  // Admin no longer performs bulk complaint status updates in the strict workflow.

  const handleExport = async (format: 'csv' | 'excel') => {
    const response = await api.get(`/api/admin/complaints/export?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = format === 'excel' ? 'complaints-export.xls' : 'complaints-export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Role-based configuration
  const roleConfig = React.useMemo(() => {
    if (isAdmin) {
      return {
        gradient: 'from-purple-600 to-purple-400',
        icon: Shield,
        title: 'All Complaints',
        subtitle: 'Manage and oversee all system complaints.',
        accentColor: 'purple'
      };
    } else if (isStaff) {
      return {
        gradient: 'from-blue-600 to-blue-400',
        icon: UserCog,
        title: 'Department Complaints',
        subtitle: 'Review and manage department-related issues.',
        accentColor: 'blue'
      };
    } else {
      return {
        gradient: 'from-emerald-600 to-emerald-400',
        icon: GraduationCap,
        title: 'My Complaints',
        subtitle: 'Track and manage your reported issues.',
        accentColor: 'emerald'
      };
    }
  }, [isStudent, isStaff, isAdmin]);

  const RoleIcon = roleConfig.icon;

  return (
    <div className="space-y-8 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={RoleIcon}
          title={roleConfig.title}
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
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </div>
          )}
        </PageHero>
      </motion.div>

      {/* Bulk admin status actions removed to match read-only admin workflow */}

      <Card className="card-modern p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <Input
              placeholder="Search by title, description or ID..."
              className="pl-12 bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-slate-500 dark:text-slate-400" size={20} />
            <select
              className={cn(
                "h-12 rounded-xl border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                "bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700",
                roleConfig.gradient === 'from-purple-600 to-purple-400' && "focus:ring-purple-500/20 focus:border-purple-500",
                roleConfig.gradient === 'from-blue-600 to-blue-400' && "focus:ring-blue-500/20 focus:border-blue-500",
                roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "focus:ring-emerald-500/20 focus:border-emerald-500"
              )}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value={ComplaintStatus.PENDING_REVIEW}>PENDING REVIEW</option>
              <option value={ComplaintStatus.OPEN}>OPEN</option>
              <option value={ComplaintStatus.IN_PROGRESS}>IN PROGRESS</option>
              <option value={ComplaintStatus.RESOLVED}>RESOLVED</option>
              <option value={ComplaintStatus.REJECTED}>REJECTED</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={showAdvancedFilters ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAdvancedFilters ? 'Hide' : 'More'} Filters
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="hostel">Hostel</option>
                <option value="library">Library</option>
                <option value="cafeteria">Cafeteria</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Priority</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">From Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">To Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="md:col-span-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setStatusFilter('all');
                  setSearch('');
                }}
              >
                Clear All Filters
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                Showing {filteredComplaints.length} of {complaints?.length || 0} complaints
              </span>
            </div>
          </motion.div>
        )}
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredComplaints.map((complaint, index) => {
            const categoryConfig = getCategoryConfig(complaint.category);
            const CategoryIcon = categoryConfig.icon;
            
            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="card-modern group transition-all">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {isAdmin && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(complaint.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedIds((prev) =>
                              prev.includes(complaint.id)
                                ? prev.filter((id) => id !== complaint.id)
                                : [...prev, complaint.id]
                            );
                          }}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
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
                        <span className="font-mono font-semibold">#{complaint.id.slice(-6)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn("rounded-lg p-1", categoryConfig.bgColor)}>
                            <CategoryIcon className={cn("h-3.5 w-3.5", categoryConfig.color)} />
                          </span>
                          <span className="font-medium">{categoryConfig.label}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(complaint.createdAt)}</span>
                        {(isAdmin || isStaff) && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "font-semibold flex items-center gap-1.5",
                              roleConfig.gradient === 'from-purple-600 to-purple-400' && "text-purple-600",
                              roleConfig.gradient === 'from-blue-600 to-blue-400' && "text-blue-600",
                              roleConfig.gradient === 'from-emerald-600 to-emerald-400' && "text-emerald-600"
                            )}>
                              {complaint.isAnonymous ? (
                                <>
                                  <span className="text-slate-500 dark:text-slate-400">🕶️ Anonymous</span>
                                </>
                              ) : (
                                complaint.studentName
                              )}
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
                      <Link to={`/complaints/${complaint.id}`} className="inline-flex items-center gap-2">
                        View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {filteredComplaints.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <Search size={64} className="mb-6 text-slate-300 dark:text-slate-600" />
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No complaints found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintsListPage;
