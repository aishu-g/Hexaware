'use client';

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { Sidebar } from '@/components/layout/sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen font-sans antialiased overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />
      <main className={`flex-1 flex flex-col overflow-y-auto ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent>{children}</DashboardContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
