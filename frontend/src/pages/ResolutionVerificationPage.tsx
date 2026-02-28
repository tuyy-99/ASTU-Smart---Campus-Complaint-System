import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, RotateCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Complaint, ComplaintStatus } from '../types';
import { mapComplaint } from '../api/mappers';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';
import { formatDate } from '../lib/utils';

const ResolutionVerificationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [comments, setComments] = React.useState<Record<string, string>>({});

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints', 'verification'],
    queryFn: async () => {
      const response = await api.get('/api/complaints');
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ complaintId, action, comment }: { complaintId: string; action: 'confirm' | 'reopen'; comment?: string }) => {
      const response = await api.patch(`/api/complaints/${complaintId}/verify`, { action, comment });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['complaint'] });
    }
  });

  const pending = React.useMemo(
    () =>
      (complaints || []).filter(
        (item) =>
          item.status === ComplaintStatus.RESOLVED &&
          (!item.resolutionVerification?.status || item.resolutionVerification.status === 'pending')
      ),
    [complaints]
  );

  const recent = React.useMemo(
    () =>
      (complaints || [])
        .filter((item) => item.status === ComplaintStatus.RESOLVED)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10),
    [complaints]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={ShieldCheck}
        title="Complaint Verification"
        subtitle="Confirm whether resolved complaints are actually fixed, or reopen them."
        iconWrapClassName="bg-emerald-600"
      />

      <Card className="card-modern">
        <h2 className="mb-4 text-lg font-bold">Pending Verification ({pending.length})</h2>
        <div className="space-y-4">
          {pending.map((complaint) => (
            <div key={complaint.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{complaint.title}</p>
                <Link to={`/complaints/${complaint.id}`} className="text-sm text-emerald-600 hover:underline">
                  Open details
                </Link>
              </div>
              <p className="mt-1 text-xs text-slate-500">Resolved on {formatDate(complaint.updatedAt)}</p>
              <textarea
                rows={2}
                value={comments[complaint.id] || ''}
                onChange={(e) => setComments((prev) => ({ ...prev, [complaint.id]: e.target.value }))}
                placeholder="Optional: add confirmation/reopen note..."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    verifyMutation.mutate({
                      complaintId: complaint.id,
                      action: 'confirm',
                      comment: comments[complaint.id]?.trim() || undefined
                    })
                  }
                  isLoading={verifyMutation.isPending && verifyMutation.variables?.complaintId === complaint.id && verifyMutation.variables?.action === 'confirm'}
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  Confirm Fixed
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    verifyMutation.mutate({
                      complaintId: complaint.id,
                      action: 'reopen',
                      comment: comments[complaint.id]?.trim() || undefined
                    })
                  }
                  isLoading={verifyMutation.isPending && verifyMutation.variables?.complaintId === complaint.id && verifyMutation.variables?.action === 'reopen'}
                >
                  <RotateCcw size={16} className="mr-2" />
                  Reopen
                </Button>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No complaints are waiting for verification.</p>
          )}
        </div>
      </Card>

      <Card className="card-modern">
        <h2 className="mb-4 text-lg font-bold">Recent Resolved Complaints</h2>
        <div className="space-y-3">
          {recent.map((complaint) => (
            <Link
              key={complaint.id}
              to={`/complaints/${complaint.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <div>
                <p className="font-medium">{complaint.title}</p>
                <p className="text-xs text-slate-500">
                  Verification: {(complaint.resolutionVerification?.status || 'pending').replace('_', ' ')}
                </p>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No resolved complaints yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResolutionVerificationPage;
