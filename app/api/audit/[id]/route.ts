// app/api/audit/[id]/route.ts
// PUBLIC endpoint — returns audit result for shared URLs.
// CRITICAL: strips ALL PII from input before responding.
// Fields removed: input.email, input.company, input.role
// Fields kept: input.tools, input.teamSize, input.useCase, result.*, id, createdAt

import { NextRequest, NextResponse } from 'next/server';
import { getAudit } from '@/lib/db/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const audit = await getAudit(params.id);
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  // ── PII stripping ──────────────────────────────────────────────────────────
  // audit.input is JSONB from Supabase — cast to Record<string, unknown> first.
  // Using delete avoids the TypeScript index-signature conflict that happens
  // when you try to destructure named props alongside [key: string]: unknown.
  const safeInput = { ...(audit.input as unknown as Record<string, unknown>) };
  delete safeInput['email'];
  delete safeInput['company'];
  delete safeInput['role'];

  return NextResponse.json({
    id: audit.id,
    createdAt: audit.createdAt,
    input: safeInput,   // tools, teamSize, useCase only — no PII
    result: audit.result,
  });
}