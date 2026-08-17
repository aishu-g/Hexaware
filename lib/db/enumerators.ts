import { createAdminClient } from '@/lib/supabase/admin';
import { EnumeratorMetric } from '@/types/database';

export async function upsertEnumeratorMetrics(metrics: Partial<EnumeratorMetric>[]): Promise<void> {
  if (metrics.length === 0) return;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('enumerator_metrics')
    .upsert(metrics, { onConflict: 'enumerator_id,batch_id' });

  if (error) {
    throw new Error(`Failed to upsert enumerator metrics: ${error.message}`);
  }
}

export async function getEnumeratorMetrics(batchId?: string): Promise<EnumeratorMetric[]> {
  const supabase = createAdminClient();
  let query = supabase.from('enumerator_metrics').select('*');
  if (batchId) query = query.eq('batch_id', batchId);

  query = query.order('risk_score', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch enumerator metrics: ${error.message}`);

  return (data || []) as EnumeratorMetric[];
}
