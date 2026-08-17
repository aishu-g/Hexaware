import { createAdminClient } from '@/lib/supabase/admin';
import { Profile, UserRole } from '@/types/database';

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(profile: {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
  department?: string;
  region?: string;
}): Promise<Profile> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || null,
      role: profile.role || 'supervisor',
      department: profile.department || 'National Sample Survey Office (NSSO)',
      region: profile.region || 'Western Zone - Maharashtra',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    // If local database table is not connected, return formatted fallback profile
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || 'Official Survey Director',
      role: profile.role || 'supervisor',
      department: profile.department || 'National Sample Survey Office (NSSO)',
      region: profile.region || 'Western Zone - Maharashtra',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  return data as Profile;
}
