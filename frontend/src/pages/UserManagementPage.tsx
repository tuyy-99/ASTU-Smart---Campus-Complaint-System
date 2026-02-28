import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageHero } from '../components/ui/PageHero';
import api from '../api/client';
import { User, UserRole } from '../types';
import { mapUser } from '../api/mappers';

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
  const clean = String(pathValue || '').replace(/^[\\/]+/, '').replace(/\\/g, '/');
  return `${STATIC_BASE_URL}/${clean}`;
};

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [selectedDepartments, setSelectedDepartments] = React.useState<Record<string, string>>({});
  const [createForm, setCreateForm] = React.useState({
    name: '',
    email: '',
    role: UserRole.STUDENT as UserRole,
    studentId: '',
    department: DEPARTMENTS[0]
  });
  const [createResult, setCreateResult] = React.useState<{ password: string; emailSent: boolean } | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = React.useState(1);
  const [deleteUserModal, setDeleteUserModal] = React.useState<{ userId: string; userName: string } | null>(null);
  const [deleteUserReason, setDeleteUserReason] = React.useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await api.get('/api/admin/users');
      return (response.data.data || []).map(mapUser) as User[];
    }
  });


  const createUserMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {
        name: createForm.name,
        email: createForm.email,
        department: createForm.department
      };

      const response = await api.post('/api/admin/users', payload);
      return response.data;
    },
    onSuccess: (data) => {
      setCreateError(null);
      setCreateResult({
        password: data.generatedPassword,
        emailSent: Boolean(data.emailSent)
      });
      setCreateForm({
        name: '',
        email: '',
        department: DEPARTMENTS[0]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      setCreateResult(null);
      setCreateError(error.response?.data?.error || 'Unable to create user');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await api.delete(`/api/admin/users/${userId}`, { data: { reason } });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.emailSent ? 'User removed and notified by email.' : 'User removed. Email notification was not sent.');
      setDeleteUserModal(null);
      setDeleteUserReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove user');
    }
  });

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    return users.filter(
      (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  React.useEffect(() => {
    if (!users) return;
    const next: Record<string, string> = {};
    users.forEach((u) => {
      next[u.id] = u.department || DEPARTMENTS[0];
    });
    setSelectedDepartments(next);
  }, [users]);

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
          icon={Shield}
          title="User Management"
          subtitle="Create and manage staff user accounts."
          iconWrapClassName="bg-purple-600"
        />
      </motion.div>

      <Card className="card-modern">
        <h2 className="mb-4 text-lg font-bold">Create Staff Account</h2>
        {createError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{createError}</p>}
        {createResult && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            Staff account created. Temporary password: <span className="font-bold">{createResult.password}</span> ({createResult.emailSent ? 'Email sent' : 'Email not sent'})
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Staff Department</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
              value={createForm.department}
              onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))}
            >
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </label>
        </div>
        <Button
          className="mt-4"
          onClick={() => createUserMutation.mutate()}
          isLoading={createUserMutation.isPending}
          disabled={!createForm.name || !createForm.email || !createForm.department}
        >
          Create Staff Account
        </Button>
      </Card>

      <Card className="card-modern flex items-center gap-4 p-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <Input
            placeholder="Search users by name or email..."
            className="pl-12 bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="card-modern overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department / ID</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === UserRole.ADMIN ? 'danger' : u.role === UserRole.STAFF ? 'warning' : 'info'}>
                    {u.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium">{u.department || u.studentId || 'N/A'}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Role changes are disabled; admin only creates staff and can deactivate them */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteUserModal({ userId: u.id, userName: u.name });
                        setDeleteUserReason('');
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {deleteUserModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-rose-700 dark:text-rose-400">Remove User</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              You are about to remove <span className="font-semibold">{deleteUserModal.userName}</span>. 
              Please provide a reason for removal (required).
            </p>
            <textarea
              value={deleteUserReason}
              onChange={(e) => setDeleteUserReason(e.target.value)}
              placeholder="Reason for removal (required)..."
              className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20"
                onClick={() => {
                  if (!deleteUserReason.trim()) {
                    toast.error('Reason is required');
                    return;
                  }
                  deleteUserMutation.mutate({ userId: deleteUserModal.userId, reason: deleteUserReason.trim() });
                }}
                isLoading={deleteUserMutation.isPending}
                disabled={!deleteUserReason.trim()}
              >
                Remove User
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteUserModal(null);
                  setDeleteUserReason('');
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

export default UserManagementPage;
