'use client';

import { ValidationRule } from '@/types/database';
import { ShieldAlert, AlertTriangle, Cpu, ToggleLeft, ToggleRight, Code, Layers } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

interface RuleCardProps {
  rule: ValidationRule;
  onToggleActive: (id: string, currentActive: boolean) => void;
}

export function RuleCard({ rule, onToggleActive }: RuleCardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isHard = rule.severity === 'hard';
  const isML = rule.code.includes('ML');

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      rule.is_active
        ? isLight
          ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          : 'bg-slate-900 border-slate-800 shadow-md hover:border-slate-700'
        : isLight
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-slate-950/60 border-slate-900 opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className={`p-2.5 rounded-xl border ${
            isHard
              ? isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : isML
              ? isLight ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
              : isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isHard ? <ShieldAlert className="w-5 h-5" /> : isML ? <Cpu className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-mono font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{rule.code}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                isHard
                  ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                  : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                {rule.severity}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {rule.level}
              </span>
            </div>
            <h3 className={`text-sm font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{rule.title}</h3>
          </div>
        </div>

        <button
          onClick={() => onToggleActive(rule.id, rule.is_active)}
          className="p-1 transition-colors"
          title={rule.is_active ? 'Rule Active (Click to Disable)' : 'Rule Disabled (Click to Enable)'}
        >
          {rule.is_active ? (
            <ToggleRight className={`w-7 h-7 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          ) : (
            <ToggleLeft className={`w-7 h-7 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
          )}
        </button>
      </div>

      <p className={`text-xs mt-3 leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        {rule.description}
      </p>

      <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
        isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
      }`}>
        <div className="flex items-center space-x-1.5 truncate max-w-sm">
          <Code className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className={`truncate px-2 py-1 rounded-md border text-[11px] font-semibold ${
            isLight ? 'bg-slate-50 text-slate-800 border-slate-200' : 'bg-slate-950 text-slate-300 border-slate-800'
          }`}>
            {rule.condition_expression}
          </span>
        </div>

        <div className={`flex items-center space-x-1 text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          <Layers className="w-3 h-3" />
          <span className="capitalize">{rule.entity}</span>
        </div>
      </div>
    </div>
  );
}
