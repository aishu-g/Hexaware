import { CheckDefinition, CheckResult, Household, Individual } from '@/types/database';

export function executeCheckDefinitions(
  batchId: string | null,
  households: Household[],
  individuals: Individual[],
  checks: CheckDefinition[]
): CheckResult[] {
  const results: CheckResult[] = [];
  const householdIdSet = new Set(households.map((h) => h.id));

  for (const check of checks) {
    if (!check.active) continue;

    const kind = check.check_kind;
    const config = check.config || {};

    if (kind === 'range') {
      const field = (config.field as string) || 'age';
      const min = Number(config.min !== undefined ? config.min : 0);
      const max = Number(config.max !== undefined ? config.max : 120);

      for (const ind of individuals) {
        const val = Number((ind as unknown as Record<string, number>)[field] || 0);
        const passed = val >= min && val <= max;
        const detail = passed
          ? `Passed Range Check: ${field} value ${val} is within permitted range [${min}, ${max}]`
          : `Failed Range Check: ${field} value ${val} is out of permitted range [${min}, ${max}]`;

        results.push({
          id: crypto.randomUUID(),
          batch_id: batchId,
          record_id: ind.person_id || ind.id,
          check_id: check.id,
          passed,
          severity: check.type,
          detail,
          created_at: new Date().toISOString()
        });
      }
    } else if (kind === 'referential') {
      for (const ind of individuals) {
        const passed = householdIdSet.has(ind.household_id);
        const detail = passed
          ? `Passed Referential Integrity Check: Household FK '${ind.household_id}' exists in households core table`
          : `Failed Referential Integrity Check: Orphan Individual record '${ind.person_id}'. Household FK '${ind.household_id}' not found in households core table`;

        results.push({
          id: crypto.randomUUID(),
          batch_id: batchId,
          record_id: ind.person_id || ind.id,
          check_id: check.id,
          passed,
          severity: check.type,
          detail,
          created_at: new Date().toISOString()
        });
      }
    } else if (kind === 'existential') {
      const targetField = (config.field as string) || 'principal_activity_status';

      for (const ind of individuals) {
        const val = (ind as unknown as Record<string, unknown>)[targetField];
        const passed = val !== undefined && val !== null && String(val).trim() !== '';
        const detail = passed
          ? `Passed Existential Check: Attribute '${targetField}' is present (${val})`
          : `Failed Existential Check: Missing required attribute '${targetField}' on record '${ind.person_id}'`;

        results.push({
          id: crypto.randomUUID(),
          batch_id: batchId,
          record_id: ind.person_id || ind.id,
          check_id: check.id,
          passed,
          severity: check.type,
          detail,
          created_at: new Date().toISOString()
        });
      }
    } else if (kind === 'pattern') {
      const field = (config.field as string) || 'psu_id';
      const patternStr = (config.pattern as string) || '.*';
      const regex = new RegExp(patternStr);

      for (const hh of households) {
        const val = String((hh as unknown as Record<string, unknown>)[field] || '');
        const passed = regex.test(val);
        const detail = passed
          ? `Passed Pattern Check: '${field}' value '${val}' matches pattern /${patternStr}/`
          : `Failed Pattern Check: '${field}' value '${val}' does not match required format /${patternStr}/`;

        results.push({
          id: crypto.randomUUID(),
          batch_id: batchId,
          record_id: hh.hh_id || hh.id,
          check_id: check.id,
          passed,
          severity: check.type,
          detail,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  return results;
}
