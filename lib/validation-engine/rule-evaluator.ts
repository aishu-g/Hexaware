import { ValidationRule, Anomaly, Household, Individual } from '@/types/database';

export function evaluateRecordRules(
  batchId: string,
  households: Household[],
  individuals: Individual[],
  rules: ValidationRule[]
): Partial<Anomaly>[] {
  const anomalies: Partial<Anomaly>[] = [];

  // Index households by ID
  const hhMap = new Map<string, Household>();
  const hhRosterCount = new Map<string, number>();
  for (const hh of households) {
    hhMap.set(hh.id, hh);
    hhRosterCount.set(hh.id, 0);
  }

  for (const ind of individuals) {
    hhRosterCount.set(ind.household_id, (hhRosterCount.get(ind.household_id) || 0) + 1);
  }

  // 1. Evaluate Individual Record-level rules
  for (const ind of individuals) {
    const hh = hhMap.get(ind.household_id);
    if (!hh) continue;

    for (const rule of rules) {
      if (!rule.is_active || rule.entity !== 'individual') continue;

      let isViolation = false;
      let reason = rule.description;

      // RULE_HARD_001: Underage Child Labor
      if (rule.code === 'RULE_HARD_001') {
        if (ind.age < 15 && [11, 21, 31, 41, 51].includes(ind.principal_activity_status)) {
          isViolation = true;
          reason = `Child under 15 (age ${ind.age}) engaged in economic activity (status ${ind.principal_activity_status})`;
        }
      }
      // RULE_HARD_002: Age-Education Level Inconsistency
      else if (rule.code === 'RULE_HARD_002') {
        if (ind.age < 10 && ind.general_education >= 8) {
          isViolation = true;
          reason = `Child age ${ind.age} marked with education code ${ind.general_education} (Diploma/Graduate degree)`;
        }
      }
      // RULE_HARD_003: Child Marital Status Anomaly
      else if (rule.code === 'RULE_HARD_003') {
        if (ind.age < 15 && [2, 3, 4].includes(ind.marital_status)) {
          isViolation = true;
          reason = `Child age ${ind.age} reported as married/widowed/divorced (code ${ind.marital_status})`;
        }
      }
      // RULE_SOFT_004: Excessive Weekly Work Hours
      else if (rule.code === 'RULE_SOFT_004') {
        if (ind.hours_worked > 84) {
          isViolation = true;
          reason = `Excessive weekly work hours reported (${ind.hours_worked} hrs/week)`;
        }
      }
      // RULE_SOFT_005: High Earnings for Casual Labor
      else if (rule.code === 'RULE_SOFT_005') {
        if (ind.principal_activity_status === 51 && ind.weekly_earnings > 25000) {
          isViolation = true;
          reason = `Casual laborer reported unusually high weekly earnings (${ind.weekly_earnings.toLocaleString()} INR)`;
        }
      }

      if (isViolation) {
        anomalies.push({
          batch_id: batchId,
          rule_id: rule.id,
          rule_code: rule.code,
          level: rule.level,
          severity: rule.severity,
          household_id: hh.id,
          individual_id: ind.id,
          enumerator_id: hh.enumerator_id,
          psu_id: hh.psu_id,
          district: hh.district,
          state: hh.state,
          score: rule.severity === 'hard' ? 1.0 : 0.75,
          reason_text: reason,
          details: {
            age: ind.age,
            sex: ind.sex,
            general_education: ind.general_education,
            marital_status: ind.marital_status,
            principal_activity_status: ind.principal_activity_status,
            weekly_earnings: ind.weekly_earnings,
            hours_worked: ind.hours_worked
          },
          status: 'open'
        });
      }
    }
  }

  // 2. Evaluate Household / Cluster-level rules
  for (const hh of households) {
    const rosterCount = hhRosterCount.get(hh.id) || 0;

    for (const rule of rules) {
      if (!rule.is_active || rule.entity !== 'household') continue;

      let isViolation = false;
      let reason = rule.description;

      // RULE_SOFT_006: Roster Size Mismatch
      if (rule.code === 'RULE_SOFT_006') {
        if (hh.hh_size !== rosterCount) {
          isViolation = true;
          reason = `Stated household size (${hh.hh_size}) does not match roster count (${rosterCount})`;
        }
      }
      // RULE_SOFT_007: Rapid Completion Time
      else if (rule.code === 'RULE_SOFT_007') {
        if (hh.response_time_seconds > 0 && hh.response_time_seconds < 90) {
          isViolation = true;
          reason = `Abnormally fast survey completion time (${hh.response_time_seconds} seconds)`;
        }
      }

      if (isViolation) {
        anomalies.push({
          batch_id: batchId,
          rule_id: rule.id,
          rule_code: rule.code,
          level: rule.level,
          severity: rule.severity,
          household_id: hh.id,
          individual_id: null,
          enumerator_id: hh.enumerator_id,
          psu_id: hh.psu_id,
          district: hh.district,
          state: hh.state,
          score: 0.65,
          reason_text: reason,
          details: {
            hh_size: hh.hh_size,
            roster_count: rosterCount,
            response_time_seconds: hh.response_time_seconds
          },
          status: 'open'
        });
      }
    }
  }

  return anomalies;
}
