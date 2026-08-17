'use client';

import React, { useState } from 'react';
import { RuleLevel, RuleSeverity, RuleEntity } from '@/types/database';
import { X, Plus, Code, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

interface RuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCreated: () => void;
}

export function RuleBuilderModal({ isOpen, onClose, onRuleCreated }: RuleBuilderModalProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [code, setCode] = useState('RULE_CUSTOM_010');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<RuleLevel>('record');
  const [severity, setSeverity] = useState<RuleSeverity>('soft');
  const [entity, setEntity] = useState<RuleEntity>('individual');
  const [conditionExpression, setConditionExpression] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          title,
          description,
          level,
          severity,
          entity,
          condition_expression: conditionExpression
        })
      });

      if (res.ok) {
        onRuleCreated();
        onClose();
      } else {
        const data = await res.json();
        alert(`Failed to create rule: ${data.error || 'Invalid payload'}`);
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 transition-all ${
      isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/70 backdrop-blur-xs'
    }`}>
      <div className={`border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <span className={`p-2 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Create Custom Validation Rule</h2>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Configure new deterministic hard or soft survey integrity checks</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-xl transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`font-bold block mb-1 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Rule Code:</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="RULE_HARD_010"
                className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              />
            </div>
            <div>
              <label className={`font-bold block mb-1 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Severity Level:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RuleSeverity)}
                className={`w-full border rounded-xl p-2.5 font-semibold focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="hard">Hard Check (Blocks Record)</option>
                <option value="soft">Soft Flag (Quality Review)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Rule Title:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Underage Secondary Education Flag"
              className={`w-full border rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          <div>
            <label className={`font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Description / Violation Reason:</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation displayed to field supervisor upon rule trigger..."
              className={`w-full border rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Evaluation Scope:</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as RuleLevel)}
                className={`w-full border rounded-xl p-2.5 font-semibold focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="record">Record Level</option>
                <option value="cluster">Cluster / PSU Level</option>
                <option value="aggregate">Aggregate Level</option>
              </select>
            </div>

            <div>
              <label className={`font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Target Entity:</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as RuleEntity)}
                className={`w-full border rounded-xl p-2.5 font-semibold focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="individual">Individual Member</option>
                <option value="household">Household</option>
                <option value="aggregate">Aggregate Region</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`font-bold flex items-center space-x-1 mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Code className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Condition Expression:</span>
            </label>
            <input
              type="text"
              required
              value={conditionExpression}
              onChange={(e) => setConditionExpression(e.target.value)}
              placeholder="e.g. age < 15 AND activity_status == 31"
              className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none focus:border-emerald-500 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
            <p className={`text-[10px] mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Supports fields: age, general_education, activity_status, weekly_earnings, hours_worked, hh_size.
            </p>
          </div>

          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl font-bold border transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-2 shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Deploy Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
