import { NextResponse } from 'next/server';
import { getAnomalyScoresByBatch } from '@/lib/db/anomaly-scores';
import { callRecordMLAnalysis, callClusterMLAnalysis } from '@/lib/ml/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId') || 'batch_sample';

    const scores = await getAnomalyScoresByBatch(batchId);
    return NextResponse.json({
      success: true,
      batchId,
      totalScores: scores.length,
      data: scores
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query anomaly scores';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const batchId = body.batchId || `batch_ml_${Date.now()}`;

    const records = body.records || [
      {
        id: 'IND_ML_001',
        household_id: 'HH_ML_10',
        age: 12,
        sex: 1,
        education: 3,
        activity_status: 31,
        weekly_earnings: 2400,
        hours_worked: 48,
        response_time_seconds: 45
      },
      {
        id: 'IND_ML_002',
        household_id: 'HH_ML_11',
        age: 42,
        sex: 2,
        education: 8,
        activity_status: 31,
        weekly_earnings: 320000,
        hours_worked: 50,
        response_time_seconds: 420
      }
    ];

    const enumerators = body.enumerators || [
      {
        enumerator_id: 'ENUM_RISK_99',
        psu_id: 'PSU_MAHA_10',
        household_count: 15,
        avg_response_time: 48,
        hours_worked_avg: 48,
        zero_earnings_pct: 0.1,
        anomaly_rate: 0.8
      }
    ];

    // Trigger ML endpoints
    const [recordResults, clusterResults] = await Promise.all([
      callRecordMLAnalysis(batchId, records),
      callClusterMLAnalysis(batchId, enumerators)
    ]);

    const storedScores = await getAnomalyScoresByBatch(batchId);

    return NextResponse.json({
      success: true,
      message: 'ML anomaly scoring executed successfully. Scores stored in anomaly_scores table.',
      batchId,
      summary: {
        recordAnomaliesCount: recordResults.length,
        clusterOutliersCount: clusterResults.length,
        storedScoresCount: storedScores.length
      },
      data: storedScores
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'ML scoring execution failed';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
