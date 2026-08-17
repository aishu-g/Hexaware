import { NextResponse } from 'next/server';
import { getCheckDefinitions, insertCheckResults } from '@/lib/db/checks';
import { executeCheckDefinitions } from '@/lib/validation-engine/check-execution-engine';
import { generateSamplePLFSData } from '@/lib/ingestion/sample-generator';
import { Household, Individual } from '@/types/database';

export async function POST(request: Request) {
  try {
    let households: Household[] = [];
    let individuals: Individual[] = [];
    let batchId: string | null = 'batch_sample_phase2';

    try {
      const body = await request.json();
      if (body.batch_id) batchId = body.batch_id;
    } catch {
      // Body empty, fallback to sample data
    }

    // 1. Generate realistic PLFS sample dataset for execution
    const sampleInput = generateSamplePLFSData(20);

    // Inject 1 orphan record for referential integrity testing demonstration
    households = sampleInput.map((h, i) => ({
      id: `hh_chk_${i}`,
      batch_id: batchId || 'batch_sample_phase2',
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

    individuals = sampleInput.flatMap((h, i) =>
      h.individuals.map((ind, j) => ({
        id: `ind_chk_${i}_${j}`,
        batch_id: batchId || 'batch_sample_phase2',
        household_id: j === 0 && i === 5 ? 'hh_non_existent_orphan' : `hh_chk_${i}`,
        person_id: ind.person_id,
        age: j === 1 && i === 2 ? 145 : ind.age, // Range check violation test
        sex: ind.sex,
        general_education: ind.general_education,
        marital_status: ind.marital_status,
        principal_activity_status: ind.principal_activity_status,
        subsidiary_activity_status: ind.subsidiary_activity_status || 0,
        weekly_earnings: ind.weekly_earnings || 0,
        hours_worked: j === 0 && i === 3 ? 96 : (ind.hours_worked || 0),
        created_at: new Date().toISOString()
      }))
    );

    // 2. Fetch Active Check Definitions
    const checks = await getCheckDefinitions();

    // 3. Execute Execution Engine
    const results = executeCheckDefinitions(batchId, households, individuals, checks);

    // 4. Save results to check_results table
    await insertCheckResults(results);

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    return NextResponse.json({
      success: true,
      message: 'Check Execution Engine executed successfully against batch dataset.',
      summary: {
        totalEvaluated: results.length,
        passedCount,
        failedCount,
        passPercentage: ((passedCount / (results.length || 1)) * 100).toFixed(1) + '%'
      },
      results
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Execution Engine failed';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
