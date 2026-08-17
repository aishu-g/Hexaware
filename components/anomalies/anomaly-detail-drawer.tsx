'use client';

import React, { useState } from 'react';
import { Anomaly, AnomalyStatus } from '@/types/database';
import { X, ShieldAlert, CheckCircle2, UserCheck, MessageSquare } from 'lucide-react';
import { EDUCATION_LABELS, ACTIVITY_STATUS_LABELS } from '@/types/survey';
import { useTheme } from '@/context/theme-context';

interface AnomalyDetailDrawerProps {
  anomaly: Anomaly | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: AnomalyStatus, notes: string) => Promise<void>;
}

export function AnomalyDetailDrawer({ anomaly, onClose, onUpdateStatus }: AnomalyDetailDrawerProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState<AnomalyStatus>(anomaly?.status || 'resolved');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!anomaly) return null;

  const isHard = anomaly.severity === 'hard';
  const details = anomaly.details || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus(anomaly.id, status, notes);
      onClose();
    } catch (err) {
      console.error('Failed to submit anomaly resolution:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-all ${
      isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/60 backdrop-blur-xs'
    }`}>
      <div className={`w-full max-w-xl border-l h-full flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div>
          {/* Header */}
          <div className={`p-5 border-b flex items-center justify-between sticky top-0 z-10 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`p-2 rounded-xl border ${
                isHard
                  ? isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{anomaly.rule_code}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    isHard
                      ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                      : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {anomaly.severity} Check
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {anomaly.district}, {anomaly.state} • PSU {anomaly.psu_id}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6">
            {/* Failure Reason Banner */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className={`flex items-center justify-between text-xs font-mono font-bold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span>ANOMALY REASON & SCORE EXPLAINABILITY</span>
                <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>SCORE: {(anomaly.score * 100).toFixed(0)}%</span>
              </div>
              <p className={`text-sm font-semibold leading-relaxed ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {anomaly.reason_text}
              </p>
            </div>

            {/* Individual Attribute Breakdown */}
            <div className="space-y-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Respondent Microdata Record Snapshot
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Age:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {details.age !== undefined && details.age !== null ? `${details.age} years` : 'N/A'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sex:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {details.sex === 1 ? 'Male' : details.sex === 2 ? 'Female' : 'Transgender'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border col-span-2 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>General Education Level:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {details.general_education ? EDUCATION_LABELS[details.general_education as number] || `Code ${details.general_education}` : 'N/A'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border col-span-2 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Principal Activity Status:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {details.principal_activity_status ? ACTIVITY_STATUS_LABELS[details.principal_activity_status as number] || `Code ${details.principal_activity_status}` : 'N/A'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Weekly Earnings (INR):</span>
                  <span className={`font-bold font-mono text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    ₹{details.weekly_earnings !== undefined ? (details.weekly_earnings as number).toLocaleString() : 0}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <span className={`block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Hours Worked / Week:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {details.hours_worked !== undefined && details.hours_worked !== null ? `${details.hours_worked} hrs` : '0 hrs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit & Resolution Section */}
            <form onSubmit={handleSubmit} className={`space-y-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center space-x-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <UserCheck className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>Officer Audit Action & Sign-off</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className={`font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Select Resolution Outcome:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: 'resolved',
                      label: 'Resolved',
                      colorLight: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500',
                      colorDark: 'bg-emerald-950 text-emerald-400 border-emerald-700 ring-1 ring-emerald-500'
                    },
                    {
                      id: 'false_positive',
                      label: 'False Positive',
                      colorLight: 'bg-slate-100 text-slate-800 border-slate-300 ring-2 ring-slate-400',
                      colorDark: 'bg-slate-800 text-slate-300 border-slate-700 ring-1 ring-slate-500'
                    },
                    {
                      id: 'in_review',
                      label: 'In Review',
                      colorLight: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-500',
                      colorDark: 'bg-amber-950 text-amber-400 border-amber-700 ring-1 ring-amber-500'
                    },
                    {
                      id: 'escalated',
                      label: 'Escalate to HQ',
                      colorLight: 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500',
                      colorDark: 'bg-rose-950 text-rose-400 border-rose-700 ring-1 ring-rose-500'
                    }
                  ].map((item) => {
                    const isSelected = status === item.id;
                    const style = isLight
                      ? isSelected ? item.colorLight : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      : isSelected ? item.colorDark : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStatus(item.id as AnomalyStatus)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${style}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className={`font-bold flex items-center space-x-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Remarks / Re-interview Directives:</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter official remarks for enumerator or field team..."
                  className={`w-full border rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-2xs'
                      : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Audit Signature...' : 'Submit Resolution Sign-off'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
