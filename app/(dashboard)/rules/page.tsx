'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { RuleCard } from '@/components/rules/rule-card';
import { RuleBuilderModal } from '@/components/rules/rule-builder-modal';
import { ValidationRule, CheckDefinition, CheckResult, CheckKind } from '@/types/database';
import { Plus, Sliders, Play, CheckCircle2, XCircle, ShieldCheck, Database } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

export default function RulesPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [checks, setChecks] = useState<CheckDefinition[]>([]);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Check Definition Form State
  const [newCheckName, setNewCheckName] = useState('');
  const [newCheckKind, setNewCheckKind] = useState<CheckKind>('range');
  const [newCheckType, setNewCheckType] = useState<'hard' | 'soft'>('hard');
  const [newCheckMin, setNewCheckMin] = useState(0);
  const [newCheckMax, setNewCheckMax] = useState(110);
  const [newCheckField, setNewCheckField] = useState('age');
  const [isCreatingCheck, setIsCreatingCheck] = useState(false);

  const fetchRulesAndChecks = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resRules, resChecks] = await Promise.all([
        fetch('/api/rules'),
        fetch('/api/checks')
      ]);

      if (resRules.ok) {
        const json = await resRules.json();
        setRules(json.data || []);
      }
      if (resChecks.ok) {
        const json = await resChecks.json();
        setChecks(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rules and checks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRulesAndChecks();
  }, [fetchRulesAndChecks]);

  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: ruleId,
          is_active: !currentActive
        })
      });

      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, is_active: !currentActive } : r))
        );
      }
    } catch (err) {
      console.error('Failed to toggle rule active state:', err);
    }
  };

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCheck(true);

    let config: Record<string, unknown> = {};
    if (newCheckKind === 'range') {
      config = { field: newCheckField, min: newCheckMin, max: newCheckMax };
    } else if (newCheckKind === 'referential') {
      config = { foreign_key: 'household_id', target_table: 'households' };
    } else if (newCheckKind === 'existential') {
      config = { field: newCheckField };
    } else {
      config = { field: newCheckField, pattern: '^PSU_[A-Z]{3}_[0-9]+$' };
    }

    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCheckName || `Custom ${newCheckKind.toUpperCase()} Check`,
          level: 'record',
          type: newCheckType,
          check_kind: newCheckKind,
          config,
          active: true
        })
      });

      if (res.ok) {
        setNewCheckName('');
        await fetchRulesAndChecks();
      }
    } catch (err) {
      console.error('Failed to create check definition:', err);
    } finally {
      setIsCreatingCheck(false);
    }
  };

  const handleExecuteEngine = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/checks/execute', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setCheckResults(json.results || []);
      }
    } catch (err) {
      console.error('Execution engine failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Validation Rule Engine & Check Definitions Admin UI"
        subtitle="Manage Deterministic Hard/Soft Checks, Referential & Range Rules, and Run Execution Engine"
        onRefresh={fetchRulesAndChecks}
        isRefreshing={isLoading}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Top Control Bar with Execution Engine Trigger */}
        <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Active Rule & Check Policy Set</h2>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Configured Rules: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{rules.length}</strong> • Active Checks: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{checks.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExecuteEngine}
              disabled={isExecuting}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 border border-indigo-400/30 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Executing Check Engine...' : 'Run Check Execution Engine'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 border border-emerald-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule</span>
            </button>
          </div>
        </div>

        {/* Check Definitions Admin UI Section */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Database className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <h3 className={`text-sm font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Check Definitions Table (<code className="font-mono text-xs text-emerald-500">check_definitions</code>)
            </h3>
          </div>

          {/* Admin Form to Add Range or Referential Check */}
          <form onSubmit={handleCreateCheck} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs items-end bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="font-bold block mb-1">Check Name:</label>
              <input
                type="text"
                required
                value={newCheckName}
                onChange={(e) => setNewCheckName(e.target.value)}
                placeholder="e.g. Earnings Range Check"
                className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Check Kind:</label>
              <select
                value={newCheckKind}
                onChange={(e) => setNewCheckKind(e.target.value as CheckKind)}
                className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="range">Range Check</option>
                <option value="referential">Referential Integrity</option>
                <option value="existential">Existential Check</option>
                <option value="pattern">Pattern Matching</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">Severity Type:</label>
              <select
                value={newCheckType}
                onChange={(e) => setNewCheckType(e.target.value as 'hard' | 'soft')}
                className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="hard">Hard (Blocks Record)</option>
                <option value="soft">Soft (Quality Flag)</option>
              </select>
            </div>

            {newCheckKind === 'range' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Min:</label>
                  <input
                    type="number"
                    value={newCheckMin}
                    onChange={(e) => setNewCheckMin(Number(e.target.value))}
                    className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Max:</label>
                  <input
                    type="number"
                    value={newCheckMax}
                    onChange={(e) => setNewCheckMax(Number(e.target.value))}
                    className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="font-bold block mb-1">Target Field:</label>
                <input
                  type="text"
                  value={newCheckField}
                  onChange={(e) => setNewCheckField(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isCreatingCheck}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingCheck ? 'Saving...' : 'Add Check'}</span>
            </button>
          </form>

          {/* Active Check Definitions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {checks.map((chk) => (
              <div key={chk.id} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    chk.type === 'hard'
                      ? isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      : isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {chk.check_kind} • {chk.type}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase">Active</span>
                </div>
                <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{chk.name}</h4>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  Config: {JSON.stringify(chk.config)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Check Execution Results Table (check_results) */}
        {checkResults.length > 0 && (
          <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-xl'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className={`text-sm font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Execution Engine Audit Log (<code className="font-mono text-xs text-indigo-400">check_results</code>)
                </h3>
              </div>
              <div className="text-xs font-mono font-bold">
                Pass Rate: <strong className="text-emerald-500">{((checkResults.filter((r) => r.passed).length / checkResults.length) * 100).toFixed(0)}%</strong> ({checkResults.filter((r) => r.passed).length}/{checkResults.length})
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase font-mono text-[11px] font-bold border-b ${
                  isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Target Record ID</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Pass / Fail Reason & Detail</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                  {checkResults.map((res) => (
                    <tr key={res.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                      <td className="py-3 px-4">
                        {res.passed ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3 mr-0.5" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        {res.record_id}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] uppercase font-bold">
                        <span className={res.severity === 'hard' ? 'text-rose-500' : 'text-amber-500'}>
                          {res.severity}
                        </span>
                      </td>

                      <td className={`py-3 px-4 font-medium ${
                        res.passed ? (isLight ? 'text-slate-700' : 'text-slate-300') : (isLight ? 'text-rose-700 font-semibold' : 'text-rose-400 font-semibold')
                      }`}>
                        {res.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing Validation Rules Grid */}
        <div className="space-y-4">
          <h3 className={`text-sm font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            System Validation Rules Policy Set
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.length === 0 ? (
              <div className={`col-span-full py-12 text-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Loading validation rules policy set...
              </div>
            ) : (
              rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <RuleBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRuleCreated={fetchRulesAndChecks}
      />
    </div>
  );
}
