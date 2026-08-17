'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Users,
  Upload,
  FileSpreadsheet,
  Building2,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === 'light';

  const navItems = [
    { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Anomaly Resolution Desk', href: '/anomalies', icon: ShieldAlert },
    { label: 'Validation Rule Engine', href: '/rules', icon: Sliders },
    { label: 'Enumerator Risk & PSU', href: '/enumerators', icon: Users },
    { label: 'Data Ingestion & Ingest', href: '/ingest', icon: Upload },
    { label: 'Export & Audit Dossier', href: '/export', icon: FileSpreadsheet }
  ];

  const roleLabelMap = {
    admin: 'ADMIN',
    hsd_officer: 'HSD OFFICER',
    supervisor: 'SUPERVISOR',
    viewer: 'VIEWER'
  };

  const currentRole = user?.role || 'supervisor';

  return (
    <aside className={`w-64 border-r flex flex-col justify-between h-screen sticky top-0 shadow-lg z-30 transition-colors duration-200 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div>
        {/* Brand Header */}
        <div className={`p-5 border-b flex items-center space-x-3 ${
          isLight ? 'border-slate-100 bg-slate-50/80' : 'border-slate-800/80 bg-slate-950/40'
        }`}>
          <div className="h-10 w-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xl shadow-xs">
            S
          </div>
          <div>
            <h1 className={`font-bold tracking-tight text-lg leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              SurvIntel
            </h1>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              PLFS Data Quality Platform
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                      : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  isActive
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                    : isLight ? 'text-slate-400' : 'text-slate-400'
                }`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className={`p-4 border-t ${isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-950/40'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <Building2 className={`w-4 h-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>MoSPI NSSO</span>
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-md uppercase font-mono font-extrabold border ${
            currentRole === 'admin'
              ? isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-400 border-indigo-800'
              : currentRole === 'hsd_officer'
              ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
              : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
          }`}>
            {roleLabelMap[currentRole] || 'SUPERVISOR'}
          </span>
        </div>

        <div className={`rounded-xl p-3 border flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-800/50 border-slate-700/50'
        }`}>
          <div className="truncate mr-2">
            <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {user?.full_name || 'Official User'}
            </p>
            <p className={`text-[10px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {user?.region || 'Western Zone - Maharashtra'}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleTheme}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-700 text-slate-400 hover:text-amber-400'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={logout}
              title="Sign out"
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-rose-600' : 'hover:bg-slate-700 text-slate-400 hover:text-rose-400'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
