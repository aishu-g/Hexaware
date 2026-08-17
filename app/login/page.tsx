'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types/database';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@mospi.gov.in');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
          role: selectedRole
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMessage(json.error || 'Invalid credentials or login failure');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoPersona = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/30 border border-emerald-400/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-3">SurvIntel Portal Login</h1>
          <p className="text-xs text-slate-400 font-medium">
            NSSO PLFS Microdata Integrity & ML Anomaly Resolution Platform
          </p>
        </div>

        {/* Demo Persona Quick Selectors */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
            Select Role Demo Persona:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoPersona('admin', 'admin@mospi.gov.in')}
              className={`p-2.5 rounded-xl border font-bold flex items-center space-x-2 transition-all ${
                selectedRole === 'admin'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-600 ring-1 ring-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin / Director</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoPersona('hsd_officer', 'officer@mospi.gov.in')}
              className={`p-2.5 rounded-xl border font-bold flex items-center space-x-2 transition-all ${
                selectedRole === 'hsd_officer'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-600 ring-1 ring-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>HSD Officer</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoPersona('supervisor', 'supervisor@mospi.gov.in')}
              className={`p-2.5 rounded-xl border font-bold flex items-center space-x-2 transition-all ${
                selectedRole === 'supervisor'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-600 ring-1 ring-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Field Supervisor</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoPersona('viewer', 'viewer@mospi.gov.in')}
              className={`p-2.5 rounded-xl border font-bold flex items-center space-x-2 transition-all ${
                selectedRole === 'viewer'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-600 ring-1 ring-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Public Viewer</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Email Address:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@mospi.gov.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 border border-emerald-400/30 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer link to signup */}
        <div className="pt-2 text-center text-xs text-slate-400 font-medium">
          Need a new officer account?{' '}
          <Link href="/signup" className="text-emerald-400 hover:underline font-bold">
            Sign up here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
