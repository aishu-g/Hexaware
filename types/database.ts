export type UserRole = 'admin' | 'hsd_officer' | 'supervisor' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  region?: string | null;
  created_at: string;
  updated_at: string;
}

export type BatchStatus = 'pending' | 'validating' | 'completed' | 'failed';

export interface SurveyBatch {
  id: string;
  name: string;
  survey_type: string;
  survey_round: string;
  total_households: number;
  total_individuals: number;
  status: BatchStatus;
  ingested_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Household {
  id: string;
  batch_id: string;
  hh_id: string;
  state: string;
  district: string;
  psu_id: string;
  sector: 'rural' | 'urban';
  hh_size: number;
  religion: string | null;
  social_group: string | null;
  monthly_expenditure: number;
  land_owned_hectares: number;
  enumerator_id: string;
  response_time_seconds: number;
  created_at: string;
}

export interface Individual {
  id: string;
  batch_id: string;
  household_id: string;
  person_id: string;
  age: number;
  sex: number;
  general_education: number;
  marital_status: number;
  principal_activity_status: number;
  subsidiary_activity_status: number;
  weekly_earnings: number;
  hours_worked: number;
  created_at: string;
}

export type RuleLevel = 'record' | 'cluster' | 'aggregate';
export type RuleSeverity = 'hard' | 'soft';
export type RuleEntity = 'household' | 'individual' | 'aggregate';

export interface ValidationRule {
  id: string;
  code: string;
  title: string;
  description: string;
  level: RuleLevel;
  severity: RuleSeverity;
  entity: RuleEntity;
  condition_expression: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CheckKind = 'referential' | 'existential' | 'range' | 'pattern';

export interface CheckDefinition {
  id: string;
  name: string;
  level: RuleLevel;
  type: RuleSeverity;
  check_kind: CheckKind;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckResult {
  id: string;
  batch_id: string | null;
  record_id: string;
  check_id: string;
  passed: boolean;
  severity: RuleSeverity;
  detail: string;
  created_at: string;
}

export type AnomalyStatus = 'open' | 'in_review' | 'resolved' | 'false_positive';

export interface Anomaly {
  id: string;
  batch_id: string;
  rule_id: string | null;
  rule_code: string;
  level: RuleLevel;
  severity: RuleSeverity;
  household_id: string | null;
  individual_id: string | null;
  enumerator_id: string | null;
  psu_id: string | null;
  district: string | null;
  state: string | null;
  score: number;
  reason_text: string;
  details: Record<string, unknown>;
  status: AnomalyStatus;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface EnumeratorMetric {
  id: string;
  enumerator_id: string;
  batch_id: string;
  psu_id: string;
  total_households_surveyed: number;
  flagged_anomalies_count: number;
  avg_response_time_seconds: number;
  risk_score: number;
  is_outlier: boolean;
  metrics_json: Record<string, unknown>;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
