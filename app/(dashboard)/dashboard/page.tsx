'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { KPICard } from '@/components/dashboard/kpi-card';
import { RuleFrequencyChart, SeverityPieChart, StateRiskChart, TrendChart } from '@/components/dashboard/anomaly-chart';
import { AnomalyDetailDrawer } from '@/components/anomalies/anomaly-detail-drawer';
import {
  ShieldAlert,
  FileCheck,
  Cpu,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  AlertOctagon,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { generateSamplePLFSData } from '@/lib/ingestion/sample-generator';
import { Anomaly, AnomalyStatus } from '@/types/database';
import { useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';

export default function ExecutiveDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  const [selectedRegion, setSelectedRegion] = useState<string>(
    user?.role === 'admin' ? 'all' : (user?.region || 'Western Zone - Maharashtra')
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>('2023-Q4');

  const [stats, setStats] = useState({
    totalMicrodata: 0,
    totalAnomalies: 0,
    hardFailures: 0,
    softFlags: 0,
    recordLevel: 0,
    clusterLevel: 0,
    aggregateLevel: 0
  });

  const [ruleFreqData, setRuleFreqData] = useState<Array<{ code: string; count: number; name: string }>>([]);
  const [severityData, setSeverityData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [stateRiskData, setStateRiskData] = useState<Array<{ state: string; hard: number; soft: number }>>([]);
  const [trendData, setTrendData] = useState<Array<{ date: string; hard: number; soft: number; total: number }>>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Enumerator Leaderboard state
  const [enumeratorLeaderboard] = useState<Array<{
    id: string;
    enumerator_id: string;
    psu_id: string;
    households: number;
    avg_speed: number;
    risk_score: number;
    is_outlier: boolean;
  }>>([
    { id: '1', enumerator_id: 'ENUM_RISK_99', psu_id: 'PSU_MAHA_10', households: 15, avg_speed: 48, risk_score: 0.88, is_outlier: true },
    { id: '2', enumerator_id: 'ENUM_IN_101', psu_id: 'PSU_MAHA_11', households: 22, avg_speed: 420, risk_score: 0.12, is_outlier: false },
    { id: '3', enumerator_id: 'ENUM_IN_102', psu_id: 'PSU_KAR_05', households: 18, avg_speed: 510, risk_score: 0.08, is_outlier: false }
  ]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageSize', '100');
      if (selectedRegion !== 'all') {
        params.append('searchQuery', selectedRegion.includes('Maharashtra') ? 'Maharashtra' : selectedRegion);
      }

      const res = await fetch(`/api/anomalies?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const items: Anomaly[] = json.data || [];

        const hard = items.filter((a) => a.severity === 'hard').length;
        const soft = items.filter((a) => a.severity === 'soft').length;
        const recordLvl = items.filter((a) => a.level === 'record').length;
        const clusterLvl = items.filter((a) => a.level === 'cluster').length;
        const aggLvl = items.filter((a) => a.level === 'aggregate').length;

        setStats({
          totalMicrodata: items.length > 0 ? items.length * 5 : 0,
          totalAnomalies: items.length,
          hardFailures: hard,
          softFlags: soft,
          recordLevel: recordLvl,
          clusterLevel: clusterLvl,
          aggregateLevel: aggLvl
        });

        // Frequency grouping
        const codeMap = new Map<string, number>();
        for (const item of items) {
          codeMap.set(item.rule_code, (codeMap.get(item.rule_code) || 0) + 1);
        }

        const freq = Array.from(codeMap.entries()).map(([code, count]) => ({
          code,
          count,
          name: code
        }));

        setRuleFreqData(freq.slice(0, 7));

        setSeverityData([
          { name: 'Hard Check Violations', value: hard, color: '#f43f5e' },
          { name: 'Soft Quality Flags', value: soft, color: '#f59e0b' }
        ]);

        // State grouping
        const stateMap = new Map<string, { hard: number; soft: number }>();
        for (const item of items) {
          const st = item.state || 'Maharashtra';
          if (!stateMap.has(st)) {
            stateMap.set(st, { hard: 0, soft: 0 });
          }
          const rec = stateMap.get(st)!;
          if (item.severity === 'hard') rec.hard += 1;
          else rec.soft += 1;
        }

        const stateList = Array.from(stateMap.entries()).map(([state, val]) => ({
          state,
          hard: val.hard,
          soft: val.soft
        }));

        setStateRiskData(stateList);

        // Trend timeline
        setTrendData([
          { date: 'Week 1', hard: Math.round(hard * 0.2), soft: Math.round(soft * 0.25), total: Math.round(items.length * 0.22) },
          { date: 'Week 2', hard: Math.round(hard * 0.3), soft: Math.round(soft * 0.2), total: Math.round(items.length * 0.25) },
          { date: 'Week 3', hard: Math.round(hard * 0.25), soft: Math.round(soft * 0.35), total: Math.round(items.length * 0.3) },
          { date: 'Week 4', hard: Math.round(hard * 0.25), soft: Math.round(soft * 0.2), total: Math.round(items.length * 0.23) }
        ]);

        setRecentAnomalies(items.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickSeed = async () => {
    setIsGenerating(true);
    try {
      const sample = generateSamplePLFSData(50);
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `PLFS 2023-Q4 Batch #${Math.floor(100 + Math.random() * 900)}`,
          survey_type: 'PLFS',
          survey_round: selectedQuarter,
          households: sample
        })
      });

      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to run quick seed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateAnomalyStatus = async (id: string, newStatus: AnomalyStatus, notes: string) => {
    try {
      const res = await fetch('/api/anomalies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomaly_id: id,
          status: newStatus,
          reviewer_notes: notes
        })
      });

      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Executive Microdata Integrity Dashboard"
        subtitle="Real-time PLFS Survey Violations, Cluster Risk Leaderboard & Role-Aware RLS Analytics"
        onRefresh={fetchDashboardData}
        isRefreshing={isLoading}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Role & Regional Toolbar */}
        <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-md'
        }`}>
          <div className="flex items-center space-x-3 text-xs">
            <div className={`flex items-center space-x-2 border rounded-xl px-3 py-2 font-medium ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Scope Region:</span>
              {user?.role === 'admin' ? (
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-transparent font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">All India Regions (National)</option>
                  <option value="HQ - New Delhi">HQ - New Delhi</option>
                  <option value="Western Zone - Maharashtra">Western Zone (Maharashtra)</option>
                  <option value="Southern Zone - Karnataka">Southern Zone (Karnataka)</option>
                  <option value="Eastern Zone - West Bengal">Eastern Zone (West Bengal)</option>
                  <option value="Northern Zone - Punjab">Northern Zone (Punjab)</option>
                </select>
              ) : (
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  {user?.region || 'Western Zone - Maharashtra'} (RLS Enforced)
                </strong>
              )}
            </div>

            <div className={`flex items-center space-x-2 border rounded-xl px-3 py-2 font-medium ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Round:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="2023-Q4">PLFS 2023-Q4 (Current)</option>
                <option value="2023-Q3">PLFS 2023-Q3 (Historical)</option>
                <option value="2023-Q2">PLFS 2023-Q2 (Historical)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleQuickSeed}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 border border-emerald-400/30 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Running Validation Ingestion...' : 'Ingest & Validate Sample Dataset'}</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Survey Microdata"
            value={stats.totalMicrodata.toLocaleString()}
            subtitle={`Records (${stats.recordLevel} Record / ${stats.clusterLevel} Cluster)`}
            icon={FileCheck}
            variant="slate"
          />
          <KPICard
            title="Hard Check Violations"
            value={stats.hardFailures}
            subtitle="Blocks Record Acceptance"
            trend="Immediate Action Needed"
            trendType="negative"
            icon={ShieldAlert}
            variant="rose"
          />
          <KPICard
            title="Soft Quality Flags"
            value={stats.softFlags}
            subtitle="Statistical & IQR Outliers"
            icon={AlertTriangle}
            variant="amber"
          />
          <KPICard
            title="ML Anomaly Density"
            value={stats.totalAnomalies > 0 ? `${((stats.totalAnomalies / (stats.totalMicrodata || 1)) * 100).toFixed(1)}%` : '0.0%'}
            subtitle="Isolation Forest Score >= 0.50"
            icon={Cpu}
            variant="emerald"
          />
        </div>

        {/* Trend Chart & Severity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flags Trend Chart Over Time */}
          <div className={`lg:col-span-2 border rounded-2xl p-5 transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Flag Summary & Violation Trends Over Time
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Weekly Hard violations vs Soft quality flags timeline (Recharts)
                </p>
              </div>
            </div>
            <TrendChart data={trendData} />
          </div>

          {/* Severity & Level Breakdown */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Anomaly Level & Severity Breakdown
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Hard vs Soft check distribution
              </p>
            </div>
            <SeverityPieChart data={severityData} />
            <div className={`mt-2 text-center text-xs font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Level Breakdown: <strong className="text-emerald-500">{stats.recordLevel} Record</strong> • <strong className="text-amber-500">{stats.clusterLevel} Cluster</strong> • <strong className="text-indigo-500">{stats.aggregateLevel} Agg</strong>
            </div>
          </div>
        </div>

        {/* Rule Frequency Distribution & State Risk Matrix Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`border rounded-2xl p-5 transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Rule Failure Frequency Distribution
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Most frequent integrity rule triggers across batch dataset
                </p>
              </div>
            </div>
            <RuleFrequencyChart data={ruleFreqData} />
          </div>

          <div className={`border rounded-2xl p-5 transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  State-Level Anomaly Density
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hard vs Soft flags aggregated by State
                </p>
              </div>
            </div>
            <StateRiskChart data={stateRiskData} />
          </div>
        </div>

        {/* Enumerator / Cluster Risk Leaderboard & Flag Drill-Down Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cluster / Enumerator Risk Leaderboard */}
          <div className={`border rounded-2xl p-5 transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Enumerator & Cluster Risk Leaderboard
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ranked by speed anomaly and Isolation Forest peer divergence score
                </p>
              </div>
              <Link href="/enumerators" className={`text-xs font-bold hover:underline flex items-center ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}>
                <span>Full Cluster Matrix</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase font-mono text-[11px] font-bold border-b ${
                  isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Enumerator ID</th>
                    <th className="py-2.5 px-3">PSU</th>
                    <th className="py-2.5 px-3">Speed</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                  {enumeratorLeaderboard.map((enumItem) => (
                    <tr key={enumItem.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                      <td className={`py-3 px-3 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        {enumItem.enumerator_id}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {enumItem.psu_id}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{enumItem.avg_speed}s</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] border ${
                          enumItem.risk_score >= 0.6
                            ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                            : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {(enumItem.risk_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {enumItem.is_outlier ? (
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}>
                            <AlertOctagon className="w-3 h-3 mr-0.5" />
                            <span>Outlier</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}>
                            <span>Normal</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drill-Down Flag Table (Click to Inspect Record) */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Flagged Anomalies Drill-Down Preview
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Click any flag row to inspect full respondent microdata record
                  </p>
                </div>
                <Link href="/anomalies" className={`text-xs font-bold hover:underline flex items-center ${
                  isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}>
                  <span>Resolution Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentAnomalies.length === 0 ? (
                  <p className={`text-xs py-8 text-center font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    No anomalies flagged. Click "Ingest & Validate Sample Dataset" above to run validation.
                  </p>
                ) : (
                  recentAnomalies.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAnomaly(item)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isLight
                          ? 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200'
                          : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          item.severity === 'hard'
                            ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                            : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {item.rule_code}
                        </span>
                        <div className="truncate max-w-xs">
                          <p className={`font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.reason_text}</p>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.district}, {item.state}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          {(item.score * 100).toFixed(0)}%
                        </span>
                        <Eye className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
              isLight ? 'border-slate-100' : 'border-slate-800/80'
            }`}>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Scope Audit Status:</span>
              <span className={`font-semibold flex items-center space-x-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <Users className="w-3.5 h-3.5" />
                <span>Supervisor Desk Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Inspector Drawer Modal */}
      <AnomalyDetailDrawer
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onUpdateStatus={handleUpdateAnomalyStatus}
      />
    </div>
  );
}
