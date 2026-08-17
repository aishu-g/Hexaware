import { z } from 'zod';

export const plfsIndividualSchema = z.object({
  person_id: z.string().min(1, 'Person ID is required'),
  age: z.number().int().min(0, 'Age must be non-negative').max(120, 'Age out of reasonable bounds'),
  sex: z.number().int().min(1).max(3),
  general_education: z.number().int().min(1).max(13),
  marital_status: z.number().int().min(1).max(4),
  principal_activity_status: z.number().int().min(10).max(99),
  subsidiary_activity_status: z.number().int().optional().default(0),
  weekly_earnings: z.number().min(0).optional().default(0),
  hours_worked: z.number().min(0).max(168).optional().default(0)
});

export const plfsHouseholdSchema = z.object({
  hh_id: z.string().min(1, 'Household ID is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  psu_id: z.string().min(1, 'PSU ID is required'),
  sector: z.enum(['rural', 'urban']),
  hh_size: z.number().int().min(1, 'Household size must be at least 1'),
  religion: z.string().optional(),
  social_group: z.string().optional(),
  monthly_expenditure: z.number().min(0).optional().default(0),
  land_owned_hectares: z.number().min(0).optional().default(0),
  enumerator_id: z.string().min(1, 'Enumerator ID is required'),
  response_time_seconds: z.number().min(0).optional().default(300),
  individuals: z.array(plfsIndividualSchema).min(1, 'Household must contain at least 1 individual record')
});

export const createBatchSchema = z.object({
  name: z.string().min(3, 'Batch name must be at least 3 characters'),
  survey_type: z.string().default('PLFS'),
  survey_round: z.string().default('2023-Q4'),
  households: z.array(plfsHouseholdSchema).min(1, 'At least 1 household is required')
});

export const createRuleSchema = z.object({
  code: z.string().min(3).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['record', 'cluster', 'aggregate']),
  severity: z.enum(['hard', 'soft']),
  entity: z.enum(['household', 'individual', 'aggregate']),
  condition_expression: z.string().min(3, 'Condition expression is required')
});

export const updateAnomalyStatusSchema = z.object({
  anomaly_id: z.string().uuid(),
  status: z.enum(['open', 'in_review', 'resolved', 'false_positive']),
  reviewer_notes: z.string().optional()
});
