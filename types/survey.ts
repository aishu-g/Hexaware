import { AnomalyStatus, RuleLevel, RuleSeverity } from './database';

export interface PLFSHouseholdInput {
  hh_id: string;
  state: string;
  district: string;
  psu_id: string;
  sector: 'rural' | 'urban';
  hh_size: number;
  religion?: string;
  social_group?: string;
  monthly_expenditure?: number;
  land_owned_hectares?: number;
  enumerator_id: string;
  response_time_seconds?: number;
  individuals: PLFSIndividualInput[];
}

export interface PLFSIndividualInput {
  person_id: string;
  age: number;
  sex: number; // 1: Male, 2: Female, 3: Transgender
  general_education: number; // 01-13
  marital_status: number; // 1: Never Married, 2: Currently Married, 3: Widowed, 4: Divorced
  principal_activity_status: number; // 11, 21, 31, 41, 51, 81, 91, 92, 97
  subsidiary_activity_status?: number;
  weekly_earnings?: number;
  hours_worked?: number;
}

export interface AnomalyFilterOptions {
  batchId?: string;
  severity?: RuleSeverity | 'all';
  level?: RuleLevel | 'all';
  status?: AnomalyStatus | 'all';
  state?: string;
  district?: string;
  enumeratorId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export const EDUCATION_LABELS: Record<number, string> = {
  1: 'Not Literate',
  2: 'Literate without formal schooling',
  3: 'Below Primary',
  4: 'Primary',
  5: 'Middle',
  6: 'Secondary',
  7: 'Higher Secondary',
  8: 'Diploma/Certificate Course',
  9: 'Graduate',
  10: 'Post Graduate & Above'
};

export const MARITAL_STATUS_LABELS: Record<number, string> = {
  1: 'Never Married',
  2: 'Currently Married',
  3: 'Widowed',
  4: 'Divorced / Separated'
};

export const ACTIVITY_STATUS_LABELS: Record<number, string> = {
  11: 'Self-Employed (Own Account Worker)',
  21: 'Self-Employed (Employer)',
  31: 'Regular Salaried/Wage Employee',
  41: 'Casual Labor in Public Works',
  51: 'Casual Labor in Other Work',
  81: 'Unemployed (Seeking Work)',
  91: 'Attending Educational Institution',
  92: 'Attending Domestic Duties',
  93: 'Attending Domestic Duties & Free Collection',
  97: 'Others (Rentiers, Pensioners, Invalid)'
};

export interface AnomalyScoreResult {
  id?: string;
  record_id?: string;
  anomaly_score: number;
  is_anomaly: boolean;
  flags?: string[];
  reasons: string[];
  metrics: Record<string, unknown>;
}

export interface EnumeratorRiskResult {
  enumerator_id: string;
  risk_score: number;
  risk_category: 'high' | 'medium' | 'low';
  flagged_patterns?: string[];
  is_outlier?: boolean;
  deviation_reasons?: string[];
}

export interface AggregateAnomalyResult {
  state: string;
  district?: string;
  anomaly_score: number;
  description: string;
}

