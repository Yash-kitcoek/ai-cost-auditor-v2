// app/api/audit/[id]/route.ts
// PUBLIC endpoint — returns audit result for shared URLs.
// CRITICAL: strips ALL PII from input before responding.
// Fields removed: input.email, input.company, input.role
// Fields kept: input.tools, input.teamSize, input.useCase, result.*, id, createdAt

import { NextRequest, NextResponse } from 'next/server';
import { adaptAuditOutputForResultPage } from '../../../../lib/audit-adapter';
import { getAudit } from '@/lib/db';
export const dynamic = 'force-dynamic';

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

  const safeInput = { ...(audit.input_stack as Record<string, unknown>) };
  delete safeInput['email'];
  delete safeInput['company'];
  delete safeInput['role'];

  return NextResponse.json({
    id: audit.id,
    createdAt: audit.created_at,
    input: safeInput,   // tools, teamSize, useCase only — no PII
    result: adaptAuditOutputForResultPage(audit.output_result, {
      teamSize: Number(safeInput.teamSize) || 1,
      useCase: (safeInput.useCase as any) || 'mixed',
    }),
  });
}
