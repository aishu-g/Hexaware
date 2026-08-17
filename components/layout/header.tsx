'use client';

import { Bell, RefreshCw, ShieldCheck, Database, Sun, Moon, UserCheck } from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  return (
    <header className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors duration-200 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div>
        <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{title}</h1>
        {subtitle && <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Active User Badge */}
        <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
        }`}>
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{user?.full_name || 'Official User'} ({user?.role?.toUpperCase() || 'SUPERVISOR'})</span>
        </div>

        {/* Active Round Indicator */}
        <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
        }`}>
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Round: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100 font-semibold'}>PLFS 2023-Q4</strong></span>
        </div>

        {/* Security / System Status Badge */}
        <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>RLS Enforced</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition-colors disabled:opacity-50 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-semibold ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
          }`}
          title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        >
          {isLight ? (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline text-indigo-600 font-bold">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-amber-300 font-bold">Light Mode</span>
            </>
          )}
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button className={`p-2 rounded-xl border transition-colors ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
          }`}>
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </div>
    </header>
  );
}
