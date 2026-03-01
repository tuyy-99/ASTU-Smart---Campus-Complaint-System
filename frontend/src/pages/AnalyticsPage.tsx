import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  FileText,
  Shield
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PageHero } from '../components/ui/PageHero';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { Analytics } from '../types';
import { mapAnalytics } from '../api/mappers';

const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const response = await api.get('/api/admin/analytics');
      return mapAnalytics(response.data.data) as Analytics;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const COLORS = ['#10b981', '#22c55e', '#3b82f6', '#f97316', '#eab308', '#ef4444'];

  const statusData = Object.entries(analytics.statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  const categoryData = Object.entries(analytics.categoryCounts).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-8 relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageHero
          icon={Shield}
          title="System Analytics"
          subtitle="Overview of system performance and complaint trends."
          iconWrapClassName="bg-purple-600"
        />
      </motion.div>

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-modern bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-800/40 hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Total Complaints
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.totalComplaints}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-modern bg-linear-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/60 dark:border-purple-800/40 hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Resolution Rate
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.resolutionRate}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-modern bg-linear-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/60 dark:border-amber-800/40 hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Avg. Resolution
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.averageResolutionTime}h
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-modern bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-800/40 hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Resolved
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.statusCounts.resolved || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Complaints by Category */}
        <Card className="card-modern bg-linear-to-br from-emerald-50/80 to-emerald-100/40 dark:from-slate-950/60 dark:via-slate-950/80 dark:to-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60">
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            Complaints by Category
          </h2>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Distribution of complaints across functional areas
          </p>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#1f2937" : "#e2e8f0"}
                />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  fill="url(#categoryGradient)"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient
                    id="categoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Complaints by Status */}
        <Card className="card-modern bg-linear-to-br from-slate-50/90 to-emerald-50/80 dark:from-slate-950/70 dark:via-slate-950/80 dark:to-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60">
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            Complaints by Status
          </h2>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Operational lifecycle of all complaints
          </p>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
