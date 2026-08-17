'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/types/database';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('supervisor');
  const [region, setRegion] = useState('Western Zone - Maharashtra');
  const [department] = useState('National Sample Survey Office (NSSO)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          full_name: fullName,
          email,
          password,
          role,
          region,
          department
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMessage(json.error || 'Failed to create account');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg border border-emerald-400/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-3">Register Officer Account</h1>
          <p className="text-xs text-slate-400 font-medium">
            Join the NSSO Survey Data Quality & Anomaly Desk
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Full Name:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. S. K. Mukherjee"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Official Email Address:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@mospi.gov.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Password:</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Officer Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="admin">Admin (Director)</option>
                <option value="hsd_officer">HSD Officer</option>
                <option value="supervisor">Field Supervisor</option>
                <option value="viewer">Public Viewer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Assigned Region:</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="HQ - New Delhi">HQ - New Delhi</option>
                <option value="Western Zone - Maharashtra">Western Zone (Maha)</option>
                <option value="Southern Zone - Karnataka">Southern Zone (Kar)</option>
                <option value="Eastern Zone - West Bengal">Eastern Zone (WB)</option>
                <option value="Northern Zone - Punjab">Northern Zone (PB)</option>
              </select>
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering Account...' : 'Complete Officer Registration'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 font-medium">
          Already registered?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Sign in here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
