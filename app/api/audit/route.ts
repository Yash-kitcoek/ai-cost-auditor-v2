import { NextRequest, NextResponse } from 'next/server';
import { generateAuditWithSnapshot } from '@/lib/audit-engine';
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
      email, tools, usage,
    });

    const totalCurrentSpend = output.totalMonthlyCost;
    const totalOptimizedSpend = totalCurrentSpend - output.totalPotentialSavings;
    const score = totalCurrentSpend === 0
      ? 100
      : Math.max(0, Math.round(100 - (output.totalPotentialSavings / totalCurrentSpend) * 100));

    // Shape result to match exactly what app/result/[id]/page.tsx reads
    const result = {
      totalMonthlySavings:  output.totalPotentialSavings,
      totalAnnualSavings:   output.totalPotentialSavings * 12,
      totalCurrentSpend,                           // ← was wrongly named currentMonthlySpend
      totalOptimizedSpend,                         // ← was wrongly named optimizedMonthlySpend
      score,
      isAlreadyOptimal: output.totalPotentialSavings === 0,
      teamSize: teamSize || 1,                     // ← was missing
      useCase:  useCase  || 'mixed',               // ← was missing
      summary:  undefined,                         // optional AI summary field
      recommendations: output.recommendations.map((rec) => ({
        toolId:          rec.tool.toLowerCase().replace(/\s+/g, '-'),
        toolName:        rec.tool,
        action:          rec.savings > 0 ? 'downgrade' : 'keep',
        currentPlan:     rec.currentTier,
        recommendedPlan: rec.recommendedTier,
        savings:         rec.savings,
        annualSavings:   rec.savings * 12,
        reason:          rec.reason,
        priority:        rec.savings > 50 ? 'high' : rec.savings > 20 ? 'medium' : 'low',
      })),
    };

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