import { createBatch, updateBatchStatus } from '@/lib/db/batches';
import { insertBatchSurveyData, getHouseholdsByBatch, getIndividualsByBatch } from '@/lib/db/survey-data';
import { getActiveValidationRules } from '@/lib/db/rules';
import { evaluateRecordRules } from '@/lib/validation-engine/rule-evaluator';
import { bulkInsertAnomalies } from '@/lib/db/anomalies';
import { upsertEnumeratorMetrics } from '@/lib/db/enumerators';
import { callRecordMLAnalysis, callClusterMLAnalysis } from '@/lib/ml/client';
import { PLFSHouseholdInput } from '@/types/survey';
import { Anomaly, EnumeratorMetric } from '@/types/database';

export async function processPLFSBatchIngestion(
  name: string,
  householdsInput: PLFSHouseholdInput[],
  ingestedBy?: string
): Promise<{
  batchId: string;
  rawRecordsCount: number;
  promotedHouseholdsCount: number;
  promotedIndividualsCount: number;
  totalHouseholds: number;
  totalIndividuals: number;
  totalAnomalies: number;
  hardCheckCount: number;
  softCheckCount: number;
}> {
  // 1. Create survey batch record
  const batch = await createBatch({
    name,
    survey_type: 'PLFS',
    survey_round: '2023-Q4',
    ingested_by: ingestedBy
  });

  try {
    // Update status to validating
    await updateBatchStatus(batch.id, 'validating');

    // 2. Stage raw records and promote to core households & individuals tables
    const counts = await insertBatchSurveyData(batch.id, householdsInput);

    // Fetch inserted records for rule engine evaluation
    let households = await getHouseholdsByBatch(batch.id);
    let individuals = await getIndividualsByBatch(batch.id);

    // In-memory fallback if database query returned empty set in mock environment
    if (households.length === 0) {
      households = householdsInput.map((h, i) => ({
        id: `hh_mock_${i}`,
        batch_id: batch.id,
        hh_id: h.hh_id,
        state: h.state,
        district: h.district,
        psu_id: h.psu_id,
        sector: h.sector,
        hh_size: h.hh_size,
        religion: h.religion || 'Hinduism',
        social_group: h.social_group || 'OTH',
        monthly_expenditure: h.monthly_expenditure || 0,
        land_owned_hectares: h.land_owned_hectares || 0,
        enumerator_id: h.enumerator_id,
        response_time_seconds: h.response_time_seconds || 300,
        created_at: new Date().toISOString()
      }));

      individuals = householdsInput.flatMap((h, i) =>
        h.individuals.map((ind, j) => ({
          id: `ind_mock_${i}_${j}`,
          batch_id: batch.id,
          household_id: `hh_mock_${i}`,
          person_id: ind.person_id,
          age: ind.age,
          sex: ind.sex,
          general_education: ind.general_education,
          marital_status: ind.marital_status,
          principal_activity_status: ind.principal_activity_status,
          subsidiary_activity_status: ind.subsidiary_activity_status || 0,
          weekly_earnings: ind.weekly_earnings || 0,
          hours_worked: ind.hours_worked || 0,
          created_at: new Date().toISOString()
        }))
      );
    }

    const rules = await getActiveValidationRules();

    // 3. Execute Rule-based Engine
    const ruleAnomalies = evaluateRecordRules(batch.id, households, individuals, rules);

    // 4. Call ML Microservice for Record-level Outlier Detection
    const mlPayload = individuals.map((ind) => {
      const hh = households.find((h) => h.id === ind.household_id);
      return {
        id: ind.id,
        household_id: ind.household_id,
        age: ind.age,
        sex: ind.sex,
        education: ind.general_education,
        activity_status: ind.principal_activity_status,
        weekly_earnings: Number(ind.weekly_earnings),
        hours_worked: Number(ind.hours_worked),
        response_time_seconds: Number(hh?.response_time_seconds || 300)
      };
    });

    const mlResults = await callRecordMLAnalysis(batch.id, mlPayload);
    const mlAnomalies: Partial<Anomaly>[] = [];

    for (const res of mlResults) {
      if (res.is_anomaly) {
        const ind = individuals.find((i) => i.id === res.id);
        const hh = ind ? households.find((h) => h.id === ind.household_id) : undefined;

        mlAnomalies.push({
          batch_id: batch.id,
          rule_id: null,
          rule_code: 'RULE_ML_008',
          level: 'record',
          severity: 'soft',
          household_id: hh?.id || null,
          individual_id: ind?.id || null,
          enumerator_id: hh?.enumerator_id || null,
          psu_id: hh?.psu_id || null,
          district: hh?.district || null,
          state: hh?.state || null,
          score: res.anomaly_score,
          reason_text: res.reasons.join('; '),
          details: res.metrics,
          status: 'open'
        });
      }
    }

    // 5. Aggregate Enumerator Metrics and call Cluster ML Analysis
    const enumGroupMap = new Map<string, {
      enumerator_id: string;
      psu_id: string;
      household_count: number;
      total_response_time: number;
      hours_worked_sum: number;
      zero_earnings_count: number;
      flagged_count: number;
    }>();

    for (const hh of households) {
      if (!enumGroupMap.has(hh.enumerator_id)) {
        enumGroupMap.set(hh.enumerator_id, {
          enumerator_id: hh.enumerator_id,
          psu_id: hh.psu_id,
          household_count: 0,
          total_response_time: 0,
          hours_worked_sum: 0,
          zero_earnings_count: 0,
          flagged_count: 0
        });
      }

      const item = enumGroupMap.get(hh.enumerator_id)!;
      item.household_count += 1;
      item.total_response_time += Number(hh.response_time_seconds || 0);

      const hhInds = individuals.filter((i) => i.household_id === hh.id);
      for (const ind of hhInds) {
        item.hours_worked_sum += Number(ind.hours_worked || 0);
        if (Number(ind.weekly_earnings) === 0) {
          item.zero_earnings_count += 1;
        }
      }
    }

    const allAnomaliesCombined = [...ruleAnomalies, ...mlAnomalies];

    for (const anom of allAnomaliesCombined) {
      if (anom.enumerator_id && enumGroupMap.has(anom.enumerator_id)) {
        enumGroupMap.get(anom.enumerator_id)!.flagged_count += 1;
      }
    }

    const enumMLInput = Array.from(enumGroupMap.values()).map((e) => ({
      enumerator_id: e.enumerator_id,
      psu_id: e.psu_id,
      household_count: e.household_count,
      avg_response_time: e.household_count > 0 ? e.total_response_time / e.household_count : 0,
      hours_worked_avg: e.household_count > 0 ? e.hours_worked_sum / e.household_count : 0,
      zero_earnings_pct: e.household_count > 0 ? e.zero_earnings_count / (e.household_count * 3) : 0,
      anomaly_rate: e.household_count > 0 ? e.flagged_count / e.household_count : 0
    }));

    const clusterResults = await callClusterMLAnalysis(batch.id, enumMLInput);
    const clusterMap = new Map(clusterResults.map((r) => [r.enumerator_id, r]));

    const enumMetricRecords: Partial<EnumeratorMetric>[] = enumMLInput.map((e) => {
      const cRes = clusterMap.get(e.enumerator_id);
      return {
        enumerator_id: e.enumerator_id,
        batch_id: batch.id,
        psu_id: e.psu_id,
        total_households_surveyed: e.household_count,
        flagged_anomalies_count: e.anomaly_rate * e.household_count,
        avg_response_time_seconds: Math.round(e.avg_response_time),
        risk_score: cRes?.risk_score || (e.avg_response_time < 90 ? 0.8 : 0.1),
        is_outlier: cRes?.is_outlier || false,
        metrics_json: {
          deviation_reasons: cRes?.deviation_reasons || [],
          zero_earnings_pct: e.zero_earnings_pct
        }
      };
    });

    await upsertEnumeratorMetrics(enumMetricRecords);

    // Save all anomalies to DB
    await bulkInsertAnomalies(allAnomaliesCombined);

    // Update batch status to completed
    await updateBatchStatus(batch.id, 'completed', {
      total_households: counts.householdsCount,
      total_individuals: counts.individualsCount
    });

    const hardCount = allAnomaliesCombined.filter((a) => a.severity === 'hard').length;
    const softCount = allAnomaliesCombined.filter((a) => a.severity === 'soft').length;

    return {
      batchId: batch.id,
      rawRecordsCount: counts.rawRecordsCount,
      promotedHouseholdsCount: counts.householdsCount,
      promotedIndividualsCount: counts.individualsCount,
      totalHouseholds: counts.householdsCount,
      totalIndividuals: counts.individualsCount,
      totalAnomalies: allAnomaliesCombined.length,
      hardCheckCount: hardCount,
      softCheckCount: softCount
    };
  } catch (err) {
    await updateBatchStatus(batch.id, 'failed');
    throw err;
  }
}
