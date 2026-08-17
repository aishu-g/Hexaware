import { createAdminClient } from '@/lib/supabase/admin';
import { Household, Individual } from '@/types/database';
import { PLFSHouseholdInput } from '@/types/survey';

export async function insertBatchSurveyData(
  batchId: string,
  householdsInput: PLFSHouseholdInput[]
): Promise<{ rawRecordsCount: number; householdsCount: number; individualsCount: number }> {
  const supabase = createAdminClient();

  const rawStagingRecords: Array<{
    batch_id: string;
    record_index: number;
    raw_json: Record<string, unknown>;
    status: string;
  }> = [];

  const householdRecords: Partial<Household>[] = [];
  const individualRecords: Partial<Individual>[] = [];

  let recordIdx = 0;
  for (const hh of householdsInput) {
    const hhId = crypto.randomUUID();
    recordIdx += 1;

    // Stage raw household record
    rawStagingRecords.push({
      batch_id: batchId,
      record_index: recordIdx,
      raw_json: hh as unknown as Record<string, unknown>,
      status: 'promoted'
    });

    householdRecords.push({
      id: hhId,
      batch_id: batchId,
      hh_id: hh.hh_id,
      state: hh.state,
      district: hh.district,
      psu_id: hh.psu_id,
      sector: hh.sector,
      hh_size: hh.hh_size,
      religion: hh.religion || 'Hinduism',
      social_group: hh.social_group || 'OTH',
      monthly_expenditure: hh.monthly_expenditure || 0,
      land_owned_hectares: hh.land_owned_hectares || 0,
      enumerator_id: hh.enumerator_id,
      response_time_seconds: hh.response_time_seconds || 300
    });

    for (const ind of hh.individuals) {
      individualRecords.push({
        id: crypto.randomUUID(),
        batch_id: batchId,
        household_id: hhId,
        person_id: ind.person_id,
        age: ind.age,
        sex: ind.sex,
        general_education: ind.general_education,
        marital_status: ind.marital_status,
        principal_activity_status: ind.principal_activity_status,
        subsidiary_activity_status: ind.subsidiary_activity_status || 0,
        weekly_earnings: ind.weekly_earnings || 0,
        hours_worked: ind.hours_worked || 0
      });
    }
  }

  // 1. Insert into raw_records staging
  try {
    for (let i = 0; i < rawStagingRecords.length; i += 500) {
      const chunk = rawStagingRecords.slice(i, i + 500);
      await supabase.from('raw_records').insert(chunk);
    }
  } catch (err) {
    console.warn('Raw records staging insert warning:', err);
  }

  // 2. Insert promoted households in chunks of 500
  try {
    for (let i = 0; i < householdRecords.length; i += 500) {
      const chunk = householdRecords.slice(i, i + 500);
      await supabase.from('households').insert(chunk);
    }
  } catch (err) {
    console.warn('Households promotion insert warning:', err);
  }

  // 3. Insert promoted individuals in chunks of 500
  try {
    for (let i = 0; i < individualRecords.length; i += 500) {
      const chunk = individualRecords.slice(i, i + 500);
      await supabase.from('individuals').insert(chunk);
    }
  } catch (err) {
    console.warn('Individuals promotion insert warning:', err);
  }

  return {
    rawRecordsCount: rawStagingRecords.length,
    householdsCount: householdRecords.length,
    individualsCount: individualRecords.length
  };
}

export async function getHouseholdsByBatch(batchId: string): Promise<Household[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('batch_id', batchId);

  if (error) return [];
  return (data || []) as Household[];
}

export async function getIndividualsByBatch(batchId: string): Promise<Individual[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('individuals')
    .select('*')
    .eq('batch_id', batchId);

  if (error) return [];
  return (data || []) as Individual[];
}
