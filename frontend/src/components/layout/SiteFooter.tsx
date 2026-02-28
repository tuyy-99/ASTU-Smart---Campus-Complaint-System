import React from 'react';
import { Link } from 'react-router-dom';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/90 text-slate-700 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 dark:text-slate-200">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <img src="/images/astu-logo.png" alt="ASTU Logo" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">ASTU Smart</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/privacy-policy" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
            Privacy
          </Link>
          <Link to="/terms-of-service" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
            Terms
          </Link>
          <Link to="/contact-support" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
            Contact
          </Link>
        </div>
        <p className="text-xs md:text-sm">&copy; 2026 Adama Science and Technology University.</p>
      </div>
    </footer>
  );
};
