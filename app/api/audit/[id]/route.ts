// app/api/audit/[id]/route.ts
// Public API — strips ALL PII before returning
// email, company, role are NEVER returned in this endpoint
// Only tools, savings numbers, recommendations are public

import { NextRequest, NextResponse } from 'next/server';
import { getAudit } from '@/lib/db/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string' || id.length < 8) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
  }

  try {
    const audit = await getAudit(id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // ✅ PII STRIPPING — never expose email, company, role in public endpoint
    // Only return: id, result (tools + savings), createdAt
    // The result object contains: recommendations, totals, useCase, teamSize, score, summary
    // It does NOT contain email/company/role — those are in the leads table only
    const safeResponse = {
      id: audit.id,
      result: audit.result,
      createdAt: audit.createdAt,
      // Explicitly NOT returning: audit.email, audit.company, audit.role
    };

    return NextResponse.json(safeResponse, {
      headers: {
        // Cache public audit results for 1 hour (helps with OG image generation)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[audit/[id]] error:', err);
    return NextResponse.json(
      { error: 'Failed to load audit' },
      { status: 500 }
    );
  }
}