import { NextResponse } from 'next/server';
import { createRuleSchema } from '@/lib/validations/survey';
import { getAllValidationRules, createValidationRule, toggleRuleActiveStatus } from '@/lib/db/rules';
import { logAuditAction } from '@/lib/db/audit';
import { z } from 'zod';

export async function GET() {
  try {
    const rules = await getAllValidationRules();
    return NextResponse.json({ success: true, data: rules });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedRule = createRuleSchema.parse(body);

    const newRule = await createValidationRule(validatedRule);

    await logAuditAction({
      action: 'CREATE_RULE',
      target_type: 'validation_rule',
      target_id: newRule.id,
      details: { code: newRule.code, title: newRule.title }
    });

    return NextResponse.json({ success: true, data: newRule });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}

const toggleSchema = z.object({
  rule_id: z.string().uuid(),
  is_active: z.boolean()
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rule_id, is_active } = toggleSchema.parse(body);

    await toggleRuleActiveStatus(rule_id, is_active);

    await logAuditAction({
      action: 'TOGGLE_RULE',
      target_type: 'validation_rule',
      target_id: rule_id,
      details: { is_active }
    });

    return NextResponse.json({ success: true, message: 'Rule status updated' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}
