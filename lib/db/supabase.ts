import { createClient } from '@supabase/supabase-js';
import { SavedAudit } from '../audit/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveAudit(audit: SavedAudit): Promise<{ error: string | null }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    // If no DB configured, skip gracefully (still return the ID)
    return { error: null };
  }

  const { error } = await supabase.from('audits').insert({
    id: audit.id,
    input: audit.input,
    result: audit.result,
    created_at: audit.createdAt,
    // PII stripped from public row; stored separately
  });

  return { error: error?.message || null };
}

export async function saveLeadCapture(
  auditId: string,
  email: string,
  company?: string,
  role?: string,
  teamSize?: number
): Promise<{ error: string | null }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: null };
  }

  const { error } = await supabase.from('leads').insert({
    audit_id: auditId,
    email,
    company: company || null,
    role: role || null,
    team_size: teamSize || null,
    created_at: new Date().toISOString(),
  });

  return { error: error?.message || null };
}

export async function getAudit(id: string): Promise<SavedAudit | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    input: data.input,
    result: data.result,
    createdAt: data.created_at,
  };
}