// lib/db.ts
// Supabase client for Round 2 features.
// Uses service role key for server-side operations (detect-changes, reaudit, admin).
// IMPORTANT: Only import this in API routes (server-side), never in client components.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy client — avoids crashing at module load when env vars are missing (e.g. during build)
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[lib/db] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add them to .env.local.'
    );
  }

  _client = createClient(url, key);
  return _client;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Audit {
  id: string;
  user_email: string;
  input_stack: any;
  output_result: any;
  pricing_snapshot: any;
  created_at: string;
  updated_at: string;
  is_unsubscribed: boolean;
}

export interface PricingChange {
  id: string;
  tool_name: string;
  old_pricing: any;
  new_pricing: any;
  changed_at: string;
  affected_audits_count: number;
}

export interface EmailLog {
  id: string;
  audit_id: string;
  user_email: string;
  email_type: string;
  sent_at: string;
  clicked: boolean;
  clicked_at?: string;
}

// ─── Audit functions ──────────────────────────────────────────────────────────

export async function saveAudit(
  audit: Omit<Audit, 'id' | 'created_at' | 'updated_at' | 'is_unsubscribed'>
): Promise<Audit> {
  const { data, error } = await getClient()
    .from('audits')
    .insert(audit)
    .select()
    .single();

  if (error) throw error;
  return data as Audit;
}

export async function getAudit(id: string): Promise<Audit | null> {
  const { data, error } = await getClient()
    .from('audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Audit;
}

export async function getAllAudits(): Promise<Audit[]> {
  const { data, error } = await getClient()
    .from('audits')
    .select('*')
    .eq('is_unsubscribed', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Audit[]) || [];
}

export async function unsubscribeUser(auditId: string): Promise<void> {
  const { error } = await getClient()
    .from('audits')
    .update({ is_unsubscribed: true })
    .eq('id', auditId);

  if (error) throw error;
}

// ─── Pricing change log ───────────────────────────────────────────────────────

export async function logPricingChange(
  change: Omit<PricingChange, 'id' | 'changed_at'>
): Promise<PricingChange> {
  const { data, error } = await getClient()
    .from('pricing_changes')
    .insert(change)
    .select()
    .single();

  if (error) throw error;
  return data as PricingChange;
}

export async function getRecentPricingChanges(limit = 20): Promise<PricingChange[]> {
  const { data, error } = await getClient()
    .from('pricing_changes')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as PricingChange[]) || [];
}

// ─── Email log ────────────────────────────────────────────────────────────────

export async function logEmail(
  log: Omit<EmailLog, 'id' | 'sent_at' | 'clicked' | 'clicked_at'>
): Promise<EmailLog> {
  const { data, error } = await getClient()
    .from('email_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data as EmailLog;
}

export async function markEmailClicked(auditId: string): Promise<void> {
  // Mark the most recent unclicked email log for this audit as clicked
  const { error } = await getClient()
    .from('email_logs')
    .update({ clicked: true, clicked_at: new Date().toISOString() })
    .eq('audit_id', auditId)
    .is('clicked_at', null);

  // Non-fatal — audit may not have an email log (e.g. direct link visit)
  if (error) {
    console.warn('[db] markEmailClicked non-fatal:', error.message);
  }
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

export async function getEmailStats() {
  const supabase = getClient();

  const [
    { count: totalAudits },
    { count: totalEmails },
    { count: clickedEmails },
  ] = await Promise.all([
    supabase.from('audits').select('*', { count: 'exact', head: true }),
    supabase.from('email_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('clicked', true),
  ]);

  return {
    totalAudits: totalAudits ?? 0,
    totalEmails: totalEmails ?? 0,
    clickedEmails: clickedEmails ?? 0,
    clickRate:
      totalEmails ? (((clickedEmails ?? 0) / totalEmails) * 100).toFixed(1) : '0.0',
  };
}