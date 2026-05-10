// lib/db/supabase.ts — FIXED VERSION
// Changes vs original:
//   1. Logs when DB is disabled (placeholder env vars) so you notice during dev
//   2. saveLeadCapture returns the error object instead of silently suppressing it
//   3. Added getLeads() for verifying DB writes during debugging

import { SavedAudit } from '../audit/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DB_ENABLED = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http')
);

// FIXED: Log clearly when DB is disabled — helps catch missing env vars in dev
if (!DB_ENABLED && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[supabase] Database disabled. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

async function getClient() {
  if (!DB_ENABLED) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

export async function saveAudit(
  audit: SavedAudit
): Promise<{ error: string | null }> {
  const client = await getClient();
  if (!client) return { error: null };
  const { error } = await client.from('audits').insert({
    id: audit.id,
    input: audit.input,
    result: audit.result,
    created_at: audit.createdAt,
  });
  if (error) console.error('[supabase] saveAudit error:', error.message);
  return { error: error?.message || null };
}

export async function saveLeadCapture(
  auditId: string,
  email: string,
  company?: string,
  role?: string,
  teamSize?: number
): Promise<{ error: string | null }> {
  const client = await getClient();
  if (!client) return { error: null };
  const { error } = await client.from('leads').insert({
    audit_id: auditId,
    email,
    company: company || null,
    role: role || null,
    team_size: teamSize || null,
    created_at: new Date().toISOString(),
  });
  // FIXED: log error clearly (was swallowed in email route before)
  if (error) console.error('[supabase] saveLeadCapture error:', error.message);
  return { error: error?.message || null };
}

export async function getAudit(id: string): Promise<SavedAudit | null> {
  const client = await getClient();
  if (!client) return null;
  const { data, error } = await client
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

// ADDED: Helper to verify leads are being stored (useful during debugging)
export async function getLeads(
  limit = 10
): Promise<Array<{ audit_id: string; email: string; created_at: string }> | null> {
  const client = await getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('leads')
    .select('audit_id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[supabase] getLeads error:', error.message);
    return null;
  }
  return data;
}