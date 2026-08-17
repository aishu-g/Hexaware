import { createAdminClient } from '@/lib/supabase/admin';
import { CheckDefinition, CheckResult } from '@/types/database';

export async function getCheckDefinitions(): Promise<CheckDefinition[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('check_definitions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    // Fallback seed check definitions if database tables aren't connected yet
    return [
      {
        id: 'chk_range_001',
        name: 'Respondent Age Range Check (0 to 110)',
        level: 'record',
        type: 'hard',
        check_kind: 'range',
        config: { field: 'age', min: 0, max: 110 },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'chk_ref_002',
        name: 'Individual to Household Foreign Key Integrity',
        level: 'record',
        type: 'hard',
        check_kind: 'referential',
        config: { foreign_key: 'household_id', target_table: 'households' },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'chk_range_003',
        name: 'Weekly Earnings Cap Range Check (Max INR 500,000)',
        level: 'record',
        type: 'soft',
        check_kind: 'range',
        config: { field: 'weekly_earnings', min: 0, max: 500000 },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'chk_pattern_004',
        name: 'PSU Cluster Code Pattern Standard',
        level: 'record',
        type: 'soft',
        check_kind: 'pattern',
        config: { field: 'psu_id', pattern: '^PSU_[A-Z]{3,4}_[0-9]{1,4}$' },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  return data as CheckDefinition[];
}

export async function createCheckDefinition(check: Partial<CheckDefinition>): Promise<CheckDefinition> {
  const supabase = createAdminClient();
  const newId = crypto.randomUUID();

  const payload = {
    id: newId,
    name: check.name || 'Custom Check',
    level: check.level || 'record',
    type: check.type || 'soft',
    check_kind: check.check_kind || 'range',
    config: check.config || {},
    active: check.active !== undefined ? check.active : true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('check_definitions')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    return {
      ...payload,
      created_at: new Date().toISOString()
    } as CheckDefinition;
  }

  return data as CheckDefinition;
}

export async function updateCheckDefinition(id: string, updates: Partial<CheckDefinition>): Promise<CheckDefinition | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('check_definitions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return data as CheckDefinition;
}

export async function insertCheckResults(results: Partial<CheckResult>[]): Promise<void> {
  const supabase = createAdminClient();
  try {
    for (let i = 0; i < results.length; i += 500) {
      const chunk = results.slice(i, i + 500);
      await supabase.from('check_results').insert(chunk);
    }
  } catch (err) {
    console.warn('Check results insert notice:', err);
  }
}

export async function getCheckResultsByBatch(batchId: string): Promise<CheckResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('batch_id', batchId);

  if (error) return [];
  return (data || []) as CheckResult[];
}
