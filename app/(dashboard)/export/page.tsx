'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { FileSpreadsheet, FileText, Download, ShieldCheck, Filter, Search } from 'lucide-react';
import { exportAnomaliesToCSV } from '@/lib/export/csv-exporter';
import { generateAuditDossierPDF } from '@/lib/export/pdf-generator';
import { Anomaly } from '@/types/database';
import { useTheme } from '@/context/theme-context';

export default function ExportPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const fetchExportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageSize', '500');
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (levelFilter !== 'all') params.append('level', levelFilter);

      const res = await fetch(`/api/anomalies?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAnomalies(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies for export:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, severityFilter, statusFilter, levelFilter]);

  useEffect(() => {
    fetchExportData();
  }, [fetchExportData]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Export & Survey Audit Dossier Desk"
        subtitle="Filter and download official audit reports, flagged microdata CSVs, and PDF certificates"
        onRefresh={fetchExportData}
        isRefreshing={isLoading}
      />

      <div className="p-6 space-y-6 flex-1 max-w-4xl mx-auto w-full">
        {/* Banner */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>NSSO Survey Audit Sign-off Center</h2>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Export verified survey microdata flags and audit dossiers for official ministry archives.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by State, District, Rule Code or Enumerator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[11px] text-slate-400">Severity:</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className={`w-full border rounded-xl p-2 font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="all">All Severities</option>
                <option value="hard">Hard Checks</option>
                <option value="soft">Soft Flags</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[11px] text-slate-400">Level:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className={`w-full border rounded-xl p-2 font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="all">All Levels</option>
                <option value="record">Record Level</option>
                <option value="cluster">Cluster Level</option>
                <option value="aggregate">Aggregate Level</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[11px] text-slate-400">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full border rounded-xl p-2 font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className={`p-2.5 rounded-xl border w-full flex items-center justify-between font-mono font-bold ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-950 border-slate-800 text-emerald-400'
              }`}>
                <span className="flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Matched:</span>
                </span>
                <span className="text-sm">{anomalies.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Export */}
          <div className={`p-6 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileSpreadsheet className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Export Flagged Microdata (CSV)</h3>
              </div>
              <p className={`text-xs leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Export all record, cluster, and aggregate anomalies matching your active filters to standard CSV. Includes rule codes, severity, scores, and officer review notes.
              </p>
            </div>

            <button
              onClick={() => exportAnomaliesToCSV(anomalies, `survintel_filtered_flags_${new Date().toISOString().slice(0, 10)}.csv`)}
              disabled={isLoading || anomalies.length === 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Filtered Microdata CSV ({anomalies.length})</span>
            </button>
          </div>

          {/* PDF Audit Dossier */}
          <div className={`p-6 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
          }`}>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Generate Official PDF Audit Dossier</h3>
              </div>
              <p className={`text-xs leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Generate a formatted, printable PDF survey audit certificate matching your active filters with NSSO header, summary stats, and flagged record table.
              </p>
            </div>

            <button
              onClick={() => generateAuditDossierPDF(anomalies, `PLFS 2023-Q4 Filtered Audit (${anomalies.length} Records)`)}
              disabled={isLoading || anomalies.length === 0}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Generate PDF Audit Certificate ({anomalies.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
