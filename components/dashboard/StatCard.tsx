'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  variant?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';
}

const variantStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    accent: 'from-blue-500/10 via-blue-500/5 to-transparent',
    trendBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accent: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    trendBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  violet: {
    iconBg: 'bg-violet-50 text-violet-600 border-violet-100',
    accent: 'from-violet-500/10 via-violet-500/5 to-transparent',
    trendBg: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    accent: 'from-amber-500/10 via-amber-500/5 to-transparent',
    trendBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    accent: 'from-rose-500/10 via-rose-500/5 to-transparent',
    trendBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  variant = 'blue',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
      {/* Decorative subtle gradient background */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${styles.accent} rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-80`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            {value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-xl border ${styles.iconBg} shadow-xs group-hover:scale-105 transition-transform duration-200`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        {trend && (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border text-[11px] ${
                trend.isPositive !== false
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
            </span>
            {trend.label && <span className="text-slate-500">{trend.label}</span>}
          </div>
        )}
        {subtitle && <span className="text-slate-500 font-medium ml-auto">{subtitle}</span>}
      </div>
    </div>
  );
}
