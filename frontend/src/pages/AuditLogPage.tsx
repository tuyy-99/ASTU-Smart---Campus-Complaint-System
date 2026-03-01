import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Activity,
  Download,
  Eye,
  X,
  Lock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';
import api from '../api/client';

type AuditLogUser = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  studentId?: string;
} | null;

type AuditLogEntry = {
  _id: string;
  user: AuditLogUser;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  targetIdDisplay?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  status?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

type AuditLogsResponse = {
  success: boolean;
  data: {
    logs: AuditLogEntry[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

type AuditStatsResponse = {
  success: boolean;
  data: {
    totalLogs: number;
    todayLogs: number;
    actionStats: { _id: string; count: number }[];
    resourceStats: { _id: string; count: number }[];
  };
};

const ACTION_OPTIONS = [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'UNAUTHORIZED_ACCESS',
  'COMPLAINT_CREATE',
  'COMPLAINT_UPDATE',
  'COMPLAINT_STATUS_UPDATE',
  'COMPLAINT_EXPORT',
  'COMPLAINT_RESOLUTION_CONFIRMED',
  'COMPLAINT_REOPENED',
  'COMPLAINT_REMARK_ADDED',
  'USER_CREATED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'REGISTRATION_REQUEST',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'STUDENT_CREATED',
  'STUDENT_SUSPENDED',
  'STUDENT_REACTIVATED',
  'PROFILE_UPDATE',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET'
];

const RESOURCE_OPTIONS = ['complaint', 'user', 'registration', 'profile', 'auth'];
const ROLE_OPTIONS = ['admin', 'staff', 'student'];
const STATUS_OPTIONS = ['Success', 'Failed'];

const ACTION_CATEGORY: Record<string, string> = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'SECURITY',
  LOGOUT: 'LOGIN',
  UNAUTHORIZED_ACCESS: 'SECURITY',
  COMPLAINT_CREATE: 'CREATE',
  COMPLAINT_UPDATE: 'UPDATE',
  COMPLAINT_STATUS_UPDATE: 'UPDATE',
  COMPLAINT_EXPORT: 'UPDATE',
  COMPLAINT_RESOLUTION_CONFIRMED: 'APPROVE',
  COMPLAINT_REOPENED: 'UPDATE',
  COMPLAINT_REMARK_ADDED: 'UPDATE',
  USER_CREATED: 'CREATE',
  USER_DEACTIVATED: 'DELETE',
  USER_REACTIVATED: 'UPDATE',
  REGISTRATION_APPROVED: 'APPROVE',
  REGISTRATION_REJECTED: 'REJECT',
  REGISTRATION_REQUEST: 'CREATE',
  STUDENT_CREATED: 'CREATE',
  STUDENT_SUSPENDED: 'DELETE',
  STUDENT_REACTIVATED: 'UPDATE',
  PROFILE_UPDATE: 'UPDATE',
  PASSWORD_CHANGE: 'UPDATE',
  PASSWORD_RESET: 'SECURITY'
};

const formatTimestamp = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toISOString();
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZoneName: 'short'
  });
};

const formatAction = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const parseUserAgent = (ua: string | undefined) => {
  if (!ua) return { browser: '—', device: '—' };
  const m = ua.match(/\((.*?)\)/);
  const device = m ? m[1] : '—';
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)[/ ]?\d?/i);
  const browser = browserMatch ? browserMatch[0] : ua.slice(0, 40) || '—';
  return { browser, device };
};

const AuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit: 25 };
    if (actionFilter) params.action = actionFilter;
    if (resourceFilter) params.resource = resourceFilter;
    if (roleFilter) params.actorRole = roleFilter;
    if (statusFilter) params.status = statusFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [page, actionFilter, resourceFilter, roleFilter, statusFilter, startDate, endDate, search]);

  const { data: logsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'audit-logs', queryParams],
    queryFn: async () => {
      const response = await api.get<AuditLogsResponse>('/api/audit/logs', { params: queryParams });
      return response.data;
    }
  });

  const { data: detailLog, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'audit-log', detailId],
    queryFn: async () => {
      if (!detailId) return null;
      const response = await api.get<{ success: boolean; data: AuditLogEntry }>(`/api/audit/logs/${detailId}`);
      return response.data.data;
    },
    enabled: !!detailId
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin', 'audit-stats'],
    queryFn: async () => {
      const response = await api.get<AuditStatsResponse>('/api/audit/stats');
      return response.data;
    }
  });

  const logs = logsData?.data?.logs ?? [];
  const pagination = logsData?.data?.pagination ?? { page: 1, limit: 25, total: 0, pages: 0 };
  const stats = statsData?.data;

  const hasFilters =
    actionFilter || resourceFilter || roleFilter || statusFilter || startDate || endDate || search.trim();
  const clearFilters = () => {
    setActionFilter('');
    setResourceFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (roleFilter) params.actorRole = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/api/audit/export', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading && !logsData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={Shield}
          title="Audit Log"
          subtitle="Immutable security and compliance log. All critical actions are recorded."
          iconWrapClassName="bg-slate-700"
        />
      </motion.div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total events
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                {stats.totalLogs}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Today
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                {stats.todayLogs}
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {formatAction(a)}
              </option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          >
            <option value="">All entities</option>
            {RESOURCE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          >
            <option value="">All status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono"
          />
          <input
            type="text"
            placeholder="Search email or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-xs font-mono min-w-[140px]"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="ml-auto text-xs"
          >
            <Download size={14} className="mr-1" />
            Export CSV
          </Button>
        </div>

        {isError && (
          <div className="p-6 text-center text-rose-600 dark:text-rose-400 text-sm">
            {error && typeof error === 'object' && 'message' in error
              ? String((error as { message?: string }).message)
              : 'Failed to load audit logs.'}
          </div>
        )}

        {!isError && logs.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Lock className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm font-medium">No events match the current filters.</p>
            <p className="text-xs mt-1">
              {hasFilters ? 'Adjust filters or clear to see all activity.' : 'Activity will appear as users perform actions.'}
            </p>
          </div>
        )}

        {!isError && logs.length > 0 && (
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Actor
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Action
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Entity
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                      Target ID
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 max-w-[200px]">
                      Description
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                      IP
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 w-24">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const role = log.actorRole || log.user?.role || '—';
                    const category = ACTION_CATEGORY[log.action] || 'UPDATE';
                    const isFailed = log.status === 'Failed';
                    return (
                      <tr
                        key={log._id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-2 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {log.user?.name ?? log.user?.email ?? '—'}
                            </span>
                            {log.user?.email && (
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                                {log.user.email}
                              </span>
                            )}
                            <span
                              className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                                role === 'admin'
                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                                  : role === 'staff'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {role}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                              category === 'SECURITY'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : category === 'CREATE'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : category === 'DELETE' || category === 'REJECT'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : category === 'APPROVE'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {category}
                          </span>
                          <span className="block text-slate-600 dark:text-slate-400 mt-0.5">
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 capitalize font-mono">
                          {log.resource}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">
                          {log.targetIdDisplay || '—'}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={log.details ?? ''}>
                          {log.details ?? '—'}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              isFailed
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {log.status || 'Success'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setDetailId(log._id)}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="text-xs"
                  >
                    <ChevronLeft size={14} /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="text-xs"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AnimatePresence>
        {detailId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Audit event details
                </h3>
                <button
                  type="button"
                  onClick={() => setDetailId(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(85vh-56px)] p-4 space-y-4">
                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  </div>
                ) : detailLog ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Audit ID</span>
                        <p className="font-mono text-slate-900 dark:text-white break-all">{detailLog._id}</p>
                      </div>
                      {detailLog.correlationId && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Correlation ID</span>
                          <p className="font-mono text-slate-900 dark:text-white break-all">
                            {detailLog.correlationId}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Timestamp (UTC)</span>
                        <p className="font-mono text-slate-900 dark:text-white">
                          {detailLog.createdAt ? new Date(detailLog.createdAt).toISOString() : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Status</span>
                        <p className="font-medium">{detailLog.status || 'Success'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">IP Address</span>
                        <p className="font-mono">{detailLog.ipAddress || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Actor</span>
                        <p>
                          {detailLog.user?.name ?? detailLog.user?.email ?? '—'}{' '}
                          {detailLog.user?.email && (
                            <span className="text-slate-500 font-mono">({detailLog.user.email})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {detailLog.userAgent && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                          Device / Browser
                        </span>
                        <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded break-all">
                          {detailLog.userAgent}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">
                          {parseUserAgent(detailLog.userAgent).device} · {parseUserAgent(detailLog.userAgent).browser}
                        </p>
                      </div>
                    )}
                    {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                          Metadata
                        </span>
                        <pre className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto">
                          {JSON.stringify(detailLog.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">
                        Full record (read-only)
                      </span>
                      <pre className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                        {JSON.stringify(
                          {
                            ...detailLog,
                            user: detailLog.user
                              ? {
                                  _id: detailLog.user._id,
                                  name: detailLog.user.name,
                                  email: detailLog.user.email,
                                  role: detailLog.user.role
                                }
                              : null
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Could not load details.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogPage;
