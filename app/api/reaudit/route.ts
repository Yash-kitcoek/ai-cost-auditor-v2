// app/api/reaudit/route.ts
// GET /api/reaudit?audit_id=<id>
// Called when user clicks "View Updated Audit" in the pricing-change email.
// Returns old stored audit + fresh audit run with current pricing.

import { NextRequest, NextResponse } from 'next/server';
import { getAudit, markEmailClicked } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { getPricingSnapshot } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get('audit_id');

    if (!auditId) {
      return NextResponse.json(
        { error: 'audit_id is required' },
        { status: 400 }
      );
    }

    const audit = await getAudit(auditId);

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Non-fatal — track that user clicked through from email
    await markEmailClicked(auditId).catch((err) =>
      console.warn('[reaudit] markEmailClicked non-fatal:', err.message)
    );

    // Re-run with current pricing
    const newPricing = getPricingSnapshot();
    const newAudit = runAudit(audit.input_stack);

    return NextResponse.json({
      success: true,
      oldAudit: audit.output_result,
      newAudit,
      oldPricing: audit.pricing_snapshot,
      newPricing,
    });
  } catch (error: any) {
    console.error('[reaudit] error:', error);
    return NextResponse.json(
      { error: 'Failed to load reaudit', details: error.message },
      { status: 500 }
    );
  }
}