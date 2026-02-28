import { BookOpen, Building2, Home, Library, Utensils, Bus, HelpCircle, LucideIcon } from 'lucide-react';

export type CategoryType = 'academic' | 'infrastructure' | 'hostel' | 'library' | 'cafeteria' | 'transport' | 'other';

export interface CategoryConfig {
  label: string;
  value: CategoryType;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  academic: {
    label: 'Academic',
    value: 'academic',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  infrastructure: {
    label: 'Infrastructure',
    value: 'infrastructure',
    icon: Building2,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  hostel: {
    label: 'Hostel',
    value: 'hostel',
    icon: Home,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  library: {
    label: 'Library',
    value: 'library',
    icon: Library,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  cafeteria: {
    label: 'Cafeteria',
    value: 'cafeteria',
    icon: Utensils,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30'
  },
  transport: {
    label: 'Transport',
    value: 'transport',
    icon: Bus,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
  },
  other: {
    label: 'Other',
    value: 'other',
    icon: HelpCircle,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30'
  }
};

export const getCategoryConfig = (category: string): CategoryConfig => {
  return CATEGORY_CONFIG[category as CategoryType] || CATEGORY_CONFIG.other;
};
