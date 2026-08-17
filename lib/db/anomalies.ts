import { createAdminClient } from '@/lib/supabase/admin';
import { Anomaly, AnomalyStatus, RuleLevel, RuleSeverity } from '@/types/database';
import { AnomalyFilterOptions } from '@/types/survey';

export async function bulkInsertAnomalies(anomalies: Partial<Anomaly>[]): Promise<number> {
  if (anomalies.length === 0) return 0;
  const supabase = createAdminClient();

  for (let i = 0; i < anomalies.length; i += 500) {
    const chunk = anomalies.slice(i, i + 500);
    const { error } = await supabase.from('anomalies').insert(chunk);
    if (error) {
      throw new Error(`Failed to insert anomaly chunk: ${error.message}`);
    }
  }

  return anomalies.length;
}

export async function getAnomalies(options: AnomalyFilterOptions = {}): Promise<{
  data: Anomaly[];
  total: number;
}> {
  const supabase = createAdminClient();
  let query = supabase.from('anomalies').select('*', { count: 'exact' });

  if (options.batchId) query = query.eq('batch_id', options.batchId);
  if (options.severity && options.severity !== 'all') query = query.eq('severity', options.severity);
  if (options.level && options.level !== 'all') query = query.eq('level', options.level);
  if (options.status && options.status !== 'all') query = query.eq('status', options.status);
  if (options.state) query = query.eq('state', options.state);
  if (options.district) query = query.eq('district', options.district);
  if (options.enumeratorId) query = query.eq('enumerator_id', options.enumeratorId);

  if (options.searchQuery) {
    query = query.or(`reason_text.ilike.%${options.searchQuery}%,rule_code.ilike.%${options.searchQuery}%`);
  }

  const page = options.page || 1;
  const pageSize = options.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch anomalies: ${error.message}`);
  }

  return {
    data: (data || []) as Anomaly[],
    total: count || 0
  };
}

export async function updateAnomalyStatus(
  anomalyId: string,
  status: AnomalyStatus,
  reviewerId?: string,
  reviewerNotes?: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('anomalies')
    .update({
      status,
      reviewed_by: reviewerId || null,
      reviewer_notes: reviewerNotes || null,
      resolved_at: status === 'resolved' || status === 'false_positive' ? new Date().toISOString() : null
    })
    .eq('id', anomalyId);

  if (error) {
    throw new Error(`Failed to update anomaly status: ${error.message}`);
  }
}

export async function getAnomalyStats(batchId?: string): Promise<{
  totalAnomalies: number;
  hardCheckFailures: number;
  softCheckFlags: number;
  openCount: number;
  resolvedCount: number;
  byLevel: Record<RuleLevel, number>;
  bySeverity: Record<RuleSeverity, number>;
}> {
  const supabase = createAdminClient();
  let query = supabase.from('anomalies').select('severity, level, status');
  if (batchId) query = query.eq('batch_id', batchId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch anomaly stats: ${error.message}`);

  const items = data || [];
  let hard = 0;
  let soft = 0;
  let open = 0;
  let resolved = 0;
  const byLevel: Record<RuleLevel, number> = { record: 0, cluster: 0, aggregate: 0 };
  const bySeverity: Record<RuleSeverity, number> = { hard: 0, soft: 0 };

  for (const item of items) {
    if (item.severity === 'hard') hard++;
    if (item.severity === 'soft') soft++;
    if (item.status === 'open' || item.status === 'in_review') open++;
    if (item.status === 'resolved' || item.status === 'false_positive') resolved++;

    const lvl = item.level as RuleLevel;
    if (byLevel[lvl] !== undefined) byLevel[lvl]++;

    const sev = item.severity as RuleSeverity;
    if (bySeverity[sev] !== undefined) bySeverity[sev]++;
  }

  return {
    totalAnomalies: items.length,
    hardCheckFailures: hard,
    softCheckFlags: soft,
    openCount: open,
    resolvedCount: resolved,
    byLevel,
    bySeverity
  };
}
