import { NextRequest, NextResponse } from 'next/server';
import { getAudit } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const audit = await getAudit(params.id);
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }
  // Strip PII from public response
  const { email, company, role, ...safeAudit } = audit as any;
  return NextResponse.json(safeAudit);
}