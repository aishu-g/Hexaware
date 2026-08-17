import { createAdminClient } from '@/lib/supabase/admin';

export interface AnomalyScoreRecord {
  id?: string;
  batch_id: string | null;
  entity_type: 'record' | 'cluster' | 'aggregate';
  entity_id: string;
  score: number;
  method: string;
  explanation: string;
  created_at?: string;
}

export async function insertAnomalyScores(scores: AnomalyScoreRecord[]): Promise<void> {
  const supabase = createAdminClient();
  try {
    for (let i = 0; i < scores.length; i += 500) {
      const chunk = scores.slice(i, i + 500);
      await supabase.from('anomaly_scores').insert(chunk);
    }
  } catch (err) {
    console.warn('Anomaly scores insert notice:', err);
  }
}

export async function getAnomalyScoresByBatch(batchId: string): Promise<AnomalyScoreRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('anomaly_scores')
    .select('*')
    .eq('batch_id', batchId)
    .order('score', { ascending: false });

  if (error) return [];
  return (data || []) as AnomalyScoreRecord[];
}
