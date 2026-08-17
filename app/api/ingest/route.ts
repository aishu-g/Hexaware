import { NextResponse } from 'next/server';
import { createBatchSchema } from '@/lib/validations/survey';
import { processPLFSBatchIngestion } from '@/lib/ingestion/pipeline';
import { logAuditAction } from '@/lib/db/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createBatchSchema.parse(body);

    const result = await processPLFSBatchIngestion(
      validatedData.name,
      validatedData.households
    );

    await logAuditAction({
      action: 'INGEST_BATCH',
      target_type: 'survey_batch',
      target_id: result.batchId,
      details: {
        batch_name: validatedData.name,
        households: result.totalHouseholds,
        individuals: result.totalIndividuals,
        anomalies: result.totalAnomalies
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Batch microdata successfully ingested and validated.',
      data: result
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 400 }
    );
  }
}
