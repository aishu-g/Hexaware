'use client';

import { Anomaly, AnomalyStatus } from '@/types/database';
import { ShieldAlert, AlertTriangle, Cpu, CheckCircle2, Eye, Filter, Search } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

interface AnomalyTableProps {
  anomalies: Anomaly[];
  total: number;
  selectedId: string | null;
  onSelectAnomaly: (anomaly: Anomaly) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  severityFilter: string;
  onSeverityChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onUpdateStatus?: (id: string, newStatus: AnomalyStatus) => void;
}

export function AnomalyTable({
  anomalies,
  total,
  selectedId,
  onSelectAnomaly,
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  statusFilter,
  onStatusChange,
  onUpdateStatus
}: AnomalyTableProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
      isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-xl'
    }`}>
      {/* Search & Filter Toolbar */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-950/40'
      }`}>
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by rule code, reason, district..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-2xs'
                  : 'bg-slate-900 border-slate-700/70 text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1.5 border rounded-xl px-3 py-1.5 font-medium ${
            isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-slate-900 border-slate-700/70 text-slate-200'
          }`}>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>All Severities</option>
              <option value="hard" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Hard Checks</option>
              <option value="soft" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Soft Flags</option>
            </select>
          </div>

          <div className={`flex items-center space-x-1.5 border rounded-xl px-3 py-1.5 font-medium ${
            isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-slate-900 border-slate-700/70 text-slate-200'
          }`}>
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>All Statuses</option>
              <option value="open" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Open</option>
              <option value="in_review" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>In Review</option>
              <option value="resolved" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Resolved</option>
              <option value="false_positive" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>False Positive</option>
            </select>
          </div>

          <span className={`text-xs font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Showing <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{anomalies.length}</strong> of {total}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className={`uppercase font-mono border-b text-[11px] font-bold ${
            isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}>
            <tr>
              <th className="py-3 px-4">Severity & Rule</th>
              <th className="py-3 px-4">Location / PSU</th>
              <th className="py-3 px-4">Enumerator</th>
              <th className="py-3 px-4">Violation Details & ML Reason</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-sans ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
            {anomalies.length === 0 ? (
              <tr>
                <td colSpan={7} className={`py-12 text-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  No flagged survey anomalies match the selected filters.
                </td>
              </tr>
            ) : (
              anomalies.map((item) => {
                const isSelected = selectedId === item.id;
                const isHard = item.severity === 'hard';
                const isML = item.rule_code.includes('ML');

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                          : 'bg-emerald-950/20 border-l-4 border-emerald-500'
                        : isLight
                          ? 'hover:bg-slate-50/80'
                          : 'hover:bg-slate-800/40'
                    }`}
                    onClick={() => onSelectAnomaly(item)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        {isHard ? (
                          <span className={`p-1.5 rounded-lg border ${
                            isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            <ShieldAlert className="w-4 h-4" />
                          </span>
                        ) : isML ? (
                          <span className={`p-1.5 rounded-lg border ${
                            isLight ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className={`p-1.5 rounded-lg border ${
                            isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                        <div>
                          <span className={`font-mono font-bold block ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{item.rule_code}</span>
                          <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.severity} • {item.level}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{item.district || 'All Districts'}</div>
                      <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.state} • PSU: {item.psu_id || 'N/A'}</div>
                    </td>

                    <td className={`py-3.5 px-4 font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {item.enumerator_id || 'SYSTEM'}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className={`line-clamp-2 leading-relaxed text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>{item.reason_text}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        item.score >= 0.8
                          ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                          : item.score >= 0.5
                          ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
                          : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {(item.score * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {onUpdateStatus ? (
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as AnomalyStatus)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border focus:outline-none cursor-pointer ${
                            item.status === 'open'
                              ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                              : item.status === 'in_review'
                              ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                              : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          }`}
                        >
                          <option value="open">OPEN</option>
                          <option value="in_review">IN REVIEW</option>
                          <option value="resolved">RESOLVED</option>
                          <option value="false_positive">FALSE POSITIVE</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.status === 'open'
                            ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                            : item.status === 'in_review'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                            : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        }`}>
                          {item.status === 'resolved' && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                          <span>{item.status.replace('_', ' ')}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnomaly(item);
                        }}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Eye className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
