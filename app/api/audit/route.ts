// app/api/audit/route.ts
// POST /api/audit
// Round 2 version: requires email upfront so the audit can be linked
// to a user for pricing-change notifications.
// Body: { email: string, tools: { [toolKey]: tierName }, usage?: { [toolKey]: number } }

import { NextRequest, NextResponse } from 'next/server';
import { generateAuditWithSnapshot } from '@/lib/audit-engine';
import { saveAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tools, usage } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required to save your audit for future notifications.' },
        { status: 400 }
      );
    }

    if (!tools || typeof tools !== 'object' || Object.keys(tools).length === 0) {
      return NextResponse.json(
        { error: 'At least one tool is required.' },
        { status: 400 }
      );
    }

    const { input, output, pricingSnapshot } = generateAuditWithSnapshot({
      email,
      tools,
      usage,
    });

    const saved = await saveAudit({
      user_email: email,
      input_stack: input,
      output_result: output,
      pricing_snapshot: pricingSnapshot,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      auditId: saved.id,
      result: output,
      reauditUrl: `${appUrl}/reaudit/${saved.id}`,
    });
  } catch (error: any) {
    console.error('[audit] error:', error);
    return NextResponse.json(
      { error: 'Audit failed', details: error.message },
      { status: 500 }
    );
  }
}