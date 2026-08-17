'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { EnumeratorMetric } from '@/types/database';
import { getEnumeratorMetrics } from '@/lib/db/enumerators';
import { Users, AlertOctagon, Clock, CheckCircle2 } from 'lucide-react';
import { exportEnumeratorMetricsToCSV } from '@/lib/export/csv-exporter';
import { useTheme } from '@/context/theme-context';

export default function EnumeratorRiskPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [metrics, setMetrics] = useState<EnumeratorMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch or fallback to mock enumerator analytics
      const data = await getEnumeratorMetrics();
      if (data.length > 0) {
        setMetrics(data);
      } else {
        // Sample fallback metrics
        setMetrics([
          {
            id: '1',
            enumerator_id: 'ENUM_RISK_99',
            batch_id: 'b1',
            psu_id: 'PSU_MAHA_10',
            total_households_surveyed: 15,
            flagged_anomalies_count: 12,
            avg_response_time_seconds: 48,
            risk_score: 0.88,
            is_outlier: true,
            metrics_json: {},
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            enumerator_id: 'ENUM_IN_101',
            batch_id: 'b1',
            psu_id: 'PSU_MAHA_11',
            total_households_surveyed: 22,
            flagged_anomalies_count: 2,
            avg_response_time_seconds: 420,
            risk_score: 0.12,
            is_outlier: false,
            metrics_json: {},
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            enumerator_id: 'ENUM_IN_102',
            batch_id: 'b1',
            psu_id: 'PSU_KAR_05',
            total_households_surveyed: 18,
            flagged_anomalies_count: 1,
            avg_response_time_seconds: 510,
            risk_score: 0.08,
            is_outlier: false,
            metrics_json: {},
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch enumerator metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Enumerator Risk & Cluster Quality Analytics"
        subtitle="PSU Peer Divergence, Response Speed Anomaly & Enumerator Outlier Rankings"
        onRefresh={fetchMetrics}
        isRefreshing={isLoading}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Banner */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Cluster & Enumerator Audit Summary</h2>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Evaluating response time distribution and default copying patterns across PSU clusters
              </p>
            </div>
          </div>

          <button
            onClick={() => exportEnumeratorMetricsToCSV(metrics)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-2xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Export Enumerator Report (CSV)
          </button>
        </div>

        {/* Data Table */}
        <div className={`border rounded-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-xl'
        }`}>
          <table className="w-full text-left text-xs">
            <thead className={`uppercase font-mono border-b text-[11px] font-bold ${
              isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Enumerator ID</th>
                <th className="py-3.5 px-4">Assigned PSU</th>
                <th className="py-3.5 px-4">Surveyed Households</th>
                <th className="py-3.5 px-4">Flagged Anomalies</th>
                <th className="py-3.5 px-4">Avg Response Time</th>
                <th className="py-3.5 px-4">Cluster Risk Score</th>
                <th className="py-3.5 px-4">Peer Outlier Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {metrics.map((m) => (
                <tr key={m.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                  <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {m.enumerator_id}
                  </td>

                  <td className={`py-3.5 px-4 font-mono font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {m.psu_id}
                  </td>

                  <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {m.total_households_surveyed}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold ${
                      m.flagged_anomalies_count > 3
                        ? isLight ? 'text-rose-600' : 'text-rose-400'
                        : isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {m.flagged_anomalies_count}
                    </span>
                  </td>

                  <td className={`py-3.5 px-4 font-mono font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.avg_response_time_seconds} sec</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                      m.risk_score >= 0.6
                        ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                        : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {(m.risk_score * 100).toFixed(0)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {m.is_outlier ? (
                      <span className={`inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                      }`}>
                        <AlertOctagon className="w-3 h-3 mr-0.5" />
                        <span>High Risk Outlier</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        <span>Peer Benchmark Normal</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
