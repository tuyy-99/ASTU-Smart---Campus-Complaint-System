import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserCircle2,
  Mail,
  Shield,
  GraduationCap,
  Building2,
  Calendar,
  Edit2,
  Key,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Save,
  X as XIcon,
  Camera,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { PageHero } from '../components/ui/PageHero';
import { useAuth } from '../context/AuthContext';
import { formatDate, cn } from '../lib/utils';
import api from '../api/client';
import { Complaint, ComplaintStatus } from '../types';
import { mapComplaint, mapUser } from '../api/mappers';

const ProfilePage: React.FC = () => {
  const { user, isStudent, isStaff, isAdmin, login } = useAuth();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isPasswordMode, setIsPasswordMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profilePhotoFile, setProfilePhotoFile] = React.useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = React.useState<string | null>(user?.profilePhotoUrl || null);

  React.useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
      });
      setProfilePhotoPreview(user.profilePhotoUrl || null);
    }
  }, [user]);

  const { data: complaints } = useQuery({
    queryKey: ['complaints', 'profile'],
    queryFn: async () => {
      const response = await api.get('/api/complaints');
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    },
    enabled: isStudent,
  });

  const stats = React.useMemo(() => {
    if (!complaints) return { total: 0, resolved: 0, inProgress: 0, pending: 0 };
    return {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
      inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
      pending: complaints.filter(c => c.status === ComplaintStatus.OPEN || c.status === ComplaintStatus.PENDING_REVIEW).length,
    };
  }, [complaints]);

  const roleConfig = React.useMemo(() => {
    if (isAdmin) {
      return {
        gradient: 'from-purple-600 to-purple-400',
        bgGradient: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
        borderColor: 'border-purple-200/60 dark:border-purple-800/40',
        iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        textColor: 'text-purple-600 dark:text-purple-400',
        badgeVariant: 'danger' as const,
      };
    } else if (isStaff) {
      return {
        gradient: 'from-blue-600 to-blue-400',
        bgGradient: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
        borderColor: 'border-blue-200/60 dark:border-blue-800/40',
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeVariant: 'warning' as const,
      };
    } else {
      return {
        gradient: 'from-emerald-600 to-emerald-400',
        bgGradient: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
        borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeVariant: 'info' as const,
      };
    }
  }, [isStaff, isAdmin]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; profilePhoto?: File | null }) => {
      // If a file is present, send multipart/form-data, otherwise JSON.
      if (data.profilePhoto) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('profilePhoto', data.profilePhoto);
        const response = await api.put('/api/auth/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
      const response = await api.put('/api/auth/profile', {
        name: data.name,
        email: data.email
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      // Update the auth context with new user data
      const token = localStorage.getItem('token');
      if (token) {
        login(token, mapUser(data.data));
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/api/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordMode(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
    },
  });

  const deleteProfilePhotoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/api/auth/profile-photo');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Profile photo deleted successfully');
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      // Update the auth context with new user data
      const token = localStorage.getItem('token');
      if (token) {
        login(token, mapUser(data.data));
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete profile photo');
    },
  });

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    updateProfileMutation.mutate({
      name: editForm.name,
      email: editForm.email,
      profilePhoto: profilePhotoFile || undefined
    });
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={UserCircle2}
          title="My Profile"
          subtitle="Manage your account information and view your activity."
          iconWrapClassName={isAdmin ? 'bg-purple-600' : isStaff ? 'bg-blue-600' : 'bg-emerald-600'}
        />
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={cn('card-modern', roleConfig.bgGradient, roleConfig.borderColor)}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profilePhotoPreview ? (
                      <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-emerald-400/70 bg-slate-900 shadow-xl">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex h-20 w-20 items-center justify-center rounded-2xl text-white font-bold text-3xl shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700',
                          roleConfig.iconBg
                        )}
                      >
                        {(isEditMode ? editForm.name : user?.name)?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isEditMode && (
                      <label className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-emerald-500 bg-emerald-600 text-white shadow-md hover:bg-emerald-500 transition-colors">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setProfilePhotoFile(file);
                            const url = URL.createObjectURL(file);
                            setProfilePhotoPreview(url);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {isEditMode ? editForm.name : user?.name || 'Unknown User'}
                    </h2>
                    <Badge variant={roleConfig.badgeVariant} className="mt-1">
                      {user?.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditMode(false);
                          setEditForm({ name: user?.name || '', email: user?.email || '' });
                        }}
                        className="gap-2"
                      >
                        <XIcon size={16} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        isLoading={updateProfileMutation.isPending}
                        className="gap-2"
                      >
                        <Save size={16} />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                      className={cn('gap-2', roleConfig.textColor)}
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {isEditMode ? (
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                  
                  {/* Profile Photo Management */}
                  {profilePhotoPreview && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Photo</label>
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700">
                          <img
                            src={profilePhotoPreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Current photo</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {profilePhotoFile ? 'New photo selected' : 'Saved photo'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (user?.profilePhotoUrl && !profilePhotoFile) {
                              // If user has a saved photo and no new file selected, delete from backend
                              if (window.confirm('Are you sure you want to delete your profile photo?')) {
                                deleteProfilePhotoMutation.mutate();
                              }
                            } else {
                              // If it's just a preview, remove it locally
                              setProfilePhotoFile(null);
                              setProfilePhotoPreview(null);
                            }
                          }}
                          disabled={deleteProfilePhotoMutation.isPending}
                          className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 size={16} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> You cannot change your role. Contact an administrator if you need role changes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className={cn('rounded-lg p-2', roleConfig.textColor, 'bg-white dark:bg-slate-900')}>
                    <Mail size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className={cn('rounded-lg p-2', roleConfig.textColor, 'bg-white dark:bg-slate-900')}>
                    <Shield size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{user?.role || '-'}</p>
                  </div>
                </div>

                {user?.studentId && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
                    <div className={cn('rounded-lg p-2', roleConfig.textColor, 'bg-white dark:bg-slate-900')}>
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Student ID</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.studentId}</p>
                    </div>
                  </div>
                )}

                {user?.department && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
                    <div className={cn('rounded-lg p-2', roleConfig.textColor, 'bg-white dark:bg-slate-900')}>
                      <Building2 size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.department}</p>
                    </div>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm md:col-span-2">
                    <div className={cn('rounded-lg p-2', roleConfig.textColor, 'bg-white dark:bg-slate-900')}>
                      <Calendar size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Member Since</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
              )}
            </Card>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-modern">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                  <Key size={20} className="text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security</h3>
              </div>
              
              {isPasswordMode ? (
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsPasswordMode(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="gap-2"
                    >
                      <XIcon size={16} />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      isLoading={changePasswordMutation.isPending}
                      className="gap-2"
                    >
                      <Save size={16} />
                      Change Password
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Manage your password and security settings to keep your account safe.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPasswordMode(true)}
                    className="gap-2"
                  >
                    <Key size={16} />
                    Change Password
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="space-y-6">
          {/* Stats Card - Only for Students */}
          {isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="card-modern">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                    <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Statistics</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-500 p-2">
                        <FileText size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/60 dark:border-green-800/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-500 p-2">
                        <CheckCircle2 size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resolved</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500 p-2">
                        <Clock size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">In Progress</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-800/10 border border-sky-200/60 dark:border-sky-800/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-sky-500 p-2">
                        <AlertCircle size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pending</span>
                    </div>
                    <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.pending}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-modern">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                  <Shield size={20} className="text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Status</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email Verified</span>
                  <Badge variant="success">Verified</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
