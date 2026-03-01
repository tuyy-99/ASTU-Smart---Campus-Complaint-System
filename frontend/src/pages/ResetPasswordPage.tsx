import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { mapUser } from '../api/mappers';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type ResetFormValues = z.infer<typeof resetSchema>;

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    setError(null);
    try {
      const response = await api.put(`/api/auth/reset-password/${token}`, {
        password: data.password
      });
      login(response.data.token, mapUser(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to reset password.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-6">
        <div className="text-center">
          <Lock className="mx-auto mb-2 text-emerald-600" size={28} />
          <h1 className="text-2xl font-bold">Reset Password</h1>
        </div>

        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="password"
            label="New Password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            type="password"
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Update Password
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Back to <Link to="/login" className="font-semibold text-emerald-600">Login</Link>
        </p>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
