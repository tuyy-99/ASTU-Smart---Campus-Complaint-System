import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';
import { formatDate, cn } from '../lib/utils';
import api from '../api/client';
import { Notification } from '../types';
import { mapNotification } from '../api/mappers';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/api/notifications');
      return (response.data.data || []).map(mapNotification) as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <PageHero
          icon={Bell}
          title="Notifications"
          subtitle="Stay updated on your complaint status and remarks."
          iconWrapClassName="bg-emerald-600"
        />
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsReadMutation.mutate()} className="ml-auto">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications?.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "relative overflow-hidden border border-slate-200/70 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-950/80",
              !n.isRead && "border-emerald-400/70 shadow-[0_16px_45px_rgba(16,185,129,0.35)]"
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/6 via-transparent to-emerald-600/10 dark:from-emerald-500/10 dark:via-transparent dark:to-emerald-700/15" />
            <div className="relative flex gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  n.type === 'status_change'
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-900/60"
                    : n.type === 'new_remark'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800/80"
                )}
              >
                {n.type === 'status_change' ? <Clock size={20} /> : n.type === 'new_remark' ? <MessageSquare size={20} /> : <Bell size={20} />}
              </div>
              <div className="flex-1 space-y-1">
                <p className={cn("text-sm leading-snug text-slate-800 dark:text-slate-100", !n.isRead && "font-semibold")}>{n.message}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatDate(n.createdAt)}</span>
                  {!n.isRead && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markAsReadMutation.mutate(n.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:border-emerald-700 dark:bg-emerald-900/40"
                >
                  <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </Card>
        ))}

        {notifications?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 dark:border-slate-800">
            <Bell size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
