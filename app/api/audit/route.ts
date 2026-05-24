import { NextRequest, NextResponse } from 'next/server';
import { generateAuditWithSnapshot } from '@/lib/audit-engine';
import { adaptAuditOutputForResultPage } from '../../../lib/audit-adapter';
import { saveAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tools, usage, honeypot, teamSize, useCase } = body;

    if (honeypot) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required for pricing-change alerts.' },
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
      email, tools, usage, teamSize, useCase,
    });

    const result = adaptAuditOutputForResultPage(output, { teamSize, useCase });

    const saved = await saveAudit({
      user_email:       email,
      input_stack:      input,
      output_result:    output,
      pricing_snapshot: pricingSnapshot,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success:    true,
      id:         saved.id,
      auditId:    saved.id,
      result,
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
