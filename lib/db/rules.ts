import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationRule, RuleLevel, RuleSeverity, RuleEntity } from '@/types/database';

export async function getActiveValidationRules(): Promise<ValidationRule[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('validation_rules')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to fetch validation rules: ${error.message}`);
  return (data || []) as ValidationRule[];
}

export async function getAllValidationRules(): Promise<ValidationRule[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('validation_rules')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to fetch validation rules: ${error.message}`);
  return (data || []) as ValidationRule[];
}

export async function createValidationRule(rule: {
  code: string;
  title: string;
  description: string;
  level: RuleLevel;
  severity: RuleSeverity;
  entity: RuleEntity;
  condition_expression: string;
  is_active?: boolean;
  created_by?: string;
}): Promise<ValidationRule> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('validation_rules')
    .insert({
      code: rule.code,
      title: rule.title,
      description: rule.description,
      level: rule.level,
      severity: rule.severity,
      entity: rule.entity,
      condition_expression: rule.condition_expression,
      is_active: rule.is_active !== undefined ? rule.is_active : true,
      created_by: rule.created_by || null
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create validation rule: ${error?.message || 'Unknown error'}`);
  }

  return data as ValidationRule;
}

export async function toggleRuleActiveStatus(ruleId: string, isActive: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('validation_rules')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', ruleId);

  if (error) {
    throw new Error(`Failed to update rule status: ${error.message}`);
  }
}
