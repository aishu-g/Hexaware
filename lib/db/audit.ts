import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLog } from '@/types/database';

export async function logAuditAction(action: {
  user_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('audit_logs').insert({
    user_id: action.user_id || null,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id || null,
    details: action.details || {}
  });

  if (error) {
    console.error('Failed to insert audit log:', error.message);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
  return (data || []) as AuditLog[];
}
