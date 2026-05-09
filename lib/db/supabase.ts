import { SavedAudit } from '../audit/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DB_ENABLED = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

async function getClient() {
  if (!DB_ENABLED) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

export async function saveAudit(audit: SavedAudit): Promise<{ error: string | null }> {
  const client = await getClient();
  if (!client) return { error: null };
  const { error } = await client.from('audits').insert({
    id: audit.id, input: audit.input, result: audit.result, created_at: audit.createdAt,
  });
  return { error: error?.message || null };
}

export async function saveLeadCapture(auditId: string, email: string, company?: string, role?: string, teamSize?: number) {
  const client = await getClient();
  if (!client) return { error: null };
  const { error } = await client.from('leads').insert({
    audit_id: auditId, email,
    company: company || null, role: role || null,
    team_size: teamSize || null, created_at: new Date().toISOString(),
  });
  return { error: error?.message || null };
}

export async function getAudit(id: string): Promise<SavedAudit | null> {
  const client = await getClient();
  if (!client) return null;
  const { data, error } = await client.from('audits').select('*').eq('id', id).single();
  if (error || !data) return null;
  return { id: data.id, input: data.input, result: data.result, createdAt: data.created_at };
}