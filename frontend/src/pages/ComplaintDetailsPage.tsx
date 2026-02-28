import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { PageHero } from '../components/ui/PageHero';
import { formatDate, cn } from '../lib/utils';
import api from '../api/client';
import { Complaint, ComplaintStatus } from '../types';
import { mapComplaint } from '../api/mappers';

const ComplaintDetailsPage: React.FC = () => {
  const CATEGORIES = ['academic', 'infrastructure', 'hostel', 'library', 'cafeteria', 'transport', 'other'];
  const DEPARTMENTS = [
    'School of Electrical & Computer Engineering',
    'School of Mechanical Engineering',
    'School of Civil Engineering & Architecture',
    'School of Computing & Informatics',
    'School of Applied Sciences',
    'School of Chemical & Food Engineering',
    'School of Humanities & Social Sciences',
    'Registrar & Academic Affairs',
    'Student Services & Welfare'
  ];
  const PRIORITIES = ['low', 'medium', 'high'];

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isStaff, isAdmin, isStudent } = useAuth();
  const queryClient = useQueryClient();
  const [remark, setRemark] = React.useState('');
  const [verificationComment, setVerificationComment] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    category: 'other',
    department: '',
    priority: 'medium'
  });

  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const response = await api.get(`/api/complaints/${id}`);
      return mapComplaint(response.data.data) as Complaint;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ComplaintStatus) => {
      const response = await api.patch(`/api/complaints/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  const addRemarkMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/api/complaints/${id}/remarks`, { comment: content });
      return response.data;
    },
    onSuccess: () => {
      setRemark('');
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
    },
  });

  // Complaint editing is no longer supported in the strict workflow.

  const verifyResolutionMutation = useMutation({
    mutationFn: async ({ action, comment }: { action: 'confirm' | 'reopen'; comment?: string }) => {
      const response = await api.patch(`/api/complaints/${id}/verify`, { action, comment });
      return response.data;
    },
    onSuccess: () => {
      setVerificationComment('');
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'dashboard'] });
    },
  });

  // Admin no longer deletes complaints; workflow is append-only with statuses and remarks.

  React.useEffect(() => {
    if (!complaint) return;
    setEditForm({
      title: complaint.title || '',
      description: complaint.description || '',
      category: complaint.category || 'other',
      department: complaint.department || '',
      priority: complaint.priority || 'medium'
    });
  }, [complaint]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 p-12 dark:border-slate-800">
        <AlertCircle size={48} className="mb-4 text-rose-500" />
        <p className="text-lg font-medium">Complaint not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const canUpdateStatus = isStaff; // Only staff can update status in the strict workflow
  const isOwner =
    complaint.createdById === (user?.id || '') ||
    complaint.studentId === (user?.studentId || '');
  const canEditComplaint = false;
  const isAwaitingStudentVerification =
    complaint.status === ComplaintStatus.RESOLVED &&
    isStudent &&
    (!complaint.resolutionVerification?.status || complaint.resolutionVerification?.status === 'pending');

  const roleTitleClass = isAdmin ? 'text-purple-300' : isStaff ? 'text-sky-300' : 'text-emerald-400';

  return (
    <div className="space-y-8 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <PageHero
          icon={AlertCircle}
          title={complaint.title}
          subtitle={`Complaint #${complaint.id.slice(-6)}`}
          iconWrapClassName={isAdmin ? 'bg-purple-600' : isStaff ? 'bg-sky-600' : 'bg-emerald-600'}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
            <StatusBadge status={complaint.status} />
          </div>
        </PageHero>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-modern">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Description</h2>
            </div>

            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
              {complaint.description}
            </p>
            
            {complaint.attachments.length > 0 && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Attachments</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {complaint.attachments.map((url, index) => {
                    const cleanUrl = url.split('?')[0].split('#')[0];
                    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(cleanUrl);
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-xl border border-slate-200 overflow-hidden bg-white/80 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 transition-colors"
                      >
                        {isImage ? (
                          <div className="relative h-40 w-full overflow-hidden">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                              <span className="font-medium">Image {index + 1}</span>
                              <Download size={14} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-3 py-3">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-emerald-600" />
                              <span className="text-sm font-medium truncate max-w-[160px]">
                                Attachment {index + 1}
                              </span>
                            </div>
                            <Download size={16} className="text-slate-400" />
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {complaint.status === ComplaintStatus.RESOLVED && (
            <Card className="card-modern">
              <h2 className="mb-3 text-lg font-bold">Resolution Verification</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current verification status:{' '}
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {complaint.resolutionVerification?.status || 'pending'}
                </span>
              </p>
              {complaint.resolutionVerification?.verifiedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Updated: {formatDate(complaint.resolutionVerification.verifiedAt)}
                </p>
              )}
              {complaint.resolutionVerification?.comment && (
                <p className="mt-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  {complaint.resolutionVerification.comment}
                </p>
              )}

              {isAwaitingStudentVerification && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={verificationComment}
                    onChange={(e) => setVerificationComment(e.target.value)}
                    placeholder="Optional: share feedback about the fix..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        verifyResolutionMutation.mutate({ action: 'confirm', comment: verificationComment.trim() || undefined })
                      }
                      isLoading={verifyResolutionMutation.isPending && verifyResolutionMutation.variables?.action === 'confirm'}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Confirm Fixed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        verifyResolutionMutation.mutate({ action: 'reopen', comment: verificationComment.trim() || undefined })
                      }
                      isLoading={verifyResolutionMutation.isPending && verifyResolutionMutation.variables?.action === 'reopen'}
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Reopen Complaint
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Remarks Section */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare size={20} /> Remarks
            </h2>
            
            <div className="space-y-4">
              {complaint.remarks.map((r) => (
                <div key={r.id} className={cn(
                  "flex flex-col gap-1 max-w-[85%]",
                  r.authorId === user?.id ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl p-4 text-sm",
                    r.authorId === user?.id 
                      ? "bg-emerald-600 text-white" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  )}>
                    {r.content}
                  </div>
                  <div className="flex items-center gap-2 px-2 text-[10px] text-slate-500">
                    <span className="font-bold">{r.authorName}</span>
                    <span>•</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              ))}

              {complaint.remarks.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500 italic">No remarks yet.</p>
              )}
            </div>

            {canUpdateStatus ? (
              <div className="flex gap-2 pt-4">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add an internal remark for this complaint..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900"
                  rows={1}
                />
                <Button 
                  onClick={() => addRemarkMutation.mutate(remark)} 
                  disabled={!remark.trim()} 
                  isLoading={addRemarkMutation.isPending}
                >
                  <Send size={18} />
                </Button>
              </div>
            ) : (
              <p className="pt-4 text-xs text-slate-500 dark:text-slate-500">
                Remarks are added by staff and administrators as part of the resolution process.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="card-modern">
            <h2 className="mb-4 text-lg font-bold">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</p>
                <p className="text-sm font-medium">{complaint.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted By</p>
                <p className="text-sm font-medium">{complaint.studentName}</p>
                <p className="text-xs text-slate-500">{complaint.studentId}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Submitted</p>
                <p className="text-sm font-medium">{formatDate(complaint.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Updated</p>
                <p className="text-sm font-medium">{formatDate(complaint.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {canUpdateStatus && (
            <Card className={cn(
              "card-modern border-2",
              isAdmin ? "border-purple-500/30 bg-purple-50/30 dark:bg-purple-900/10" : "border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10"
            )}>
              <h2 className="mb-4 text-lg font-bold">Update Status</h2>
              <div className="grid grid-cols-2 gap-2">
                {[ComplaintStatus.PENDING_REVIEW, ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED].map((status) => (
                  <Button
                    key={status}
                    variant={complaint.status === status ? 'primary' : 'outline'}
                    size="sm"
                    className="capitalize"
                    onClick={() => updateStatusMutation.mutate(status)}
                    isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === status}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {isAdmin && complaint.resolutionVerification?.status === 'confirmed' && (
            <Card className="card-modern border-2 border-rose-500/30 bg-rose-50/30 dark:bg-rose-900/10">
              <h2 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Delete Complaint</h2>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                This complaint has been verified by the student. You can permanently delete it from the system.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Complaint
              </Button>
            </Card>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Delete Complaint</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this complaint? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => {
                  deleteComplaintMutation.mutate();
                  setShowDeleteModal(false);
                }}
                isLoading={deleteComplaintMutation.isPending}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsPage;


