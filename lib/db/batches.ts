import { createAdminClient } from '@/lib/supabase/admin';
import { SurveyBatch, BatchStatus } from '@/types/database';

export async function createBatch(data: {
  name: string;
  survey_type?: string;
  survey_round?: string;
  total_households?: number;
  total_individuals?: number;
  ingested_by?: string;
  metadata?: Record<string, unknown>;
}): Promise<SurveyBatch> {
  const supabase = createAdminClient();
  const { data: batch, error } = await supabase
    .from('survey_batches')
    .insert({
      name: data.name,
      survey_type: data.survey_type || 'PLFS',
      survey_round: data.survey_round || '2023-Q4',
      total_households: data.total_households || 0,
      total_individuals: data.total_individuals || 0,
      status: 'pending',
      ingested_by: data.ingested_by || null,
      metadata: data.metadata || {}
    })
    .select()
    .single();

  if (error || !batch) {
    throw new Error(`Failed to create survey batch: ${error?.message || 'Unknown error'}`);
  }

  return batch as SurveyBatch;
}

export async function updateBatchStatus(
  batchId: string,
  status: BatchStatus,
  counts?: { total_households?: number; total_individuals?: number }
): Promise<void> {
  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = { status };
  if (counts?.total_households !== undefined) updateData.total_households = counts.total_households;
  if (counts?.total_individuals !== undefined) updateData.total_individuals = counts.total_individuals;

  const { error } = await supabase
    .from('survey_batches')
    .update(updateData)
    .eq('id', batchId);

  if (error) {
    throw new Error(`Failed to update batch status: ${error.message}`);
  }
}

export async function getBatches(): Promise<SurveyBatch[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('survey_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch survey batches: ${error.message}`);
  }

  return (data || []) as SurveyBatch[];
}

export async function getBatchById(batchId: string): Promise<SurveyBatch | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('survey_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (error) return null;
  return data as SurveyBatch;
}
