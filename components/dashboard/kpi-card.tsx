'use client';

import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
}

const variantStylesDark = {
  emerald: {
    bg: 'from-emerald-950/30 to-slate-900',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  amber: {
    bg: 'from-amber-950/30 to-slate-900',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  },
  rose: {
    bg: 'from-rose-950/30 to-slate-900',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  },
  indigo: {
    bg: 'from-indigo-950/30 to-slate-900',
    border: 'border-indigo-500/30',
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  },
  slate: {
    bg: 'from-slate-900 to-slate-900',
    border: 'border-slate-800',
    iconBg: 'bg-slate-800 text-slate-400 border-slate-700'
  }
};

const variantStylesLight = {
  emerald: {
    bg: 'bg-white',
    border: 'border-emerald-200/80 shadow-xs hover:border-emerald-300',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  amber: {
    bg: 'bg-white',
    border: 'border-amber-200/80 shadow-xs hover:border-amber-300',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  rose: {
    bg: 'bg-white',
    border: 'border-rose-200/80 shadow-xs hover:border-rose-300',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  indigo: {
    bg: 'bg-white',
    border: 'border-indigo-200/80 shadow-xs hover:border-indigo-300',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  slate: {
    bg: 'bg-white',
    border: 'border-slate-200 shadow-xs hover:border-slate-300',
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon: Icon,
  variant = 'slate'
}: KPICardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const styles = isLight ? variantStylesLight[variant] : variantStylesDark[variant];

  return (
    <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all duration-200 ${
      isLight ? `${styles.bg} ${styles.border}` : `bg-gradient-to-br ${styles.bg} ${styles.border} shadow-lg hover:border-slate-700`
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {title}
          </p>
          <h3 className={`text-3xl font-extrabold mt-1.5 tracking-tight font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {value}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className={`mt-3 pt-2.5 border-t flex items-center text-xs ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
          <span
            className={`font-bold ${
              trendType === 'positive'
                ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                : trendType === 'negative'
                ? isLight ? 'text-rose-600' : 'text-rose-400'
                : isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {trend}
          </span>
          <span className={`ml-1.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>vs previous round</span>
        </div>
      )}
    </div>
  );
}
