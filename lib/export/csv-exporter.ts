import Papa from 'papaparse';
import { Anomaly, EnumeratorMetric } from '@/types/database';

export function exportAnomaliesToCSV(anomalies: Anomaly[], filename = 'survintel_flagged_anomalies.csv') {
  if (anomalies.length === 0) {
    alert('No anomaly records to export.');
    return;
  }

  const exportData = anomalies.map((a) => ({
    'Anomaly ID': a.id,
    'Rule Code': a.rule_code,
    'Severity': a.severity.toUpperCase(),
    'Level': a.level.toUpperCase(),
    'State': a.state || 'N/A',
    'District': a.district || 'N/A',
    'PSU ID': a.psu_id || 'N/A',
    'Enumerator ID': a.enumerator_id || 'N/A',
    'Anomaly Score': `${(a.score * 100).toFixed(0)}%`,
    'Violation Description': a.reason_text,
    'Status': a.status.toUpperCase(),
    'Reviewed By': a.reviewed_by || 'Unreviewed',
    'Review Notes': a.reviewer_notes || '',
    'Timestamp': new Date(a.created_at).toLocaleString()
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportEnumeratorMetricsToCSV(metrics: EnumeratorMetric[], filename = 'survintel_enumerator_risk_report.csv') {
  if (metrics.length === 0) return;

  const exportData = metrics.map((m) => ({
    'Enumerator ID': m.enumerator_id,
    'PSU ID': m.psu_id,
    'Total Households Surveyed': m.total_households_surveyed,
    'Flagged Anomaly Count': m.flagged_anomalies_count,
    'Avg Response Time (Sec)': m.avg_response_time_seconds,
    'Risk Score': `${(m.risk_score * 100).toFixed(0)}%`,
    'Is Outlier': m.is_outlier ? 'YES' : 'NO'
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
