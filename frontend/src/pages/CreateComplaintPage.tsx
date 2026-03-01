import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, FileText, GraduationCap, BookOpen, Building2, Home, Library, Utensils, Bus, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { PageHero } from '../components/ui/PageHero';
import api from '../api/client';

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide more details (min 20 chars)'),
  category: z.string().min(1, 'Please select a category'),
  department: z.string().min(1, 'Please select a department'),
  priority: z.string().min(1, 'Please select a priority'),
  isAnonymous: z.boolean().optional()
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

import { COMPLAINT_DEPARTMENTS } from '../constants/departments';

const CATEGORIES = [
  { label: 'Academic', value: 'academic', icon: BookOpen, color: 'text-blue-600' },
  { label: 'Infrastructure', value: 'infrastructure', icon: Building2, color: 'text-orange-600' },
  { label: 'Hostel', value: 'hostel', icon: Home, color: 'text-purple-600' },
  { label: 'Library', value: 'library', icon: Library, color: 'text-indigo-600' },
  { label: 'Cafeteria', value: 'cafeteria', icon: Utensils, color: 'text-rose-600' },
  { label: 'Transport', value: 'transport', icon: Bus, color: 'text-cyan-600' },
  { label: 'Other', value: 'other', icon: HelpCircle, color: 'text-slate-600' }
];

const PRIORITIES = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
];

const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter((file: File) => {
        const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        return isValidType && isValidSize;
      });

      if (validFiles.length < newFiles.length) {
        setError('Some files were rejected. Only JPG, PNG, and PDF under 5MB are allowed.');
      }

      setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormValues) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('department', data.department);
      formData.append('priority', data.priority);
      formData.append('isAnonymous', String(isAnonymous));
      
      files.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post('/api/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/complaints');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={GraduationCap}
          title="New Complaint"
          subtitle="Provide details about the issue you're facing."
          iconWrapClassName="bg-emerald-600"
        />
      </motion.div>

      <Card className="card-modern">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
            >
              {error}
            </motion.div>
          )}

          <Input
            label="Title"
            placeholder="Brief summary of the issue"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <label
                    key={cat.value}
                    className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-500 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:shadow-lg dark:has-[:checked]:bg-emerald-900/20"
                  >
                    <input
                      type="radio"
                      value={cat.value}
                      {...register('category')}
                      className="sr-only"
                    />
                    <Icon className={`h-6 w-6 ${cat.color}`} />
                    <span className="text-xs font-semibold text-center">{cat.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.category && <p className="text-xs font-medium text-rose-500">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
              <select
                className="flex h-12 w-full rounded-xl border border-slate-300 bg-white/80 dark:bg-slate-800/80 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700 transition-all"
                {...register('department')}
              >
                <option value="">Select a department</option>
                {COMPLAINT_DEPARTMENTS.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              {errors.department && <p className="text-xs font-medium text-rose-500">{errors.department.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                className="flex h-12 w-full rounded-xl border border-slate-300 bg-white/80 dark:bg-slate-800/80 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700 transition-all"
                {...register('priority')}
              >
                {PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
              {errors.priority && <p className="text-xs font-medium text-rose-500">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              className="flex min-h-[150px] w-full rounded-xl border border-slate-300 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700 transition-all resize-none"
              placeholder="Describe the issue in detail..."
              {...register('description')}
            />
            {errors.description && <p className="text-xs font-medium text-rose-500">{errors.description.message}</p>}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
            <label htmlFor="anonymous" className="flex-1 cursor-pointer">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Submit Anonymously</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your identity will be hidden from staff and admins. Use this for sensitive issues.
              </p>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachments (Optional)</label>
            <div className="flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div key={index} className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 pr-8 dark:border-slate-700 dark:bg-slate-800">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="max-w-[150px] truncate text-xs font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1 p-1 text-slate-400 hover:text-rose-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50 transition-colors">
                  <Upload size={20} className="text-slate-400" />
                  <span className="mt-1 text-[10px] font-medium text-slate-500">Add File</span>
                  <input type="file" className="hidden" multiple onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Max 5 files. JPG, PNG, PDF only. Max 5MB each.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-12 font-semibold" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30" isLoading={isSubmitting}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateComplaintPage;
