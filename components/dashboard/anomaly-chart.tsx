'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useTheme } from '@/context/theme-context';

const SEVERITY_COLORS = {
  hard: '#f43f5e', // Rose-500
  soft: '#f59e0b', // Amber-500
  ml: '#8b5cf6'   // Violet-500
};

interface RuleFreqItem {
  code: string;
  count: number;
  name: string;
}

interface SeverityItem {
  name: string;
  value: number;
  color: string;
}

interface StateRiskItem {
  state: string;
  hard: number;
  soft: number;
}

interface TrendItem {
  date: string;
  hard: number;
  soft: number;
  total: number;
}

export function TrendChart({ data }: { data: TrendItem[] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const strokeColor = isLight ? '#64748b' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#334155';
  const tooltipStyle = isLight
    ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
    : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' };

  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        No flag trend data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
          <defs>
            <linearGradient id="hardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="softGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
          <XAxis dataKey="date" stroke={strokeColor} fontSize={11} />
          <YAxis stroke={strokeColor} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend verticalAlign="top" height={36} formatter={(value) => <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{value}</span>} />
          <Area type="monotone" dataKey="hard" stroke="#f43f5e" fillOpacity={1} fill="url(#hardGrad)" name="Hard Violations" strokeWidth={2} />
          <Area type="monotone" dataKey="soft" stroke="#f59e0b" fillOpacity={1} fill="url(#softGrad)" name="Soft Quality Flags" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RuleFrequencyChart({ data }: { data: RuleFreqItem[] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const strokeColor = isLight ? '#64748b' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#334155';
  const tooltipStyle = isLight
    ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
    : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' };

  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        No rule frequency data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
          <XAxis dataKey="code" stroke={strokeColor} fontSize={11} angle={-15} textAnchor="end" />
          <YAxis stroke={strokeColor} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isLight ? '#f1f5f9' : '#1e293b' }} />
          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Violations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeverityPieChart({ data }: { data: SeverityItem[] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const tooltipStyle = isLight
    ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
    : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' };

  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        No severity data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || SEVERITY_COLORS.soft} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string | number) => (
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StateRiskChart({ data }: { data: StateRiskItem[] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const strokeColor = isLight ? '#64748b' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#334155';
  const tooltipStyle = isLight
    ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
    : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' };

  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        No state risk data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
          <XAxis type="number" stroke={strokeColor} fontSize={11} />
          <YAxis dataKey="state" type="category" stroke={strokeColor} fontSize={11} width={90} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="hard" stackId="a" fill="#f43f5e" name="Hard Checks" />
          <Bar dataKey="soft" stackId="a" fill="#f59e0b" name="Soft Flags" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
