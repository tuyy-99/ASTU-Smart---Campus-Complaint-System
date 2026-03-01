import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserCheck, Check, X, ZoomIn, ZoomOut, Search, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { PageHero } from '../components/ui/PageHero';
import api from '../api/client';
import { User, UserRole } from '../types';
import { mapUser } from '../api/mappers';

type RegistrationRequest = {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  profilePhotoPath?: string;
  idPhotoPath: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
};

const STATIC_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/i, '').replace(/\/$/, '');
const toAssetUrl = (pathValue: string) => {
  // If it's already a full URL (Cloudinary), return as-is
  if (pathValue && (pathValue.startsWith('http://') || pathValue.startsWith('https://'))) {
    return pathValue;
  }
  // Otherwise, construct local URL
  const clean = String(pathValue || '').replace(/^[\\/]+/, '').replace(/\\/g, '/');
  return `${STATIC_BASE_URL}/${clean}`;
};

const StaffRegistrationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'requests' | 'add'>('requests');
  const [requestActionMessage, setRequestActionMessage] = React.useState<string | null>(null);
  const [previewImage, setPreviewImage] = React.useState<{ src: string; label: string } | null>(null);
  const [previewZoom, setPreviewZoom] = React.useState(1);
  const [deleteRequestModal, setDeleteRequestModal] = React.useState<{ requestId: string; status: string } | null>(null);
  const [rejectModal, setRejectModal] = React.useState<{ requestId: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [deleteStudentModal, setDeleteStudentModal] = React.useState<{ studentId: string; studentName: string } | null>(null);
  const [deleteStudentReason, setDeleteStudentReason] = React.useState('');
  
  // Add Student form state
  const [newStudentName, setNewStudentName] = React.useState('');
  const [newStudentEmail, setNewStudentEmail] = React.useState('');
  const [newStudentId, setNewStudentId] = React.useState('');
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null);

  const { data: registrationRequests, isLoading } = useQuery({
    queryKey: ['staff', 'registration-requests'],
    queryFn: async () => {
      const response = await api.get('/api/staff/registration-requests');
      return (response.data.data || []) as RegistrationRequest[];
    }
  });

  const { data: students } = useQuery({
    queryKey: ['staff', 'students'],
    queryFn: async () => {
      const response = await api.get('/api/staff/students');
      return (response.data.data || []).map(mapUser) as User[];
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.patch(`/api/staff/registration-requests/${requestId}/approve`);
      return response.data;
    },
    onSuccess: (data) => {
      setRequestActionMessage(
        data?.emailSent
          ? 'Request approved and student notified by email.'
          : 'Request approved. Email notification was not sent (check SMTP settings).'
      );
      queryClient.invalidateQueries({ queryKey: ['staff', 'registration-requests'] });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, rejectionReason }: { requestId: string; rejectionReason?: string }) => {
      const response = await api.patch(`/api/staff/registration-requests/${requestId}/reject`, { rejectionReason });
      return response.data;
    },
    onSuccess: (data) => {
      setRequestActionMessage(
        data?.emailSent
          ? 'Request rejected and student notified by email.'
          : 'Request rejected. Email notification was not sent (check SMTP settings).'
      );
      queryClient.invalidateQueries({ queryKey: ['staff', 'registration-requests'] });
    }
  });

  const deleteRegistrationRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.delete(`/api/admin/registration-requests/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Registration request deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['staff', 'registration-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete registration request');
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string; reason: string }) => {
      const response = await api.delete(`/api/staff/students/${studentId}`, { data: { reason } });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.emailSent ? 'Student removed and notified by email.' : 'Student removed. Email notification was not sent.');
      setDeleteStudentModal(null);
      setDeleteStudentReason('');
      queryClient.invalidateQueries({ queryKey: ['staff', 'students'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove student');
    }
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; studentId: string }) => {
      const response = await api.post('/api/staff/students', data);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedPassword(data.generatedPassword);
      toast.success(data?.emailSent ? 'Student created and credentials sent by email.' : 'Student created. Email notification was not sent.');
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentId('');
      queryClient.invalidateQueries({ queryKey: ['staff', 'students'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create student');
    }
  });

  const handleCreateStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentId.trim()) {
      toast.error('All fields are required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudentEmail)) {
      toast.error('Invalid email format');
      return;
    }

    const studentIdRegex = /^UGR\/\d{5}\/\d{2}$/i;
    if (!studentIdRegex.test(newStudentId.trim())) {
      toast.error('Student ID must be in format: UGR/00000/00');
      return;
    }

    createStudentMutation.mutate({
      name: newStudentName.trim(),
      email: newStudentEmail.trim(),
      studentId: newStudentId.trim().toUpperCase()
    });
  };

  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    return students.filter(
      (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={UserCheck}
          title="Student Registration & Management"
          subtitle="Review student registration requests and manage students in your department."
          iconWrapClassName="bg-blue-600"
        />
      </motion.div>

      <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === 'requests'
              ? 'bg-white text-blue-600 shadow-md dark:bg-slate-900 dark:text-blue-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="mr-2 inline h-4 w-4" />
          Registration Requests
        </button>
        <button
          onClick={() => {
            setActiveTab('add');
            setGeneratedPassword(null);
          }}
          className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === 'add'
              ? 'bg-white text-blue-600 shadow-md dark:bg-slate-900 dark:text-blue-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <UserPlus className="mr-2 inline h-4 w-4" />
          Add Student
        </button>
      </div>

      {activeTab === 'requests' && (
        <Card className="card-modern space-y-4">
          <h2 className="text-lg font-bold">Pending Registration Requests</h2>
        {requestActionMessage && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {requestActionMessage}
          </p>
        )}
        {!registrationRequests?.length && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No registration requests found.</p>
        )}
        <div className="space-y-4">
          {registrationRequests?.map((request) => (
            <div key={request._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.name}</p>
                  <p className="text-xs text-slate-500">{request.email}</p>
                  <p className="text-xs text-slate-500">{request.studentId}</p>
                </div>
                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'success'
                      : request.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {request.status.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Photo</p>
                  {request.profilePhotoPath ? (
                    <button
                      type="button"
                      className="block h-56 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900"
                      onClick={() => {
                        setPreviewImage({ src: toAssetUrl(request.profilePhotoPath || ''), label: `${request.name} profile` });
                        setPreviewZoom(1);
                      }}
                    >
                      <img src={toAssetUrl(request.profilePhotoPath)} alt={`${request.name} profile`} className="h-full w-full rounded object-contain" />
                    </button>
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No profile photo submitted
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">ID Photo</p>
                  <button
                    type="button"
                    className="block h-56 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900"
                    onClick={() => {
                      setPreviewImage({ src: toAssetUrl(request.idPhotoPath), label: `${request.name} ID` });
                      setPreviewZoom(1);
                    }}
                  >
                    <img src={toAssetUrl(request.idPhotoPath)} alt={`${request.name} id`} className="h-full w-full rounded object-contain" />
                  </button>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveRequestMutation.mutate(request._id)}
                    isLoading={approveRequestMutation.isPending && approveRequestMutation.variables === request._id}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectModal({ requestId: request._id, name: request.name });
                      setRejectionReason('');
                    }}
                    isLoading={rejectRequestMutation.isPending && rejectRequestMutation.variables?.requestId === request._id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}

              {request.status === 'rejected' && request.rejectionReason && (
                <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">Reason: {request.rejectionReason}</p>
              )}

              {request.status !== 'pending' && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDeleteRequestModal({ requestId: request._id, status: request.status });
                    }}
                    isLoading={deleteRegistrationRequestMutation.isPending && deleteRegistrationRequestMutation.variables === request._id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Delete Request
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        </Card>
      )}

      {activeTab === 'add' && (
        <Card className="card-modern space-y-6">
          <div>
            <h2 className="text-lg font-bold">Create Student Account</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a new student to your department. A password will be auto-generated and sent to the student's email.
            </p>
          </div>

          {generatedPassword && (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Student account created successfully!
              </p>
              <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Generated Password</p>
                <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{generatedPassword}</p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Please save this password. The student will use their Student ID and this password to log in.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Enter student's full name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="bg-white/80 dark:bg-slate-800/80"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="student@astu.edu.et"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="bg-white/80 dark:bg-slate-800/80"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Student ID <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="UGR/00000/00"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value.toUpperCase())}
                className="bg-white/80 dark:bg-slate-800/80 font-mono"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Format: UGR/00000/00 (e.g., UGR/12345/16)
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> A secure password will be automatically generated and sent to the student's email. 
                The student will use their Student ID and the generated password to log in.
              </p>
            </div>

            <Button
              onClick={handleCreateStudent}
              isLoading={createStudentMutation.isPending}
              disabled={!newStudentName.trim() || !newStudentEmail.trim() || !newStudentId.trim()}
              className="w-full"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Create Student Account
            </Button>
          </div>
        </Card>
      )}

      <Card className="card-modern space-y-4">
        <h2 className="text-lg font-bold">Department Students</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <Input
            placeholder="Search students by name or email..."
            className="pl-12 bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!filteredStudents?.length && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No students found in your department.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents?.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium">{student.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium">{student.department || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteStudentModal({ studentId: student.id, studentName: student.name });
                        setDeleteStudentReason('');
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white p-4 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{previewImage.label}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewZoom((z) => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="mr-1 h-4 w-4" /> Out
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.1))}>
                  <ZoomIn className="mr-1 h-4 w-4" /> In
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreviewZoom(1)}>
                  Reset
                </Button>
                <Button size="sm" onClick={() => setPreviewImage(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <img
                src={previewImage.src}
                alt={previewImage.label}
                style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center top' }}
                className="mx-auto max-h-full w-auto object-contain transition-transform"
              />
            </div>
          </div>
        </div>
      )}

      {deleteRequestModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Delete Registration Request</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this <span className="font-semibold">{deleteRequestModal.status}</span> registration request? 
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => {
                  deleteRegistrationRequestMutation.mutate(deleteRequestModal.requestId);
                  setDeleteRequestModal(null);
                }}
                isLoading={deleteRegistrationRequestMutation.isPending}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteRequestModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Reject Registration Request</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              You are about to reject the registration request from <span className="font-semibold">{rejectModal.name}</span>. 
              Please provide a clear reason (minimum 10 characters).
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (e.g., Invalid student ID, Photo does not match records)..."
              className="mb-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800"
              rows={4}
            />
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              {rejectionReason.length}/10 characters minimum
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => {
                  if (rejectionReason.trim().length < 10) {
                    toast.error('Rejection reason must be at least 10 characters');
                    return;
                  }
                  rejectRequestMutation.mutate({ requestId: rejectModal.requestId, rejectionReason: rejectionReason.trim() });
                  setRejectModal(null);
                  setRejectionReason('');
                }}
                isLoading={rejectRequestMutation.isPending}
                disabled={rejectionReason.trim().length < 10}
              >
                Reject Request
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejectModal(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteStudentModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Remove Student</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              You are about to remove <span className="font-semibold">{deleteStudentModal.studentName}</span>. 
              Please provide a reason for removal (required, minimum 10 characters).
            </p>
            <textarea
              value={deleteStudentReason}
              onChange={(e) => setDeleteStudentReason(e.target.value)}
              placeholder="Reason for removal (e.g., Graduated, Transferred, Disciplinary action)..."
              className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => {
                  if (!deleteStudentReason.trim() || deleteStudentReason.trim().length < 10) {
                    toast.error('Reason must be at least 10 characters');
                    return;
                  }
                  deleteStudentMutation.mutate({ studentId: deleteStudentModal.studentId, reason: deleteStudentReason.trim() });
                }}
                isLoading={deleteStudentMutation.isPending}
                disabled={!deleteStudentReason.trim() || deleteStudentReason.trim().length < 10}
              >
                Remove Student
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteStudentModal(null);
                  setDeleteStudentReason('');
                }}
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

export default StaffRegistrationPage;
