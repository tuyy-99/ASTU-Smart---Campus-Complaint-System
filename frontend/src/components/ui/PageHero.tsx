import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  titleClassName?: string;
  iconWrapClassName?: string;
  children?: React.ReactNode;
}

export const PageHero: React.FC<PageHeroProps> = ({
  icon: Icon,
  title,
  subtitle,
  titleClassName,
  iconWrapClassName,
  children
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-2xl shadow-2xl dark:border-slate-800/70 dark:bg-slate-900/70 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-700',
              iconWrapClassName || 'bg-emerald-600'
            )}
          >
            <Icon size={32} />
          </div>
          <div>
            <h1 className={cn('text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-1', titleClassName)}>
              {title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg font-medium">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
