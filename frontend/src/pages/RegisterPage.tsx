import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import api from '../api/client';
import { STUDENT_DEPARTMENTS } from '../constants/departments';

const registerRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  studentId: z.string().regex(/^UGR\/\d{5}\/\d{2}$/, 'Format must be UGR/00000/16'),
  department: z.string().min(1, 'Department is required')
});

type RegisterRequestValues = z.infer<typeof registerRequestSchema>;

const RegisterPage: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = React.useState<File | null>(null);
  const [idPhoto, setIdPhoto] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RegisterRequestValues>({
    resolver: zodResolver(registerRequestSchema)
  });

  const onSubmit = async (data: RegisterRequestValues) => {
    try {
      setError(null);
      setSuccess(null);

      if (!idPhoto) {
        setError('Student ID photo is required.');
        return;
      }

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('studentId', data.studentId.toUpperCase());
      formData.append('department', data.department);
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }
      formData.append('idPhoto', idPhoto);

      const response = await api.post('/api/auth/register-request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const pendingEmailSent = Boolean(response.data?.pendingEmailSent);
      setSuccess(
        pendingEmailSent
          ? (response.data?.message || 'Registration request submitted successfully. Pending email sent.')
          : `${response.data?.message || 'Registration request submitted successfully.'} Email not sent, please contact support.`
      );
      reset();
      setProfilePhoto(null);
      setIdPhoto(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration request failed. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background with image showing through */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,46,22,0.40) 50%, rgba(2,6,23,0.60) 100%), url('/images/astu-main-building.jpg')`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundAttachment: 'fixed, fixed',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="card-modern border-white/20 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 md:p-10 shadow-2xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30"
            >
              <UserPlus size={36} />
            </motion.div>
            <h1 className="mb-2 bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Registration Request
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Submit your registration request. Student ID photo is required, profile photo is optional.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
              className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@astu.edu.et"
              error={errors.email?.message}
              {...register('email')}
              className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
            />
            <Input
              label="Student ID"
              placeholder="UGR/12345/16"
              error={errors.studentId?.message}
              {...register('studentId')}
              className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select
                {...register('department')}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-sm dark:border-slate-700 dark:bg-slate-800/80"
              >
                <option value="">Select School/Department</option>
                {STUDENT_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-sm dark:border-slate-700 dark:bg-slate-800/80"
                onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Student ID Photo (Required)</label>
              <input
                type="file"
                accept="image/*"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-sm dark:border-slate-700 dark:bg-slate-800/80"
                onChange={(e) => setIdPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="h-14 w-full text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30" isLoading={isSubmitting}>
                Submit Registration Request
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
              Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
