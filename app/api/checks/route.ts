import { NextResponse } from 'next/server';
import { getCheckDefinitions, createCheckDefinition, updateCheckDefinition } from '@/lib/db/checks';

export async function GET() {
  try {
    const checks = await getCheckDefinitions();
    return NextResponse.json({ success: true, data: checks });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch check definitions';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCheck = await createCheckDefinition(body);
    return NextResponse.json({ success: true, data: newCheck });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create check definition';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Check ID is required' }, { status: 400 });
    }

    const updated = await updateCheckDefinition(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update check definition';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
