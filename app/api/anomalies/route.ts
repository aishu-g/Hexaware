import { NextResponse } from 'next/server';
import { updateAnomalyStatusSchema } from '@/lib/validations/survey';
import { getAnomalies, updateAnomalyStatus, getAnomalyStats } from '@/lib/db/anomalies';
import { logAuditAction } from '@/lib/db/audit';
import { RuleSeverity, RuleLevel, AnomalyStatus } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'stats') {
      const batchId = searchParams.get('batchId') || undefined;
      const stats = await getAnomalyStats(batchId);
      return NextResponse.json({ success: true, data: stats });
    }

    const options = {
      batchId: searchParams.get('batchId') || undefined,
      severity: (searchParams.get('severity') as RuleSeverity | 'all') || 'all',
      level: (searchParams.get('level') as RuleLevel | 'all') || 'all',
      status: (searchParams.get('status') as AnomalyStatus | 'all') || 'all',
      state: searchParams.get('state') || undefined,
      district: searchParams.get('district') || undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '50', 10)
    };

    const result = await getAnomalies(options);
    return NextResponse.json({ success: true, data: result.data, total: result.total });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validatedData = updateAnomalyStatusSchema.parse(body);

    await updateAnomalyStatus(
      validatedData.anomaly_id,
      validatedData.status,
      undefined,
      validatedData.reviewer_notes
    );

    await logAuditAction({
      action: 'UPDATE_ANOMALY_STATUS',
      target_type: 'anomaly',
      target_id: validatedData.anomaly_id,
      details: { status: validatedData.status, notes: validatedData.reviewer_notes }
    });

    return NextResponse.json({ success: true, message: 'Anomaly resolution status updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}
