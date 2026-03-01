import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { mapUser } from '../api/mappers';
import { cn } from '../lib/utils';

const studentLoginSchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^UGR\/\d{5}\/\d{2}$/i, 'Student ID must follow format UGR/00000/16'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const staffLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;
type StaffLoginFormValues = z.infer<typeof staffLoginSchema>;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginType, setLoginType] = React.useState<'student' | 'staff'>('student');

  const studentForm = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginSchema),
  });

  const staffForm = useForm<StaffLoginFormValues>({
    resolver: zodResolver(staffLoginSchema),
  });

  const onStudentSubmit = async (data: StudentLoginFormValues) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/login', {
        studentId: data.studentId,
        password: data.password,
      });
      login(response.data.token, mapUser(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const onStaffSubmit = async (data: StaffLoginFormValues) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      login(response.data.token, mapUser(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const isSubmitting = studentForm.formState.isSubmitting || staffForm.formState.isSubmitting;
  const studentErrors = studentForm.formState.errors;
  const staffErrors = staffForm.formState.errors;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 page-bg-wrapper">
      {/* Enhanced background with overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/astu-main-building.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="fixed inset-0 z-0 bg-linear-to-br from-emerald-900/40 to-slate-900/50 to-slate-900/60 dark:from-emerald-900/60 dark:via-slate-950/70 dark:to-slate-950/80" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="card-modern border-emerald-500/30 bg-white/95 dark:bg-slate-900/95 p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30"
            >
              <FileText size={36} />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-emerald-600 to-emerald-400 mb-2">
              Welcome Back
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
              Sign in to ASTU Smart Complaint System
            </p>
          </div>

          {/* Login Type Toggle */}
          <div className="mb-6 flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginType("student")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all",
                loginType === "student"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400",
              )}
            >
              <GraduationCap size={18} />
              Student
            </button>
            <button
              type="button"
              onClick={() => setLoginType("staff")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all",
                loginType === "staff"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
              )}
            >
              <Users size={18} />
              Staff / Admin
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
            >
              {error}
            </motion.div>
          )}

          {loginType === "student" ? (
            <form
              onSubmit={studentForm.handleSubmit(onStudentSubmit)}
              className="space-y-4"
            >
              <Input
                label="Student ID"
                type="text"
                placeholder="UGR/00000/16"
                error={studentErrors.studentId?.message}
                {...studentForm.register("studentId")}
                className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 uppercase"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  error={studentErrors.password?.message}
                  {...studentForm.register("password")}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-8 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <div className="mt-2.5 text-right text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                isLoading={isSubmitting}
              >
                Sign In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          ) : (
            <form
              onSubmit={staffForm.handleSubmit(onStaffSubmit)}
              className="space-y-4"
            >
              <Input
                label="Email Address"
                type="email"
                placeholder="name@astu.edu.et"
                error={staffErrors.email?.message}
                {...staffForm.register("email")}
                className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  error={staffErrors.password?.message}
                  {...staffForm.register("password")}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-8 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <div className="mt-2.5 text-right text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 bg-blue-600 hover:bg-blue-700"
                isLoading={isSubmitting}
              >
                Sign In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          )}

          {loginType === "student" && (
            <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Need an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Submit Registration Request
              </Link>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
