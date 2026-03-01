import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { mapUser } from '../api/mappers';

const staffLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type StaffLoginFormValues = z.infer<typeof staffLoginSchema>;

const StaffLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StaffLoginFormValues>({
    resolver: zodResolver(staffLoginSchema),
  });

  const onSubmit = async (data: StaffLoginFormValues) => {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background with image showing through */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(29,78,216,0.40) 50%, rgba(2,6,23,0.60) 100%), url('/images/astu-main-building.jpg')`,
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
        className="relative z-10 w-full max-w-md"
      >
        <Card className="card-modern border-white/20 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 md:p-10 shadow-2xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30"
            >
              <Users size={40} />
            </motion.div>
            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-300">
              Staff & Admin
            </h1>
            <p className="mt-2 text-lg text-slate-900 dark:text-slate-100">
              Sign in with your email
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="your.email@example.com"
              error={errors.email?.message}
              {...register('email')}
              className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
                className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              className="h-14 w-full text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500"
              isLoading={isSubmitting}
            >
              Sign In
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </form>

          <div className="mt-8 space-y-4 text-center text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              <Link
                to="/login"
                className="font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ← Student Login
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StaffLoginPage;
