-- Seed default validation rules for PLFS survey microdata
insert into public.validation_rules (code, title, description, level, severity, entity, condition_expression, is_active)
values
(
    'RULE_HARD_001',
    'Underage Employment / Child Labor Flag',
    'Individual under 15 years old reported as working in economic principal activity (status 11, 21, 31, 41, 51).',
    'record',
    'hard',
    'individual',
    'age < 15 AND activity_status IN (11, 21, 31, 41, 51)',
    true
),
(
    'RULE_HARD_002',
    'Age-Education Level Inconsistency',
    'Individual under 10 years old reported as having completed secondary or higher education (code >= 8).',
    'record',
    'hard',
    'individual',
    'age < 10 AND general_education >= 8',
    true
),
(
    'RULE_HARD_003',
    'Child Marital Status Anomaly',
    'Individual under 15 years old reported as currently married, widowed, or divorced.',
    'record',
    'hard',
    'individual',
    'age < 15 AND marital_status IN (2, 3, 4)',
    true
),
(
    'RULE_SOFT_004',
    'Excessive Weekly Hours Worked',
    'Individual reported working more than 84 hours in the reference week (>12 hours/day).',
    'record',
    'soft',
    'individual',
    'hours_worked > 84',
    true
),
(
    'RULE_SOFT_005',
    'High Earnings Outlier for Casual Labor',
    'Casual labor activity status (51) with weekly earnings exceeding 25,000 INR.',
    'record',
    'soft',
    'individual',
    'principal_activity_status = 51 AND weekly_earnings > 25000',
    true
),
(
    'RULE_SOFT_006',
    'Household Roster Size Mismatch',
    'Total individual roster records does not match stated household size attribute.',
    'record',
    'soft',
    'household',
    'hh_size != roster_count',
    true
),
(
    'RULE_SOFT_007',
    'Rapid Survey Completion Time',
    'Enumerator completed full household survey in under 90 seconds.',
    'cluster',
    'soft',
    'household',
    'response_time_seconds < 90',
    true
),
(
    'RULE_ML_008',
    'Isolation Forest Multivariate Anomaly',
    'Machine learning score indicates multivariate statistical anomaly in respondent profile.',
    'record',
    'soft',
    'individual',
    'ml_anomaly_score >= 0.50',
    true
),
(
    'RULE_CLUSTER_009',
    'Enumerator Speed Deviation Outlier',
    'Enumerator average response speed deviates by >2.0 standard deviations from peer PSU average.',
    'cluster',
    'soft',
    'household',
    'speed_z_score > 2.0',
    true
)
on conflict (code) do update set
    title = excluded.title,
    description = excluded.description,
    condition_expression = excluded.condition_expression;
